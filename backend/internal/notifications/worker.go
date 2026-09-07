package notifications

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"pixelmap.io/backend/internal/utils"
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
	// Ingestion can insert history out of order, so use chain order rather than
	// the previous serial ID. Include transaction order for same-block updates.
	err = tx.QueryRowContext(ctx, `SELECT previous.image FROM data_histories previous
		JOIN data_histories current ON current.id = $1
		WHERE previous.tile_id = current.tile_id
		AND (previous.block_number, previous.log_index, previous.id)
		  < (current.block_number, current.log_index, current.id)
		ORDER BY previous.block_number DESC, previous.log_index DESC, previous.id DESC LIMIT 1`, u.ID).Scan(&u.PreviousImage)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("load previous tile image: %w", err)
	}
	messageID := ""
	waitKey := fmt.Sprintf("DISCORD_IMAGE_WAIT_%s_%d", w.Channel, u.ID)
	if u.Image != "" {
		if err := w.Sender.ImageReady(ctx, u); err != nil {
			// Keep the first failure time durable across process restarts. Allow
			// publication an hour, then send a text fallback instead of blocking
			// every subsequent event. Invalid on-chain data falls back immediately.
			var since int64
			if dbErr := tx.QueryRowContext(ctx, `INSERT INTO current_state (state,value) VALUES ($1,$2)
				ON CONFLICT (state) DO UPDATE SET value=current_state.value RETURNING value`, waitKey, time.Now().Unix()).Scan(&since); dbErr != nil {
				return dbErr
			}
			if !errors.Is(err, utils.ErrInvalidTileImage) && time.Since(time.Unix(since, 0)) < time.Hour {
				if commitErr := tx.Commit(); commitErr != nil {
					return commitErr
				}
				return err
			}
			u.ImageUnavailable = true
			w.Logger.Error("Tile image unavailable; sending Discord text fallback", "history_id", u.ID, "tile_id", u.TileID, "error", err)
			// Retain a small durable audit record for repair/replay tooling.
			if _, dbErr := tx.ExecContext(ctx, `INSERT INTO current_state (state,value) VALUES ($1,$2) ON CONFLICT (state) DO NOTHING`, fmt.Sprintf("DISCORD_IMAGE_FALLBACK_%s_%d", w.Channel, u.ID), time.Now().Unix()); dbErr != nil {
				return dbErr
			}
		}
		messageID, err = w.Sender.Send(ctx, u)
		if err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM current_state WHERE state=$1`, waitKey); err != nil {
		return err
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
