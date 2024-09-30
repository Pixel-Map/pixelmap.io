// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package pixelmap

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

// PixelMapMetaData contains all meta data concerning the PixelMap contract.
var PixelMapMetaData = &bind.MetaData{
	ABI: "[{\"constant\":true,\"inputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"tiles\",\"outputs\":[{\"name\":\"owner\",\"type\":\"address\"},{\"name\":\"image\",\"type\":\"string\"},{\"name\":\"url\",\"type\":\"string\"},{\"name\":\"price\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"location\",\"type\":\"uint256\"}],\"name\":\"buyTile\",\"outputs\":[],\"payable\":true,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"location\",\"type\":\"uint256\"},{\"name\":\"image\",\"type\":\"string\"},{\"name\":\"url\",\"type\":\"string\"},{\"name\":\"price\",\"type\":\"uint256\"}],\"name\":\"setTile\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"location\",\"type\":\"uint256\"}],\"name\":\"getTile\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[],\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"name\":\"location\",\"type\":\"uint256\"}],\"name\":\"TileUpdated\",\"type\":\"event\"}]",
}

// PixelMapABI is the input ABI used to generate the binding from.
// Deprecated: Use PixelMapMetaData.ABI instead.
var PixelMapABI = PixelMapMetaData.ABI

// PixelMap is an auto generated Go binding around an Ethereum contract.
type PixelMap struct {
	PixelMapCaller     // Read-only binding to the contract
	PixelMapTransactor // Write-only binding to the contract
	PixelMapFilterer   // Log filterer for contract events
}

// PixelMapCaller is an auto generated read-only Go binding around an Ethereum contract.
type PixelMapCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapTransactor is an auto generated write-only Go binding around an Ethereum contract.
type PixelMapTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type PixelMapFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PixelMapSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type PixelMapSession struct {
	Contract     *PixelMap         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// PixelMapCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type PixelMapCallerSession struct {
	Contract *PixelMapCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// PixelMapTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type PixelMapTransactorSession struct {
	Contract     *PixelMapTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// PixelMapRaw is an auto generated low-level Go binding around an Ethereum contract.
type PixelMapRaw struct {
	Contract *PixelMap // Generic contract binding to access the raw methods on
}

// PixelMapCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type PixelMapCallerRaw struct {
	Contract *PixelMapCaller // Generic read-only contract binding to access the raw methods on
}

// PixelMapTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type PixelMapTransactorRaw struct {
	Contract *PixelMapTransactor // Generic write-only contract binding to access the raw methods on
}

