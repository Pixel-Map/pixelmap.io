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
    var split = spanText.split("x");
    var location = parseInt(split[0]) + (parseInt(split[1]) * 81)
    var pixelmapContract = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tiles","outputs":[{"name":"owner","type":"address"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"}],"name":"TileUpdated","type":"event"}]);
    var myContractInstance = pixelmapContract.at('0x406D4d30dE0C7c11499aDA85a3DC50c735B6dd60');

    // Buy a Tile
    myContractInstance.buyTile(location, {
        from: web3.eth.defaultAccount,
        value: web3.toWei('2', 'ether'),
        to: '0x406D4d30dE0C7c11499aDA85a3DC50c735B6dd60'
    }, function(error, result) {
        if (!error) {
            console.log(result)
            $('#edit-modal').modal('hide')
        }
        else {
            alert(error);
          }
    });
};

function updateTile(x, y) {
    var spanText = $('#the_id2').text()
    var split = spanText.split("x");
    var location = parseInt(split[0]) + (parseInt(split[1]) * 81)
    var pixelmapContract = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tiles","outputs":[{"name":"owner","type":"address"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"}],"name":"TileUpdated","type":"event"}]);
    var myContractInstance = pixelmapContract.at('0x406D4d30dE0C7c11499aDA85a3DC50c735B6dd60');
    var url = document.getElementById('url').value;
    var price = document.getElementById('price').value;
    // Buy a Tile
    myContractInstance.setTile(location, selectedImage, url, web3.toWei(price, 'ether'), {
        from: web3.eth.defaultAccount,
        value: 0,
        to: '0x406D4d30dE0C7c11499aDA85a3DC50c735B6dd60'
    }, function(error, result) {
      if (!error) {
          console.log(result)
          $('#edit-tile').modal('hide')
      }
      else {
          alert(error);
        }
    });
};
