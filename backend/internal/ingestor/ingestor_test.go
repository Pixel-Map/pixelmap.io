package ingestor

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	db "pixelmap.io/backend/internal/db"
)

// MockQueries implements the db.Querier interface for testing
type MockQueries struct {
	mock.Mock
}

func (m *MockQueries) GetLastProcessedBlock(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockQueries) UpdateLastProcessedBlock(ctx context.Context, blockNumber int64) error {
	args := m.Called(ctx, blockNumber)
	return args.Error(0)
}

func (m *MockQueries) GetTileById(ctx context.Context, id int32) (db.Tile, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(db.Tile), args.Error(1)
}

func (m *MockQueries) UpdateTile(ctx context.Context, arg db.UpdateTileParams) error {
	args := m.Called(ctx, arg)
	return args.Error(0)
}

func (m *MockQueries) UpdateTileOwner(ctx context.Context, arg db.UpdateTileOwnerParams) error {
	args := m.Called(ctx, arg)
	return args.Error(0)
}

func (m *MockQueries) UpdateWrappedStatus(ctx context.Context, arg db.UpdateWrappedStatusParams) error {
	args := m.Called(ctx, arg)
	return args.Error(0)
}

func (m *MockQueries) InsertTile(ctx context.Context, arg db.InsertTileParams) (db.Tile, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.Tile), args.Error(1)
}

func (m *MockQueries) InsertPixelMapTransaction(ctx context.Context, arg db.InsertPixelMapTransactionParams) (db.PixelMapTransaction, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.PixelMapTransaction), args.Error(1)
}

func (m *MockQueries) InsertPurchaseHistory(ctx context.Context, arg db.InsertPurchaseHistoryParams) (db.PurchaseHistory, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.PurchaseHistory), args.Error(1)
}

func (m *MockQueries) InsertDataHistory(ctx context.Context, arg db.InsertDataHistoryParams) (db.DataHistory, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.DataHistory), args.Error(1)
}

func (m *MockQueries) InsertWrappingHistory(ctx context.Context, arg db.InsertWrappingHistoryParams) (db.WrappingHistory, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.WrappingHistory), args.Error(1)
}

func (m *MockQueries) InsertTransferHistory(ctx context.Context, arg db.InsertTransferHistoryParams) (db.TransferHistory, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(db.TransferHistory), args.Error(1)
}

func (m *MockQueries) GetLastProcessedDataHistoryID(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockQueries) GetUnprocessedDataHistory(ctx context.Context, lastID int64) ([]db.DataHistory, error) {
	args := m.Called(ctx, lastID)
	return args.Get(0).([]db.DataHistory), args.Error(1)
}

func (m *MockQueries) GetDataHistoryByTileId(ctx context.Context, tileID int32) ([]db.DataHistory, error) {
	args := m.Called(ctx, tileID)
	return args.Get(0).([]db.DataHistory), args.Error(1)
}

func (m *MockQueries) UpdateLastProcessedDataHistoryID(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQueries) GetLatestTileImages(ctx context.Context) ([]db.GetLatestTileImagesRow, error) {
	args := m.Called(ctx)
	return args.Get(0).([]db.GetLatestTileImagesRow), args.Error(1)
}

func (m *MockQueries) ListTiles(ctx context.Context, arg db.ListTilesParams) ([]db.Tile, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]db.Tile), args.Error(1)
}

func (m *MockQueries) WithTx(tx *sql.Tx) *db.Queries {
	args := m.Called(tx)
	return args.Get(0).(*db.Queries)
}

// MockEtherscanClient mocks the Etherscan API client
type MockEtherscanClient struct {
	mock.Mock
}

func (m *MockEtherscanClient) GetLatestBlockNumber() (uint64, error) {
	args := m.Called()
	return args.Get(0).(uint64), args.Error(1)
}

