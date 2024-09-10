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
	base91Alphabet    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~\""
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
	return decodeCompressed(tileCodeString[len(ImageCompressed):], false)
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

	result := bytesToHexString(decodedData)
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
	if index < 0 || int(index) >= len(Colors4bit) {
		return [3]byte{}, fmt.Errorf("invalid 4-bit color index: %d", index)
	}
	return Colors4bit[index], nil
}

func get8bitColor(s string) ([3]byte, error) {
	index, err := strconv.ParseInt(s, 16, 8)
	if err != nil {
		return [3]byte{}, err
	}
	if index < 0 || int(index) >= len(Colors8bit) {
		return [3]byte{}, fmt.Errorf("invalid 8-bit color index: %d", index)
	}
	return Colors8bit[index], nil
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
