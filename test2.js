var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var pixelmapContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"},{"name":"_image","type":"bytes24[16]"},{"name":"_url","type":"string"},{"name":"_price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"bytes24[16]"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"},{"indexed":false,"name":"image","type":"bytes24[16]"},{"indexed":false,"name":"url","type":"string"},{"indexed":false,"name":"price","type":"uint256"},{"indexed":false,"name":"owner","type":"address"}],"name":"TileUpdated","type":"event"}]);



var ABI = [{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"},{"name":"_image","type":"bytes24[16]"},{"name":"_url","type":"string"},{"name":"_price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"bytes24[16]"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"},{"indexed":false,"name":"image","type":"bytes24[16]"},{"indexed":false,"name":"url","type":"string"},{"indexed":false,"name":"price","type":"uint256"},{"indexed":false,"name":"owner","type":"address"}],"name":"TileUpdated","type":"event"}];
var contractAddress = "0x6E3E04Ba26cd6d89803152caE6A8a8e6b8905A37";
var MyContract = web3.eth.contract(ABI);
var myContractInstance = MyContract.at(contractAddress);

// Set a Tile
var array = ["0xff0000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
             "0x000000000000000000000000000000000000000000000000",
           ];
//console.log(myContractInstance.setTile(1, array, "www.yahoo.com", 5, {from: '0x005FfAE2d5Cf174543ea89E59AAF2BBb5c728096', to: contractAddress}));
console.log(myContractInstance.getTile.call(0));
