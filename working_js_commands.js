var Web3 = require('web3');
var fs = require('fs'), ini = require('ini')
var config = ini.parse(fs.readFileSync('config.ini', 'utf-8'))

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var pixelmapContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"},{"name":"_image","type":"bytes24[16]"},{"name":"_url","type":"string"},{"name":"_price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"bytes24[16]"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"},{"indexed":false,"name":"image","type":"bytes24[16]"},{"indexed":false,"name":"url","type":"string"},{"indexed":false,"name":"price","type":"uint256"},{"indexed":false,"name":"owner","type":"address"}],"name":"TileUpdated","type":"event"}]);
var abi = [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"owners","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getPos","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"urls","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"images","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"prices","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"x","type":"uint256"},{"indexed":false,"name":"y","type":"uint256"}],"name":"TileUpdated","type":"event"}]

var contractAddress = config.DEFAULT.address;
var MyContract = web3.eth.contract(abi);
var myContractInstance = MyContract.at(contractAddress);

// Send a Transaction
web3.eth.sendTransaction({
   from: '0x005FfAE2d5Cf174543ea89E59AAF2BBb5c728096',
   to: '0x00c5ED24F6d9A0D4c4041aa50065bCbcB2A9fa36',
   value:  web3.toWei(1.1, "ether")
});

// Buy a Tile
console.log(myContractInstance.buyTile(1, {from: '0x005FfAE2d5Cf174543ea89E59AAF2BBb5c728096', value:web3.toWei('2','ether'), to: contractAddress}));

// Get Tile Data
console.log(myContractInstance.getTile.call(2));
