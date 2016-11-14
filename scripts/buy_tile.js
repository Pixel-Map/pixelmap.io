window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No web3? You should consider trying MetaMask!')
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
})

function sendEther(x, y) {
    var spanText = $('#the_id').text()
    var location = spanText.split("x");
    var pixelmapContract = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"owners","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getPos","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"urls","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"images","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"prices","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"x","type":"uint256"},{"indexed":false,"name":"y","type":"uint256"}],"name":"TileUpdated","type":"event"}]);
    var myContractInstance = pixelmapContract.at('0x7B746ea556d77EBdF119F5A40713EdeEe4f069FC');

    // Buy a Tile
    myContractInstance.buyTile(location[0], location[1], {
        from: web3.eth.defaultAccount,
        value: web3.toWei('2', 'ether'),
        to: '0x7B746ea556d77EBdF119F5A40713EdeEe4f069FC'
    }, function(error, result) {
        if (!error)
            console.log(result)
        else
            console.error(error);
    });
};
