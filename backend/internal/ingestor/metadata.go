package ingestor

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"pixelmap.io/backend/internal/db"
	utils "pixelmap.io/backend/internal/utils"
)

var logger = log.New(os.Stdout, "metadata", log.LstdFlags)

type MetadataPixelMapTile struct {
	ID               int                   `json:"id"`
	Image            string                `json:"image"`
	URL              string                `json:"url"`
	Price            string                `json:"price"`
	Owner            string                `json:"owner"`
	Wrapped          bool                  `json:"wrapped"`
	OpenseaPrice     string                `json:"opensea_price"`
	Ens              string                `json:"ens"`
	HistoricalImages []PixelMapImage       `json:"historical_images"`
	PurchaseHistory  []PurchaseHistoryItem `json:"purchase_history"`
	TransferHistory  []TransferHistoryItem `json:"transfer_history"`
	WrappingHistory  []WrappingHistoryItem `json:"wrapping_history"`
	DataHistory      []DataHistoryItem     `json:"data_history"`
}

type PurchaseHistoryItem struct {
	ID          int32     `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	BlockNumber int64     `json:"block_number"`
	Tx          string    `json:"tx"`
	SoldBy      string    `json:"sold_by"`
	PurchasedBy string    `json:"purchased_by"`
	Price       string    `json:"price"`
}

type TransferHistoryItem struct {
	ID              int32     `json:"id"`
	Timestamp       time.Time `json:"timestamp"`
	BlockNumber     int64     `json:"block_number"`
	Tx              string    `json:"tx"`
	TransferredFrom string    `json:"transferred_from"`
	TransferredTo   string    `json:"transferred_to"`
}

type WrappingHistoryItem struct {
	ID          int32     `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	BlockNumber int64     `json:"block_number"`
	Tx          string    `json:"tx"`
	Wrapped     bool      `json:"wrapped"`
	UpdatedBy   string    `json:"updated_by"`
}

