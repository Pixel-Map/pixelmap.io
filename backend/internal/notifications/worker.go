package notifications

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"time"
)

type Sender interface {
	ImageReady(context.Context, Update) error
	Send(context.Context, Update) (string, error)
}

type Worker struct {
	DB      *sql.DB
	Sender  Sender
	Channel string
	Logger  *slog.Logger
}

func (w *Worker) stateKey() string { return "DISCORD_LAST_DATA_HISTORY_ID_" + w.Channel }

// A new channel starts at the current head: never replay a decade of history.
// Existing cursors survive restarts and outages. This is deliberately a new key;
// the deleted NestJS bot stored a row count, not a data_histories primary key.
func (w *Worker) Initialize(ctx context.Context) error {
	_, err := w.DB.ExecContext(ctx, `INSERT INTO current_state (state, value)
		SELECT $1, COALESCE(MAX(id), 0) FROM data_histories
		ON CONFLICT (state) DO NOTHING`, w.stateKey())
	return err
}

// One transaction per event: concurrent workers serialize on the cursor row.
// Failed image checks or sends leave the cursor untouched. Discord's enforced
// nonce also deduplicates recent retries if sending succeeds but commit fails.
// This is at-least-once delivery, not a cross-system exactly-once guarantee.
func (w *Worker) Step(ctx context.Context) error {
	tx, err := w.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var cursor int64
	if err := tx.QueryRowContext(ctx, `SELECT value FROM current_state WHERE state = $1 FOR UPDATE`, w.stateKey()).Scan(&cursor); err != nil {
		return fmt.Errorf("lock notification cursor: %w", err)
	}
	var u Update
	err = tx.QueryRowContext(ctx, `SELECT id, tile_id, block_number, time_stamp, image, url, updated_by, tx
		FROM data_histories WHERE id > $1 ORDER BY id LIMIT 1`, cursor).
		Scan(&u.ID, &u.TileID, &u.BlockNumber, &u.Timestamp, &u.Image, &u.URL, &u.UpdatedBy, &u.Transaction)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("load pending tile update: %w", err)
	}
	messageID := ""
	if u.Image != "" {
		if err := w.Sender.ImageReady(ctx, u); err != nil {
			return err
		}
		messageID, err = w.Sender.Send(ctx, u)
		if err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `UPDATE current_state SET value = $2 WHERE state = $1`, w.stateKey(), u.ID); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("save notification cursor: %w", err)
	}
	w.Logger.Info("Discord tile update processed", "history_id", u.ID, "tile_id", u.TileID, "message_id", messageID, "empty_image_skipped", u.Image == "")
	return nil
}

func (w *Worker) Run(ctx context.Context) {
	initialized := false
	for ctx.Err() == nil {
		delay := 5 * time.Second
		stepCtx, cancel := context.WithTimeout(ctx, 40*time.Second)
		var err error
		if !initialized {
			err = w.Initialize(stepCtx)
			if err == nil {
				initialized = true
				w.Logger.Info("Discord notifier ready", "channel_id", w.Channel)
			}
		}
		if err == nil {
			err = w.Step(stepCtx)
		}
		cancel()
		if err != nil && ctx.Err() == nil {
			delay = 30 * time.Second
			var retry *RetryError
			if errors.As(err, &retry) {
				delay = retry.After
			}
			w.Logger.Error("Discord notification deferred; cursor preserved", "error", err, "retry_in", delay)
		}
		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}
