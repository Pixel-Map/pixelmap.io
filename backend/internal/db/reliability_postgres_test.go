package db

import (
	"context"
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
	"os"
	"testing"
	"time"
)

func TestPostgresHistoryOrderAndResumableInitialization(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to an isolated test Postgres")
	}
	conn, err := sql.Open("postgres", dsn)
	require.NoError(t, err)
	defer conn.Close()
	schema := fmt.Sprintf("db_reliability_%d", time.Now().UnixNano())
	_, err = conn.Exec("CREATE SCHEMA " + schema)
	require.NoError(t, err)
	defer conn.Exec("DROP SCHEMA " + schema + " CASCADE")
	isolated, err := sql.Open("postgres", dsn+"&search_path="+schema)
	require.NoError(t, err)
	defer isolated.Close()
	migration, err := os.ReadFile("migrations/001_initial_schema.sql")
	require.NoError(t, err)
	_, err = isolated.Exec(string(migration))
	require.NoError(t, err)
	q := New(isolated)
	ctx := context.Background()
	_, err = q.InsertTile(ctx, InsertTileParams{ID: 100, Image: "existing-art", Price: "1", Owner: "existing-owner"})
	require.NoError(t, err)
	_, err = q.InsertTile(ctx, InsertTileParams{ID: 100, Image: "", Price: "2", Owner: "genesis-owner"})
	require.NoError(t, err)
	tile, err := q.GetTileById(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, "existing-art", tile.Image)
	require.Equal(t, "existing-owner", tile.Owner)
	// Insert a later transaction first, then backfill an earlier transaction
	// in the same block. Serial IDs and timestamps must not decide the winner.
	for _, entry := range []struct {
		tx, image string
		index     int32
	}{{"late", "new", 2}, {"early", "old", 1}} {
		_, err = q.InsertDataHistory(ctx, InsertDataHistoryParams{TileID: 100, BlockNumber: 20, TimeStamp: time.Unix(100, 0), Tx: entry.tx, LogIndex: entry.index, Image: entry.image, UpdatedBy: "owner"})
		require.NoError(t, err)
	}
	images, err := q.GetLatestTileImages(ctx)
	require.NoError(t, err)
	require.Len(t, images, 1)
	require.Equal(t, "new", images[0].Image)
	history, err := q.GetDataHistoryByTileId(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, "late", history[0].Tx)
	latest, err := q.GetLatestDataHistoryByTileId(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, "late", latest.Tx)
}
