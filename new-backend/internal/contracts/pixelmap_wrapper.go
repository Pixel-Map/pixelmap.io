// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contracts

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// PixelMapWrapperMetaData contains all meta data concerning the PixelMapWrapper contract.
var PixelMapWrapperMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"stateMutability\":\"payable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"approved\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"ApprovalForAll\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"}],\"name\":\"Unwrapped\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"}],\"name\":\"Wrapped\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"_baseContractURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"_baseTokenURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"_pixelmap\",\"outputs\":[{\"internalType\":\"contractPixelMap\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"_pixelmapAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"contractURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"getApproved\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"}],\"name\":\"getwithdrawableETHforLocation\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"isApprovedForAll\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"ownerOf\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"pendingLocationSales\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"seller\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"_data\",\"type\":\"bytes\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"setApprovalForAll\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"__baseTokenURI\",\"type\":\"string\"}],\"name\":\"setBaseTokenURI\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"__baseContractURI\",\"type\":\"string\"}],\"name\":\"setBasecontractURI\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_image\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_url\",\"type\":\"string\"}],\"name\":\"setTileData\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"extension\",\"type\":\"string\"}],\"name\":\"setTokenExtension\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes4\",\"name\":\"interfaceId\",\"type\":\"bytes4\"}],\"name\":\"supportsInterface\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_tokenId\",\"type\":\"uint256\"}],\"name\":\"tokenURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_salePrice\",\"type\":\"uint256\"}],\"name\":\"unwrap\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"}],\"name\":\"withdrawETH\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_locationID\",\"type\":\"uint256\"}],\"name\":\"wrap\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"stateMutability\":\"payable\",\"type\":\"receive\"}]",
}

// PixelMapWrapperABI is the input ABI used to generate the binding from.
// Deprecated: Use PixelMapWrapperMetaData.ABI instead.
var PixelMapWrapperABI = PixelMapWrapperMetaData.ABI

// PixelMapWrapper is an auto generated Go binding around an Ethereum contract.
type PixelMapWrapper struct {
	PixelMapWrapperCaller     // Read-only binding to the contract
	PixelMapWrapperTransactor // Write-only binding to the contract
	PixelMapWrapperFilterer   // Log filterer for contract events
}

// PixelMapWrapperCaller is an auto generated read-only Go binding around an Ethereum contract.
type PixelMapWrapperCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapWrapperTransactor is an auto generated write-only Go binding around an Ethereum contract.
type PixelMapWrapperTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapWrapperFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type PixelMapWrapperFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapWrapperSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type PixelMapWrapperSession struct {
	Contract     *PixelMapWrapper  // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// PixelMapWrapperCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type PixelMapWrapperCallerSession struct {
	Contract *PixelMapWrapperCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts          // Call options to use throughout this session
}

// PixelMapWrapperTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type PixelMapWrapperTransactorSession struct {
	Contract     *PixelMapWrapperTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts          // Transaction auth options to use throughout this session
}

// PixelMapWrapperRaw is an auto generated low-level Go binding around an Ethereum contract.
type PixelMapWrapperRaw struct {
	Contract *PixelMapWrapper // Generic contract binding to access the raw methods on
}

// PixelMapWrapperCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type PixelMapWrapperCallerRaw struct {
	Contract *PixelMapWrapperCaller // Generic read-only contract binding to access the raw methods on
}

// PixelMapWrapperTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type PixelMapWrapperTransactorRaw struct {
	Contract *PixelMapWrapperTransactor // Generic write-only contract binding to access the raw methods on
}

