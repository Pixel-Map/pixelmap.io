package notifications

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"pixelmap.io/backend/internal/utils"
	"sync"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

type fakeSender struct {
	readyErr, sendErr error
	sent              []int64
	updates           []Update
	mu                sync.Mutex
}

func (s *fakeSender) ImageReady(context.Context, Update) error { return s.readyErr }
func (s *fakeSender) Send(ctx context.Context, u Update) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.sendErr != nil {
		return "", s.sendErr
	}
	s.sent = append(s.sent, u.ID)
	s.updates = append(s.updates, u)
	return fmt.Sprint(u.ID), nil
}

// Use only a disposable Postgres database: these tests create isolated schemas.
// NOTIFICATIONS_TEST_DATABASE_URL=... go test ./internal/notifications -race
func TestWorkerPostgres(t *testing.T) {
	dsn := os.Getenv("NOTIFICATIONS_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set NOTIFICATIONS_TEST_DATABASE_URL to an isolated test Postgres")
	}
	db, err := sql.Open("postgres", dsn)
	require.NoError(t, err)
	defer db.Close()
	ctx := context.Background()
	schema := fmt.Sprintf("discord_test_%d", time.Now().UnixNano())
	_, err = db.Exec(`CREATE SCHEMA ` + schema)
	require.NoError(t, err)
	defer db.Exec(`DROP SCHEMA ` + schema + ` CASCADE`)
	// lib/pq passes search_path as a connection parameter for every connection.
	testDB, err := sql.Open("postgres", dsn+"&search_path="+schema)
	require.NoError(t, err)
	defer testDB.Close()
	_, err = testDB.Exec(`CREATE TABLE current_state (state text PRIMARY KEY, value bigint NOT NULL);
		CREATE TABLE data_histories (id serial PRIMARY KEY, tile_id integer NOT NULL, block_number bigint NOT NULL,
		time_stamp timestamp NOT NULL, image text NOT NULL, url text NOT NULL, updated_by text NOT NULL, tx text NOT NULL, log_index integer NOT NULL DEFAULT 0);`)
	require.NoError(t, err)
	add := func(image string) int64 {
		var id int64
		require.NoError(t, testDB.QueryRow(`INSERT INTO data_histories (tile_id,block_number,time_stamp,image,url,updated_by,tx)
		VALUES (100,25924135,now(),$1,'example.com','owner','tx') RETURNING id`, image).Scan(&id))
		return id
	}
	old := add("old")
	sender := &fakeSender{}
	w := &Worker{DB: testDB, Sender: sender, Channel: "123", Logger: slog.New(slog.NewTextHandler(io.Discard, nil))}
	cursor := func() int64 {
		var value int64
		require.NoError(t, testDB.QueryRow(`SELECT value FROM current_state WHERE state=$1`, w.stateKey()).Scan(&value))
		return value
	}
	require.NoError(t, w.Initialize(ctx))
	require.Equal(t, old, cursor(), "first startup must skip historical backlog")
	require.NoError(t, w.Step(ctx))
	require.Empty(t, sender.sent)
	newID := add("new")
	sender.readyErr = errors.New("image not published")
	require.Error(t, w.Step(ctx))
	require.Equal(t, old, cursor())
	require.Empty(t, sender.sent)
	sender.readyErr = nil
	sender.sendErr = errors.New("Discord unavailable")
	require.Error(t, w.Step(ctx))
	require.Equal(t, old, cursor())
	sender.sendErr = nil
	require.NoError(t, w.Step(ctx))
	require.Equal(t, newID, cursor())
	require.Equal(t, []int64{newID}, sender.sent)
	require.Equal(t, "old", sender.updates[0].PreviousImage)
	require.NoError(t, w.Initialize(ctx))
	require.NoError(t, w.Step(ctx))
	require.Len(t, sender.sent, 1, "restart must not replay deliveries")
	empty := add("")
	require.NoError(t, w.Step(ctx))
	require.Equal(t, empty, cursor())
	require.Len(t, sender.sent, 1)
	concurrentID := add("next")
	var group sync.WaitGroup
	errs := make(chan error, 2)
	for range 2 {
		group.Add(1)
		go func() { defer group.Done(); errs <- w.Step(ctx) }()
	}
	group.Wait()
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
	require.Equal(t, []int64{newID, concurrentID}, sender.sent, "two workers must serialize delivery")
	missingID := add("missing")
	sender.readyErr = errors.New("image not published")
	require.Error(t, w.Step(ctx))
	_, err = testDB.Exec(`UPDATE current_state SET value=$2 WHERE state=$1`, fmt.Sprintf("DISCORD_IMAGE_WAIT_%s_%d", w.Channel, missingID), time.Now().Add(-2*time.Hour).Unix())
	require.NoError(t, err)
	// A fresh worker retains the timeout and sends a text fallback.
	restarted := &Worker{DB: testDB, Sender: sender, Channel: w.Channel, Logger: w.Logger}
	require.NoError(t, restarted.Step(ctx))
	require.Equal(t, missingID, cursor())
	require.True(t, sender.updates[len(sender.updates)-1].ImageUnavailable)
	invalidID := add("0")
	sender.readyErr = utils.ErrInvalidTileImage
	require.NoError(t, restarted.Step(ctx))
	require.Equal(t, invalidID, cursor())
	sender.readyErr = nil
	other := &Worker{DB: testDB, Sender: sender, Channel: "456", Logger: w.Logger}
	require.NoError(t, other.Initialize(ctx))
	require.NoError(t, other.Step(ctx))
	require.Len(t, sender.sent, 4, "a new channel starts at head")
	// Insertion IDs are not chain order. The predecessor may even have been
	// backfilled after this event; a different tile must never be compared.
	var targetID int64
	require.NoError(t, testDB.QueryRow(`INSERT INTO data_histories (tile_id,block_number,log_index,time_stamp,image,url,updated_by,tx)
		VALUES (200,30,2,now(),'target','','owner','tx') RETURNING id`).Scan(&targetID))
	_, err = testDB.Exec(`INSERT INTO data_histories (tile_id,block_number,log_index,time_stamp,image,url,updated_by,tx) VALUES
		(200,20,0,now(),'older-block','','owner','tx'),
		(200,30,1,now(),'same-block-before','','owner','tx'),
		(201,30,1,now(),'wrong-tile','','owner','tx')`)
	require.NoError(t, err)
	require.NoError(t, w.Step(ctx))
	require.Equal(t, targetID, sender.updates[len(sender.updates)-1].ID)
	require.Equal(t, "same-block-before", sender.updates[len(sender.updates)-1].PreviousImage)
}