func (m *MockEtherscanClient) GetTransactions(ctx context.Context, fromBlock, toBlock int64) ([]EtherscanTransaction, error) {
	args := m.Called(ctx, fromBlock, toBlock)
	return args.Get(0).([]EtherscanTransaction), args.Error(1)
}

// MockS3Syncer mocks the S3Syncer
type MockS3Syncer struct {
	mock.Mock
}

func (m *MockS3Syncer) SyncWithS3(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// TestableIngestor is a wrapper that provides access to the Ingestor methods but uses mocked dependencies
type TestableIngestor struct {
	logger          *zap.Logger
	queries         *MockQueries
	etherscanClient *MockEtherscanClient
	s3Syncer        *MockS3Syncer
	pubSub          *PubSub
	renderSignal    chan struct{}
	maxRetries      int
	baseDelay       time.Duration
}

// NewTestableIngestor creates a new instance of TestableIngestor with mocked dependencies
func NewTestableIngestor(t *testing.T) *TestableIngestor {
	logger, _ := zap.NewDevelopment()
	mockQueries := new(MockQueries)
	mockEtherscanClient := new(MockEtherscanClient)
	mockS3Syncer := new(MockS3Syncer)

	renderSignal := make(chan struct{}, 1)

	return &TestableIngestor{
		logger:          logger,
		queries:         mockQueries,
		etherscanClient: mockEtherscanClient,
		s3Syncer:        mockS3Syncer,
		pubSub:          NewPubSub(),
		renderSignal:    renderSignal,
		maxRetries:      5,
		baseDelay:       time.Second,
	}
}

// Tests for PubSub
func TestPubSub(t *testing.T) {
	pubSub := NewPubSub()
	
	// Test Subscribe
	ch := pubSub.Subscribe("test_event")
	assert.NotNil(t, ch)
	
	// Test Publish
	payload := []byte(`{"test": "data"}`)
	pubSub.Publish(Event{Type: "test_event", Payload: payload})
	
	// Check that the event was received
	select {
	case event := <-ch:
		assert.Equal(t, "test_event", event.Type)
		// Use string comparison since the types are different
		assert.Equal(t, string(payload), string(event.Payload))
	case <-time.After(time.Second):
		t.Fatal("Timed out waiting for event")
	}
}

// Test for getStartBlock functionality
func TestGetStartBlock(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for getEndBlock functionality
func TestGetEndBlock(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for processBlockRange functionality
func TestProcessBlockRange(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for fetchTransactions functionality
func TestFetchTransactions(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for updateLastProcessedBlock functionality
func TestUpdateLastProcessedBlock(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for processDataHistory functionality
func TestProcessDataHistory(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for signalNewData
func TestSignalNewData(t *testing.T) {
	// Create a testable ingestor with a signal channel
	ingestor := &Ingestor{
		renderSignal: make(chan struct{}, 1),
	}
	
	// Test that signalNewData adds a signal to the channel
	ingestor.signalNewData()
	
	// Verify that the signal was sent
	select {
	case <-ingestor.renderSignal:
		// Signal was received, test passed
	default:
		t.Fatal("No signal was sent to the renderSignal channel")
	}
	
	// Test that signalNewData doesn't block when channel already has a signal
	ingestor.signalNewData() // First signal (already tested above)
	ingestor.signalNewData() // Second signal (shouldn't block)
	
	// Verify that exactly one signal is in the channel
	select {
	case <-ingestor.renderSignal:
		// Signal was received
		select {
		case <-ingestor.renderSignal:
			t.Fatal("Multiple signals were sent to the renderSignal channel")
		default:
			// No more signals, which is correct
		}
	default:
		t.Fatal("No signal was available in the renderSignal channel")
	}
}

// Test for updateTileDataAndSync functionality
func TestUpdateTileDataAndSync(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for processTileUpdate functionality
func TestProcessTileUpdate(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}

// Test for processTransfer functionality
func TestProcessTransfer(t *testing.T) {
	t.Skip("Function requires refactoring to make it more testable")
}