// NewPixelMapWrapper creates a new instance of PixelMapWrapper, bound to a specific deployed contract.
func NewPixelMapWrapper(address common.Address, backend bind.ContractBackend) (*PixelMapWrapper, error) {
	contract, err := bindPixelMapWrapper(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapper{PixelMapWrapperCaller: PixelMapWrapperCaller{contract: contract}, PixelMapWrapperTransactor: PixelMapWrapperTransactor{contract: contract}, PixelMapWrapperFilterer: PixelMapWrapperFilterer{contract: contract}}, nil
}

// NewPixelMapWrapperCaller creates a new read-only instance of PixelMapWrapper, bound to a specific deployed contract.
func NewPixelMapWrapperCaller(address common.Address, caller bind.ContractCaller) (*PixelMapWrapperCaller, error) {
	contract, err := bindPixelMapWrapper(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperCaller{contract: contract}, nil
}

// NewPixelMapWrapperTransactor creates a new write-only instance of PixelMapWrapper, bound to a specific deployed contract.
func NewPixelMapWrapperTransactor(address common.Address, transactor bind.ContractTransactor) (*PixelMapWrapperTransactor, error) {
	contract, err := bindPixelMapWrapper(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperTransactor{contract: contract}, nil
}

// NewPixelMapWrapperFilterer creates a new log filterer instance of PixelMapWrapper, bound to a specific deployed contract.
func NewPixelMapWrapperFilterer(address common.Address, filterer bind.ContractFilterer) (*PixelMapWrapperFilterer, error) {
	contract, err := bindPixelMapWrapper(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperFilterer{contract: contract}, nil
}

// bindPixelMapWrapper binds a generic wrapper to an already deployed contract.
func bindPixelMapWrapper(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := PixelMapWrapperMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PixelMapWrapper *PixelMapWrapperRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _PixelMapWrapper.Contract.PixelMapWrapperCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PixelMapWrapper *PixelMapWrapperRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.PixelMapWrapperTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PixelMapWrapper *PixelMapWrapperRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.PixelMapWrapperTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PixelMapWrapper *PixelMapWrapperCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _PixelMapWrapper.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PixelMapWrapper *PixelMapWrapperTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PixelMapWrapper *PixelMapWrapperTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.contract.Transact(opts, method, params...)
}

// BaseContractURI is a free data retrieval call binding the contract method 0xa515caaa.
//
// Solidity: function _baseContractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) BaseContractURI(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "_baseContractURI")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// BaseContractURI is a free data retrieval call binding the contract method 0xa515caaa.
//
// Solidity: function _baseContractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) BaseContractURI() (string, error) {
	return _PixelMapWrapper.Contract.BaseContractURI(&_PixelMapWrapper.CallOpts)
}

// BaseContractURI is a free data retrieval call binding the contract method 0xa515caaa.
//
// Solidity: function _baseContractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) BaseContractURI() (string, error) {
	return _PixelMapWrapper.Contract.BaseContractURI(&_PixelMapWrapper.CallOpts)
}

// BaseTokenURI is a free data retrieval call binding the contract method 0xcfc86f7b.
//
// Solidity: function _baseTokenURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) BaseTokenURI(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "_baseTokenURI")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// BaseTokenURI is a free data retrieval call binding the contract method 0xcfc86f7b.
//
// Solidity: function _baseTokenURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) BaseTokenURI() (string, error) {
	return _PixelMapWrapper.Contract.BaseTokenURI(&_PixelMapWrapper.CallOpts)
}

// BaseTokenURI is a free data retrieval call binding the contract method 0xcfc86f7b.
//
// Solidity: function _baseTokenURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) BaseTokenURI() (string, error) {
	return _PixelMapWrapper.Contract.BaseTokenURI(&_PixelMapWrapper.CallOpts)
}

// Pixelmap is a free data retrieval call binding the contract method 0xd04877fa.
//
// Solidity: function _pixelmap() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCaller) Pixelmap(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "_pixelmap")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Pixelmap is a free data retrieval call binding the contract method 0xd04877fa.
//
// Solidity: function _pixelmap() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperSession) Pixelmap() (common.Address, error) {
	return _PixelMapWrapper.Contract.Pixelmap(&_PixelMapWrapper.CallOpts)
}

// Pixelmap is a free data retrieval call binding the contract method 0xd04877fa.
//
// Solidity: function _pixelmap() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) Pixelmap() (common.Address, error) {
	return _PixelMapWrapper.Contract.Pixelmap(&_PixelMapWrapper.CallOpts)
}

// PixelmapAddress is a free data retrieval call binding the contract method 0x5f3d784d.
//
// Solidity: function _pixelmapAddress() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCaller) PixelmapAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "_pixelmapAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// PixelmapAddress is a free data retrieval call binding the contract method 0x5f3d784d.
//
// Solidity: function _pixelmapAddress() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperSession) PixelmapAddress() (common.Address, error) {
	return _PixelMapWrapper.Contract.PixelmapAddress(&_PixelMapWrapper.CallOpts)
}

// PixelmapAddress is a free data retrieval call binding the contract method 0x5f3d784d.
//
// Solidity: function _pixelmapAddress() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) PixelmapAddress() (common.Address, error) {
	return _PixelMapWrapper.Contract.PixelmapAddress(&_PixelMapWrapper.CallOpts)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address owner) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperCaller) BalanceOf(opts *bind.CallOpts, owner common.Address) (*big.Int, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "balanceOf", owner)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address owner) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperSession) BalanceOf(owner common.Address) (*big.Int, error) {
	return _PixelMapWrapper.Contract.BalanceOf(&_PixelMapWrapper.CallOpts, owner)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address owner) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) BalanceOf(owner common.Address) (*big.Int, error) {
	return _PixelMapWrapper.Contract.BalanceOf(&_PixelMapWrapper.CallOpts, owner)
}

