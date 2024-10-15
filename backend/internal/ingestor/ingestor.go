package ingestor

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/big"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/lib/pq"
	ens "github.com/wealdtech/go-ens/v3"
	"go.uber.org/zap"
	pixelmap "pixelmap.io/backend/internal/contracts/pixelmap"
	pixelmapWrapper "pixelmap.io/backend/internal/contracts/pixelmapWrapper"
	db "pixelmap.io/backend/internal/db"
	utils "pixelmap.io/backend/internal/utils"
)

type Event struct {
	Type    string
	Payload json.RawMessage
}

type PubSub struct {
	subscribers map[string][]chan Event
	mu          sync.RWMutex
}

func NewPubSub() *PubSub {
	return &PubSub{
		subscribers: make(map[string][]chan Event),
	}
}

func lookupENS(client *ethclient.Client, address string) (string, error) {

	name, err := ens.ReverseResolve(client, common.HexToAddress(address))
	if err != nil {
		if err.Error() == "ErrNoName" {
			return "", nil // No ENS name found, but not an error
		}
		return "", fmt.Errorf("failed to resolve ENS name: %w", err)
	}

	return name, nil
}

func (ps *PubSub) Subscribe(eventType string) <-chan Event {
	ps.mu.Lock()
	defer ps.mu.Unlock()
	ch := make(chan Event, 100)
	ps.subscribers[eventType] = append(ps.subscribers[eventType], ch)
	return ch
}

func (ps *PubSub) Publish(event Event) {
	ps.mu.RLock()
	defer ps.mu.RUnlock()
	for _, ch := range ps.subscribers[event.Type] {
		select {
		case ch <- event:
		default:
			// Channel full, event dropped
		}
	}
}

type Ingestor struct {
	logger          *zap.Logger
	queries         *db.Queries
	etherscanClient *EtherscanClient
	pubSub          *PubSub
	renderSignal    chan struct{}
	isRendering     atomic.Bool
	maxRetries      int
	baseDelay       time.Duration
	s3Syncer        *S3Syncer
	ethClient       *ethclient.Client
}

func NewIngestor(logger *zap.Logger, sqlDB *sql.DB, apiKey string) *Ingestor {
	pubSub := NewPubSub()
	var s3Syncer *S3Syncer

	// Check if SYNC_TO_AWS environment variable is set
	if os.Getenv("SYNC_TO_AWS") == "true" {
		var err error
		s3Syncer, err = NewS3Syncer(logger, "cache")
		if err != nil {
			logger.Error("Failed to create S3Syncer", zap.Error(err))
		}
	}

	ethClient, err := ethclient.Dial(os.Getenv("WEB3_URL"))
	if err != nil {
		logger.Error("Failed to connect to Ethereum client", zap.Error(err))
	}

	if err != nil {
		logger.Error("Failed to create ENS resolver", zap.Error(err))
	}

	ingestor := &Ingestor{
		logger:          logger,
		queries:         db.New(sqlDB),
		etherscanClient: NewEtherscanClient(apiKey, logger),
		pubSub:          pubSub,
		renderSignal:    make(chan struct{}, 1),
		maxRetries:      5,
		baseDelay:       time.Second,
		s3Syncer:        s3Syncer,
		ethClient:       ethClient,
	}

	// Start the continuous rendering process
	go ingestor.continuousRenderProcess()

	// Trigger an initial render
	ingestor.signalNewData()

	return ingestor
}

func (i *Ingestor) StartContinuousIngestion(ctx context.Context) error {
	for {
		err := i.IngestTransactions(ctx)
		if err != nil {
			i.logger.Error("Error during transaction ingestion", zap.Error(err))
			// Optionally, you might want to return the error here if you want to stop the process on errors
			// return err
		}

		i.logger.Info("Finished ingestion cycle, waiting for 30 seconds before next check")
		// Start up the render process
		i.signalNewData()

		select {
		case <-time.After(30 * time.Second):
			// Continue to the next iteration after 30 seconds
		case <-ctx.Done():
			// Exit if the context is cancelled
			return ctx.Err()
		}
	}
}

