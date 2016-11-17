window.addEventListener('load', function() {
  web3.eth.defaultAccount=web3.eth.accounts[0]
})

function sendEther(x, y) {
    var spanText = $('#the_id').text()
    var split = spanText.split("x");
    var location = parseInt(split[0]) + (parseInt(split[1]) * 81)
    var pixelmapContract = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tiles","outputs":[{"name":"owner","type":"address"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"}],"name":"TileUpdated","type":"event"}]);
    var myContractInstance = pixelmapContract.at('0x015A06a433353f8db634dF4eDdF0C109882A15AB');

    // Buy a Tile
    myContractInstance.buyTile(location, {
        from: web3.eth.defaultAccount,
        value: web3.toWei('2', 'ether'),
        to: '0x015A06a433353f8db634dF4eDdF0C109882A15AB'
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
    var myContractInstance = pixelmapContract.at('0x015A06a433353f8db634dF4eDdF0C109882A15AB');
    var url = document.getElementById('url').value;
    var price = document.getElementById('price').value;
    // Buy a Tile
    myContractInstance.setTile(location, selectedImage, url, web3.toWei(price, 'ether'), {
        from: web3.eth.defaultAccount,
        value: 0,
        to: '0x015A06a433353f8db634dF4eDdF0C109882A15AB'
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
