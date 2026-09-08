package ingestor

import (
	"context"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"pixelmap.io/backend/internal/contracts/pixelmap"
	"pixelmap.io/backend/internal/db"
	"pixelmap.io/backend/internal/utils"
)

func validTransaction() EtherscanTransaction {
	return EtherscanTransaction{BlockNumber: "20", TimeStamp: "1700000000", Nonce: "0", Value: "0", Gas: "1", GasPrice: "1", CumulativeGasUsed: "1", GasUsed: "1", Confirmations: "10", TransactionIndex: "0", From: "0x1111111111111111111111111111111111111111", To: "0x015a06a433353f8db634df4eddf0c109882a15ab", Hash: "0x" + strings.Repeat("1", 64)}
}

func TestTransactionNumbersRejectMalformedAndOverflow(t *testing.T) {
	for _, field := range []string{"blockNumber", "timeStamp", "nonce", "value", "gas", "gasPrice", "cumulativeGasUsed", "gasUsed", "confirmations", "transactionIndex"} {
		for _, bad := range []string{"", "oops", "-1", strings.Repeat("9", 100)} {
			t.Run(field+"/"+bad, func(t *testing.T) {
				tx := validTransaction()
				fields := map[string]*string{"blockNumber": &tx.BlockNumber, "timeStamp": &tx.TimeStamp, "nonce": &tx.Nonce, "value": &tx.Value, "gas": &tx.Gas, "gasPrice": &tx.GasPrice, "cumulativeGasUsed": &tx.CumulativeGasUsed, "gasUsed": &tx.GasUsed, "confirmations": &tx.Confirmations, "transactionIndex": &tx.TransactionIndex}
				*fields[field] = bad
				i := &Ingestor{logger: zap.NewNop()}
				require.NotPanics(t, func() { require.Error(t, i.processTransaction(context.Background(), &tx)) })
			})
		}
	}
	tx := validTransaction()
	tx.TransactionIndex = "0x2"
	require.NoError(t, validateTransactionNumbers(&tx))
}

func isolatedIngestorDB(t *testing.T) *sql.DB {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to an isolated test Postgres")
	}
	admin, err := sql.Open("postgres", dsn)
	require.NoError(t, err)
	schema := fmt.Sprintf("ingestor_atomic_%d", time.Now().UnixNano())
	_, err = admin.Exec("CREATE SCHEMA " + schema)
	require.NoError(t, err)
	conn, err := sql.Open("postgres", dsn+"&search_path="+schema)
	require.NoError(t, err)
	t.Cleanup(func() { conn.Close(); admin.Exec("DROP SCHEMA " + schema + " CASCADE"); admin.Close() })
	migration, err := os.ReadFile("../db/migrations/001_initial_schema.sql")
	require.NoError(t, err)
	_, err = conn.Exec(string(migration))
	require.NoError(t, err)
	return conn
}

func TestBatchRollsBackHistoryStateAndCursorThenRecovers(t *testing.T) {
	conn := isolatedIngestorDB(t)
	ctx := context.Background()
	q := db.New(conn)
	_, err := q.InsertTile(ctx, db.InsertTileParams{ID: 100, Price: "0", Image: "old", Owner: "old-owner"})
	require.NoError(t, err)
	require.NoError(t, q.UpdateLastProcessedBlock(ctx, 19))
	abi, err := pixelmap.PixelMapMetaData.GetAbi()
	require.NoError(t, err)
	input, err := abi.Pack("setTile", big.NewInt(100), strings.Repeat("fff", 256), "example.com", big.NewInt(0))
	require.NoError(t, err)
	event := validTransaction()
	event.Input = "0x" + hex.EncodeToString(input)
	chain := &testChain{rows: []EtherscanTransaction{event}}
	i := &Ingestor{sqlDB: conn, queries: q, logger: zap.NewNop(), etherscanClient: chain, maxRetries: 1, renderSignal: make(chan struct{}, 1)}
	// Fail after the history insert, at the current-tile write.
	_, err = conn.Exec(`CREATE FUNCTION reject_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$;
 CREATE TRIGGER fail_tile BEFORE UPDATE ON tiles FOR EACH ROW EXECUTE FUNCTION reject_update()`)
	require.NoError(t, err)
	require.Error(t, i.processBlockRange(ctx, 20, 20))
	var count int
	require.NoError(t, conn.QueryRow("SELECT count(*) FROM data_histories").Scan(&count))
	require.Zero(t, count)
	tile, err := q.GetTileById(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, "old", tile.Image)
	cursor, err := q.GetLastProcessedBlock(ctx)
	require.NoError(t, err)
	require.EqualValues(t, 19, cursor)
	_, err = conn.Exec("DROP TRIGGER fail_tile ON tiles")
	require.NoError(t, err)
	require.NoError(t, i.processBlockRange(ctx, 20, 20))
	tile, err = q.GetTileById(ctx, 100)
	require.NoError(t, err)
	require.Equal(t, strings.Repeat("fff", 256), tile.Image)
	pending, err := i.pendingTiles(ctx)
	require.NoError(t, err)
	require.True(t, pending[100])
	// A subsequent malformed event also rolls the entire range back.
	bad := event
	bad.Nonce = "invalid"
	chain.rows = []EtherscanTransaction{event, bad}
	require.Error(t, i.processBlockRange(ctx, 21, 21))
	cursor, err = q.GetLastProcessedBlock(ctx)
	require.NoError(t, err)
	require.EqualValues(t, 20, cursor)
	// Restarted publisher recovers durable pending work; failures keep the marker.
	t.Chdir(t.TempDir())
	publisher := &testPublisher{err: fmt.Errorf("S3 unavailable")}
	i.s3Syncer = publisher
	require.Error(t, i.processDataHistory(ctx))
	pending, err = i.pendingTiles(ctx)
	require.NoError(t, err)
	require.True(t, pending[100])
	publisher.err = nil
	require.NoError(t, i.processDataHistory(ctx))
	pending, err = i.pendingTiles(ctx)
	require.NoError(t, err)
	require.Empty(t, pending)
}