// ContractURI is a free data retrieval call binding the contract method 0xe8a3d485.
//
// Solidity: function contractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) ContractURI(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "contractURI")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// ContractURI is a free data retrieval call binding the contract method 0xe8a3d485.
//
// Solidity: function contractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) ContractURI() (string, error) {
	return _PixelMapWrapper.Contract.ContractURI(&_PixelMapWrapper.CallOpts)
}

// ContractURI is a free data retrieval call binding the contract method 0xe8a3d485.
//
// Solidity: function contractURI() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) ContractURI() (string, error) {
	return _PixelMapWrapper.Contract.ContractURI(&_PixelMapWrapper.CallOpts)
}

// GetApproved is a free data retrieval call binding the contract method 0x081812fc.
//
// Solidity: function getApproved(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCaller) GetApproved(opts *bind.CallOpts, tokenId *big.Int) (common.Address, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "getApproved", tokenId)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetApproved is a free data retrieval call binding the contract method 0x081812fc.
//
// Solidity: function getApproved(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperSession) GetApproved(tokenId *big.Int) (common.Address, error) {
	return _PixelMapWrapper.Contract.GetApproved(&_PixelMapWrapper.CallOpts, tokenId)
}

// GetApproved is a free data retrieval call binding the contract method 0x081812fc.
//
// Solidity: function getApproved(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) GetApproved(tokenId *big.Int) (common.Address, error) {
	return _PixelMapWrapper.Contract.GetApproved(&_PixelMapWrapper.CallOpts, tokenId)
}

// GetwithdrawableETHforLocation is a free data retrieval call binding the contract method 0x268b1930.
//
// Solidity: function getwithdrawableETHforLocation(uint256 _locationID) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperCaller) GetwithdrawableETHforLocation(opts *bind.CallOpts, _locationID *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "getwithdrawableETHforLocation", _locationID)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetwithdrawableETHforLocation is a free data retrieval call binding the contract method 0x268b1930.
//
// Solidity: function getwithdrawableETHforLocation(uint256 _locationID) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperSession) GetwithdrawableETHforLocation(_locationID *big.Int) (*big.Int, error) {
	return _PixelMapWrapper.Contract.GetwithdrawableETHforLocation(&_PixelMapWrapper.CallOpts, _locationID)
}

// GetwithdrawableETHforLocation is a free data retrieval call binding the contract method 0x268b1930.
//
// Solidity: function getwithdrawableETHforLocation(uint256 _locationID) view returns(uint256)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) GetwithdrawableETHforLocation(_locationID *big.Int) (*big.Int, error) {
	return _PixelMapWrapper.Contract.GetwithdrawableETHforLocation(&_PixelMapWrapper.CallOpts, _locationID)
}

// IsApprovedForAll is a free data retrieval call binding the contract method 0xe985e9c5.
//
// Solidity: function isApprovedForAll(address owner, address operator) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperCaller) IsApprovedForAll(opts *bind.CallOpts, owner common.Address, operator common.Address) (bool, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "isApprovedForAll", owner, operator)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsApprovedForAll is a free data retrieval call binding the contract method 0xe985e9c5.
//
// Solidity: function isApprovedForAll(address owner, address operator) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperSession) IsApprovedForAll(owner common.Address, operator common.Address) (bool, error) {
	return _PixelMapWrapper.Contract.IsApprovedForAll(&_PixelMapWrapper.CallOpts, owner, operator)
}

// IsApprovedForAll is a free data retrieval call binding the contract method 0xe985e9c5.
//
// Solidity: function isApprovedForAll(address owner, address operator) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) IsApprovedForAll(owner common.Address, operator common.Address) (bool, error) {
	return _PixelMapWrapper.Contract.IsApprovedForAll(&_PixelMapWrapper.CallOpts, owner, operator)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) Name(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "name")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) Name() (string, error) {
	return _PixelMapWrapper.Contract.Name(&_PixelMapWrapper.CallOpts)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) Name() (string, error) {
	return _PixelMapWrapper.Contract.Name(&_PixelMapWrapper.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperSession) Owner() (common.Address, error) {
	return _PixelMapWrapper.Contract.Owner(&_PixelMapWrapper.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) Owner() (common.Address, error) {
	return _PixelMapWrapper.Contract.Owner(&_PixelMapWrapper.CallOpts)
}

// OwnerOf is a free data retrieval call binding the contract method 0x6352211e.
//
// Solidity: function ownerOf(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCaller) OwnerOf(opts *bind.CallOpts, tokenId *big.Int) (common.Address, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "ownerOf", tokenId)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// OwnerOf is a free data retrieval call binding the contract method 0x6352211e.
//
// Solidity: function ownerOf(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperSession) OwnerOf(tokenId *big.Int) (common.Address, error) {
	return _PixelMapWrapper.Contract.OwnerOf(&_PixelMapWrapper.CallOpts, tokenId)
}

// OwnerOf is a free data retrieval call binding the contract method 0x6352211e.
//
// Solidity: function ownerOf(uint256 tokenId) view returns(address)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) OwnerOf(tokenId *big.Int) (common.Address, error) {
	return _PixelMapWrapper.Contract.OwnerOf(&_PixelMapWrapper.CallOpts, tokenId)
}

