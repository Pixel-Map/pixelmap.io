package ingestor

import (
	"context"
	"errors"
	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"math/big"
	"os"
	"path/filepath"
	db "pixelmap.io/backend/internal/db"
	"strings"
	"testing"
	"time"
)

type testQueries struct {
	db.Querier
	block             int64
	cursor            int32
	history           []db.DataHistory
	stateErr, listErr error
	updated           db.UpdateTileParams
	owner             db.UpdateTileOwnerParams
	inserted          db.InsertDataHistoryParams
}

func (q *testQueries) GetLastProcessedBlock(context.Context) (int64, error) { return q.block, nil }
func (q *testQueries) UpdateLastProcessedBlock(_ context.Context, n int64) error {
	if q.stateErr != nil {
		return q.stateErr
	}
	q.block = n
	return nil
}
func (q *testQueries) GetLastProcessedDataHistoryID(context.Context) (int32, error) {
	return q.cursor, nil
}
func (q *testQueries) GetUnprocessedDataHistory(_ context.Context, id int32) ([]db.DataHistory, error) {
	var rows []db.DataHistory
	for _, r := range q.history {
		if r.ID > id {
			rows = append(rows, r)
		}
	}
	return rows, nil
}
func (q *testQueries) UpdateLastProcessedDataHistoryID(_ context.Context, n int32) error {
	if q.stateErr != nil {
		return q.stateErr
	}
	q.cursor = n
	return nil
}
func (q *testQueries) GetTileById(_ context.Context, id int32) (db.Tile, error) {
	return db.Tile{ID: id, Image: strings.Repeat("fff", 256)}, nil
}
func (q *testQueries) GetDataHistoryByTileId(_ context.Context, id int32) ([]db.DataHistory, error) {
	return q.history, nil
}
func (q *testQueries) GetPurchaseHistoryByTileId(context.Context, int32) ([]db.PurchaseHistory, error) {
	return nil, nil
}
func (q *testQueries) GetTransferHistoryByTileId(context.Context, int32) ([]db.TransferHistory, error) {
	return nil, nil
}
func (q *testQueries) GetWrappingHistoryByTileId(context.Context, int32) ([]db.WrappingHistory, error) {
	return nil, nil
}
func (q *testQueries) GetLatestTileImages(context.Context) ([]db.GetLatestTileImagesRow, error) {
	return nil, nil
}
func (q *testQueries) ListTiles(context.Context, db.ListTilesParams) ([]db.Tile, error) {
	return nil, q.listErr
}
func (q *testQueries) InsertDataHistory(_ context.Context, p db.InsertDataHistoryParams) (int32, error) {
	q.inserted = p
	return 1, nil
}
func (q *testQueries) UpdateTile(_ context.Context, p db.UpdateTileParams) error {
	q.updated = p
	return nil
}
func (q *testQueries) InsertTransferHistory(context.Context, db.InsertTransferHistoryParams) (int32, error) {
	return 1, nil
}
func (q *testQueries) UpdateTileOwner(_ context.Context, p db.UpdateTileOwnerParams) error {
	q.owner = p
	return nil
}

type testChain struct {
	err   error
	calls int
	rows  []EtherscanTransaction
}

func (c *testChain) GetLatestBlockNumber() (uint64, error) { return 100, c.err }
func (c *testChain) GetTransactions(context.Context, int64, int64) ([]EtherscanTransaction, error) {
	c.calls++
	return c.rows, c.err
}

type testPublisher struct {
	err    error
	calls  int
	before func()
}

func (p *testPublisher) SyncWithS3(context.Context) error {
	p.calls++
	if p.before != nil {
		p.before()
	}
	return p.err
}
func testIngestor(q *testQueries, c *testChain) *Ingestor {
	return &Ingestor{queries: q, etherscanClient: c, logger: zap.NewNop(), maxRetries: 2, pubSub: NewPubSub(), renderSignal: make(chan struct{}, 1)}
}