func TestSameBlockHistoryKeepsDistinctArtifacts(t *testing.T) {
	t.Chdir(t.TempDir())
	a := db.DataHistory{TileID: 100, BlockNumber: 20, Tx: "first", Image: strings.Repeat("f00", 256)}
	b := a
	b.Tx = "second"
	b.Image = strings.Repeat("00f", 256)
	require.NoError(t, RenderHistoryImage(a))
	require.NoError(t, RenderHistoryImage(b))
	ap := utils.HistoryImagePath(a.TileID, a.BlockNumber, a.Tx)
	bp := utils.HistoryImagePath(b.TileID, b.BlockNumber, b.Tx)
	require.NotEqual(t, ap, bp)
	ab, err := os.ReadFile(filepath.Join("cache", ap))
	require.NoError(t, err)
	bb, err := os.ReadFile(filepath.Join("cache", bp))
	require.NoError(t, err)
	require.NotEqual(t, ab, bb)
	require.Equal(t, ap, publishedHistoryPath(a.TileID, a.BlockNumber, a.Tx))
	require.Equal(t, "/100/10.png", publishedHistoryPath(100, 10, "unmigrated"))
}

func TestRendererStopsOnCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	i := &Ingestor{renderSignal: make(chan struct{}, 1)}
	done := make(chan struct{})
	go func() { i.continuousRenderProcess(ctx); close(done) }()
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("renderer did not stop")
	}
}

func TestLegacyAliasesKeepLastEditInBlockDuringBackfill(t *testing.T) {
	t.Chdir(t.TempDir())
	history := []db.DataHistory{
		{TileID: 100, BlockNumber: 21, Tx: "newest", Image: strings.Repeat("fff", 256)},
		{TileID: 100, BlockNumber: 20, Tx: "later-in-block", Image: strings.Repeat("00f", 256)},
		{TileID: 100, BlockNumber: 20, Tx: "earlier-in-block", Image: strings.Repeat("f00", 256)},
	}
	require.NoError(t, MaterializeHistory(context.Background(), history))
	expected, err := os.ReadFile(filepath.Join("cache", utils.HistoryImagePath(100, 20, "later-in-block")))
	require.NoError(t, err)
	legacy, err := os.ReadFile("cache/100/20.png")
	require.NoError(t, err)
	require.Equal(t, expected, legacy)
	newest, err := os.ReadFile(filepath.Join("cache", utils.HistoryImagePath(100, 21, "newest")))
	require.NoError(t, err)
	latest, err := os.ReadFile("cache/100/latest.png")
	require.NoError(t, err)
	require.Equal(t, newest, latest)
}

func TestPurchaseReplayDoesNotAbortTransaction(t *testing.T) {
	conn := isolatedIngestorDB(t)
	ctx := context.Background()
	q := db.New(conn)
	_, err := q.InsertTile(ctx, db.InsertTileParams{ID: 100, Price: "1", Owner: "seller"})
	require.NoError(t, err)
	params := db.InsertPurchaseHistoryParams{TileID: 100, Tx: "purchase", SoldBy: "seller", PurchasedBy: "buyer", Price: "1", TimeStamp: time.Now(), BlockNumber: 20}
	original, err := q.InsertPurchaseHistory(ctx, params)
	require.NoError(t, err)
	transaction, err := conn.BeginTx(ctx, nil)
	require.NoError(t, err)
	defer transaction.Rollback()
	replayed, err := db.New(transaction).InsertPurchaseHistory(ctx, params)
	require.NoError(t, err)
	require.Equal(t, original, replayed)
	require.NoError(t, transaction.Commit())
}
