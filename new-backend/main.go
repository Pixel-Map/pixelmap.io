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
		logger.Error("Fatal error in ingestor", zap.Error(err))
		os.Exit(1)
	}

	logger.Info("Indexing completed successfully")
}
