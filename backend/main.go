package main

//go:generate sh -c "cd internal/db && sqlc generate"
//go:generate sh -c "abigen --abi ../contracts/PixelMap.abi -pkg pixelmap --type PixelMap --out internal/contracts/pixelmap/pixelmap.go"
//go:generate sh -c "abigen --abi ../contracts/PixelMapWrapper.abi -pkg contracts --type PixelMapWrapper --out internal/contracts/pixelmapWrapper/pixelmap_wrapper.go"

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"os"
	"os/signal"
	"pixelmap.io/backend/internal/health"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	prettyconsole "github.com/thessem/zap-prettyconsole"
	"go.uber.org/zap"
	"pixelmap.io/backend/internal/ingestor"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--healthcheck" {
		if err := health.Check(10*time.Minute, "/tmp/pixelmap-ingestion", "/tmp/pixelmap-publication"); err != nil {
			log.Print(err)
			os.Exit(1)
		}
		return
	}
	logger := prettyconsole.NewLogger(zap.InfoLevel)
	if err := godotenv.Load(); err != nil {
		if !os.IsNotExist(err) {
			log.Fatal("Error loading .env file")
		}
	}

	defer logger.Sync()

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	ingester := ingestor.NewIngestor(logger, db, os.Getenv("ETHERSCAN_API_KEY"))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := ingester.StartContinuousIngestion(ctx); err != nil && !errors.Is(err, context.Canceled) {
		log.Fatalf("Continuous ingestion stopped: %v", err)
	}
}