func (i *Ingestor) IngestTransactions(ctx context.Context) error {
	startBlock, err := i.getStartBlock(ctx)
	if err != nil {
		return fmt.Errorf("failed to get start block: %w", err)
	}

	endBlock, err := i.getEndBlock()
	if err != nil {
		return fmt.Errorf("failed to get end block: %w", err)
	}

	i.logger.Info("Starting transaction ingestion",
		zap.Int64("startBlock", startBlock),
		zap.Int64("endBlock", endBlock))

	for currentBlock := startBlock; currentBlock <= endBlock; currentBlock += blockRangeSize {
		if err := i.processBlockRange(ctx, currentBlock, endBlock); err != nil {
			return err
		}
	}

	i.logger.Info("Finished ingesting transactions", zap.Int64("endBlock", endBlock))
	return nil
}

func (i *Ingestor) getStartBlock(ctx context.Context) (int64, error) {
	lastProcessedBlock, err := i.queries.GetLastProcessedBlock(ctx)
	if err != nil && err != sql.ErrNoRows {
		i.logger.Error("Failed to get last processed block", zap.Error(err))
		return 0, fmt.Errorf("failed to get last processed block: %w", err)
	}

	if lastProcessedBlock == 0 {
		// Initialize tiles
		if err := i.initializeTiles(ctx); err != nil {
			return 0, fmt.Errorf("failed to initialize tiles: %w", err)
		}
		return startBlockNumber, nil
	}

	if lastProcessedBlock > startBlockNumber {
		return lastProcessedBlock + 1, nil
	}
	return startBlockNumber, nil
}

func (i *Ingestor) initializeTiles(ctx context.Context) error {
	i.logger.Info("Initializing tiles")
	for tileID := 0; tileID < 3970; tileID++ {
		i.logger.Debug("Initializing tile", zap.Int("tileID", tileID))
		tile := db.InsertTileParams{
			ID:      int32(tileID),
			Price:   "2.00",
			Url:     "",
			Image:   "",
			Owner:   "0x4f4b7e7edf5ec41235624ce207a6ef352aca7050", // Creator of Pixelmap
			Wrapped: false,
		}

		if _, err := i.queries.InsertTile(ctx, tile); err != nil {
			return fmt.Errorf("failed to insert initial tile data: %w", err)
		}
	}
	i.logger.Info("Tiles initialized successfully")
	return nil
}

func (i *Ingestor) getEndBlock() (int64, error) {
	latestBlock, err := i.etherscanClient.GetLatestBlockNumber()
	if err != nil {
		i.logger.Error("Failed to get latest block number", zap.Error(err))
		return 0, fmt.Errorf("failed to get latest block number: %w", err)
	}
	return int64(latestBlock) - safetyBlockOffset, nil
}

func (i *Ingestor) processBlockRange(ctx context.Context, currentBlock, endBlock int64) error {
	blockEnd := currentBlock + blockRangeSize - 1
	if blockEnd > endBlock {
		blockEnd = endBlock
	}

	transactions, err := i.fetchTransactions(ctx, currentBlock, blockEnd)
	if err != nil {
		return err
	}

	skippedCount := 0
	for _, tx := range transactions {
		if err := i.processTransaction(ctx, &tx); err != nil {
			if strings.Contains(err.Error(), "bad jump destination") {
				skippedCount++
				continue
			}
			i.logger.Error("Failed to process transaction", zap.Error(err), zap.String("hash", tx.Hash))
			return fmt.Errorf("failed to process transaction %s: %w", tx.Hash, err)
		}
	}

	if err := i.updateLastProcessedBlock(ctx, blockEnd); err != nil {
		return err
	}

	i.logger.Info("Processed blocks",
		zap.Int64("from", currentBlock),
		zap.Int64("to", blockEnd),
		zap.Int("skippedTransactions", skippedCount))
	return nil
}

