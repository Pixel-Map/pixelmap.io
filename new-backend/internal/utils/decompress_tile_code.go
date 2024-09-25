package utils

import (
	"bytes"
	"compress/zlib"
	"fmt"
	"io"
	"strconv"

	"github.com/golang-module/dongle"

	"strings"
)

const (
	ImageCompressed   = "b#"
	ImageCompressedV2 = "c#"
	MaxPixelSize      = 16
	ColorDepth4       = 4
	ColorDepth8       = 8
	ColorDepth12      = 12
)

// DecompressTileCode attempts to decompress the given tile code string using various decoders.
// It tries uncompressed, compressed v1, and compressed v2 decoders in order.
func DecompressTileCode(tileCodeString string) (string, error) {
	tileCodeString = strings.TrimSpace(tileCodeString)

	decoders := []Decoder{
		uncompressedDecoder,
		compressedV1Decoder,
		compressedV2Decoder,
	}

	// Try each decoder until one succeeds
	for _, decoder := range decoders {
		result, err := decoder(tileCodeString)
		if err == nil {
			return result, nil
		}
	}

	return "", fmt.Errorf("unable to decode tile code")
}

type Decoder func(string) (string, error)

func uncompressedDecoder(tileCodeString string) (string, error) {
	if strings.HasPrefix(tileCodeString, ImageCompressed) || strings.HasPrefix(tileCodeString, ImageCompressedV2) {
		return "", fmt.Errorf("not an uncompressed image")
	}
	return tileCodeString, nil
}

// compressedV1Decoder handles the decompression of v1 compressed tile codes.
// It decodes the data, determines the pixel size and color depth, and expands the result if necessary.
func compressedV1Decoder(tileCodeString string) (string, error) {
	if !strings.HasPrefix(tileCodeString, ImageCompressed) {
		return "", fmt.Errorf("not a v1 compressed image")
	}
	data, err := decodeCompressed(tileCodeString[len(ImageCompressed):], false)
	if err != nil {
		return "", fmt.Errorf("failed to decode compressed v1: %w", err)
	}
	imageProperties := DetectImageProperties([]byte(data), tileCodeString)
	decodedString := DecodeDataToString([]byte(data), imageProperties.ColorDepth)
	decodedString = ExpandColorEncoding(decodedString, imageProperties.ColorDepth)
	decodedString = ExpandPixelSize(decodedString, imageProperties.PixelSize)
	return decodedString, nil
}

// compressedV2Decoder handles the decompression of v2 compressed tile codes.
// It decodes the data, determines the pixel size and color depth, and expands the result if necessary.
func compressedV2Decoder(tileCodeString string) (string, error) {
	if !strings.HasPrefix(tileCodeString, ImageCompressedV2) {
		return "", fmt.Errorf("not a v2 compressed image")
	}
	return decodeCompressed(tileCodeString[len(ImageCompressedV2):], true)
}

// decodeCompressed handles the decompression of both v1 and v2 compressed tile codes.
// It decodes the data, determines the pixel size and color depth, and expands the result if necessary.
func decodeCompressed(data string, isV2 bool) (string, error) {
	// Decode the Base91 encoded string and inflate the zlib compressed data
	decodedData, err := DecodeAndInflate(data)
	if err != nil {
		return "", fmt.Errorf("failed to decode and inflate: %w", err)
	}

	// Determine the pixel size and color depth based on the decoded data length and version
	pixelSize, colorDepth := determinePixelSizeAndColorDepth(len(decodedData), isV2)

	// Convert the decompressed data to a string based on color depth
	result := DecodeDataToString(decodedData, colorDepth)

	// Expand the color encoding if necessary (for 4-bit and 8-bit color depths)
	result = ExpandColorEncoding(result, colorDepth)

	// Expand the pixel size if it's smaller than the maximum (16x16)
	result = ExpandPixelSize(result, pixelSize)

	return result, nil
}

// ExpandColorEncoding expands the color encoding of the tile code string based on the color depth.
// This function handles 4-bit and 8-bit color depths.
func ExpandColorEncoding(decodedString string, colorDepth int) string {
	if colorDepth == 8 {
		return ExpandHexDoubles(decodedString)
	}
	if colorDepth == 4 {
		return ExpandHexSingles(decodedString)
	}
	return decodedString
}

// ExpandHexDoubles expands a hexadecimal string where each pair of characters represents an 8-bit color value.
// It converts each 8-bit value to a 12-bit value and returns the expanded string.
func ExpandHexDoubles(tileCodeString string) string {
	var result strings.Builder
	for i := 0; i < len(tileCodeString); i += 2 {
		colorValue, _ := strconv.ParseUint(tileCodeString[i:i+2], 16, 8)
		color := Get8bitColor(uint(colorValue))
		for _, c := range color {
			result.WriteString(fmt.Sprintf("%x", c>>4))
		}
	}
	return result.String()
}

