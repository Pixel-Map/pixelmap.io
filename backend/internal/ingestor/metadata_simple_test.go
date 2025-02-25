package ingestor

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"pixelmap.io/backend/internal/db"
)

func TestGetHistoricalImages(t *testing.T) {
	// Create test tile
	tile := db.Tile{
		ID:    123,
		Image: "test_image",
		Url:   "http://example.com",
		Owner: "0x123",
	}

	// Create test data history
	dataHistory := []db.DataHistory{
		{
			BlockNumber: 100,
			TimeStamp:   time.Now().Add(-2 * time.Hour),
			Image:       "b#image1", // Compressed image
		},
		{
			BlockNumber: 200,
			TimeStamp:   time.Now().Add(-1 * time.Hour),
			Image:       "c#image2", // Compressed image v2
		},
		{
			BlockNumber: 300,
			TimeStamp:   time.Now(),
			Image:       "012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", // Long uncompressed image (>768 chars)
		},
		{
			BlockNumber: 400,
			TimeStamp:   time.Now().Add(1 * time.Hour),
			Image:       "too_short", // Too short, should be skipped
		},
		{
			BlockNumber: 500,
			TimeStamp:   time.Now().Add(2 * time.Hour),
			Image:       "b#image1", // Duplicate of first image, should be skipped
		},
	}

	// Get historical images
	images := GetHistoricalImages(tile, dataHistory)

	// Test assertions
	assert.Equal(t, 3, len(images), "Should have 3 unique images")
	
	// Check details of each image
	assert.Equal(t, int64(100), images[0].BlockNumber)
	assert.Equal(t, "b#image1", images[0].Image)
	assert.Equal(t, "https://pixelmap.art/123/100.png", images[0].ImageURL)
	
	assert.Equal(t, int64(200), images[1].BlockNumber)
	assert.Equal(t, "c#image2", images[1].Image)
	
	assert.Equal(t, int64(300), images[2].BlockNumber)
	// The third image should be the long one
	assert.True(t, len(images[2].Image) >= 768)
}

func TestContains(t *testing.T) {
	// Test with a slice that contains the element
	slice := []int{1, 2, 3, 4, 5}
	assert.True(t, contains(slice, 3), "Slice should contain 3")
	
	// Test with a slice that doesn't contain the element
	assert.False(t, contains(slice, 6), "Slice should not contain 6")
	
	// Test with an empty slice
	assert.False(t, contains([]int{}, 1), "Empty slice should not contain any element")
}

func TestTileIsOnEdge(t *testing.T) {
	// Test tiles on the top row
	assert.True(t, tileIsOnEdge(0), "Tile 0 should be on edge")
	assert.True(t, tileIsOnEdge(40), "Tile 40 should be on edge")
	assert.True(t, tileIsOnEdge(80), "Tile 80 should be on edge")
	
	// Test tiles on the bottom row
	assert.True(t, tileIsOnEdge(3888), "Tile 3888 should be on edge")
	assert.True(t, tileIsOnEdge(3969), "Tile 3969 should be on edge")
	
	// Test tiles on the left side
	assert.True(t, tileIsOnEdge(81), "Tile 81 should be on edge")
	assert.True(t, tileIsOnEdge(1701), "Tile 1701 should be on edge")
	
	// Test tiles on the right side
	assert.True(t, tileIsOnEdge(161), "Tile 161 should be on edge")
	assert.True(t, tileIsOnEdge(1781), "Tile 1781 should be on edge")
	
	// Test a tile not on the edge
	assert.False(t, tileIsOnEdge(1000), "Tile 1000 should not be on edge")
	assert.False(t, tileIsOnEdge(2500), "Tile 2500 should not be on edge")
}

func TestTileIsInCenter(t *testing.T) {
	// Test tiles in the center rows
	assert.True(t, tileIsInCenter(1578), "Tile 1578 should be in center (top row)")
	assert.True(t, tileIsInCenter(1660), "Tile 1660 should be in center (second row)")
	assert.True(t, tileIsInCenter(2310), "Tile 2310 should be in center (bottom row)")
	
	// Test tiles not in the center
	assert.False(t, tileIsInCenter(0), "Tile 0 should not be in center")
	assert.False(t, tileIsInCenter(1000), "Tile 1000 should not be in center")
	assert.False(t, tileIsInCenter(3000), "Tile 3000 should not be in center")
}