// PendingLocationSales is a free data retrieval call binding the contract method 0x5c242f95.
//
// Solidity: function pendingLocationSales(uint256 ) view returns(address seller, uint256 amount)
func (_PixelMapWrapper *PixelMapWrapperCaller) PendingLocationSales(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Seller common.Address
	Amount *big.Int
}, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "pendingLocationSales", arg0)

	outstruct := new(struct {
		Seller common.Address
		Amount *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Seller = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Amount = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// PendingLocationSales is a free data retrieval call binding the contract method 0x5c242f95.
//
// Solidity: function pendingLocationSales(uint256 ) view returns(address seller, uint256 amount)
func (_PixelMapWrapper *PixelMapWrapperSession) PendingLocationSales(arg0 *big.Int) (struct {
	Seller common.Address
	Amount *big.Int
}, error) {
	return _PixelMapWrapper.Contract.PendingLocationSales(&_PixelMapWrapper.CallOpts, arg0)
}

// PendingLocationSales is a free data retrieval call binding the contract method 0x5c242f95.
//
// Solidity: function pendingLocationSales(uint256 ) view returns(address seller, uint256 amount)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) PendingLocationSales(arg0 *big.Int) (struct {
	Seller common.Address
	Amount *big.Int
}, error) {
	return _PixelMapWrapper.Contract.PendingLocationSales(&_PixelMapWrapper.CallOpts, arg0)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperCaller) SupportsInterface(opts *bind.CallOpts, interfaceId [4]byte) (bool, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "supportsInterface", interfaceId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _PixelMapWrapper.Contract.SupportsInterface(&_PixelMapWrapper.CallOpts, interfaceId)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _PixelMapWrapper.Contract.SupportsInterface(&_PixelMapWrapper.CallOpts, interfaceId)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) Symbol(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "symbol")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) Symbol() (string, error) {
	return _PixelMapWrapper.Contract.Symbol(&_PixelMapWrapper.CallOpts)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) Symbol() (string, error) {
	return _PixelMapWrapper.Contract.Symbol(&_PixelMapWrapper.CallOpts)
}

// TokenURI is a free data retrieval call binding the contract method 0xc87b56dd.
//
// Solidity: function tokenURI(uint256 _tokenId) view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCaller) TokenURI(opts *bind.CallOpts, _tokenId *big.Int) (string, error) {
	var out []interface{}
	err := _PixelMapWrapper.contract.Call(opts, &out, "tokenURI", _tokenId)

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// TokenURI is a free data retrieval call binding the contract method 0xc87b56dd.
//
// Solidity: function tokenURI(uint256 _tokenId) view returns(string)
func (_PixelMapWrapper *PixelMapWrapperSession) TokenURI(_tokenId *big.Int) (string, error) {
	return _PixelMapWrapper.Contract.TokenURI(&_PixelMapWrapper.CallOpts, _tokenId)
}

// TokenURI is a free data retrieval call binding the contract method 0xc87b56dd.
//
// Solidity: function tokenURI(uint256 _tokenId) view returns(string)
func (_PixelMapWrapper *PixelMapWrapperCallerSession) TokenURI(_tokenId *big.Int) (string, error) {
	return _PixelMapWrapper.Contract.TokenURI(&_PixelMapWrapper.CallOpts, _tokenId)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) Approve(opts *bind.TransactOpts, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "approve", to, tokenId)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) Approve(to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Approve(&_PixelMapWrapper.TransactOpts, to, tokenId)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) Approve(to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Approve(&_PixelMapWrapper.TransactOpts, to, tokenId)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_PixelMapWrapper *PixelMapWrapperSession) RenounceOwnership() (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.RenounceOwnership(&_PixelMapWrapper.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.RenounceOwnership(&_PixelMapWrapper.TransactOpts)
}

// SafeTransferFrom is a paid mutator transaction binding the contract method 0x42842e0e.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SafeTransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "safeTransferFrom", from, to, tokenId)
}

// SafeTransferFrom is a paid mutator transaction binding the contract method 0x42842e0e.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SafeTransferFrom(from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SafeTransferFrom(&_PixelMapWrapper.TransactOpts, from, to, tokenId)
}

// SafeTransferFrom is a paid mutator transaction binding the contract method 0x42842e0e.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SafeTransferFrom(from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SafeTransferFrom(&_PixelMapWrapper.TransactOpts, from, to, tokenId)
}

// SafeTransferFrom0 is a paid mutator transaction binding the contract method 0xb88d4fde.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SafeTransferFrom0(opts *bind.TransactOpts, from common.Address, to common.Address, tokenId *big.Int, _data []byte) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "safeTransferFrom0", from, to, tokenId, _data)
}

