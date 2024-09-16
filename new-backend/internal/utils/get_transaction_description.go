package utils

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
)

func GetTransactionDescription(
	pixelMap *bind.BoundContract,
	pixelMapWrapper *bind.BoundContract,
	transaction *PixelMapTransaction,
) (*TransactionDescription, error) {
	var contractABI *abi.ABI
	var err error

	// Compare addresses case-insensitively
	if strings.EqualFold(transaction.ContractAddress, pixelMap.Address().Hex()) {
		contractABI, err = pixelMap.ParseABI()
	} else if strings.EqualFold(transaction.ContractAddress, pixelMapWrapper.Address().Hex()) {
		contractABI, err = pixelMapWrapper.ParseABI()
	} else {
		return nil, fmt.Errorf("unable to get transaction description: wrong contract address")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	method, err := contractABI.MethodById(transaction.Input[:4])
	if err != nil {
		return nil, fmt.Errorf("failed to get method from ABI: %w", err)
	}

	args, err := method.Inputs.Unpack(transaction.Input[4:])
	if err != nil {
		return nil, fmt.Errorf("failed to unpack input data: %w", err)
	}

	// Create a map of argument names to their values
	argsMap := make(map[string]interface{})
	for i, arg := range args {
		argsMap[method.Inputs[i].Name] = arg
	}

	return &TransactionDescription{
		Name: method.Name,
		Args: argsMap,
	}, nil
}

// PixelMapTransaction represents the structure of a transaction
type PixelMapTransaction struct {
	ContractAddress string
	Input           []byte
	Value           *big.Int
	// Add other fields as needed
}
