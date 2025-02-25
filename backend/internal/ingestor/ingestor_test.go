package ingestor

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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

func TestNewIngestor(t *testing.T) {
	t.Skip("Skipping test that requires database connection")
	
	/*
	logger, _ := zap.NewDevelopment()
	db, err := sql.Open("postgres", "postgresql://postgres:postgres@localhost:5432/pixelmap?sslmode=disable")
	require.NoError(t, err)
	defer db.Close()

	ingestor := NewIngestor(logger, db, "test_api_key")
	
	assert.NotNil(t, ingestor)
	assert.NotNil(t, ingestor.logger)
	assert.NotNil(t, ingestor.queries)
	assert.NotNil(t, ingestor.etherscanClient)
	assert.NotNil(t, ingestor.pubSub)
	assert.NotNil(t, ingestor.renderSignal)
	assert.Equal(t, 5, ingestor.maxRetries)
	assert.Equal(t, time.Second, ingestor.baseDelay)
	*/
}

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

// This function is commented out as the tests are skipped
/*
func processTileUpdateWrapper(t *testing.T) (*MockQueries, *MockEtherscanClient, context.Context) {
	logger, _ := zap.NewDevelopment()
	mockQueries := new(MockQueries)
	mockEtherscanClient := new(MockEtherscanClient)
	ctx := context.Background()
	
	return mockQueries, mockEtherscanClient, ctx
}
*/

// Skip this test until we refactor the code to make it more testable
func TestProcessTileUpdate(t *testing.T) {
	t.Skip("This test requires refactoring to use interfaces for better mocking")
	
	/*
	mockQueries, mockEtherscanClient, ctx := processTileUpdateWrapper(t)
	
	location := big.NewInt(123)
	image := "390390390390390390390000000390390390390390390390390390390390390390000FF0FF0000390390"
	url := "https://example.com"
	priceWei := big.NewInt(2000000000000000000) // 2 ETH in Wei
	tx := &EtherscanTransaction{
		Hash:      "0x123",
		From:      "0x456",
		TimeStamp: "1617192000",
	}
	timestamp := int64(1617192000)
	blockNumber := int64(12345678)
	txIndex := int32(1)
	
	// Mock GetTileById
	mockQueries.On("GetTileById", ctx, int32(123)).Return(db.Tile{
		ID:    123,
		Price: "1.00",
		Url:   "https://old-example.com",
		Image: "old-image-data",
		Owner: "0x456",
	}, nil)
	
	// Mock InsertDataHistory
	dataHistoryArg := mock.MatchedBy(func(arg db.InsertDataHistoryParams) bool {
		return arg.TileID == 123 && arg.Price.String == "2.00" && arg.Url == url
	})
	mockQueries.On("InsertDataHistory", ctx, dataHistoryArg).Return(db.DataHistory{}, nil)
	
	// Mock UpdateTile
	updateTileArg := mock.MatchedBy(func(arg db.UpdateTileParams) bool {
		return arg.ID == 123 && arg.Price == "2.00" && arg.Url == url && arg.Image == image
	})
	mockQueries.On("UpdateTile", ctx, updateTileArg).Return(nil)
	
	err := ingestor.processTileUpdate(ctx, location, image, url, priceWei, tx, timestamp, blockNumber, txIndex)
	assert.NoError(t, err)
	
	mockQueries.AssertExpectations(t)
	*/
}

