package utils

import (
	"bytes"
	"compress/zlib"
	"fmt"
	"io"
	"log"
	"strconv"

	"github.com/golang-module/dongle"

	"strings"
)

const (
	ImageCompressed   = "b#"
	ImageCompressedV2 = "c#"
)

func DecompressTileCode(tileCodeString string) (string, error) {
	tileCodeString = strings.TrimSpace(tileCodeString)
	log.Printf("Input tileCodeString: %s", tileCodeString)

	decoders := []Decoder{
		uncompressedDecoder,
		compressedV1Decoder,
		compressedV2Decoder,
	}

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
	log.Println("Not a compressed image, returning as-is")
	return tileCodeString, nil
}
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

func compressedV2Decoder(tileCodeString string) (string, error) {
	if !strings.HasPrefix(tileCodeString, ImageCompressedV2) {
		return "", fmt.Errorf("not a v2 compressed image")
	}
	return decodeCompressed(tileCodeString[len(ImageCompressedV2):], true)
}
func decodeCompressed(data string, isV2 bool) (string, error) {
	decodedData, err := decodeAndInflate(data)
	if err != nil {
		return "", fmt.Errorf("failed to decode and inflate: %w", err)
	}

	pixelSize, colorDepth := determinePixelSizeAndColorDepth(len(decodedData), isV2)
	log.Printf("Determined pixelSize: %d, colorDepth: %d", pixelSize, colorDepth)

	// Convert the decompressed data to a string based on color depth
	result := DecodeDataToString(decodedData, colorDepth)

	// Expand the color encoding if necessary
	result = ExpandColorEncoding(result, colorDepth)

	// Expand the pixel size if necessary
	result = ExpandPixelSize(result, pixelSize)

	log.Printf("Final result length: %d", len(result))
	log.Printf("Final result (first 60 chars): %s", result[:min(60, len(result))])

	return result, nil
}
func ExpandColorEncoding(tileCodeString string, colorDepth int) string {
	if colorDepth == 8 {
		return ExpandHexDoubles(tileCodeString)
	}
	if colorDepth == 4 {
		return ExpandHexSingles(tileCodeString)
	}
	return tileCodeString
}
func ExpandHexDoubles(tileCodeString string) string {
	var result strings.Builder
	for i := 0; i < len(tileCodeString); i += 2 {
		colorIndex, _ := strconv.ParseInt(tileCodeString[i:i+2], 16, 8)
		color := Get8bitColor(int(colorIndex))
		for _, c := range color {
			result.WriteString(fmt.Sprintf("%x", c>>4))
		}
	}
	return result.String()
}

func ExpandHexSingles(tileCodeString string) string {
	var result strings.Builder
	for _, char := range tileCodeString {
		colorIndex, _ := strconv.ParseInt(string(char), 16, 8)
		color := Get4bitColor(int(colorIndex))
		for _, c := range color {
			result.WriteString(fmt.Sprintf("%x", c>>4))
		}
	}
	return result.String()
}
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

func decodeAndInflate(str string) ([]byte, error) {
	decoded, err := DecodeBase91(str)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base91: %w", err)
	}
	log.Printf("Base91 decoded length: %d", len(decoded))

	// Use zlib to decompress the data
	decompressed, err := ZlibInflate(decoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decompress data: %w", err)
	}

	log.Printf("Zlib decompressed length: %d", len(decompressed))
	return decompressed, nil
}
func ExpandPixelSize(tileCodeString string, pixelSize int) string {
	if pixelSize == 16 {
		return tileCodeString
	}

	const maxSize = 16
	diffRatio := float64(maxSize) / float64(pixelSize)
	var imageString strings.Builder

	for y := 0; y < maxSize; y++ {
		for x := 0; x < maxSize; x++ {
			index := (int(float64(y)/diffRatio)*pixelSize + int(float64(x)/diffRatio)) * 3
			imageString.WriteString(tileCodeString[index : index+3])
		}
	}

	return imageString.String()
}

func determinePixelSizeAndColorDepth(dataLength int, isV2 bool) (int, int) {
	pixelSize, colorDepth := 16, 12

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

func DecodeBase91(s string) ([]byte, error) {
	return dongle.Decode.FromString(s).ByBase91().ToBytes(), nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

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

func DetectImageProperties(data []byte, tileCodeString string) ImageProperties {
	const IMAGE_COMPRESSED_V2 = "c#"

	if !strings.HasPrefix(tileCodeString, IMAGE_COMPRESSED_V2) {
		return ImageProperties{PixelSize: 16, ColorDepth: 12}
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

	return ImageProperties{PixelSize: 16, ColorDepth: 12}
}