// SafeTransferFrom0 is a paid mutator transaction binding the contract method 0xb88d4fde.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SafeTransferFrom0(from common.Address, to common.Address, tokenId *big.Int, _data []byte) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SafeTransferFrom0(&_PixelMapWrapper.TransactOpts, from, to, tokenId, _data)
}

// SafeTransferFrom0 is a paid mutator transaction binding the contract method 0xb88d4fde.
//
// Solidity: function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SafeTransferFrom0(from common.Address, to common.Address, tokenId *big.Int, _data []byte) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SafeTransferFrom0(&_PixelMapWrapper.TransactOpts, from, to, tokenId, _data)
}

// SetApprovalForAll is a paid mutator transaction binding the contract method 0xa22cb465.
//
// Solidity: function setApprovalForAll(address operator, bool approved) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SetApprovalForAll(opts *bind.TransactOpts, operator common.Address, approved bool) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "setApprovalForAll", operator, approved)
}

// SetApprovalForAll is a paid mutator transaction binding the contract method 0xa22cb465.
//
// Solidity: function setApprovalForAll(address operator, bool approved) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SetApprovalForAll(operator common.Address, approved bool) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetApprovalForAll(&_PixelMapWrapper.TransactOpts, operator, approved)
}

// SetApprovalForAll is a paid mutator transaction binding the contract method 0xa22cb465.
//
// Solidity: function setApprovalForAll(address operator, bool approved) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SetApprovalForAll(operator common.Address, approved bool) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetApprovalForAll(&_PixelMapWrapper.TransactOpts, operator, approved)
}

// SetBaseTokenURI is a paid mutator transaction binding the contract method 0x30176e13.
//
// Solidity: function setBaseTokenURI(string __baseTokenURI) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SetBaseTokenURI(opts *bind.TransactOpts, __baseTokenURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "setBaseTokenURI", __baseTokenURI)
}

// SetBaseTokenURI is a paid mutator transaction binding the contract method 0x30176e13.
//
// Solidity: function setBaseTokenURI(string __baseTokenURI) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SetBaseTokenURI(__baseTokenURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetBaseTokenURI(&_PixelMapWrapper.TransactOpts, __baseTokenURI)
}

// SetBaseTokenURI is a paid mutator transaction binding the contract method 0x30176e13.
//
// Solidity: function setBaseTokenURI(string __baseTokenURI) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SetBaseTokenURI(__baseTokenURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetBaseTokenURI(&_PixelMapWrapper.TransactOpts, __baseTokenURI)
}

// SetBasecontractURI is a paid mutator transaction binding the contract method 0x15ae0738.
//
// Solidity: function setBasecontractURI(string __baseContractURI) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SetBasecontractURI(opts *bind.TransactOpts, __baseContractURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "setBasecontractURI", __baseContractURI)
}

// SetBasecontractURI is a paid mutator transaction binding the contract method 0x15ae0738.
//
// Solidity: function setBasecontractURI(string __baseContractURI) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SetBasecontractURI(__baseContractURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetBasecontractURI(&_PixelMapWrapper.TransactOpts, __baseContractURI)
}

// SetBasecontractURI is a paid mutator transaction binding the contract method 0x15ae0738.
//
// Solidity: function setBasecontractURI(string __baseContractURI) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SetBasecontractURI(__baseContractURI string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetBasecontractURI(&_PixelMapWrapper.TransactOpts, __baseContractURI)
}

// SetTileData is a paid mutator transaction binding the contract method 0x345dadeb.
//
// Solidity: function setTileData(uint256 _locationID, string _image, string _url) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SetTileData(opts *bind.TransactOpts, _locationID *big.Int, _image string, _url string) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "setTileData", _locationID, _image, _url)
}

// SetTileData is a paid mutator transaction binding the contract method 0x345dadeb.
//
// Solidity: function setTileData(uint256 _locationID, string _image, string _url) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SetTileData(_locationID *big.Int, _image string, _url string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetTileData(&_PixelMapWrapper.TransactOpts, _locationID, _image, _url)
}

// SetTileData is a paid mutator transaction binding the contract method 0x345dadeb.
//
// Solidity: function setTileData(uint256 _locationID, string _image, string _url) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SetTileData(_locationID *big.Int, _image string, _url string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetTileData(&_PixelMapWrapper.TransactOpts, _locationID, _image, _url)
}

// SetTokenExtension is a paid mutator transaction binding the contract method 0x147c0718.
//
// Solidity: function setTokenExtension(string extension) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) SetTokenExtension(opts *bind.TransactOpts, extension string) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "setTokenExtension", extension)
}

