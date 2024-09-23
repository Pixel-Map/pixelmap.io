package utils

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"

	"golang.org/x/image/draw"
)

func RenderImage(tileImageData string, sizeX, sizeY int, outputPath string) error {
	// First try to decompress the tile image data
	decompressedImage, err := DecompressTileCode(tileImageData)
	if err != nil {
		return fmt.Errorf("failed to decompress tile image data: %w", err)
	}

	if len(decompressedImage) < 768 {
		fmt.Printf("decompressed tile image data is too short: %d bytes", len(decompressedImage))
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(outputPath), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	img := image.NewRGBA(image.Rect(0, 0, 16, 16))

	for i := 0; i < 256; i++ {
		x, y := i%16, i/16
		hexStr := decompressedImage[i*3 : i*3+3]
		r := parseHexChar(hexStr[0])
		g := parseHexChar(hexStr[1])
		b := parseHexChar(hexStr[2])
		img.Set(x, y, color.RGBA{r, g, b, 255})
	}

	resizedImg := image.NewRGBA(image.Rect(0, 0, sizeX, sizeY))
	draw.NearestNeighbor.Scale(resizedImg, resizedImg.Bounds(), img, img.Bounds(), draw.Over, nil)

	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer outFile.Close()

	if err := png.Encode(outFile, resizedImg); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	return nil
}

func parseHexChar(c byte) uint8 {
	switch {
	case c >= '0' && c <= '9':
		return (c - '0') * 17
	case c >= 'a' && c <= 'f':
		return (c - 'a' + 10) * 17
	case c >= 'A' && c <= 'F':
		return (c - 'A' + 10) * 17
	default:
		return 0
	}
}

func RenderFullMap(tiles []string, outputPath string) error {
	if len(tiles) != 3970 {
		return fmt.Errorf("tile array is NOT 3,970 tiles")
	}

	width := 81 * 16  // 81 tiles across
	height := 49 * 16 // 49 tiles down

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for i, tile := range tiles {
		if len(tile) < 768 {
			continue // Skip invalid tiles
		}

		row := i / 81
		col := i % 81

		for y := 0; y < 16; y++ {
			for x := 0; x < 16; x++ {
				index := (y*16 + x) * 3
				hexStr := tile[index : index+3]
				r := parseHexChar(hexStr[0])
				g := parseHexChar(hexStr[1])
				b := parseHexChar(hexStr[2])
				img.Set(x+16*col, y+16*row, color.RGBA{r, g, b, 255})
			}
		}
	}

	if err := os.MkdirAll(filepath.Dir(outputPath), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer outFile.Close()

	if err := png.Encode(outFile, img); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	return nil
}