type DataHistoryItem struct {
	ID          int32     `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	BlockNumber int64     `json:"block_number"`
	Tx          string    `json:"tx"`
	Image       string    `json:"image,omitempty"`
	URL         string    `json:"url,omitempty"`
	Price       string    `json:"price,omitempty"`
	UpdatedBy   string    `json:"updated_by"`
}

// GenerateTiledataJSON generates the tiledata.json file
func GenerateTiledataJSON(tiles []db.Tile, queries *db.Queries, ctx context.Context) error {
	logger.Println("Generating tiledata.json")
	tiledataJSON := make([]map[string]interface{}, len(tiles))

	for i, tile := range tiles {
		// Fetch data history for the tile
		dataHistory, err := queries.GetDataHistoryByTileId(ctx, tile.ID)
		if err != nil {
			return fmt.Errorf("error fetching data history for tile %d: %w", tile.ID, err)
		}

		// Convert data history to a format suitable for JSON
		historicalImages := make([]map[string]interface{}, len(dataHistory))
		for j, history := range dataHistory {
			historicalImages[j] = map[string]interface{}{
				"blockNumber": history.BlockNumber,
				"date":        history.TimeStamp,
				"image":       history.Image,
				"image_url":   fmt.Sprintf("https://pixelmap.art/%d/%d.png", tile.ID, history.BlockNumber),
				"updatedBy":   history.UpdatedBy,
			}
		}

		tiledataJSON[i] = map[string]interface{}{
			"id":                tile.ID,
			"url":               tile.Url,
			"image":             tile.Image,
			"owner":             tile.Owner,
			"price":             tile.Price,
			"wrapped":           tile.Wrapped,
			"openseaPrice":      tile.OpenseaPrice,
			"lastUpdated":       time.Date(2021, time.December, 13, 1, 1, 0, 0, time.UTC),
			"ens":               tile.Ens,
			"historical_images": historicalImages, // Add historical images here
		}
	}

	jsonData, err := json.MarshalIndent(tiledataJSON, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling tiledata JSON: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir("cache/tiledata.json"), os.ModePerm); err != nil {
		return fmt.Errorf("error creating cache directory: %w", err)
	}

	if err := os.WriteFile("cache/tiledata.json", jsonData, 0644); err != nil {
		return fmt.Errorf("error writing tiledata.json file: %w", err)
	}

	return nil
}

// UpdateTileMetadata updates the metadata for a given tile (exported for regeneration scripts)
func UpdateTileMetadata(tile db.Tile, dataHistory []db.DataHistory, queries *db.Queries, ctx context.Context) error {
	tileMetaData := map[string]interface{}{
		"description": "Official PixelMap Wrapped Tile. Created in 2016, PixelMap is considered the second oldest NFT, the " +
			"oldest verified collection on OpenSea, and provides the ability to create, display, and immortalize artwork " +
			"directly on the blockchain. All tiles can be viewed at https://pixelmap.io, and customized by the owner " +
			"(image and URL are stored on-chain in the OG contract. PixelMap was launched on November 17, 2016 - " +
			"https://etherscan.io/address/0x015a06a433353f8db634df4eddf0c109882a15ab. For more information, visit the " +
			"Discord, at https://discord.pixelmap.io",
		"external_url": tile.Url,
		"name":         fmt.Sprintf("Tile #%d", tile.ID),
		"attributes":   []map[string]string{},
		"image":        "",
	}

	// Invisible (The very last tile)
	if tile.ID == 3969 {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "Invisible"})
	}

	// Genesis Tile
	if tile.ID == 1984 {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "Genesis"})
	}

	// Center ( tiles within 5 spaces of center tile aka the spider )
	if tileIsInCenter(int(tile.ID)) {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "Center"})
	}

	// Edge
	if tileIsOnEdge(int(tile.ID)) {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "Edge"})
	}

	// Corner
	if tile.ID == 0 || tile.ID == 80 || tile.ID == 3888 || tile.ID == 3968 {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "Corner"})
	}

	// Year Image first Updated
	ogTiles := []int{0, 80, 574, 868, 1317, 1416, 1661, 1822, 1901, 1902, 1903, 1904, 1905,
		1906, 1920, 1983, 1984, 1985, 1986, 1987, 2063, 2064, 2065, 2066, 2067,
		2068, 2145, 2146, 2147, 2226, 3968}
	// If the tile is in the ogTiles array, add it to the attributes
	if contains(ogTiles, int(tile.ID)) {
		tileMetaData["attributes"] = append(tileMetaData["attributes"].([]map[string]string), map[string]string{"value": "OG"})
	}

	image, err := utils.DecompressTileCode(tile.Image)
	if err != nil {
		tileMetaData["image"] = "https://pixelmap.art/blank.png"
	}

	if len(image) >= 768 {
		tileMetaData["image"] = fmt.Sprintf("https://pixelmap.art/%d/latest.png", tile.ID)
	} else {
		tileMetaData["image"] = "https://pixelmap.art/blank.png"
	}

	// Write metadata for OpenSea
	jsonMetaData, err := json.MarshalIndent(tileMetaData, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling tile metadata: %w", err)
	}

	historicalImages := GetHistoricalImages(tile, dataHistory)
	
	// Initialize empty slices
	purchaseItems := []PurchaseHistoryItem{}
	transferItems := []TransferHistoryItem{}
	wrappingItems := []WrappingHistoryItem{}
	dataItems := []DataHistoryItem{}
	
	// Only fetch history if queries is not nil (for testing)
	if queries != nil {
		// Fetch purchase history
		purchaseHistory, err := queries.GetPurchaseHistoryByTileId(ctx, tile.ID)
		if err != nil {
			logger.Printf("Error fetching purchase history for tile %d: %v", tile.ID, err)
			purchaseHistory = []db.PurchaseHistory{}
		}
		
		// Convert purchase history to API format
		purchaseItems = make([]PurchaseHistoryItem, len(purchaseHistory))
		for i, p := range purchaseHistory {
			purchaseItems[i] = PurchaseHistoryItem{
				ID:          p.ID,
				Timestamp:   p.TimeStamp,
				BlockNumber: p.BlockNumber,
				Tx:          p.Tx,
				SoldBy:      p.SoldBy,
				PurchasedBy: p.PurchasedBy,
				Price:       p.Price,
			}
		}
		
		// Note: Transfer and Wrapping history queries don't exist yet in the database
		// We'll leave them empty for now until the queries are added
		// TODO: Add GetTransferHistoryByTileId and GetWrappingHistoryByTileId queries
	}
	
	// Convert data history to API format
	dataItems = make([]DataHistoryItem, len(dataHistory))
	for i, d := range dataHistory {
		price := ""
		if d.Price.Valid {
			price = d.Price.String
		}
		dataItems[i] = DataHistoryItem{
			ID:          d.ID,
			Timestamp:   d.TimeStamp,
			BlockNumber: d.BlockNumber,
			Tx:          d.Tx,
			Image:       d.Image,
			URL:         d.Url,
			Price:       price,
			UpdatedBy:   d.UpdatedBy,
		}
	}
	
	// Create PixelMapTile API data
	pixelMapTile := MetadataPixelMapTile{
		ID:               int(tile.ID),
		Image:            tile.Image,
		URL:              tile.Url,
		Price:            tile.Price,
		Owner:            tile.Owner,
		Wrapped:          tile.Wrapped,
		OpenseaPrice:     tile.OpenseaPrice,
		Ens:              tile.Ens,
		HistoricalImages: historicalImages,
		PurchaseHistory:  purchaseItems,
		TransferHistory:  transferItems,
		WrappingHistory:  wrappingItems,
		DataHistory:      dataItems,
	}

	if err := os.MkdirAll(filepath.Dir("cache/metadata/"), os.ModePerm); err != nil {
		return fmt.Errorf("error creating metadata directory: %w", err)
	}
	if err := os.WriteFile(fmt.Sprintf("cache/metadata/%d.json", tile.ID), jsonMetaData, 0644); err != nil {
		return fmt.Errorf("error writing metadata file: %w", err)
	}

	pixelMapTileJSON, err := json.MarshalIndent(pixelMapTile, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling pixel map tile: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir("cache/tile/"), os.ModePerm); err != nil {
		return fmt.Errorf("error creating tile directory: %w", err)
	}
	if err := os.WriteFile(fmt.Sprintf("cache/tile/%d.json", tile.ID), pixelMapTileJSON, 0644); err != nil {
		return fmt.Errorf("error writing tile file: %w", err)
	}

	return nil
}

// tileIsInCenter checks if a given tile number is in the center of the PixelMap
func tileIsInCenter(tileNumber int) bool {
	// Top Row
	if tileNumber >= 1574 && tileNumber <= 1584 {
		return true
	}
	// Second Row
	if tileNumber >= 1655 && tileNumber <= 1665 {
		return true
	}
	// Third Row
	if tileNumber >= 1736 && tileNumber <= 1746 {
		return true
	}
	// Fourth Row
	if tileNumber >= 1817 && tileNumber <= 1827 {
		return true
	}
	// Fifth Row
	if tileNumber >= 1898 && tileNumber <= 1908 {
		return true
	}
	// Sixth Row
	if tileNumber >= 1979 && tileNumber <= 1989 {
		return true
	}
	// Seventh Row
	if tileNumber >= 2060 && tileNumber <= 2070 {
		return true
	}
	// Eighth Row
	if tileNumber >= 2141 && tileNumber <= 2151 {
		return true
	}
	// Ninth Row
	if tileNumber >= 2222 && tileNumber <= 2232 {
		return true
	}
	// Tenth Row
	if tileNumber >= 2303 && tileNumber <= 2313 {
		return true
	}
	// Bottom Row
	if tileNumber >= 2384 && tileNumber <= 2394 {
		return true
	}

	// Clearly not in the center
	return false
}

// tileIsOnEdge checks if a given tile number is on the edge of the PixelMap
func tileIsOnEdge(tileNumber int) bool {
	// Top Row
	if tileNumber >= 0 && tileNumber <= 80 {
		return true
	}
	// Bottom Row
	if tileNumber >= 3888 && tileNumber <= 3969 {
		return true
	}

	// Left Side
	leftSide := []int{
		81, 162, 243, 324, 405, 486, 567, 648, 729, 810, 891, 972, 1053, 1134, 1215, 1296, 1377, 1458, 1539, 1620, 1701,
		1782, 1863, 1944, 2025, 2106, 2187, 2268, 2349, 2430, 2511, 2592, 2673, 2754, 2835, 2916, 2997, 3078, 3159, 3240,
		3321, 3402, 3483, 3564, 3645, 3726, 3807, 3888, 3969,
	}
	for _, v := range leftSide {
		if v == tileNumber {
			return true
		}
	}

	// Right Side
	rightSide := []int{
		80, 161, 242, 323, 404, 485, 566, 647, 728, 809, 890, 971, 1052, 1133, 1214, 1295, 1376, 1457, 1538, 1619, 1700,
		1781, 1862, 1943, 2024, 2105, 2186, 2267, 2348, 2429, 2510, 2591, 2672, 2753, 2834, 2915, 2996, 3077, 3158, 3239,
		3320, 3401, 3482, 3563, 3644, 3725, 3806, 3887, 3968,
	}
	for _, v := range rightSide {
		if v == tileNumber {
			return true
		}
	}

	// Clearly not on the edge
	return false
}
func contains(s []int, e int) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

// PixelMapImage represents the structure of a historical image
type PixelMapImage struct {
	BlockNumber int64     `json:"blockNumber"`
	Date        time.Time `json:"date"`
	Image       string    `json:"image"`
	ImageURL    string    `json:"image_url"`
}

// GetHistoricalImages processes the data history of a tile and returns unique historical images
func GetHistoricalImages(tile db.Tile, dataHistory []db.DataHistory) []PixelMapImage {
	imagesAlreadySeen := make(map[string]bool)
	var historicalImages []PixelMapImage

	for _, dh := range dataHistory {
		if len(dh.Image) >= 768 || strings.HasPrefix(dh.Image, "b#") || strings.HasPrefix(dh.Image, "c#") {
			if !imagesAlreadySeen[dh.Image] {
				imagesAlreadySeen[dh.Image] = true
				historicalImages = append(historicalImages, PixelMapImage{
					BlockNumber: dh.BlockNumber,
					Date:        dh.TimeStamp,
					Image:       dh.Image,
					ImageURL:    fmt.Sprintf("https://pixelmap.art/%d/%d.png", tile.ID, dh.BlockNumber),
				})
			}
		}
	}

	return historicalImages
}