// SetTokenExtension is a paid mutator transaction binding the contract method 0x147c0718.
//
// Solidity: function setTokenExtension(string extension) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) SetTokenExtension(extension string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetTokenExtension(&_PixelMapWrapper.TransactOpts, extension)
}

// SetTokenExtension is a paid mutator transaction binding the contract method 0x147c0718.
//
// Solidity: function setTokenExtension(string extension) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) SetTokenExtension(extension string) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.SetTokenExtension(&_PixelMapWrapper.TransactOpts, extension)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) TransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "transferFrom", from, to, tokenId)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) TransferFrom(from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.TransferFrom(&_PixelMapWrapper.TransactOpts, from, to, tokenId)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 tokenId) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) TransferFrom(from common.Address, to common.Address, tokenId *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.TransferFrom(&_PixelMapWrapper.TransactOpts, from, to, tokenId)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.TransferOwnership(&_PixelMapWrapper.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.TransferOwnership(&_PixelMapWrapper.TransactOpts, newOwner)
}

// Unwrap is a paid mutator transaction binding the contract method 0x6e286671.
//
// Solidity: function unwrap(uint256 _locationID, uint256 _salePrice) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) Unwrap(opts *bind.TransactOpts, _locationID *big.Int, _salePrice *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "unwrap", _locationID, _salePrice)
}

// Unwrap is a paid mutator transaction binding the contract method 0x6e286671.
//
// Solidity: function unwrap(uint256 _locationID, uint256 _salePrice) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) Unwrap(_locationID *big.Int, _salePrice *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Unwrap(&_PixelMapWrapper.TransactOpts, _locationID, _salePrice)
}

// Unwrap is a paid mutator transaction binding the contract method 0x6e286671.
//
// Solidity: function unwrap(uint256 _locationID, uint256 _salePrice) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) Unwrap(_locationID *big.Int, _salePrice *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Unwrap(&_PixelMapWrapper.TransactOpts, _locationID, _salePrice)
}

// WithdrawETH is a paid mutator transaction binding the contract method 0xf14210a6.
//
// Solidity: function withdrawETH(uint256 _locationID) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) WithdrawETH(opts *bind.TransactOpts, _locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "withdrawETH", _locationID)
}

// WithdrawETH is a paid mutator transaction binding the contract method 0xf14210a6.
//
// Solidity: function withdrawETH(uint256 _locationID) returns()
func (_PixelMapWrapper *PixelMapWrapperSession) WithdrawETH(_locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.WithdrawETH(&_PixelMapWrapper.TransactOpts, _locationID)
}

// WithdrawETH is a paid mutator transaction binding the contract method 0xf14210a6.
//
// Solidity: function withdrawETH(uint256 _locationID) returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) WithdrawETH(_locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.WithdrawETH(&_PixelMapWrapper.TransactOpts, _locationID)
}

// Wrap is a paid mutator transaction binding the contract method 0xea598cb0.
//
// Solidity: function wrap(uint256 _locationID) payable returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) Wrap(opts *bind.TransactOpts, _locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.Transact(opts, "wrap", _locationID)
}

// Wrap is a paid mutator transaction binding the contract method 0xea598cb0.
//
// Solidity: function wrap(uint256 _locationID) payable returns()
func (_PixelMapWrapper *PixelMapWrapperSession) Wrap(_locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Wrap(&_PixelMapWrapper.TransactOpts, _locationID)
}

// Wrap is a paid mutator transaction binding the contract method 0xea598cb0.
//
// Solidity: function wrap(uint256 _locationID) payable returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) Wrap(_locationID *big.Int) (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Wrap(&_PixelMapWrapper.TransactOpts, _locationID)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_PixelMapWrapper *PixelMapWrapperTransactor) Receive(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMapWrapper.contract.RawTransact(opts, nil) // calldata is disallowed for receive function
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_PixelMapWrapper *PixelMapWrapperSession) Receive() (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Receive(&_PixelMapWrapper.TransactOpts)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_PixelMapWrapper *PixelMapWrapperTransactorSession) Receive() (*types.Transaction, error) {
	return _PixelMapWrapper.Contract.Receive(&_PixelMapWrapper.TransactOpts)
}

