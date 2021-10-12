pragma solidity ^0.4.2;
contract PixelMap {
    address creator;
    struct Tile {
        address owner;
        string image;
        string url;
        uint price;
    }
    mapping (uint => Tile) public tiles;
    event TileUpdated(uint location);

    // Original Tile Owner
    function PixelMap() {creator = msg.sender;}

    // Get Tile information at X,Y position.
    function getTile(uint location) returns (address, string, string, uint) {
        return (tiles[location].owner,
                tiles[location].image,
                tiles[location].url,
                tiles[location].price);
    }

    // Purchase an unclaimed Tile for 2 Eth.
    function buyTile(uint location) payable {
        if (location > 3969) {throw;}
        uint price = tiles[location].price;
        address owner;

        // Make sure person doesn't already own tile.
        if (tiles[location].owner == msg.sender) {
            throw;
        }

        // If Unowned by the Bank, sell for 2Eth.
        if (tiles[location].owner == 0x0) {
            price = 2000000000000000000;
            owner = creator;
        }
        else {
            owner = tiles[location].owner;
        }
        // If the tile isn't for sale, don't sell it!
        if (price == 0) {
            throw;
        }

        // Pay for Tile.
        if (msg.value != price) {
            throw;
        }
        if (owner.send(price)) {
            tiles[location].owner = msg.sender;
            tiles[location].price = 0; // Set Price to 0.
            TileUpdated(location);
        }
        else {throw;}
    }

    // Set an already owned Tile to whatever you'd like.
    function setTile(uint location, string image, string url, uint price) {
        if (tiles[location].owner != msg.sender) {throw;} // Pixel not owned by you!
        else {
            tiles[location].image = image;
            tiles[location].url = url;
            tiles[location].price = price;
            TileUpdated(location);
        }
    }
}
