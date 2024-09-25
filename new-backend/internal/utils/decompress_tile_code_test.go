package utils

import (
	"bytes"
	"testing"
)

func TestDecompressTileCode(t *testing.T) {
	t.Run("returns the original string if it's not compressed", func(t *testing.T) {
		originalString := "000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000"
		result, err := DecompressTileCode(originalString)
		if err != nil {
			t.Fatalf("DecompressTileCode failed: %v", err)
		}
		if result != originalString {
			t.Errorf("Expected %s, but got %s", originalString, result)
		}
	})
	t.Run("successfully decodes a Pako compressed Base91 string", func(t *testing.T) {
		compressedImage := "b#I@Y8KucA>C=C$amO}}.yB\"wn7S4JMIgmxvTR#6?fMx89\"gv=Ng~)}w.FaSy63j:PAgZ@8klfYnduUCA4jNfEe#:d~OC(~3NJ}r8.$_>rsm*vE}W0z7i~b~UV&6IsQ&@3r2.|8gWFd=vky~Y.|ookg=<hy4>*c?k[j.4{j)D|Txq?Hkb9?cYSf"
		expected := "d84000000d84940000000000355355355355355134134355d84d84d849400001741742b5000355355134134355355355d84d84d849400001741742b50003553551341343553553559400000000001741741740006300000003553553553551340001741742b51740000006306300000001341341341341342b52b52b52b5174000000000c730000001341341341341342b52b52b52b5174000000000c730000001341341341341342b5174174174174000000c73c73000000466466466466466db1000000db1db1174174000c73000000466134134134355db1db1db1174174000000000000134134466355355355134db1db1db1174174000000000000134134466355355355134174174174000000900900000355134134466355355355355000000000900d50000000000134134134466355355355134000000000000000000000355355134134466134134134355000000000000000000000355355134134466134134134355000000000000134134134134134134134134134134134134"

		result, err := DecompressTileCode(compressedImage)
		if err != nil {
			t.Fatalf("DecompressTileCode failed: %v", err)
		}
		if result != expected {
			t.Errorf("Expected %s, but got %s", expected, result)
		}
	})

	t.Run("successfully decodes a regular hex triplet string with accidental whitespace", func(t *testing.T) {
		compressedImage := "  000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000"
		expected := "000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000"

		result, err := DecompressTileCode(compressedImage)
		if err != nil {
			t.Fatalf("DecompressTileCode failed: %v", err)
		}
		if result != expected {
			t.Errorf("Expected %s, but got %s", expected, result)
		}
	})

	t.Run("successfully decodes a Pako compressed Base91 string with v2 compression", func(t *testing.T) {
		compressedImage :=
			"c#I@O:{0t#NMZD.(KC%ZhwOry(0kP{0WZLh*FTUG`cUB_A`c)}Nn@D]zS{/djLAA!mHP(B"
		expected := "ffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffdffd000ffdffdffdffdffdffdffdffdffdffdffdffdffdffd000000ffdffdffdffdffdffdffdffdffdffdffdffdffd000000000ffdffdffdffdffdffdffdffdffdffdffdffdffd000000000ffdffdffdffdffdffdffdffdffdffdffdffd000000000000ffdffdffdffdffdffdffdffdffdffdffd332000000000000ffdffdffdffdffdffdffdffdffdffdffd000000000000000ffdffdffdffdffdffdffdffdffdffd000000000000000000ffdffdffdffdffdffdffdffdffd887000000000000000000ffdffdffdffdffdffdffdffdffd000000000000000000000"
		result, err := DecompressTileCode(compressedImage)
		if err != nil {
			t.Fatalf("DecompressTileCode failed: %v", err)
		}
		if result != expected {
			t.Errorf("Expected %s, but got %s", expected, result)
		}
	})

	t.Run("successfully decodes a Nyan cat", func(t *testing.T) {
		compressedImage :=
			"c#I@D;=i~W/FHHllD<NjB!e<#8;&ebh)TU|@kRfb(nH7v;D*!T%wAx0z&/~BN3e87=T4rwt=3rGMP3`HWD%n:4YybsE#mk}G8$M/)NHzs:K`q[ax#29/(va@+!)`)bq~Fa#|MPS_5D"
		expected := "036036036036036036036036036fff036036036036036036036036fff036036036036036fff036fff036036036036036f00f00036036036036111111036fff036036036fff036111f00f00f00f00f00111999999111036036036036036111999f90f90f00f00f00111999999999111036036036111999999f90f90f90f90f90111999999999999111111111999999999ff0ff0f90f90111999999999999999999999999999999999ff0ff0ff0ff0111999999999fff111999999999999fff1113f03f0ff0ff0111999f99f991111119999991119991111113f03f03f03f0111999f99f9999999999999999999999999909f09f3f03f03f011199999999911199999911199911199909f09f09f09f09f09f11199999911111111111111111199963f63f09f09f09f09f09f11199999999999999999999911163f63f63f63f63f63f63f11111111111111111111111103603603663f63f63f63f63f999999111036036999999111036036036036036036036111111111111036036111111111036"
		result, err := DecompressTileCode(compressedImage)
		if err != nil {
			t.Fatalf("DecompressTileCode failed: %v", err)
		}
		if result != expected {
			t.Errorf("Expected %s, but got %s", expected, result)
		}
	})

}

