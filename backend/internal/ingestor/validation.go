package ingestor

import (
	"fmt"
	"math"
	"math/big"
)

// Reject malformed or overflowing fields before any database writes or Int64 calls.
func validateTransactionNumbers(tx *EtherscanTransaction) error {
	if tx == nil {
		return fmt.Errorf("missing transaction")
	}
	for _, field := range []struct{ name, value string }{
		{"blockNumber", tx.BlockNumber}, {"timeStamp", tx.TimeStamp}, {"nonce", tx.Nonce},
		{"gas", tx.Gas}, {"gasPrice", tx.GasPrice}, {"cumulativeGasUsed", tx.CumulativeGasUsed},
		{"gasUsed", tx.GasUsed}, {"confirmations", tx.Confirmations}, {"value", tx.Value},
	} {
		n, ok := new(big.Int).SetString(field.value, 10)
		if !ok || n.Sign() < 0 || (field.name != "value" && !n.IsInt64()) || (field.name == "value" && n.BitLen() > 256) {
			return fmt.Errorf("invalid transaction %s", field.name)
		}
	}
	index, err := chainIndex(tx.TransactionIndex)
	if tx.TransactionIndex == "" || err != nil || index > math.MaxInt32 {
		return fmt.Errorf("invalid transaction transactionIndex")
	}
	return nil
}