// NewPixelMap creates a new instance of PixelMap, bound to a specific deployed contract.
func NewPixelMap(address common.Address, backend bind.ContractBackend) (*PixelMap, error) {
	contract, err := bindPixelMap(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &PixelMap{PixelMapCaller: PixelMapCaller{contract: contract}, PixelMapTransactor: PixelMapTransactor{contract: contract}, PixelMapFilterer: PixelMapFilterer{contract: contract}}, nil
}

// NewPixelMapCaller creates a new read-only instance of PixelMap, bound to a specific deployed contract.
func NewPixelMapCaller(address common.Address, caller bind.ContractCaller) (*PixelMapCaller, error) {
	contract, err := bindPixelMap(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &PixelMapCaller{contract: contract}, nil
}

// NewPixelMapTransactor creates a new write-only instance of PixelMap, bound to a specific deployed contract.
func NewPixelMapTransactor(address common.Address, transactor bind.ContractTransactor) (*PixelMapTransactor, error) {
	contract, err := bindPixelMap(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &PixelMapTransactor{contract: contract}, nil
}

// NewPixelMapFilterer creates a new log filterer instance of PixelMap, bound to a specific deployed contract.
func NewPixelMapFilterer(address common.Address, filterer bind.ContractFilterer) (*PixelMapFilterer, error) {
	contract, err := bindPixelMap(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &PixelMapFilterer{contract: contract}, nil
}

// bindPixelMap binds a generic wrapper to an already deployed contract.
func bindPixelMap(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := PixelMapMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PixelMap *PixelMapRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _PixelMap.Contract.PixelMapCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PixelMap *PixelMapRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMap.Contract.PixelMapTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PixelMap *PixelMapRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PixelMap.Contract.PixelMapTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PixelMap *PixelMapCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _PixelMap.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PixelMap *PixelMapTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PixelMap.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PixelMap *PixelMapTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PixelMap.Contract.contract.Transact(opts, method, params...)
}

// Tiles is a free data retrieval call binding the contract method 0x2fd2e742.
//
// Solidity: function tiles(uint256 ) returns(address owner, string image, string url, uint256 price)
func (_PixelMap *PixelMapCaller) Tiles(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Owner common.Address
	Image string
	Url   string
	Price *big.Int
}, error) {
	var out []interface{}
	err := _PixelMap.contract.Call(opts, &out, "tiles", arg0)

	outstruct := new(struct {
		Owner common.Address
		Image string
		Url   string
		Price *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Owner = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Image = *abi.ConvertType(out[1], new(string)).(*string)
	outstruct.Url = *abi.ConvertType(out[2], new(string)).(*string)
	outstruct.Price = *abi.ConvertType(out[3], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// Tiles is a free data retrieval call binding the contract method 0x2fd2e742.
//
// Solidity: function tiles(uint256 ) returns(address owner, string image, string url, uint256 price)
func (_PixelMap *PixelMapSession) Tiles(arg0 *big.Int) (struct {
	Owner common.Address
	Image string
	Url   string
	Price *big.Int
}, error) {
	return _PixelMap.Contract.Tiles(&_PixelMap.CallOpts, arg0)
}

// Tiles is a free data retrieval call binding the contract method 0x2fd2e742.
//
// Solidity: function tiles(uint256 ) returns(address owner, string image, string url, uint256 price)
func (_PixelMap *PixelMapCallerSession) Tiles(arg0 *big.Int) (struct {
	Owner common.Address
	Image string
	Url   string
	Price *big.Int
}, error) {
	return _PixelMap.Contract.Tiles(&_PixelMap.CallOpts, arg0)
}

// BuyTile is a paid mutator transaction binding the contract method 0x329ce29e.
//
// Solidity: function buyTile(uint256 location) returns()
func (_PixelMap *PixelMapTransactor) BuyTile(opts *bind.TransactOpts, location *big.Int) (*types.Transaction, error) {
	return _PixelMap.contract.Transact(opts, "buyTile", location)
}

// BuyTile is a paid mutator transaction binding the contract method 0x329ce29e.
//
// Solidity: function buyTile(uint256 location) returns()
func (_PixelMap *PixelMapSession) BuyTile(location *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.BuyTile(&_PixelMap.TransactOpts, location)
}

// BuyTile is a paid mutator transaction binding the contract method 0x329ce29e.
//
// Solidity: function buyTile(uint256 location) returns()
func (_PixelMap *PixelMapTransactorSession) BuyTile(location *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.BuyTile(&_PixelMap.TransactOpts, location)
}

// GetTile is a paid mutator transaction binding the contract method 0xa97cc114.
//
// Solidity: function getTile(uint256 location) returns(address, string, string, uint256)
func (_PixelMap *PixelMapTransactor) GetTile(opts *bind.TransactOpts, location *big.Int) (*types.Transaction, error) {
	return _PixelMap.contract.Transact(opts, "getTile", location)
}

// GetTile is a paid mutator transaction binding the contract method 0xa97cc114.
//
// Solidity: function getTile(uint256 location) returns(address, string, string, uint256)
func (_PixelMap *PixelMapSession) GetTile(location *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.GetTile(&_PixelMap.TransactOpts, location)
}

// GetTile is a paid mutator transaction binding the contract method 0xa97cc114.
//
// Solidity: function getTile(uint256 location) returns(address, string, string, uint256)
func (_PixelMap *PixelMapTransactorSession) GetTile(location *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.GetTile(&_PixelMap.TransactOpts, location)
}

// SetTile is a paid mutator transaction binding the contract method 0x678d9758.
//
// Solidity: function setTile(uint256 location, string image, string url, uint256 price) returns()
func (_PixelMap *PixelMapTransactor) SetTile(opts *bind.TransactOpts, location *big.Int, image string, url string, price *big.Int) (*types.Transaction, error) {
	return _PixelMap.contract.Transact(opts, "setTile", location, image, url, price)
}

// SetTile is a paid mutator transaction binding the contract method 0x678d9758.
//
// Solidity: function setTile(uint256 location, string image, string url, uint256 price) returns()
func (_PixelMap *PixelMapSession) SetTile(location *big.Int, image string, url string, price *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.SetTile(&_PixelMap.TransactOpts, location, image, url, price)
}

// SetTile is a paid mutator transaction binding the contract method 0x678d9758.
//
// Solidity: function setTile(uint256 location, string image, string url, uint256 price) returns()
func (_PixelMap *PixelMapTransactorSession) SetTile(location *big.Int, image string, url string, price *big.Int) (*types.Transaction, error) {
	return _PixelMap.Contract.SetTile(&_PixelMap.TransactOpts, location, image, url, price)
}

// PixelMapTileUpdatedIterator is returned from FilterTileUpdated and is used to iterate over the raw logs and unpacked data for TileUpdated events raised by the PixelMap contract.
type PixelMapTileUpdatedIterator struct {
	Event *PixelMapTileUpdated // Event containing the contract specifics and raw log

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
func (it *PixelMapTileUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(PixelMapTileUpdated)
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
		it.Event = new(PixelMapTileUpdated)
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
func (it *PixelMapTileUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *PixelMapTileUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// PixelMapTileUpdated represents a TileUpdated event raised by the PixelMap contract.
type PixelMapTileUpdated struct {
	Location *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterTileUpdated is a free log retrieval operation binding the contract event 0xb497d17d9ddaf07c831248da6ed8174689abdc4370285e618e350f29f5aff9a0.
//
// Solidity: event TileUpdated(uint256 location)
func (_PixelMap *PixelMapFilterer) FilterTileUpdated(opts *bind.FilterOpts) (*PixelMapTileUpdatedIterator, error) {

	logs, sub, err := _PixelMap.contract.FilterLogs(opts, "TileUpdated")
	if err != nil {
		return nil, err
	}
	return &PixelMapTileUpdatedIterator{contract: _PixelMap.contract, event: "TileUpdated", logs: logs, sub: sub}, nil
}

// WatchTileUpdated is a free log subscription operation binding the contract event 0xb497d17d9ddaf07c831248da6ed8174689abdc4370285e618e350f29f5aff9a0.
//
// Solidity: event TileUpdated(uint256 location)
func (_PixelMap *PixelMapFilterer) WatchTileUpdated(opts *bind.WatchOpts, sink chan<- *PixelMapTileUpdated) (event.Subscription, error) {

	logs, sub, err := _PixelMap.contract.WatchLogs(opts, "TileUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(PixelMapTileUpdated)
				if err := _PixelMap.contract.UnpackLog(event, "TileUpdated", log); err != nil {
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

// ParseTileUpdated is a log parse operation binding the contract event 0xb497d17d9ddaf07c831248da6ed8174689abdc4370285e618e350f29f5aff9a0.
//
// Solidity: event TileUpdated(uint256 location)
func (_PixelMap *PixelMapFilterer) ParseTileUpdated(log types.Log) (*PixelMapTileUpdated, error) {
	event := new(PixelMapTileUpdated)
	if err := _PixelMap.contract.UnpackLog(event, "TileUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