// PixelMapWrapperApprovalIterator is returned from FilterApproval and is used to iterate over the raw logs and unpacked data for Approval events raised by the PixelMapWrapper contract.
type PixelMapWrapperApprovalIterator struct {
	Event *PixelMapWrapperApproval // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperApprovalIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperApproval)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperApproval)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperApprovalIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperApprovalIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperApproval represents a Approval event raised by the PixelMapWrapper contract.
type PixelMapWrapperApproval struct {
	Owner    common.Address
	Approved common.Address
	TokenId  *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterApproval is a free log retrieval operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterApproval(opts *bind.FilterOpts, owner []common.Address, approved []common.Address, tokenId []*big.Int) (*PixelMapWrapperApprovalIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var approvedRule []interface{}
	for _, approvedItem := range approved {
		approvedRule = append(approvedRule, approvedItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "Approval", ownerRule, approvedRule, tokenIdRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperApprovalIterator{contract: _PixelMapWrapper.contract, event: "Approval", logs: logs, sub: sub}, nil
}

// WatchApproval is a free log subscription operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchApproval(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperApproval, owner []common.Address, approved []common.Address, tokenId []*big.Int) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var approvedRule []interface{}
	for _, approvedItem := range approved {
		approvedRule = append(approvedRule, approvedItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "Approval", ownerRule, approvedRule, tokenIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperApproval)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "Approval", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseApproval is a log parse operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseApproval(log types.Log) (*PixelMapWrapperApproval, error) {
	event := new(PixelMapWrapperApproval)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "Approval", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// PixelMapWrapperApprovalForAllIterator is returned from FilterApprovalForAll and is used to iterate over the raw logs and unpacked data for ApprovalForAll events raised by the PixelMapWrapper contract.
type PixelMapWrapperApprovalForAllIterator struct {
	Event *PixelMapWrapperApprovalForAll // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperApprovalForAllIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperApprovalForAll)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperApprovalForAll)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperApprovalForAllIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperApprovalForAllIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperApprovalForAll represents a ApprovalForAll event raised by the PixelMapWrapper contract.
type PixelMapWrapperApprovalForAll struct {
	Owner    common.Address
	Operator common.Address
	Approved bool
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterApprovalForAll is a free log retrieval operation binding the contract event 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31.
//
// Solidity: event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterApprovalForAll(opts *bind.FilterOpts, owner []common.Address, operator []common.Address) (*PixelMapWrapperApprovalForAllIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "ApprovalForAll", ownerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperApprovalForAllIterator{contract: _PixelMapWrapper.contract, event: "ApprovalForAll", logs: logs, sub: sub}, nil
}

// WatchApprovalForAll is a free log subscription operation binding the contract event 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31.
//
// Solidity: event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchApprovalForAll(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperApprovalForAll, owner []common.Address, operator []common.Address) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "ApprovalForAll", ownerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperApprovalForAll)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "ApprovalForAll", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseApprovalForAll is a log parse operation binding the contract event 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31.
//
// Solidity: event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseApprovalForAll(log types.Log) (*PixelMapWrapperApprovalForAll, error) {
	event := new(PixelMapWrapperApprovalForAll)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "ApprovalForAll", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// PixelMapWrapperOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the PixelMapWrapper contract.
type PixelMapWrapperOwnershipTransferredIterator struct {
	Event *PixelMapWrapperOwnershipTransferred // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperOwnershipTransferred)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperOwnershipTransferred)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperOwnershipTransferred represents a OwnershipTransferred event raised by the PixelMapWrapper contract.
type PixelMapWrapperOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*PixelMapWrapperOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperOwnershipTransferredIterator{contract: _PixelMapWrapper.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperOwnershipTransferred)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOwnershipTransferred is a log parse operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseOwnershipTransferred(log types.Log) (*PixelMapWrapperOwnershipTransferred, error) {
	event := new(PixelMapWrapperOwnershipTransferred)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// PixelMapWrapperTransferIterator is returned from FilterTransfer and is used to iterate over the raw logs and unpacked data for Transfer events raised by the PixelMapWrapper contract.
type PixelMapWrapperTransferIterator struct {
	Event *PixelMapWrapperTransfer // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperTransferIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperTransfer)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperTransfer)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperTransferIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperTransferIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperTransfer represents a Transfer event raised by the PixelMapWrapper contract.
type PixelMapWrapperTransfer struct {
	From    common.Address
	To      common.Address
	TokenId *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterTransfer is a free log retrieval operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterTransfer(opts *bind.FilterOpts, from []common.Address, to []common.Address, tokenId []*big.Int) (*PixelMapWrapperTransferIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "Transfer", fromRule, toRule, tokenIdRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperTransferIterator{contract: _PixelMapWrapper.contract, event: "Transfer", logs: logs, sub: sub}, nil
}

// WatchTransfer is a free log subscription operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchTransfer(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperTransfer, from []common.Address, to []common.Address, tokenId []*big.Int) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}
	var tokenIdRule []interface{}
	for _, tokenIdItem := range tokenId {
		tokenIdRule = append(tokenIdRule, tokenIdItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "Transfer", fromRule, toRule, tokenIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperTransfer)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "Transfer", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTransfer is a log parse operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseTransfer(log types.Log) (*PixelMapWrapperTransfer, error) {
	event := new(PixelMapWrapperTransfer)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "Transfer", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// PixelMapWrapperUnwrappedIterator is returned from FilterUnwrapped and is used to iterate over the raw logs and unpacked data for Unwrapped events raised by the PixelMapWrapper contract.
type PixelMapWrapperUnwrappedIterator struct {
	Event *PixelMapWrapperUnwrapped // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperUnwrappedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperUnwrapped)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperUnwrapped)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperUnwrappedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperUnwrappedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperUnwrapped represents a Unwrapped event raised by the PixelMapWrapper contract.
type PixelMapWrapperUnwrapped struct {
	Owner      common.Address
	LocationID *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterUnwrapped is a free log retrieval operation binding the contract event 0x95ae649bfaaef9def56a52f4fb2d9e8fa5496bb7082930e442c74cc76b03dcb3.
//
// Solidity: event Unwrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterUnwrapped(opts *bind.FilterOpts, owner []common.Address, _locationID []*big.Int) (*PixelMapWrapperUnwrappedIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var _locationIDRule []interface{}
	for _, _locationIDItem := range _locationID {
		_locationIDRule = append(_locationIDRule, _locationIDItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "Unwrapped", ownerRule, _locationIDRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperUnwrappedIterator{contract: _PixelMapWrapper.contract, event: "Unwrapped", logs: logs, sub: sub}, nil
}

// WatchUnwrapped is a free log subscription operation binding the contract event 0x95ae649bfaaef9def56a52f4fb2d9e8fa5496bb7082930e442c74cc76b03dcb3.
//
// Solidity: event Unwrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchUnwrapped(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperUnwrapped, owner []common.Address, _locationID []*big.Int) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var _locationIDRule []interface{}
	for _, _locationIDItem := range _locationID {
		_locationIDRule = append(_locationIDRule, _locationIDItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "Unwrapped", ownerRule, _locationIDRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperUnwrapped)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "Unwrapped", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseUnwrapped is a log parse operation binding the contract event 0x95ae649bfaaef9def56a52f4fb2d9e8fa5496bb7082930e442c74cc76b03dcb3.
//
// Solidity: event Unwrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseUnwrapped(log types.Log) (*PixelMapWrapperUnwrapped, error) {
	event := new(PixelMapWrapperUnwrapped)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "Unwrapped", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// PixelMapWrapperWrappedIterator is returned from FilterWrapped and is used to iterate over the raw logs and unpacked data for Wrapped events raised by the PixelMapWrapper contract.
type PixelMapWrapperWrappedIterator struct {
	Event *PixelMapWrapperWrapped // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *PixelMapWrapperWrappedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapWrapperWrapped)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(PixelMapWrapperWrapped)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *PixelMapWrapperWrappedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapWrapperWrappedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapWrapperWrapped represents a Wrapped event raised by the PixelMapWrapper contract.
type PixelMapWrapperWrapped struct {
	Owner      common.Address
	LocationID *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterWrapped is a free log retrieval operation binding the contract event 0x4700c1726b4198077cd40320a32c45265a1910521eb0ef713dd1d8412413d7fc.
//
// Solidity: event Wrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) FilterWrapped(opts *bind.FilterOpts, owner []common.Address, _locationID []*big.Int) (*PixelMapWrapperWrappedIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var _locationIDRule []interface{}
	for _, _locationIDItem := range _locationID {
		_locationIDRule = append(_locationIDRule, _locationIDItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.FilterLogs(opts, "Wrapped", ownerRule, _locationIDRule)
	if err != nil {
		return nil, err
	}
	return &PixelMapWrapperWrappedIterator{contract: _PixelMapWrapper.contract, event: "Wrapped", logs: logs, sub: sub}, nil
}

// WatchWrapped is a free log subscription operation binding the contract event 0x4700c1726b4198077cd40320a32c45265a1910521eb0ef713dd1d8412413d7fc.
//
// Solidity: event Wrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) WatchWrapped(opts *bind.WatchOpts, sink chan<- *PixelMapWrapperWrapped, owner []common.Address, _locationID []*big.Int) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var _locationIDRule []interface{}
	for _, _locationIDItem := range _locationID {
		_locationIDRule = append(_locationIDRule, _locationIDItem)
	}

	logs, sub, err := _PixelMapWrapper.contract.WatchLogs(opts, "Wrapped", ownerRule, _locationIDRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapWrapperWrapped)
				if err := _PixelMapWrapper.contract.UnpackLog(event, "Wrapped", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseWrapped is a log parse operation binding the contract event 0x4700c1726b4198077cd40320a32c45265a1910521eb0ef713dd1d8412413d7fc.
//
// Solidity: event Wrapped(address indexed owner, uint256 indexed _locationID)
func (_PixelMapWrapper *PixelMapWrapperFilterer) ParseWrapped(log types.Log) (*PixelMapWrapperWrapped, error) {
	event := new(PixelMapWrapperWrapped)
	if err := _PixelMapWrapper.contract.UnpackLog(event, "Wrapped", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