// ExpandHexSingles expands a hexadecimal string where each character represents an 8-bit color value.
// It converts each 8-bit value to a 12-bit value and returns the expanded string.
func ExpandHexSingles(tileCodeString string) string {
	var result strings.Builder
	for _, char := range tileCodeString {
		colorIndex, _ := strconv.ParseInt(string(char), 16, 8)
		color := Get4bitColor(uint(colorIndex))
		for _, c := range color {
			result.WriteString(fmt.Sprintf("%x", c>>4))
		}
	}
	return result.String()
}

// DecodeDataToString converts the decompressed data to a string based on the color depth.
// For 4-bit and 8-bit color depths, it converts the data to a hexadecimal string.
// For other color depths, it converts the data to a regular string.
func DecodeDataToString(data []byte, colorDepth int) string {
	if colorDepth == 8 || colorDepth == 4 {
		var result strings.Builder
		for _, byte := range data {
			result.WriteString(fmt.Sprintf("%02x", byte))
		}
		return result.String()
	}
	return string(data)
}

// decodeAndInflate decodes a Base91 encoded string and inflates the zlib compressed data.
func DecodeAndInflate(compressedImage string) ([]byte, error) {

	// Check if it's a v2 compressed image
	compressedImage = strings.TrimPrefix(compressedImage, ImageCompressedV2)

	// Decode Base91
	decoded, err := DecodeBase91(compressedImage)
	if err != nil {
		return nil, fmt.Errorf("failed to decode Base91: %v", err)
	}

	// Inflate
	inflated, err := ZlibInflate(decoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decompress data: %v", err)
	}

	return inflated, nil
}

// ExpandPixelSize expands the tile code string to a 16x16 pixel representation if necessary.
// This function handles cases where the original pixel size is smaller than 16x16.
func ExpandPixelSize(tileCodeString string, pixelSize int) string {
	if pixelSize == MaxPixelSize {
		return tileCodeString
	}

	diffRatio := float64(MaxPixelSize) / float64(pixelSize)
	var imageString strings.Builder

	// Iterate through each pixel in the 16x16 grid
	for y := 0; y < MaxPixelSize; y++ {
		for x := 0; x < MaxPixelSize; x++ {
			// Calculate the corresponding index in the original smaller image
			index := (int(float64(y)/diffRatio)*pixelSize + int(float64(x)/diffRatio)) * 3
			// Append the color data for this pixel
			imageString.WriteString(tileCodeString[index : index+3])
		}
	}

	return imageString.String()
}

// determinePixelSizeAndColorDepth calculates the pixel size and color depth
// based on the length of the decoded data and whether it's a v2 compressed image.
func determinePixelSizeAndColorDepth(dataLength int, isV2 bool) (int, int) {
	pixelSize, colorDepth := MaxPixelSize, ColorDepth12

	if isV2 {
		switch dataLength {
		case 8:
			pixelSize, colorDepth = 4, 4
		case 16:
			pixelSize, colorDepth = 4, 8
		case 48:
			pixelSize, colorDepth = 4, 12
		case 32:
			pixelSize, colorDepth = 8, 4
		case 64:
			pixelSize, colorDepth = 8, 8
		case 192:
			pixelSize, colorDepth = 8, 12
		case 128:
			pixelSize, colorDepth = 16, 4
		case 256:
			pixelSize, colorDepth = 16, 8
		case 768:
			pixelSize, colorDepth = 16, 12
		}
	}

	return pixelSize, colorDepth
}

// DecodeBase91 decodes a Base91 encoded string to bytes using the dongle library.
func DecodeBase91(s string) ([]byte, error) {
	return dongle.Decode.FromString(s).ByBase91().ToBytes(), nil
}

// min returns the minimum of two integers.
func min(a, b int) int {
	return map[bool]int{true: a, false: b}[a < b]
}

// ZlibInflate decompresses zlib compressed data.
func ZlibInflate(data []byte) ([]byte, error) {
	r, err := zlib.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer r.Close()

	var result bytes.Buffer
	_, err = io.Copy(&result, r)
	if err != nil {
		return nil, err
	}
	return result.Bytes(), nil
}

type ImageProperties struct {
	PixelSize  int
	ColorDepth int
}

// DetectImageProperties detects the pixel size and color depth of an image based on the tile code string.
// It handles both uncompressed and v2 compressed images.
func DetectImageProperties(data []byte, tileCodeString string) ImageProperties {
	if !strings.HasPrefix(tileCodeString, ImageCompressedV2) {
		return ImageProperties{PixelSize: MaxPixelSize, ColorDepth: ColorDepth12}
	}

	properties := map[int]ImageProperties{
		8:   {PixelSize: 4, ColorDepth: 4},
		16:  {PixelSize: 4, ColorDepth: 8},
		48:  {PixelSize: 4, ColorDepth: 12},
		32:  {PixelSize: 8, ColorDepth: 4},
		64:  {PixelSize: 8, ColorDepth: 8},
		192: {PixelSize: 8, ColorDepth: 12},
		128: {PixelSize: 16, ColorDepth: 4},
		256: {PixelSize: 16, ColorDepth: 8},
		768: {PixelSize: 16, ColorDepth: 12},
	}

	if result, ok := properties[len(data)]; ok {
		return result
	}

	return ImageProperties{PixelSize: MaxPixelSize, ColorDepth: ColorDepth12}
}
