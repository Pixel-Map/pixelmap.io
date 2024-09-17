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
	if len(tileImageData) < 768 {
		fmt.Println("Not saving image, invalid image data found, skipping")
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(outputPath), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	img := image.NewRGBA(image.Rect(0, 0, 16, 16))

	for i := 0; i < 256; i++ {
		x, y := i%16, i/16
		hexStr := tileImageData[i*3 : i*3+3]
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