func TestGetStartBlock(t *testing.T) {
	q := &testQueries{block: startBlockNumber + 10}
	i := testIngestor(q, nil)
	n, err := i.getStartBlock(context.Background())
	require.NoError(t, err)
	require.Equal(t, q.block+1, n)
}
func TestGetEndBlock(t *testing.T) {
	c := &testChain{}
	i := testIngestor(nil, c)
	n, err := i.getEndBlock()
	require.NoError(t, err)
	require.EqualValues(t, 100-safetyBlockOffset, n)
	c.err = errors.New("upstream down")
	_, err = i.getEndBlock()
	require.Error(t, err)
}
func TestProcessBlockRange(t *testing.T) {
	q := &testQueries{block: 10}
	c := &testChain{err: errors.New("partial upstream failure")}
	i := testIngestor(q, c)
	require.Error(t, i.processBlockRange(context.Background(), 11, 20))
	require.EqualValues(t, 10, q.block)
	c.err = nil
	require.NoError(t, i.processBlockRange(context.Background(), 11, 20))
	require.EqualValues(t, 20, q.block)
}
func TestFetchTransactions(t *testing.T) {
	c := &testChain{err: errors.New("upstream down")}
	i := testIngestor(nil, c)
	_, err := i.fetchTransactions(context.Background(), 1, 2)
	require.Error(t, err)
	require.Equal(t, 2, c.calls)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err = i.fetchTransactions(ctx, 1, 2)
	require.ErrorIs(t, err, context.Canceled)
}
func TestUpdateLastProcessedBlock(t *testing.T) {
	q := &testQueries{stateErr: errors.New("database down")}
	i := testIngestor(q, nil)
	require.Error(t, i.updateLastProcessedBlock(context.Background(), 20))
	require.Zero(t, q.block)
	q.stateErr = nil
	require.NoError(t, i.updateLastProcessedBlock(context.Background(), 20))
	require.EqualValues(t, 20, q.block)
}
func TestProcessDataHistory(t *testing.T) {
	t.Chdir(t.TempDir())
	q := &testQueries{history: []db.DataHistory{{ID: 1, TileID: 100, Image: strings.Repeat("fff", 256), BlockNumber: 20}}}
	i := testIngestor(q, nil)
	p := &testPublisher{err: errors.New("S3 down"), before: func() { require.Zero(t, q.cursor, "checkpoint must remain pending until publish succeeds") }}
	i.s3Syncer = p
	require.Error(t, i.processDataHistory(context.Background()))
	require.Zero(t, q.cursor)
	p.err = nil
	require.NoError(t, i.processDataHistory(context.Background()))
	require.EqualValues(t, 1, q.cursor)
	require.FileExists(t, "cache/100/20.png")
	p.before = nil
	require.NoError(t, i.processDataHistory(context.Background()))
	require.Equal(t, 3, p.calls, "no new history must still retry outstanding uploads")
}
func TestUpdateTileDataAndSync(t *testing.T) {
	t.Chdir(t.TempDir())
	q := &testQueries{listErr: errors.New("database down")}
	i := testIngestor(q, nil)
	p := &testPublisher{}
	i.s3Syncer = p
	require.Error(t, i.updateTileDataAndSync(context.Background()))
	require.Zero(t, p.calls)
	q.listErr = nil
	p.err = errors.New("S3 down")
	require.Error(t, i.updateTileDataAndSync(context.Background()))
	require.Equal(t, 1, p.calls)
}
func TestProcessTileUpdate(t *testing.T) {
	q := &testQueries{}
	i := testIngestor(q, nil)
	tx := &EtherscanTransaction{Hash: "tx", From: "owner"}
	require.NoError(t, i.processTileUpdate(context.Background(), big.NewInt(100), strings.Repeat("fff", 256), "example.com", big.NewInt(0), tx, 123, 20, 2))
	require.Equal(t, q.updated.Image, q.inserted.Image)
	require.EqualValues(t, 100, q.updated.ID)
	require.Equal(t, "owner", q.updated.Owner)
	require.EqualValues(t, 20, q.inserted.BlockNumber)
	require.Equal(t, time.Unix(123, 0), q.inserted.TimeStamp)
}
func TestProcessTransfer(t *testing.T) {
	t.Chdir(t.TempDir())
	q := &testQueries{}
	i := testIngestor(q, nil)
	tx := &EtherscanTransaction{Hash: "tx"}
	require.Error(t, i.processTransfer(context.Background(), nil, tx, 123, 20, 0))
	from, to := common.HexToAddress("0x1"), common.HexToAddress("0x2")
	require.NoError(t, i.processTransfer(context.Background(), []interface{}{from, to, big.NewInt(100)}, tx, 123, 20, 0))
	require.Equal(t, to.Hex(), q.owner.Owner)
	require.EqualValues(t, 100, q.owner.ID)
}
func TestRenderInvalidImageReplacesStaleArtwork(t *testing.T) {
	t.Chdir(t.TempDir())
	i := testIngestor(nil, nil)
	require.NoError(t, i.renderAndSaveImage(big.NewInt(100), strings.Repeat("fff", 256), 20))
	before, err := os.ReadFile("cache/100/latest.png")
	require.NoError(t, err)
	require.NoError(t, i.renderAndSaveImage(big.NewInt(100), "0", 21))
	after, err := os.ReadFile("cache/100/latest.png")
	require.NoError(t, err)
	require.NotEqual(t, before, after)
	require.FileExists(t, filepath.Join("cache", "100", "21.png"))
}
func TestPubSub(t *testing.T) {
	ps := NewPubSub()
	ch := ps.Subscribe("event")
	ps.Publish(Event{Type: "event"})
	select {
	case e := <-ch:
		require.Equal(t, "event", e.Type)
	case <-time.After(time.Second):
		t.Fatal("missing event")
	}
}
func TestSignalNewData(t *testing.T) {
	i := testIngestor(nil, nil)
	i.signalNewData()
	i.signalNewData()
	require.Len(t, i.renderSignal, 1)
}
