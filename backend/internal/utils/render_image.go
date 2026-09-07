package utils

import (
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"strings"

	"golang.org/x/image/draw"
)

var ErrInvalidTileImage = errors.New("invalid tile image")

func DecodeTileImage(code string) (string, error) {
	decoded, err := DecompressTileCode(code)
	if err != nil || len(decoded) != 768 || strings.Trim(decoded, "0123456789abcdefABCDEF") != "" {
		return "", ErrInvalidTileImage
	}
	return strings.ToLower(decoded), nil
}

// Invalid on-chain strings are represented as transparent tiles, never stale art.
func RenderBlankImage(sizeX, sizeY int, path string) error {
	return AtomicWrite(path, func(w io.Writer) error { return png.Encode(w, image.NewRGBA(image.Rect(0, 0, sizeX, sizeY))) })
}

func RenderImage(tileImageData string, sizeX, sizeY int, outputPath string) error {
	// First try to decompress the tile image data
	decompressedImage, err := DecodeTileImage(tileImageData)
	if err != nil {
		return fmt.Errorf("failed to decompress tile image data: %w", err)
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

	return AtomicWrite(outputPath, func(w io.Writer) error { return png.Encode(w, resizedImg) })
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
		// Decompress the tile if it's compressed
		decompressedTile, err := DecodeTileImage(tile)
		if err != nil {
			continue // Invalid on-chain artwork has the same blank representation.
		}

		if len(decompressedTile) < 768 {
			continue // Skip invalid tiles
		}

		row := i / 81
		col := i % 81

		for y := 0; y < 16; y++ {
			for x := 0; x < 16; x++ {
				index := (y*16 + x) * 3
				hexStr := decompressedTile[index : index+3]
				r := parseHexChar(hexStr[0])
				g := parseHexChar(hexStr[1])
				b := parseHexChar(hexStr[2])
				img.Set(x+16*col, y+16*row, color.RGBA{r, g, b, 255})
			}
		}
	}

	return AtomicWrite(outputPath, func(w io.Writer) error { return png.Encode(w, img) })
}