func TestDecodeBase91(t *testing.T) {
	t.Run("correctly decodes a base91 encoded string", func(t *testing.T) {
		encodedString := "I@Y8KucA>C=C$amO}}.yB\"wn7S4JMIgmxvTR#6?fMx89\"gv=Ng~)}w.FaSy63j:PAgZ@8klfYnduUCA4jNfEe#:d~OC(~3NJ}r8.$_>rsm*vE}W0z7i~b~UV&6IsQ&@3r2.|8gWFd=vky~Y.|ookg=<hy4>*c?k[j.4{j)D|Txq?Hkb9?cYSf"
		expectedDecodedArray := []byte{
			120, 156, 173, 146, 65, 14, 128, 32, 12, 4, 191, 4, 82, 64, 191, 131, 252,
			255, 13, 46, 212, 172, 13, 114, 33, 218, 204, 161, 135, 233, 166, 84, 235,
			46, 174, 87, 221, 229, 184, 219, 86, 33, 70, 139, 15, 2, 208, 64, 83, 84,
			246, 89, 192, 86, 34, 71, 104, 42, 171, 190, 221, 65, 101, 128, 62, 133,
			201, 98, 24, 180, 153, 106, 170, 76, 95, 243, 9, 52, 66, 31, 117, 230,
			240, 151, 207, 181, 233, 67, 166, 47, 41, 89, 106, 241, 247, 253, 139, 7,
			156, 178, 62, 195, 219, 61, 187, 102, 205, 231, 92, 221, 129, 111, 239,
			179, 234, 15, 155, 31, 29, 61, 251, 219, 7, 76, 131, 86, 227, 24, 254,
			206, 119, 179, 178, 127, 194, 240, 222, 47, 254, 240, 105, 166, 92, 135,
			148, 159, 249,
		}

		result, err := DecodeBase91(encodedString)
		if err != nil {
			t.Fatalf("DecodeBase91 failed: %v", err)
		}
		if !bytes.Equal(result, expectedDecodedArray) {
			t.Errorf("Expected %v, but got %v", expectedDecodedArray, result)
		}
	})

	t.Run("returns an empty slice for an empty string", func(t *testing.T) {
		encodedString := ""

		result, err := DecodeBase91(encodedString)
		if err != nil {
			t.Fatalf("DecodeBase91 failed: %v", err)
		}
		if len(result) != 0 {
			t.Errorf("Expected empty slice, but got %v", result)
		}
	})

	t.Run("does not throw an error for invalid base91 input", func(t *testing.T) {
		invalidEncodedString := "!@#$%^&*()"

		_, err := DecodeBase91(invalidEncodedString)
		if err != nil {
			t.Errorf("Expected no error, but got: %v", err)
		}
	})
}

