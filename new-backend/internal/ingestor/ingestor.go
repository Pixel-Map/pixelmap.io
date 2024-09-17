package ingestor

import (
	"context"
	"database/sql"
	"fmt"
	"math/big"
	"os"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"
	pixelmap "pixelmap.io/backend/internal/contracts/pixelmap"
	db "pixelmap.io/backend/internal/db"
	utils "pixelmap.io/backend/internal/utils"
)

const (
	startBlockNumber    = 2641527
	blockRangeSize      = 10000
	safetyBlockOffset   = 10
	constructorMethodID = "0x60606040"
	imageSize           = 512
)

type Ingestor struct {
	logger          *zap.Logger
	queries         *db.Queries
	etherscanClient *EtherscanClient
}

func NewIngestor(logger *zap.Logger, sqlDB *sql.DB, apiKey string) *Ingestor {
	return &Ingestor{
		logger:          logger,
		queries:         db.New(sqlDB), // This should now work correctly
		etherscanClient: NewEtherscanClient(apiKey, logger),
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

	for _, tx := range transactions {
		if err := i.processTransaction(ctx, &tx); err != nil {
			i.logger.Error("Failed to process transaction", zap.Error(err), zap.String("hash", tx.Hash))
			return fmt.Errorf("failed to process transaction %s: %w", tx.Hash, err)
		}
	}

	if err := i.updateLastProcessedBlock(ctx, blockEnd); err != nil {
		return err
	}

	i.logger.Info("Processed blocks", zap.Int64("from", currentBlock), zap.Int64("to", blockEnd))
	return nil
}

func (i *Ingestor) processTransaction(ctx context.Context, tx *EtherscanTransaction) error {
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

	fmt.Printf("transaction: %+v\n", transaction)

	// Decode the input data
	abi, err := pixelmap.PixelMapMetaData.GetAbi()
	if err != nil {
		return fmt.Errorf("failed to get ABI: %w", err)
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
				fmt.Printf("buyTile called with location: %s\n", location.String())
			}
		}

	case "setTile":
		if len(args) >= 4 {
			location, _ := args[0].(*big.Int)
			image, _ := args[1].(string)
			url, _ := args[2].(string)
			priceWei, _ := args[3].(*big.Int)

			// Convert Wei to Ether
			priceEth := new(big.Float).Quo(new(big.Float).SetInt(priceWei), big.NewFloat(1e18))

			// Round to 2 decimal places
			priceEthRounded := new(big.Float).Mul(priceEth, big.NewFloat(100))
			priceEthInt, _ := priceEthRounded.Int(nil)
			priceEthRounded.SetInt(priceEthInt)
			priceEthRounded.Quo(priceEthRounded, big.NewFloat(100))

			// Format the price with 2 decimal places
			priceEthStr := fmt.Sprintf("%.2f", priceEthRounded)

			fmt.Printf("setTile called with location: %s, image: %s, url: %s, price: %s ETH\n",
				location.String(), image, url, priceEthStr)

			// Render and save the image
			if err := i.renderAndSaveImage(location, image, blockNumber.Int64()); err != nil {
				return fmt.Errorf("failed to render and save image: %w", err)
			}
			// Add to dataHistory
			dataHistory := db.InsertDataHistoryParams{
				TileID:      int32(location.Int64()),
				Price:       priceEthStr, // Store the rounded Ether price as a string
				Url:         url,
				Tx:          tx.Hash,
				TimeStamp:   time.Unix(timeStamp.Int64(), 0),
				BlockNumber: blockNumber.Int64(),
				Image:       image,
				UpdatedBy:   tx.From,
				LogIndex:    int32(transactionIndex),
			}

			if _, err := i.queries.InsertDataHistory(ctx, dataHistory); err != nil {
				return fmt.Errorf("failed to insert data history: %w", err)
			}
		}

	// Add other cases as needed

	default:
		fmt.Printf("Unknown method called: %s\n", method.Name)
	}

	_, err = i.queries.InsertPixelMapTransaction(ctx, transaction)

	return err
}

func (i *Ingestor) fetchTransactions(ctx context.Context, fromBlock, toBlock int64) ([]EtherscanTransaction, error) {
	i.logger.Debug("Fetching transactions", zap.Int64("from", fromBlock), zap.Int64("to", toBlock))

	transactions, err := i.etherscanClient.GetTransactions(ctx, fromBlock, toBlock)
	if err != nil {
		if err.Error() == "API error: No transactions found" {
			i.logger.Info("No transactions found in block range", zap.Int64("from", fromBlock), zap.Int64("to", toBlock))
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get transactions for blocks %d-%d: %w", fromBlock, toBlock, err)
	}

	i.logger.Info("Processing transactions", zap.Int("count", len(transactions)), zap.Int64("from", fromBlock), zap.Int64("to", toBlock))
	return transactions, nil
}

func (i *Ingestor) updateLastProcessedBlock(ctx context.Context, blockNumber int64) error {
	if err := i.queries.UpdateLastProcessedBlock(ctx, blockNumber); err != nil {
		i.logger.Error("Failed to update last processed block", zap.Error(err), zap.Int64("block", blockNumber))
		return fmt.Errorf("failed to update last processed block: %w", err)
	}
	return nil
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
		return fmt.Errorf("failed to render image: %w", err)
	}

	// Render the image using the existing RenderImage function
	err = utils.RenderImage(imageData, imageSize, imageSize, latestFilePath)
	if err != nil {
		return fmt.Errorf("failed to render image: %w", err)
	}

	i.logger.Info("Image rendered and saved",
		zap.String("blockPath", blockFilePath),
		zap.String("latestPath", latestFilePath))
	return nil
}
