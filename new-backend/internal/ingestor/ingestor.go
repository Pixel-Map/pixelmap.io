package ingestor

import (
	"context"
	"database/sql"
	sqldb "database/sql"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"
	pixelmap "pixelmap.io/backend/internal/contracts/pixelmap"
	db "pixelmap.io/backend/internal/db"
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
	// Retrieve the last processed block from the database
	lastProcessedBlock, err := i.queries.GetLastProcessedBlock(ctx)
	if err != nil && err != sql.ErrNoRows {
		i.logger.Error("Failed to get last processed block", zap.Error(err))
		return fmt.Errorf("failed to get last processed block: %w", err)
	}

	startBlock := int64(2641527)
	if lastProcessedBlock > startBlock {
		startBlock = lastProcessedBlock + 1
	}

	latestBlock, err := i.etherscanClient.GetLatestBlockNumber()
	if err != nil {
		i.logger.Error("Failed to get latest block number", zap.Error(err))
		return fmt.Errorf("failed to get latest block number: %w", err)
	}

	i.logger.Info("Starting transaction ingestion",
		zap.Int64("startBlock", startBlock),
		zap.Uint64("latestBlock", latestBlock))

	endBlock := int64(latestBlock) - 10 // As requested, to avoid uncles

	for currentBlock := startBlock; currentBlock <= endBlock; currentBlock += 10000 {
		blockEnd := currentBlock + 9999
		if blockEnd > endBlock {
			blockEnd = endBlock
		}

		i.logger.Debug("Fetching transactions",
			zap.Int64("from", currentBlock),
			zap.Int64("to", blockEnd))

		transactions, err := i.etherscanClient.GetTransactions(ctx, currentBlock, blockEnd)
		if err != nil {
			i.logger.Warn("Error fetching transactions",
				zap.Error(err),
				zap.Int64("from", currentBlock),
				zap.Int64("to", blockEnd))

			if err.Error() == "API error: No transactions found" {
				i.logger.Info("No transactions found in block range",
					zap.Int64("from", currentBlock),
					zap.Int64("to", blockEnd))
				continue
			}
			// If it's any other error, return it
			return fmt.Errorf("failed to get transactions for blocks %d-%d: %w", currentBlock, blockEnd, err)
		}

		i.logger.Info("Processing transactions",
			zap.Int("count", len(transactions)),
			zap.Int64("from", currentBlock),
			zap.Int64("to", blockEnd))

		for _, tx := range transactions {
			if err := i.processTransaction(ctx, &tx); err != nil {
				i.logger.Error("Failed to process transaction", zap.Error(err), zap.String("hash", tx.Hash))
				return fmt.Errorf("failed to process transaction %s: %w", tx.Hash, err)
			}
		}

		// Update the last processed block in the database
		if err := i.queries.UpdateLastProcessedBlock(ctx, blockEnd); err != nil {
			i.logger.Error("Failed to update last processed block", zap.Error(err), zap.Int64("block", blockEnd))
			return fmt.Errorf("failed to update last processed block: %w", err)
		}

		i.logger.Info("Processed blocks", zap.Int64("from", currentBlock), zap.Int64("to", blockEnd))
	}

	i.logger.Info("Finished ingesting transactions", zap.Int64("endBlock", endBlock))

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
		TxreceiptStatus:   sqldb.NullBool{Bool: tx.TxreceiptStatus == "1", Valid: true},
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
	if string(methodID) == "0x60606040" {
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
			price, _ := args[3].(*big.Int)
			fmt.Printf("setTile called with location: %s, image: %s, url: %s, price: %s\n",
				location.String(), image, url, price.String())
		}

	// Add other cases as needed

	default:
		fmt.Printf("Unknown method called: %s\n", method.Name)
	}

	_, err = i.queries.InsertPixelMapTransaction(ctx, transaction)

	return err
}
