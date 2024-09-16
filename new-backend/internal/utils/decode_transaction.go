package utils

import (
	"errors"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"pixelmap.io/backend/internal/contracts" // Import the generated contracts
	"pixelmap.io/backend/internal/db"
)

type TransactionType int

const (
	SetTile TransactionType = iota
	BuyTile
	Wrap
	Unwrap
	Transfer
	CreateContract
	GetTile
	NotImportant
)

type DecodedPixelMapTransaction struct {
	Location    int
	Type        TransactionType
	Price       float64
	From        string
	To          string
	Image       string
	URL         string
	Timestamp   time.Time
	TxHash      string
	BlockNumber int64
	LogIndex    int64
}

func DecodeTransaction(pixelMap *contracts.PixelMap, pixelMapWrapper *contracts.PixelMapWrapper, transaction *db.PixelMapTransaction) (*DecodedPixelMapTransaction, error) {
	// Contract Creation Event
	if transaction.Hash == "0x79e41799591e99ffb0aad02d270ac92328e441d0d6a0e49fd6cb9948efb40656" ||
		transaction.Hash == "0x7982bdc73900590ee3d1239341c6390eebcc2ee2b39041d382ee7762ce7586db" {
		return &DecodedPixelMapTransaction{
			Type:        CreateContract,
			BlockNumber: transaction.BlockNumber,
		}, nil
	}

	// Determine if the transaction is on PixelMap or PixelMapWrapper, then decode accordingly
	var method string
	if transaction.To == "0x015a06a433353f8db634df4eddf0c109882a15ab" {
		// Decode as PixelMap transaction
		method = DetermineCallType(transaction.Input)

	} else if transaction.To == "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b" {
		// Decode as PixelMapWrapper transaction
	} else {
		return nil, fmt.Errorf("unknown transaction type: %s", transaction.To)
	}

	decoded := &DecodedPixelMapTransaction{
		Timestamp:   transaction.TimeStamp,
		TxHash:      transaction.Hash,
		BlockNumber: transaction.BlockNumber,
		LogIndex:    int64(transaction.TransactionIndex),
	}

	switch method {
	case "buyTile":
		decoded.Type = BuyTile
		decoded.Location, _ = strconv.Atoi(method.Params["_location"].(string))
		decoded.Price = ethToFloat(new(big.Int).SetBytes([]byte(transaction.Value)))
		decoded.From = common.HexToAddress(transaction.From).Hex()
		// You might need to implement a way to get the current owner
		// decoded.To = getCurrentOwner(pixelMap, pixelMapWrapper, transaction, decoded.Location)

	case "setTile":
		decoded.Type = SetTile
		decoded.Location, _ = strconv.Atoi(method.Params["_location"].(string))
		decoded.Price = ethToFloat(new(big.Int).SetBytes([]byte(transaction.Value)))
		decoded.Image = method.Params["_image"].(string)
		decoded.URL = method.Params["_url"].(string)
		decoded.From = common.HexToAddress(transaction.From).Hex()

	// ... handle other cases similarly ...

	default:
		return nil, fmt.Errorf("unknown transaction type: %s", method.Name)
	}

	return decoded, nil
}

func ethToFloat(wei *big.Int) float64 {
	fwei := new(big.Float).SetInt(wei)
	eth := new(big.Float).Quo(fwei, big.NewFloat(1e18))
	result, _ := eth.Float64()
	return result
}

// Assume these functions are implemented elsewhere in the package
// func getTransactionDescription(pixelMap, pixelMapWrapper *bind.BoundContract, transaction *db.PixelMapTransaction) (*TransactionDescription, error)
// func getCurrentOwner(pixelMap, pixelMapWrapper *bind.BoundContract, transaction *db.PixelMapTransaction, tileLocation int) (string, error)

type TransactionDescription struct {
	Name string
	Args map[string]interface{}
}

func DetermineCallType(input string) string {

	// Extract the function selector (first 4 bytes, or 8 characters after '0x')
	functionSelector := input[2:10]

	switch functionSelector {
	case "329ce29e":
		return "buyTile"
	case "678d9758":
		return "setTile"
	case "a97cc114":
		return "getTile"
	case "2fd2e742":
		return "tiles"
	default:
		return "unknown"
	}
}
