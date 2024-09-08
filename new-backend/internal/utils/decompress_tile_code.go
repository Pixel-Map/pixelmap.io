package utils

import (
	"bytes"
	"fmt"
	"log"
	"strconv"

	"github.com/golang-module/dongle"

	"strings"
)

const (
	ImageCompressed   = "b#"
	ImageCompressedV2 = "c#"
	base91Alphabet    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~\""
)

var colors4bit = [][3]byte{
	{0, 0, 0},       // #000000
	{29, 43, 83},    // #1D2B53
	{126, 37, 83},   // #7E2553
	{0, 135, 81},    // #008751
	{171, 82, 54},   // #AB5236
	{95, 87, 79},    // #5F574F
	{194, 195, 195}, // #C2C3C7
	{255, 241, 232}, // #FFF1E8
	{255, 0, 77},    // #FF004D
	{255, 163, 0},   // #FFA300
	{255, 255, 39},  // #FFFF27
	{0, 231, 86},    // #00E756
	{41, 173, 255},  // #29ADFF
	{131, 118, 156}, // #83769C
	{255, 119, 168}, // #FF77A8
	{255, 204, 170}, // #FFCCAA
}

var colors8bit = [][3]byte{
	{0, 0, 0},
	{0, 0, 48},
	{0, 0, 96},
	{0, 0, 144},
	{0, 0, 192},
	{0, 0, 240},
	{0, 48, 0},
	{0, 48, 48},
	{0, 48, 96},
	{0, 48, 144},
	{0, 48, 192},
	{0, 48, 240},
	{0, 96, 0},
	{0, 96, 48},
	{0, 96, 96},
	{0, 96, 144},
	{0, 96, 192},
	{0, 96, 240},
	{0, 144, 0},
	{0, 144, 48},
	{0, 144, 96},
	{0, 144, 144},
	{0, 144, 192},
	{0, 144, 240},
	{0, 192, 0},
	{0, 192, 48},
	{0, 192, 96},
	{0, 192, 144},
	{0, 192, 192},
	{0, 192, 240},
	{0, 240, 0},
	{0, 240, 48},
	{0, 240, 96},
	{0, 240, 144},
	{0, 240, 192},
	{0, 240, 240},
	{48, 0, 0},
	{48, 0, 48},
	{48, 0, 96},
	{48, 0, 144},
	{48, 0, 192},
	{48, 0, 240},
	{48, 48, 0},
	{48, 48, 48},
	{48, 48, 96},
	{48, 48, 144},
	{48, 48, 192},
	{48, 48, 240},
	{48, 96, 0},
	{48, 96, 48},
	{48, 96, 96},
	{48, 96, 144},
	{48, 96, 192},
	{48, 96, 240},
	{48, 144, 0},
	{48, 144, 48},
	{48, 144, 96},
	{48, 144, 144},
	{48, 144, 192},
	{48, 144, 240},
	{48, 192, 0},
	{48, 192, 48},
	{48, 192, 96},
	{48, 192, 144},
	{48, 192, 192},
	{48, 192, 240},
	{48, 240, 0},
	{48, 240, 48},
	{48, 240, 96},
	{48, 240, 144},
	{48, 240, 192},
	{48, 240, 240},
	{96, 0, 0},
	{96, 0, 48},
	{96, 0, 96},
	{96, 0, 144},
	{96, 0, 192},
	{96, 0, 240},
	{96, 48, 0},
	{96, 48, 48},
	{96, 48, 96},
	{96, 48, 144},
	{96, 48, 192},
	{96, 48, 240},
	{96, 96, 0},
	{96, 96, 48},
	{96, 96, 96},
	{96, 96, 144},
	{96, 96, 192},
	{96, 96, 240},
	{96, 144, 0},
	{96, 144, 48},
	{96, 144, 96},
	{96, 144, 144},
	{96, 144, 192},
	{96, 144, 240},
	{96, 192, 0},
	{96, 192, 48},
	{96, 192, 96},
	{96, 192, 144},
	{96, 192, 192},
	{96, 192, 240},
	{96, 240, 0},
	{96, 240, 48},
	{96, 240, 96},
	{96, 240, 144},
	{96, 240, 192},
	{96, 240, 240},
	{144, 0, 0},
	{144, 0, 48},
	{144, 0, 96},
	{144, 0, 144},
	{144, 0, 192},
	{144, 0, 240},
	{144, 48, 0},
	{144, 48, 48},
	{144, 48, 96},
	{144, 48, 144},
	{144, 48, 192},
	{144, 48, 240},
	{144, 96, 0},
	{144, 96, 48},
	{144, 96, 96},
	{144, 96, 144},
	{144, 96, 192},
	{144, 96, 240},
	{144, 144, 0},
	{144, 144, 48},
	{144, 144, 96},
	{144, 144, 144},
	{144, 144, 192},
	{144, 144, 240},
	{144, 192, 0},
	{144, 192, 48},
	{144, 192, 96},
	{144, 192, 144},
	{144, 192, 192},
	{144, 192, 240},
	{144, 240, 0},
	{144, 240, 48},
	{144, 240, 96},
	{144, 240, 144},
	{144, 240, 192},
	{144, 240, 240},
	{192, 0, 0},
	{192, 0, 48},
	{192, 0, 96},
	{192, 0, 144},
	{192, 0, 192},
	{192, 0, 240},
	{192, 48, 0},
	{192, 48, 48},
	{192, 48, 96},
	{192, 48, 144},
	{192, 48, 192},
	{192, 48, 240},
	{192, 96, 0},
	{192, 96, 48},
	{192, 96, 96},
	{192, 96, 144},
	{192, 96, 192},
	{192, 96, 240},
	{192, 144, 0},
	{192, 144, 48},
	{192, 144, 96},
	{192, 144, 144},
	{192, 144, 192},
	{192, 144, 240},
	{192, 192, 0},
	{192, 192, 48},
	{192, 192, 96},
	{192, 192, 144},
	{192, 192, 192},
	{192, 192, 240},
	{192, 240, 0},
	{192, 240, 48},
	{192, 240, 96},
	{192, 240, 144},
	{192, 240, 192},
	{192, 240, 240},
	{240, 0, 0},
	{240, 0, 48},
	{240, 0, 96},
	{240, 0, 144},
	{240, 0, 192},
	{240, 0, 240},
	{240, 48, 0},
	{240, 48, 48},
	{240, 48, 96},
	{240, 48, 144},
	{240, 48, 192},
	{240, 48, 240},
	{240, 96, 0},
	{240, 96, 48},
	{240, 96, 96},
	{240, 96, 144},
	{240, 96, 192},
	{240, 96, 240},
	{240, 144, 0},
	{240, 144, 48},
	{240, 144, 96},
	{240, 144, 144},
	{240, 144, 192},
	{240, 144, 240},
	{240, 192, 0},
	{240, 192, 48},
	{240, 192, 96},
	{240, 192, 144},
	{240, 192, 192},
	{240, 192, 240},
	{240, 240, 0},
	{240, 240, 48},
	{240, 240, 96},
	{240, 240, 144},
	{240, 240, 192},
	{240, 240, 240},
	{16, 16, 16},
	{16, 16, 128},
	{16, 16, 224},
	{16, 128, 16},
	{16, 128, 128},
	{16, 128, 224},
	{16, 224, 16},
	{16, 224, 128},
	{16, 224, 224},
	{128, 16, 16},
	{128, 16, 128},
	{128, 16, 224},
	{128, 128, 16},
	{128, 128, 128},
	{128, 128, 224},
	{128, 224, 16},
	{128, 224, 128},
	{128, 224, 224},
	{224, 16, 16},
	{224, 16, 128},
	{224, 16, 224},
	{224, 128, 16},
	{224, 128, 128},
	{224, 128, 224},
	{224, 224, 16},
	{224, 224, 128},
	{224, 224, 224},
	{64, 64, 64},
	{64, 64, 176},
	{64, 176, 64},
	{176, 176, 176},
	{176, 64, 64},
	{176, 64, 176},
	{176, 176, 64},
	{176, 176, 176},
}

