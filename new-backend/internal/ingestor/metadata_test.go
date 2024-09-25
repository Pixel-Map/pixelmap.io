package ingestor

import (
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"pixelmap.io/backend/internal/db"
)

func TestUpdateTileMetadataForTileZero(t *testing.T) {
	// Setup
	tile := db.Tile{
		ID:           0,
		Image:        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeffffffffefffffffffffffeefffffffffffffffffffffc75ffffffffffffffffffffffffffffffffffffc75ffffffc75ffffffc75fffc75fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff266ffffffffffff377ffffffffffffffffffffffffffffff266ffffff589266266fffffffffffffffffffffffffffffffffffffff267266266ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0acffffffffffffffffff4cdffffffeeeffffffffffffffffff0acffffff6cdfffffffffdeefffffffffffffffffffffffffffffffff6cdfffffffffbeefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		Url:          "http://www.lisbonstateofmind.com/",
		Price:        "0",
		Owner:        "0x6f0ff9b84772e2a410d5e848ce219c5ebc5b4b44",
		Wrapped:      false,
		OpenseaPrice: "0",
		Ens:          "",
	}

	dataHistory := []db.DataHistory{
		{
			BlockNumber: 1000000,
			TimeStamp:   parseTime("2022-01-01T00:00:00Z"),
			Image:       "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeffffffffefffffffffffffeefffffffffffffffffffffc75ffffffffffffffffffffffffffffffffffffc75ffffffc75ffffffc75fffc75fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff266ffffffffffff377ffffffffffffffffffffffffffffff266ffffff589266266fffffffffffffffffffffffffffffffffffffff267266266ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0acffffffffffffffffff4cdffffffeeeffffffffffffffffff0acffffff6cdfffffffffdeefffffffffffffffffffffffffffffffff6cdfffffffffbeefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		},
		{
			BlockNumber: 2000000,
			TimeStamp:   parseTime("2022-02-01T00:00:00Z"),
			Image:       "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeffffffffefffffffffffffeefffffffffffffffffffffc75ffffffffffffffffffffffffffffffffffffc75ffffffc75ffffffc75fffc75fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff266ffffffffffff377ffffffffffffffffffffffffffffff266ffffff589266266fffffffffffffffffffffffffffffffffffffff267266266ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0acffffffffffffffffff4cdffffffeeeffffffffffffffffff0acffffff6cdfffffffffdeefffffffffffffffffffffffffffffffff6cdfffffffffbeefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		},
	}

	// Execute
	err := updateTileMetadata(tile, dataHistory)

	// Assert
	assert.NoError(t, err)

	// Check OpenSea metadata
	openseaMetadata, err := os.ReadFile("cache/metadata/0.json")
	assert.NoError(t, err)

	var openseaData map[string]interface{}
	err = json.Unmarshal(openseaMetadata, &openseaData)
	assert.NoError(t, err)

	assert.Equal(t, "Tile #0", openseaData["name"])
	assert.Equal(t, "http://www.lisbonstateofmind.com/", openseaData["external_url"])
	assert.Equal(t, "https://pixelmap.art/0/latest.png", openseaData["image"])

	attributes := openseaData["attributes"].([]interface{})
	assert.Len(t, attributes, 3)
	assert.Contains(t, attributes, map[string]interface{}{"value": "Corner"})
	assert.Contains(t, attributes, map[string]interface{}{"value": "OG"})

	// Cleanup
	os.Remove("cache/metadata/0.json")

}

// Helper function to parse time
func parseTime(s string) time.Time {
	t, _ := time.Parse(time.RFC3339, s)
	return t
}

func TestUpdateTileMetadataForTileCenter(t *testing.T) {
	// Setup
	tile := db.Tile{
		ID:           1985,
		Image:        "notset",
		Url:          "http://example.com/",
		Price:        "0",
		Owner:        "0x1234567890123456789012345678901234567890",
		Wrapped:      false,
		OpenseaPrice: "0",
		Ens:          "",
	}

	dataHistory := []db.DataHistory{
		{
			BlockNumber: 1000000,
			TimeStamp:   parseTime("2022-01-01T00:00:00Z"),
			Image:       "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		},
	}

	// Execute
	err := updateTileMetadata(tile, dataHistory)

	// Assert
	assert.NoError(t, err)

	// Check OpenSea metadata
	openseaMetadata, err := os.ReadFile("cache/metadata/1985.json")
	assert.NoError(t, err)

	var openseaData map[string]interface{}
	err = json.Unmarshal(openseaMetadata, &openseaData)
	assert.NoError(t, err)

	assert.Equal(t, "Tile #1985", openseaData["name"])
	assert.Equal(t, "http://example.com/", openseaData["external_url"])
	assert.Equal(t, "https://pixelmap.art/blank.png", openseaData["image"])

	attributes := openseaData["attributes"].([]interface{})
	assert.Len(t, attributes, 2)
	assert.Contains(t, attributes, map[string]interface{}{"value": "Center"})

	// Cleanup
	// os.Remove("cache/metadata/1985.json")
}
