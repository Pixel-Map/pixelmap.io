package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGet4bitColor(t *testing.T) {
	testCases := []struct {
		index    uint
		expected [3]byte
	}{
		{0, [3]byte{0, 0, 0}},        // Black
		{7, [3]byte{255, 241, 232}},  // Almost white
		{8, [3]byte{255, 0, 77}},     // Bright red
		{15, [3]byte{255, 204, 170}}, // Peach
	}

	for _, tc := range testCases {
		t.Run(string(rune(tc.index+'0')), func(t *testing.T) {
			result := Get4bitColor(tc.index)
			assert.Equal(t, tc.expected, result)
		})
	}

	// Test out of bounds index defaults to the first color
	if len(Colors4bit) > 0 {
		outOfBoundsResult := Get4bitColor(uint(len(Colors4bit) + 10))
		assert.Equal(t, Colors4bit[0], outOfBoundsResult)
	}
}

func TestGet8bitColor(t *testing.T) {
	// Test with direct values from the Colors8bit array
	result0 := Get8bitColor(0)
	assert.Equal(t, [3]byte{0, 0, 0}, result0, "Color at index 0 should be black")
	
	// Test index bounds check
	result1000 := Get8bitColor(1000)
	assert.Equal(t, [3]byte{0, 0, 0}, result1000, "Out of bounds index should return the first color")
	
	// Test a few more valid indices
	if len(Colors8bit) > 30 {
		result30 := Get8bitColor(30)
		assert.Equal(t, Colors8bit[30], result30)
	}
	
	if len(Colors8bit) > 100 {
		result100 := Get8bitColor(100)
		assert.Equal(t, Colors8bit[100], result100)
	}
}