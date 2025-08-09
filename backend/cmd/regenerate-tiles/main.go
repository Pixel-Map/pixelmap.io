package main

import (
	"context"
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
	"pixelmap.io/backend/internal/db"
	"pixelmap.io/backend/internal/ingestor"
)

func main() {
	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://localhost/pixelmap?sslmode=disable"
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