func DecompressTileCode(tileCodeString string) (string, error) {
	tileCodeString = strings.TrimSpace(tileCodeString)

	log.Printf("Input tileCodeString: %s", tileCodeString)

	if !strings.HasPrefix(tileCodeString, ImageCompressed) && !strings.HasPrefix(tileCodeString, ImageCompressedV2) {
		log.Println("Not a compressed image, returning as-is")
		return tileCodeString, nil
	}

	var data []byte
	var err error

	if strings.HasPrefix(tileCodeString, ImageCompressed) {
		data, err = decodeAndInflate(tileCodeString[len(ImageCompressed):])
	} else {
		data, err = decodeAndInflate(tileCodeString[len(ImageCompressedV2):])
	}

	if err != nil {
		return "", fmt.Errorf("failed to decode and inflate: %w", err)
	}

	pixelSize, colorDepth := determinePixelSizeAndColorDepth(len(data), strings.HasPrefix(tileCodeString, ImageCompressedV2))
	log.Printf("Determined pixelSize: %d, colorDepth: %d", pixelSize, colorDepth)

	result := bytesToHexString(data)
	log.Printf("Final result length: %d", len(result))
	log.Printf("Final result (first 60 chars): %s", result[:min(60, len(result))])

	return result, nil
}

func bytesToHexString(data []byte) string {
	var result strings.Builder
	for _, b := range data {
		result.WriteString(fmt.Sprintf("%02x", b))
	}
	return result.String()
}

func decodeAndInflate(str string) ([]byte, error) {
	decoded, err := DecodeBase91(str)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base91: %w", err)
	}
	log.Printf("Base91 decoded length: %d", len(decoded))

	// Custom decompression algorithm
	var result bytes.Buffer
	var b uint32
	var n uint32

	for _, v := range decoded {
		b |= uint32(v) << n
		n += 8
		for n > 7 {
			result.WriteByte(byte(b & 0xFF))
			b >>= 8
			n -= 8
		}
	}

	if n > 0 {
		result.WriteByte(byte(b & 0xFF))
	}

	log.Printf("Custom decompressed length: %d", result.Len())
	return result.Bytes(), nil
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

func get4bitColor(s string) ([3]byte, error) {
	index, err := strconv.ParseInt(s, 16, 4)
	if err != nil {
		return [3]byte{}, err
	}
	if index < 0 || int(index) >= len(colors4bit) {
		return [3]byte{}, fmt.Errorf("invalid 4-bit color index: %d", index)
	}
	return colors4bit[index], nil
}

func get8bitColor(s string) ([3]byte, error) {
	index, err := strconv.ParseInt(s, 16, 8)
	if err != nil {
		return [3]byte{}, err
	}
	if index < 0 || int(index) >= len(colors8bit) {
		return [3]byte{}, fmt.Errorf("invalid 8-bit color index: %d", index)
	}
	return colors8bit[index], nil
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