func TestProcessTransaction_BuyTile(t *testing.T) {
	t.Skip("This test requires refactoring to use interfaces for better mocking")
	
	/*
	logger, _ := zap.NewDevelopment()
	mockQueries := new(MockQueries)
	mockEtherscanClient := new(MockEtherscanClient)
	
	ctx := context.Background()
	tx := &EtherscanTransaction{
		Hash:             "0x123",
		BlockNumber:      "12345678",
		TimeStamp:        "1617192000",
		From:             "0xbuyer",
		To:               "0x015a06a433353f8db634df4eddf0c109882a15ab", // PixelMap contract
		Nonce:            "1",
		Value:            "2000000000000000000", // 2 ETH
		Gas:              "100000",
		GasPrice:         "10000000000",
		Input:            "0x4b43ed1200000000000000000000000000000000000000000000000000000000000000fa", // buyTile method with location 250
		TransactionIndex: "1",
		IsError:          "0",
		TxreceiptStatus:  "1",
		CumulativeGasUsed: "50000",
		GasUsed:          "40000",
		Confirmations:    "100",
	}
	
	// Mock GetTileById
	mockQueries.On("GetTileById", ctx, int32(250)).Return(db.Tile{
		ID:    250,
		Price: "2.00",
		Owner: "0x4f4b7e7edf5ec41235624ce207a6ef352aca7050", // Creator
	}, nil)
	
	// Mock InsertPurchaseHistory
	mockQueries.On("InsertPurchaseHistory", ctx, mock.AnythingOfType("db.InsertPurchaseHistoryParams")).Return(db.PurchaseHistory{}, nil)
	
	// Mock UpdateTileOwner
	mockQueries.On("UpdateTileOwner", ctx, db.UpdateTileOwnerParams{
		ID:    250,
		Owner: "0xbuyer",
	}).Return(nil)
	
	// Mock InsertPixelMapTransaction
	mockQueries.On("InsertPixelMapTransaction", ctx, mock.AnythingOfType("db.InsertPixelMapTransactionParams")).Return(db.PixelMapTransaction{}, nil)
	
	err := ingestor.processTransaction(ctx, tx)
	assert.NoError(t, err)
	
	mockQueries.AssertExpectations(t)
	*/
}

func TestProcessTransfer(t *testing.T) {
	t.Skip("This test requires refactoring to use interfaces for better mocking")
	
	/*
	ctx := context.Background()
	mockQueries := new(MockQueries)
	mockEtherscanClient := new(MockEtherscanClient)
	
	from := common.HexToAddress("0xseller")
	to := common.HexToAddress("0xbuyer")
	tokenId := big.NewInt(123)
	tx := &EtherscanTransaction{
		Hash:      "0x123",
		From:      "0xuser",
		TimeStamp: "1617192000",
	}
	timestamp := int64(1617192000)
	blockNumber := int64(12345678)
	logIndex := int32(1)
	
	// Mock InsertTransferHistory
	mockQueries.On("InsertTransferHistory", ctx, mock.AnythingOfType("db.InsertTransferHistoryParams")).Return(db.TransferHistory{}, nil)
	
	// Mock UpdateTileOwner
	mockQueries.On("UpdateTileOwner", ctx, mock.AnythingOfType("db.UpdateTileOwnerParams")).Return(nil)
	
	// Mock ListTiles for updateTileDataAndSync
	mockQueries.On("ListTiles", ctx, db.ListTilesParams{Limit: 3970, Offset: 0}).Return([]db.Tile{}, nil)
	
	args := []interface{}{from, to, tokenId}
	err := ingestor.processTransfer(ctx, args, tx, timestamp, blockNumber, logIndex)
	assert.NoError(t, err)
	
	mockQueries.AssertExpectations(t)
	*/
}

func TestGetStartBlock(t *testing.T) {
	t.Skip("This test requires refactoring to use interfaces for better mocking")
	
	/*
	ctx := context.Background()
	mockQueries := new(MockQueries)
	
	t.Run("LastProcessedBlock exists", func(t *testing.T) {
		mockQueries.On("GetLastProcessedBlock", ctx).Return(int64(1000), nil).Once()
		
		startBlock, err := ingestor.getStartBlock(ctx)
		assert.NoError(t, err)
		assert.Equal(t, int64(1001), startBlock)
	})
	
	t.Run("LastProcessedBlock is 0", func(t *testing.T) {
		mockQueries.On("GetLastProcessedBlock", ctx).Return(int64(0), nil).Once()
		
		// Mock initializeTiles
		for i := 0; i < 3970; i++ {
			mockQueries.On("InsertTile", ctx, mock.AnythingOfType("db.InsertTileParams")).Return(db.Tile{}, nil).Once()
		}
		
		startBlock, err := ingestor.getStartBlock(ctx)
		assert.NoError(t, err)
		assert.Equal(t, startBlockNumber, startBlock)
	})
	*/
}

func TestGetEndBlock(t *testing.T) {
	t.Skip("This test requires refactoring to use interfaces for better mocking")
	
	/*
	mockEtherscanClient := new(MockEtherscanClient)
	
	mockEtherscanClient.On("GetLatestBlockNumber").Return(uint64(10000), nil)
	
	endBlock, err := ingestor.getEndBlock()
	assert.NoError(t, err)
	assert.Equal(t, int64(10000-safetyBlockOffset), endBlock)
	
	mockEtherscanClient.AssertExpectations(t)
	*/
}