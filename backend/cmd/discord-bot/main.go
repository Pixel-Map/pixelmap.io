package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"
	"os/signal"
	"regexp"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"pixelmap.io/backend/internal/notifications"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	// Container environment can override the optional mounted dotenv file.
	_ = godotenv.Load()
	token, channel := os.Getenv("DISCORD_TOKEN"), os.Getenv("DISCORD_CHANNEL_ID")
	if token == "" || token == "REPLACE" || !regexp.MustCompile(`^[0-9]{17,20}$`).MatchString(channel) || os.Getenv("DATABASE_URL") == "" {
		logger.Error("Discord bot requires DISCORD_TOKEN, DISCORD_CHANNEL_ID and DATABASE_URL")
		os.Exit(1)
	}
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		logger.Error("Unable to initialize notification database")
		os.Exit(1)
	}
	defer db.Close()
	db.SetMaxOpenConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	worker := notifications.Worker{DB: db, Sender: notifications.NewClient(token, channel), Channel: channel, Logger: logger}
	worker.Run(ctx)
}