func TestZlibInflate(t *testing.T) {
	t.Run("successfully inflates a Pako compressed Base91 string", func(t *testing.T) {
		compressedImage := []byte{
			120, 156, 173, 146, 65, 14, 128, 32, 12, 4, 191, 4, 82, 64, 191, 131, 252,
			255, 13, 46, 212, 172, 13, 114, 33, 218, 204, 161, 135, 233, 166, 84, 235,
			46, 174, 87, 221, 229, 184, 219, 86, 33, 70, 139, 15, 2, 208, 64, 83, 84,
			246, 89, 192, 86, 34, 71, 104, 42, 171, 190, 221, 65, 101, 128, 62, 133,
			201, 98, 24, 180, 153, 106, 170, 76, 95, 243, 9, 52, 66, 31, 117, 230,
			240, 151, 207, 181, 233, 67, 166, 47, 41, 89, 106, 241, 247, 253, 139, 7,
			156, 178, 62, 195, 219, 61, 187, 102, 205, 231, 92, 221, 129, 111, 239,
			179, 234, 15, 155, 31, 29, 61, 251, 219, 7, 76, 131, 86, 227, 24, 254,
			206, 119, 179, 178, 127, 194, 240, 222, 47, 254, 240, 105, 166, 92, 135,
			148, 159, 249,
		}

		expectedInflatedImage := []byte{
			100, 56, 52, 48, 48, 48, 48, 48, 48, 100, 56, 52, 57, 52, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 51, 53, 53, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53, 100, 56, 52, 100, 56, 52,
			100, 56, 52, 57, 52, 48, 48, 48, 48, 49, 55, 52, 49, 55, 52, 50, 98, 53,
			48, 48, 48, 51, 53, 53, 51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			51, 53, 53, 51, 53, 53, 100, 56, 52, 100, 56, 52, 100, 56, 52, 57, 52, 48,
			48, 48, 48, 49, 55, 52, 49, 55, 52, 50, 98, 53, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			57, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 55, 52, 49, 55, 52,
			49, 55, 52, 48, 48, 48, 54, 51, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 48, 48, 48, 49, 55, 52,
			49, 55, 52, 50, 98, 53, 49, 55, 52, 48, 48, 48, 48, 48, 48, 54, 51, 48,
			54, 51, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 50, 98, 53, 50, 98, 53, 50, 98, 53, 50, 98, 53,
			49, 55, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48, 99, 55, 51, 48, 48, 48,
			48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			50, 98, 53, 50, 98, 53, 50, 98, 53, 50, 98, 53, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 99, 55, 51, 48, 48, 48, 48, 48, 48, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 50, 98, 53, 49, 55, 52,
			49, 55, 52, 49, 55, 52, 49, 55, 52, 48, 48, 48, 48, 48, 48, 99, 55, 51,
			99, 55, 51, 48, 48, 48, 48, 48, 48, 52, 54, 54, 52, 54, 54, 52, 54, 54,
			52, 54, 54, 52, 54, 54, 100, 98, 49, 48, 48, 48, 48, 48, 48, 100, 98, 49,
			100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48, 99, 55, 51, 48, 48, 48,
			48, 48, 48, 52, 54, 54, 49, 51, 52, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			100, 98, 49, 100, 98, 49, 100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 52, 54, 54,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 100, 98, 49, 100, 98, 49,
			100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 49, 51, 52, 49, 51, 52, 52, 54, 54, 51, 53, 53, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 55, 52, 49, 55, 52, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 57, 48, 48, 57, 48, 48, 48, 48, 48, 51, 53, 53, 49, 51, 52,
			49, 51, 52, 52, 54, 54, 51, 53, 53, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 57, 48, 48, 100, 53, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52, 52, 54, 54,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 52, 54, 54, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 51, 53, 53, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53, 51, 53, 53, 49, 51, 52,
			49, 51, 52, 52, 54, 54, 49, 51, 52, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
		}

		result, err := ZlibInflate(compressedImage)
		if err != nil {
			t.Fatalf("ZlibInflate failed: %v", err)
		}
		if !bytes.Equal(result, expectedInflatedImage) {
			t.Errorf("Expected %v, but got %v", expectedInflatedImage, result)
		}
	})
}

const IMAGE_COMPRESSED_V2 = "c#"

