package utils

import (
	"crypto/sha256"
	"fmt"
)

// Hash the transaction identity to keep untrusted values out of filesystem paths.
func HistoryImagePath(tileID int32, block int64, transaction string) string {
	if transaction == "" {
		return fmt.Sprintf("/%d/%d.png", tileID, block)
	}
	return fmt.Sprintf("/%d/%d-%x.png", tileID, block, sha256.Sum256([]byte(transaction)))
}
