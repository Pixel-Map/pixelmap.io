package main

//go:generate sh -c "cd internal/db && sqlc generate"

import (
	"context"
	"database/sql"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	prettyconsole "github.com/thessem/zap-prettyconsole"
	"go.uber.org/zap"
	"pixelmap.io/backend/internal/ingestor"
)

func main() {
	logger := prettyconsole.NewLogger(zap.DebugLevel)
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	defer logger.Sync()

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	ingester := ingestor.NewIngestor(logger, db, os.Getenv("ETHERSCAN_API_KEY"))

	if err := ingester.IngestTransactions(context.Background()); err != nil {
		logger.Fatal("Failed to ingest transactions", zap.Error(err))
	}

	logger.Info("Indexing completed successfully")
}

// func main() {
// 	// Initialize zap logger
// 	logger := prettyconsole.NewLogger(zap.DebugLevel)

// 	defer logger.Sync()

// 	// Load .env file
// 	err := godotenv.Load()
// 	if err != nil {
// 		logger.Fatal("Error loading .env file", zap.Error(err))
// 	}
// 	// Get API key from environment
// 	apiKey := os.Getenv("ETHERSCAN_API_KEY")
// 	if apiKey == "" {
// 		logger.Fatal("ETHERSCAN_API_KEY not set in .env file")
// 	}

// 	// Set up the request parameters
// 	url := "https://api.etherscan.io/api"
// 	params := map[string]string{
// 		"module":     "account",
// 		"action":     "txlist",
// 		"address":    "0x015a06a433353f8db634df4eddf0c109882a15ab", // Replace with a real Ethereum address
// 		"startblock": "0",
// 		"endblock":   "99999999",
// 		"sort":       "asc",
// 		"apikey":     apiKey,
// 	}

// 	// Make the request
// 	response, err := utils.MakeRateLimitedRequest(url, params, logger)
// 	if err != nil {
// 		logger.Error("Failed to make request", zap.Error(err))
// 		return
// 	}

// 	// Process the response
// 	logger.Info("Status", zap.String("status", response.Status))
// 	logger.Info("Message", zap.String("message", response.Message))

// 	switch result := response.Result.(type) {
// 	case string:
// 		logger.Error("Error in result", zap.String("result", result))
// 	case []interface{}:
// 		logger.Info("Number of results", zap.Int("count", len(result)))
// 		for _, tx := range result {
// 			logger.Info("Transaction", zap.Any("tx", tx))
// 		}
// 	default:
// 		fmt.Printf("Unexpected result type: %T\n", result)
// 	}
// }