func TestDetectImageProperties(t *testing.T) {
	tests := []struct {
		name           string
		data           []byte
		tileCodeString string
		wantPixelSize  int
		wantColorDepth int
	}{
		{
			name:           "non-V2 compressed string",
			data:           []byte{},
			tileCodeString: "b#somedata",
			wantPixelSize:  16,
			wantColorDepth: 12,
		},
		{
			name:           "4x4 image with 4-bit color depth",
			data:           make([]byte, 8),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  4,
			wantColorDepth: 4,
		},
		{
			name:           "4x4 image with 8-bit color depth",
			data:           make([]byte, 16),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  4,
			wantColorDepth: 8,
		},
		{
			name:           "4x4 image with 12-bit color depth",
			data:           make([]byte, 48),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  4,
			wantColorDepth: 12,
		},
		{
			name:           "8x8 image with 4-bit color depth",
			data:           make([]byte, 32),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  8,
			wantColorDepth: 4,
		},
		{
			name:           "8x8 image with 8-bit color depth",
			data:           make([]byte, 64),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  8,
			wantColorDepth: 8,
		},
		{
			name:           "8x8 image with 12-bit color depth",
			data:           make([]byte, 192),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  8,
			wantColorDepth: 12,
		},
		{
			name:           "16x16 image with 4-bit color depth",
			data:           make([]byte, 128),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  16,
			wantColorDepth: 4,
		},
		{
			name:           "16x16 image with 8-bit color depth",
			data:           make([]byte, 256),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  16,
			wantColorDepth: 8,
		},
		{
			name:           "16x16 image with 12-bit color depth",
			data:           make([]byte, 768),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  16,
			wantColorDepth: 12,
		},
		{
			name:           "unknown data length",
			data:           make([]byte, 1000),
			tileCodeString: IMAGE_COMPRESSED_V2 + "data",
			wantPixelSize:  16,
			wantColorDepth: 12,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DetectImageProperties(tt.data, tt.tileCodeString)
			if got.PixelSize != tt.wantPixelSize || got.ColorDepth != tt.wantColorDepth {
				t.Errorf("detectImageProperties() = {pixelSize: %d, colorDepth: %d}, want {pixelSize: %d, colorDepth: %d}",
					got.PixelSize, got.ColorDepth, tt.wantPixelSize, tt.wantColorDepth)
			}
		})
	}
}

// // It successfully inflates the image data

func TestInflateCompressedData(t *testing.T) {
	t.Run("should decompress a compressed image string", func(t *testing.T) {
		compressedImage :=
			"c#I@D;=i~W/FHHllD<NjB!e<#8;&ebh)TU|@kRfb(nH7v;D*!T%wAx0z&/~BN3e87=T4rwt=3rGMP3`HWD%n:4YybsE#mk}G8$M/)NHzs:K`q[ax#29/(va@+!)`)bq~Fa#|MPS_5D"
		result, err := DecodeAndInflate(compressedImage)
		if err != nil {
			t.Fatalf("DecodeAndInflate failed: %v", err)
		}
		expected := []byte{
			8, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8,
			8, 215, 8, 215, 8, 8, 8, 8, 8, 180, 180, 8, 8, 8, 8, 216, 216, 8, 215,
			8, 8, 8, 215, 8, 216, 180, 180, 180, 180, 180, 216, 129, 129, 216, 8, 8,
			8, 8, 8, 216, 129, 198, 198, 180, 180, 180, 216, 129, 129, 129, 216, 8,
			8, 8, 216, 129, 129, 198, 198, 198, 198, 198, 216, 129, 129, 129, 129,
			216, 216, 216, 129, 129, 129, 210, 210, 198, 198, 216, 129, 129, 129,
			129, 129, 129, 129, 129, 129, 129, 129, 210, 210, 210, 210, 216, 129,
			129, 129, 215, 216, 129, 129, 129, 129, 215, 216, 66, 66, 210, 210, 216,
			129, 201, 201, 216, 216, 129, 129, 216, 129, 216, 216, 66, 66, 66, 66,
			216, 129, 201, 201, 129, 129, 129, 129, 129, 129, 129, 129, 23, 23, 66,
			66, 66, 216, 129, 129, 129, 216, 129, 129, 216, 129, 216, 129, 23, 23,
			23, 23, 23, 23, 216, 129, 129, 216, 216, 216, 216, 216, 216, 129, 83,
			83, 23, 23, 23, 23, 23, 216, 129, 129, 129, 129, 129, 129, 129, 216, 83,
			83, 83, 83, 83, 83, 83, 216, 216, 216, 216, 216, 216, 216, 216, 8, 8, 8,
			83, 83, 83, 83, 83, 129, 129, 216, 8, 8, 129, 129, 216, 8, 8, 8, 8, 8,
			8, 8, 216, 216, 216, 216, 8, 8, 216, 216, 216, 8,
		}
		if !bytes.Equal(result, expected) {
			t.Errorf("Expected %v, but got %v", expected, result)
		}
	})
}