func (i *Ingestor) processTransaction(ctx context.Context, tx *EtherscanTransaction) error {
	// Check if this is a "bad jump destination" transaction
	if tx.IsError == "1" {
		i.logger.Debug("Skipping bad transaction",
			zap.String("hash", tx.Hash))
		return nil
	}

	// Convert types and insert into database
	blockNumber, _ := new(big.Int).SetString(tx.BlockNumber, 10)
	timeStamp, _ := new(big.Int).SetString(tx.TimeStamp, 10)
	nonce, _ := new(big.Int).SetString(tx.Nonce, 10)
	value, _ := new(big.Int).SetString(tx.Value, 10)
	gas, _ := new(big.Int).SetString(tx.Gas, 10)
	gasPrice, _ := new(big.Int).SetString(tx.GasPrice, 10)
	cumulativeGasUsed, _ := new(big.Int).SetString(tx.CumulativeGasUsed, 10)
	gasUsed, _ := new(big.Int).SetString(tx.GasUsed, 10)
	confirmations, _ := new(big.Int).SetString(tx.Confirmations, 10)

	transactionIndex, _ := strconv.Atoi(tx.TransactionIndex)
	// Make sure nonce is valid
	if tx.Nonce == "" {
		i.logger.Warn("Skipping transaction with invalid nonce", zap.String("hash", tx.Hash))
		i.logger.Info("Transaction", zap.Any("transaction", tx))
		return nil
	}
	transaction := db.InsertPixelMapTransactionParams{
		BlockNumber:       blockNumber.Int64(),
		TimeStamp:         time.Unix(timeStamp.Int64(), 0),
		Hash:              tx.Hash,
		Nonce:             nonce.Int64(),
		BlockHash:         tx.BlockHash,
		TransactionIndex:  int32(transactionIndex),
		From:              tx.From,
		To:                tx.To,
		Value:             value.String(),
		Gas:               gas.Int64(),
		GasPrice:          gasPrice.Int64(),
		IsError:           tx.IsError == "1",
		TxreceiptStatus:   sql.NullBool{Bool: tx.TxreceiptStatus == "1", Valid: true},
		Input:             tx.Input,
		ContractAddress:   tx.ContractAddress,
		CumulativeGasUsed: cumulativeGasUsed.Int64(),
		GasUsed:           gasUsed.Int64(),
		Confirmations:     confirmations.Int64(),
	}

	// fmt.Printf("transaction: %+v\n", transaction)

	// Decode the input data
	// If tx involves contract at 0x015A06a433353f8db634dF4eDdF0C109882A15AB, use non wrapper ABI
	var abi *abi.ABI
	if tx.To == "0x015a06a433353f8db634df4eddf0c109882a15ab" {
		abi, _ = pixelmap.PixelMapMetaData.GetAbi()

	} else if tx.To == "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b" {
		abi, _ = pixelmapWrapper.PixelMapWrapperMetaData.GetAbi()
	} else {
		// It's a transfer
		fmt.Println("Unknown contract address", tx.To)
		fmt.Printf("transaction: %+v\n", tx)
		return nil
	}

	// Check if the input data is long enough to contain a method ID
	if len(tx.Input) < 10 {
		i.logger.Warn("Transaction input too short to contain method ID",
			zap.String("hash", tx.Hash),
			zap.String("input", tx.Input))
		return nil
	}

	// The first 4 bytes of the input data represent the method ID
	methodID := tx.Input[:10]
	if string(methodID) == constructorMethodID {
		fmt.Println("Constructor called")
		return nil
	}
	method, err := abi.MethodById(common.FromHex(methodID))
	if err != nil {
		return fmt.Errorf("failed to get method: %w", err)
	}
	// Decode the parameters
	args, err := method.Inputs.Unpack(common.FromHex(tx.Input)[4:])
	if err != nil {
		return fmt.Errorf("failed to unpack inputs: %w", err)
	}

	switch method.Name {
	case "buyTile":
		if len(args) > 0 {
			location, ok := args[0].(*big.Int)
			if ok {
				i.logger.Debug("buyTile called",
					zap.String("location", location.String()),
					zap.String("tx", tx.Hash),
					zap.String("from", tx.From))

				// Fetch the current tile data
				tile, err := i.queries.GetTileById(ctx, int32(location.Int64()))
				if err != nil {
					return fmt.Errorf("failed to get tile data: %w", err)
				}

				// Insert purchase history
				purchaseHistory := db.InsertPurchaseHistoryParams{
					TileID:      int32(location.Int64()),
					SoldBy:      tile.Owner,
					PurchasedBy: tx.From,
					Price:       "0",
					Tx:          tx.Hash,
					TimeStamp:   time.Unix(timeStamp.Int64(), 0),
					BlockNumber: blockNumber.Int64(),
					LogIndex:    int32(transactionIndex),
				}
				if tile.Price != "" {
					purchaseHistory.Price = tile.Price
				}

				_, err = i.queries.InsertPurchaseHistory(ctx, purchaseHistory)
				if err != nil {
					// Check if it's a duplicate key error
					if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
						// This is a duplicate entry, log it and continue
						i.logger.Warn("Duplicate purchase history entry",
							zap.String("tx", tx.Hash),
							zap.Int32("tileID", purchaseHistory.TileID),
							zap.Int32("logIndex", purchaseHistory.LogIndex))
					} else {
						// If it's not a duplicate key error, return the error
						return fmt.Errorf("failed to insert purchase history: %w", err)
					}
				}

				// Update tile owner
				if tx.From == "" {
					i.logger.Warn("Transaction has no Owner address?",
						zap.String("tx", tx.Hash))
					os.Exit(1)
				}
				err = i.queries.UpdateTileOwner(ctx, db.UpdateTileOwnerParams{
					ID:    int32(location.Int64()),
					Owner: tx.From,
				})
				if err != nil {
					return fmt.Errorf("failed to update tile owner: %w", err)
				}

				i.logger.Info("Tile purchased",
					zap.String("location", location.String()),
					zap.String("newOwner", tx.From),
					zap.String("transaction", tx.Hash))
			}
		}

	case "setTile":
		if len(args) >= 4 {
			location, _ := args[0].(*big.Int)
			image, _ := args[1].(string)
			url, _ := args[2].(string)
			priceWei, _ := args[3].(*big.Int)

			if err := i.processTileUpdate(ctx, location, image, url, priceWei, tx, timeStamp.Int64(), blockNumber.Int64(), int32(transactionIndex)); err != nil {
				return err
			}
		}

	case "setTileData":
		if len(args) >= 3 {
			location, _ := args[0].(*big.Int)
			image, _ := args[1].(string)
			url, _ := args[2].(string)

			// For setTileData, we don't change the price, so we pass nil for priceWei
			if err := i.processTileUpdate(ctx, location, image, url, nil, tx, timeStamp.Int64(), blockNumber.Int64(), int32(transactionIndex)); err != nil {
				return err
			}
		}

	case "getTile":
		if len(args) >= 1 {
			location, _ := args[0].(*big.Int)
			i.logger.Debug("getTile called",
				zap.String("location", location.String()),
				zap.String("tx", tx.Hash),
				zap.String("from", tx.From))
		}
	case "setBaseTokenURI":
		i.logger.Info("setBaseTokenURI called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
	case "setTokenExtension":
		i.logger.Info("setTokenExtension called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
	case "setApprovalForAll":
		i.logger.Info("setApprovalForAll called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
	case "wrap":
		i.logger.Info("wrap called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))

		location, _ := args[0].(*big.Int)
		i.logger.Info("wrap called",
			zap.String("location", location.String()),
			zap.String("wrapped", "true"),
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
		wrappingHistory := db.InsertWrappingHistoryParams{
			TileID:      int32(location.Int64()),
			Wrapped:     true,
			Tx:          tx.Hash,
			TimeStamp:   time.Unix(timeStamp.Int64(), 0),
			BlockNumber: blockNumber.Int64(),
			UpdatedBy:   tx.From,
			LogIndex:    int32(transactionIndex),
		}
		_, err := i.queries.InsertWrappingHistory(ctx, wrappingHistory)
		if err != nil {
			return fmt.Errorf("failed to insert wrapping history: %w", err)
		}
		if tx.From == "" {
			i.logger.Warn("Transaction has no Owner address?",
				zap.String("tx", tx.Hash))
			os.Exit(1)
		}
		err = i.queries.UpdateWrappedStatus(ctx, db.UpdateWrappedStatusParams{
			ID:      int32(location.Int64()),
			Wrapped: true,
		})
		if err != nil {
			return fmt.Errorf("failed to update tile owner: %w", err)
		}

	case "unwrap":
		i.logger.Info("wrap called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))

		location, _ := args[0].(*big.Int)
		wrapped, _ := args[1].(string)
		i.logger.Info("unwrap called",
			zap.String("location", location.String()),
			zap.String("unwrapped", wrapped),
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
		wrappingHistory := db.InsertWrappingHistoryParams{
			TileID:      int32(location.Int64()),
			Wrapped:     false,
			Tx:          tx.Hash,
			TimeStamp:   time.Unix(timeStamp.Int64(), 0),
			BlockNumber: blockNumber.Int64(),
			UpdatedBy:   tx.From,
			LogIndex:    int32(transactionIndex),
		}
		_, err := i.queries.InsertWrappingHistory(ctx, wrappingHistory)
		if err != nil {
			return fmt.Errorf("failed to insert wrapping history: %w", err)
		}
		if tx.From == "" {
			i.logger.Warn("Transaction has no Owner address?",
				zap.String("tx", tx.Hash))
			os.Exit(1)
		}
		err = i.queries.UpdateWrappedStatus(ctx, db.UpdateWrappedStatusParams{
			ID:      int32(location.Int64()),
			Wrapped: false,
		})
		if err != nil {
			return fmt.Errorf("failed to update tile owner: %w", err)
		}

	case "transferFrom", "safeTransferFrom", "safeTransferFrom0":
		if err := i.processTransfer(ctx, args, tx, timeStamp.Int64(), blockNumber.Int64(), int32(transactionIndex)); err != nil {
			return err
		}
	case "withdrawETH":
		i.logger.Info("withdrawETH called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
	case "approve":
		i.logger.Info("approve called",
			zap.String("tx", tx.Hash),
			zap.String("from", tx.From))
	default:
		fmt.Printf("Unknown method called: %s\n", method.Name)
		os.Exit(2)
	}

	_, err = i.queries.InsertPixelMapTransaction(ctx, transaction)

	return err
}

func (i *Ingestor) fetchTransactions(ctx context.Context, fromBlock, toBlock int64) ([]EtherscanTransaction, error) {
	i.logger.Debug("Fetching transactions", zap.Int64("from", fromBlock), zap.Int64("to", toBlock))

	var transactions []EtherscanTransaction
	var err error

	for attempt := 0; attempt < i.maxRetries; attempt++ {
		transactions, err = i.etherscanClient.GetTransactions(ctx, fromBlock, toBlock)
		if err == nil {
			break
		}

		if err.Error() == "API error: No transactions found" {
			return nil, nil
		}

		i.logger.Warn("Failed to fetch transactions, retrying",
			zap.Error(err),
			zap.Int("attempt", attempt+1),
			zap.Int64("from", fromBlock),
			zap.Int64("to", toBlock))

		// Calculate backoff delay
		delay := i.baseDelay * time.Duration(1<<uint(attempt))
		jitter := time.Duration(rand.Int63n(int64(delay) / 2))
		delay = delay + jitter

		select {
		case <-time.After(delay):
			// Wait before retrying
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get transactions for blocks %d-%d after %d attempts: %w", fromBlock, toBlock, i.maxRetries, err)
	}

	i.logger.Debug("Processing transactions", zap.Int("count", len(transactions)), zap.Int64("from", fromBlock), zap.Int64("to", toBlock))
	return transactions, nil
}

func (i *Ingestor) updateLastProcessedBlock(ctx context.Context, blockNumber int64) error {
	if err := i.queries.UpdateLastProcessedBlock(ctx, blockNumber); err != nil {
		i.logger.Error("Failed to update last processed block", zap.Error(err), zap.Int64("block", blockNumber))
		return fmt.Errorf("failed to update last processed block: %w", err)
	}
	return nil
}

func (i *Ingestor) signalNewData() {
	select {
	case i.renderSignal <- struct{}{}:
	default:
		// Channel already has a signal, no need to send another
	}
}

func (i *Ingestor) continuousRenderProcess() {
	for {
		// Wait for a signal that new data is available
		<-i.renderSignal

		// Set the rendering flag
		if !i.isRendering.CompareAndSwap(false, true) {
			// If already rendering, continue waiting
			continue
		}

		// Start rendering in a separate goroutine
		go func() {
			defer i.isRendering.Store(false)

			for {
				if err := i.processDataHistory(context.Background()); err != nil {
					i.logger.Error("Failed to process data history", zap.Error(err))
					return
				}

				// Check if there's more data to process
				select {
				case <-i.renderSignal:
					// More data available, continue processing
					continue
				default:
					// No more data, exit the rendering loop
					return
				}
			}
		}()
	}
}

func (i *Ingestor) processDataHistory(ctx context.Context) error {
	lastProcessedID, err := i.queries.GetLastProcessedDataHistoryID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get last processed data history ID: %w", err)
	}

	// Fetch a batch of unprocessed data history entries
	history, err := i.queries.GetUnprocessedDataHistory(ctx, lastProcessedID)
	if err != nil {
		return fmt.Errorf("failed to get unprocessed data history: %w", err)
	}

	if len(history) == 0 {
		// No more data to process
		return nil
	}

	for _, row := range history {
		location := big.NewInt(int64(row.TileID))
		if err := i.renderAndSaveImage(location, row.Image, row.BlockNumber); err != nil {
			return fmt.Errorf("failed to render and save image: %w", err)
		}

		// Update metadata
		tile, err := i.queries.GetTileById(ctx, int32(location.Int64()))
		if err != nil {
			return fmt.Errorf("failed to get tile data: %w", err)
		}
		// Get all data history for the tile
		dataHistory, err := i.queries.GetDataHistoryByTileId(ctx, int32(location.Int64()))
		if err != nil {
			return fmt.Errorf("failed to get data history: %w", err)
		}
		if err := updateTileMetadata(tile, dataHistory); err != nil {
			return fmt.Errorf("failed to update metadata: %w", err)
		}

		// Update the last processed ID
		if err := i.queries.UpdateLastProcessedDataHistoryID(ctx, row.ID); err != nil {
			return fmt.Errorf("failed to update last processed data history ID: %w", err)
		}
	}

	// Redraw the full map
	tiles, err := i.getLatestTileImages(ctx)
	if err != nil {
		return fmt.Errorf("failed to get latest tile images: %w", err)
	}
	utils.RenderFullMap(tiles, "cache/tilemap.png")

	// Call the reusable function
	if err := i.updateTileDataAndSync(ctx); err != nil {
		return err
	}

	i.logger.Info("Finished processing data history", zap.Int("count", len(history)))

	return nil
}

func (i *Ingestor) getLatestTileImages(ctx context.Context) ([]string, error) {
	tiles := make([]string, 3970)
	latestImages, err := i.queries.GetLatestTileImages(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest tile images: %w", err)
	}
	for _, img := range latestImages {
		tiles[img.TileID] = img.Image
	}
	return tiles, nil
}

func (i *Ingestor) renderAndSaveImage(location *big.Int, imageData string, blockNumber int64) error {
	// Create the directory if it doesn't exist
	dirPath := fmt.Sprintf("cache/%s", location.String())
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Generate the file paths
	blockFilePath := fmt.Sprintf("%s/%d.png", dirPath, blockNumber)
	latestFilePath := fmt.Sprintf("%s/latest.png", dirPath)

	// Render the image using the existing RenderImage function
	err := utils.RenderImage(imageData, imageSize, imageSize, blockFilePath)
	if err != nil {
		i.logger.Error("Failed to render block image",
			zap.Error(err),
			zap.String("path", blockFilePath),
			zap.String("imageData", imageData))
		return nil
	}

	// Render the image using the existing RenderImage function
	err = utils.RenderImage(imageData, imageSize, imageSize, latestFilePath)
	if err != nil {
		i.logger.Error("Failed to render latest image",
			zap.Error(err),
			zap.String("path", latestFilePath),
			zap.String("imageData", imageData))
		return fmt.Errorf("failed to render latest image: %w", err)
	}

	// Verify that the files were created
	if _, err := os.Stat(blockFilePath); os.IsNotExist(err) {
		i.logger.Debug("Block image file not created",
			zap.String("path", blockFilePath))
		return nil
	}

	if _, err := os.Stat(latestFilePath); os.IsNotExist(err) {
		i.logger.Error("Latest image file not created",
			zap.String("path", latestFilePath))
		return fmt.Errorf("latest image file not created: %s", latestFilePath)
	}

	i.logger.Info("Image rendered and saved",
		zap.String("blockPath", blockFilePath),
		zap.String("latestPath", latestFilePath))
	return nil
}

func (i *Ingestor) processTileUpdate(ctx context.Context, location *big.Int, image, url string, priceWei *big.Int, tx *EtherscanTransaction, timestamp, blockNumber int64, transactionIndex int32) error {
	var priceEthStr string
	if priceWei == nil {
		// Fetch the current price from the database
		currentTile, err := i.queries.GetTileById(ctx, int32(location.Int64()))
		if err != nil {
			return fmt.Errorf("failed to get current tile data: %w", err)
		}
		priceEthStr = currentTile.Price
	} else if priceWei.Sign() > 0 {
		// Convert Wei to Ether
		priceEth := new(big.Float).Quo(new(big.Float).SetInt(priceWei), big.NewFloat(1e18))

		if priceEth.Cmp(big.NewFloat(maxPostgresNumeric)) > 0 {
			i.logger.Warn("Price exceeds maximum supported value, capping at max",
				zap.String("location", location.String()),
				zap.String("originalPrice", priceEth.Text('f', 18)),
				zap.Float64("maxPrice", maxPostgresNumeric))
			priceEthStr = fmt.Sprintf("%.2f", maxPostgresNumeric)
		} else {
			// Format the price with up to 18 decimal places, removing trailing zeros
			priceEthStr = strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.18f", priceEth), "0"), ".")
		}
	} else {
		priceEthStr = "0"
	}

	i.logger.Info("Tile update",
		zap.String("location", location.String()),
		zap.String("price", priceEthStr),
		zap.String("url", url),
		zap.String("tx", tx.Hash),
		zap.String("from", tx.From))

	// If length of image is greater than 800, truncate it
	if len(image) > 800 {
		image = image[:800]
	}
	// Add to dataHistory
	dataHistory := db.InsertDataHistoryParams{
		TileID:      int32(location.Int64()),
		Price:       sql.NullString{String: priceEthStr, Valid: priceEthStr != ""}, // Use sql.NullString
		Url:         url,
		Tx:          tx.Hash,
		TimeStamp:   time.Unix(timestamp, 0),
		BlockNumber: blockNumber,
		Image:       image,
		UpdatedBy:   tx.From,
		LogIndex:    transactionIndex,
	}

	if _, err := i.queries.InsertDataHistory(ctx, dataHistory); err != nil {
		return fmt.Errorf("failed to insert data history: %w", err)
	}

	// Update the tile in the database
	err := i.queries.UpdateTile(ctx, db.UpdateTileParams{
		ID:    int32(location.Int64()),
		Price: priceEthStr,
		Url:   url,
		Image: image,
		Owner: tx.From,
	})
	if err != nil {
		i.logger.Error("Failed to update tile", zap.Error(err), zap.String("location", location.String()))
		os.Exit(1)
		return fmt.Errorf("failed to update tile: %w", err)
	}

	// Signal that new data is available to render
	i.signalNewData()

	// Keep the Discord notification
	discordPayload, _ := json.Marshal(map[string]interface{}{
		"message": fmt.Sprintf("Tile %s updated by %s", location.String(), tx.From),
		"url":     url,
	})
	i.pubSub.Publish(Event{Type: EventTypeDiscordNotification, Payload: discordPayload})

	return nil
}

func (i *Ingestor) processTransfer(ctx context.Context, args []interface{}, tx *EtherscanTransaction, timestamp, blockNumber int64, transactionIndex int32) error {
	if len(args) < 3 {
		i.logger.Error("Insufficient arguments for transfer")
		os.Exit(1)
		return fmt.Errorf("insufficient arguments for transfer")
	}

	from, ok := args[0].(common.Address)
	if !ok {
		i.logger.Error("Invalid 'from' address")
		os.Exit(1)
		return fmt.Errorf("invalid 'from' address")
	}

	to, ok := args[1].(common.Address)
	if !ok {
		i.logger.Error("Invalid 'to' address")
		os.Exit(1)
		return fmt.Errorf("invalid 'to' address")
	}

	location, ok := args[2].(*big.Int)
	if !ok {
		i.logger.Error("Invalid location")
		os.Exit(1)
		return fmt.Errorf("invalid location")
	}

	i.logger.Info("Transfer processed",
		zap.String("from", from.Hex()),
		zap.String("to", to.Hex()),
		zap.String("location", location.String()),
		zap.String("tx", tx.Hash),
		zap.String("caller", tx.From))

	transferHistory := db.InsertTransferHistoryParams{
		TileID:          int32(location.Int64()),
		Tx:              tx.Hash,
		TimeStamp:       time.Unix(timestamp, 0),
		BlockNumber:     blockNumber,
		TransferredFrom: from.Hex(),
		TransferredTo:   to.Hex(),
		LogIndex:        transactionIndex,
	}

	_, err := i.queries.InsertTransferHistory(ctx, transferHistory)
	if err != nil {
		return fmt.Errorf("failed to insert transfer history: %w", err)
	}

	// Update tile owner
	if to.Hex() == "" {
		i.logger.Warn("Transaction has no Owner address?",
			zap.String("tx", tx.Hash))
		os.Exit(1)
	}

	// Lookup ENS
	ensName, err := lookupENS(i.ethClient, to.Hex())
	if err != nil {
		if strings.Contains(err.Error(), "not a resolver") {
			// This is an expected error for addresses without ENS names
			i.logger.Debug("Address does not have an ENS name", zap.String("address", to.Hex()))
		} else {
			// Log other errors as warnings
			i.logger.Warn("Failed to lookup ENS", zap.Error(err), zap.String("address", to.Hex()))
		}
		ensName = "" // Ensure ensName is empty if lookup failed
	}
	i.logger.Debug("ENS lookup result", zap.String("ens", ensName), zap.String("address", to.Hex()))

	err = i.queries.UpdateTileOwner(ctx, db.UpdateTileOwnerParams{
		ID:    int32(location.Int64()),
		Owner: to.Hex(),
		Ens:   ensName,
	})
	if err != nil {
		i.logger.Error("Failed to update tile owner", zap.Error(err), zap.String("location", location.String()))
		os.Exit(1)
		return fmt.Errorf("failed to update tile owner: %w", err)
	}

	// Call the reusable function
	if err := i.updateTileDataAndSync(ctx); err != nil {
		return err
	}

	return nil
}

func (i *Ingestor) updateTileDataAndSync(ctx context.Context) error {
	i.logger.Info("Updating tiledata.json and syncing with S3")
	// Fetch all tiles
	allTiles, err := i.queries.ListTiles(ctx, db.ListTilesParams{
		Limit:  int32(3970),
		Offset: 0,
	})
	if err != nil {
		return fmt.Errorf("failed to get all tiles: %w", err)
	}

	// Generate tiledata.json
	if err := GenerateTiledataJSON(allTiles, i.queries, ctx); err != nil {
		return fmt.Errorf("failed to generate tiledata.json: %w", err)
	}

	// Sync with S3 if s3Syncer is initialized
	if i.s3Syncer != nil {
		err := i.s3Syncer.SyncWithS3(ctx)
		if err != nil {
			i.logger.Error("Failed to sync with S3", zap.Error(err))
			// Note: We're not returning this error as it shouldn't stop the main process
		}
	}

	return nil
}
