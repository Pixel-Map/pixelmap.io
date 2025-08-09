package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"bufio"
	"strings"

	"go.uber.org/zap"
	"pixelmap.io/backend/internal/ingestor"
)

func loadEnv() {
	envPath := ".env"
	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		envPath = filepath.Join("..", ".env")
	}
	
	file, err := os.Open(envPath)
	if err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			value = strings.Trim(value, `"'`)
			os.Setenv(key, value)
		}
	}
}

func main() {
	// Load environment variables
	loadEnv()

	// Create logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Create S3 syncer
	s3Syncer, err := ingestor.NewS3Syncer(logger, "cache")
	if err != nil {
		log.Fatal("Failed to create S3 syncer:", err)
	}

	log.Println("Starting S3 sync...")
	
	// Sync to S3
	ctx := context.Background()
	if err := s3Syncer.SyncWithS3(ctx); err != nil {
		log.Fatal("Failed to sync to S3:", err)
	}

	log.Println("S3 sync complete!")
}