// Test detectImageProperties
func TestDetectImagePropertiesNyanCat(t *testing.T) {
	t.Run("should return default values for non-V2 compressed strings", func(t *testing.T) {
		result := DetectImageProperties(
			[]byte{
				8, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8,
				8, 215, 8, 215, 8, 8, 8, 8, 8, 180, 180, 8, 8, 8, 8, 216, 216, 8, 215,
				8, 8, 8, 215, 8, 216, 180, 180, 180, 180, 180, 216, 129, 129, 216, 8, 8,
				8, 8, 8, 216, 129, 198, 198, 180, 180, 180, 216, 129, 129, 129, 216, 8,
				8, 8, 216, 129, 129, 198, 198, 198, 198, 198, 216, 129, 129, 129, 129,
				216, 216, 216, 129, 129, 129, 210, 210, 198, 198, 216, 129, 129, 129,
				129, 129, 129, 129, 129, 129, 129, 129, 210, 210, 210, 210, 216, 129,
				129, 129, 215, 216, 129, 129, 129, 129, 215, 216, 66, 66, 210, 210, 216,
				129, 201, 201, 216, 216, 129, 129, 216, 129, 216, 216, 66, 66, 66, 66,
				216, 129, 201, 201, 129, 129, 129, 129, 129, 129, 129, 129, 23, 23, 66,
				66, 66, 216, 129, 129, 129, 216, 129, 129, 216, 129, 216, 129, 23, 23,
				23, 23, 23, 23, 216, 129, 129, 216, 216, 216, 216, 216, 216, 129, 83,
				83, 23, 23, 23, 23, 23, 216, 129, 129, 129, 129, 129, 129, 129, 216, 83,
				83, 83, 83, 83, 83, 83, 216, 216, 216, 216, 216, 216, 216, 216, 8, 8, 8,
				83, 83, 83, 83, 83, 129, 129, 216, 8, 8, 129, 129, 216, 8, 8, 8, 8, 8,
				8, 8, 216, 216, 216, 216, 8, 8, 216, 216, 216, 8,
			},
			"c#I@D;=i~W/FHHllD<NjB!e<#8;&ebh)TU|@kRfb(nH7v;D*!T%wAx0z&/~BN3e87=T4rwt=3rGMP3`HWD%n:4YybsE#mk}G8$M/)NHzs:K`q[ax#29/(va@+!)`)bq~Fa#|MPS_5D",
		)
		if result.PixelSize != 16 || result.ColorDepth != 8 {
			t.Errorf("Expected {pixelSize: 16, colorDepth: 8}, but got %v", result)
		}
	})
}

