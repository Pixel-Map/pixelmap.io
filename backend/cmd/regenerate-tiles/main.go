package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"bufio"
	"strings"

	_ "github.com/lib/pq"
	"pixelmap.io/backend/internal/db"
	"pixelmap.io/backend/internal/ingestor"
)

func loadEnv() {
	// Try to load .env file from backend directory
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
			// Remove quotes if present
			value = strings.Trim(value, `"'`)
			os.Setenv(key, value)
		}
	}
}

func main() {
	// Load environment variables from .env file
	loadEnv()
	
	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set. Please check your .env file")
	}

	conn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer conn.Close()

	queries := db.New(conn)
	ctx := context.Background()

	log.Println("Starting tile JSON regeneration...")

	// Get all tiles (PixelMap has 3969 tiles)
	tiles, err := queries.ListTiles(ctx, db.ListTilesParams{
		Limit:  4000,
		Offset: 0,
	})
	if err != nil {
		log.Fatal("Failed to get tiles:", err)
	}

	log.Printf("Found %d tiles to regenerate", len(tiles))

	// Regenerate metadata for each tile
	for i, tile := range tiles {
		if i%100 == 0 {
			log.Printf("Progress: %d/%d tiles processed", i, len(tiles))
		}

		// Get data history for the tile
		dataHistory, err := queries.GetDataHistoryByTileId(ctx, tile.ID)
		if err != nil {
			log.Printf("Error fetching data history for tile %d: %v", tile.ID, err)
			continue
		}

		// Update metadata (this creates the JSON file)
		if err := ingestor.UpdateTileMetadata(tile, dataHistory, queries, ctx); err != nil {
			log.Printf("Error updating metadata for tile %d: %v", tile.ID, err)
			continue
		}
	}

	log.Println("Regeneration complete!")
	
	// Optionally trigger S3 sync here
	// You can add S3 sync code if needed
	
	log.Println("Don't forget to sync to S3!")
}