// Test decodeDataToString
func TestDecodeDataToString(t *testing.T) {
	t.Run("should decode 8-bit data to a string", func(t *testing.T) {
		result := DecodeDataToString(
			[]byte{
				8, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8, 8, 8, 8, 8, 215, 8, 8, 8, 8,
				8, 215, 8, 215, 8, 8, 8, 8, 8, 180, 180, 8, 8, 8, 8, 216, 216, 8, 215,
				8, 8, 8, 215, 8, 216, 180, 180, 180, 180, 180, 216, 129, 129, 216, 8, 8,
				8, 8, 8, 216, 129, 198, 198, 180, 180, 180, 216, 129, 129, 129, 216, 8,
				8, 8, 216, 129, 129, 198, 198, 198, 198, 198, 216, 129, 129, 129, 129,
				216, 216, 216, 129, 129, 129, 210, 210, 198, 198, 216, 129, 129, 129,
				129, 129, 129, 129, 129, 129, 129, 129, 210, 210, 210, 210, 216, 129,
				129, 129, 215, 216, 129, 129, 129, 129, 215, 216, 66, 66, 210, 210, 216,
				129, 201, 201, 216, 216, 129, 129, 216, 129, 216, 216, 66, 66, 66, 66,
				216, 129, 201, 201, 129, 129, 129, 129, 129, 129, 129, 129, 23, 23, 66,
				66, 66, 216, 129, 129, 129, 216, 129, 129, 216, 129, 216, 129, 23, 23,
				23, 23, 23, 23, 216, 129, 129, 216, 216, 216, 216, 216, 216, 129, 83,
				83, 23, 23, 23, 23, 23, 216, 129, 129, 129, 129, 129, 129, 129, 216, 83,
				83, 83, 83, 83, 83, 83, 216, 216, 216, 216, 216, 216, 216, 216, 8, 8, 8,
				83, 83, 83, 83, 83, 129, 129, 216, 8, 8, 129, 129, 216, 8, 8, 8, 8, 8,
				8, 8, 216, 216, 216, 216, 8, 8, 216, 216, 216, 8,
			},
			8,
		)
		expected := "080808080808080808d70808080808080808d70808080808d708d70808080808b4b408080808d8d808d7080808d708d8b4b4b4b4b4d88181d80808080808d881c6c6b4b4b4d8818181d8080808d88181c6c6c6c6c6d881818181d8d8d8818181d2d2c6c6d88181818181818181818181d2d2d2d2d8818181d7d881818181d7d84242d2d2d881c9c9d8d88181d881d8d842424242d881c9c981818181818181811717424242d8818181d88181d881d881171717171717d88181d8d8d8d8d8d88153531717171717d881818181818181d853535353535353d8d8d8d8d8d8d8d808080853535353538181d808088181d808080808080808d8d8d8d80808d8d8d808"
		if result != expected {
			t.Errorf("Expected %v, but got %v", expected, result)
		}
	})
}

// Test expandColorEncoding
func TestExpandColorEncoding(t *testing.T) {
	t.Run("should expand 8-bit data to a string", func(t *testing.T) {
		decodedString :=
			"080808080808080808d70808080808080808d70808080808d708d70808080808b4b408080808d8d808d7080808d708d8b4b4b4b4b4d88181d80808080808d881c6c6b4b4b4d8818181d8080808d88181c6c6c6c6c6d881818181d8d8d8818181d2d2c6c6d88181818181818181818181d2d2d2d2d8818181d7d881818181d7d84242d2d2d881c9c9d8d88181d881d8d842424242d881c9c981818181818181811717424242d8818181d88181d881d881171717171717d88181d8d8d8d8d8d88153531717171717d881818181818181d853535353535353d8d8d8d8d8d8d8d808080853535353538181d808088181d808080808080808d8d8d8d80808d8d8d808"
		result := ExpandColorEncoding(decodedString, 8)
		expected := "036036036036036036036036036fff036036036036036036036036fff036036036036036fff036fff036036036036036f00f00036036036036111111036fff036036036fff036111f00f00f00f00f00111999999111036036036036036111999f90f90f00f00f00111999999999111036036036111999999f90f90f90f90f90111999999999999111111111999999999ff0ff0f90f90111999999999999999999999999999999999ff0ff0ff0ff0111999999999fff111999999999999fff1113f03f0ff0ff0111999f99f991111119999991119991111113f03f03f03f0111999f99f9999999999999999999999999909f09f3f03f03f011199999999911199999911199911199909f09f09f09f09f09f11199999911111111111111111199963f63f09f09f09f09f09f11199999999999999999999911163f63f63f63f63f63f63f11111111111111111111111103603603663f63f63f63f63f999999111036036999999111036036036036036036036111111111111036036111111111036"
		if result != expected {
			t.Errorf("Expected %v, Received %v", expected, result)
		}
	})
}
