pragma solidity ^0.4.2;
contract PixelMap {
    mapping (uint => address) public owners;
    mapping (uint => string) public images;
    mapping (uint => string) public urls;
    mapping (uint => uint) public prices;
    address creator;
    event TileUpdated(uint x, uint y);

    // Constructor
    function PixelMap() {
        creator = msg.sender;
    }
    // Given X & Y, return Tile number.
    function getPos(uint x, uint y) returns (uint) {
        return y*81+x;
    }

    // Get Tile information at X,Y position.
    function getTile(uint x, uint y) returns (address, string, string, uint) {
        uint location = getPos(x, y);
        return (owners[location], urls[location], images[location], prices[location]);
    }

    // Purchase an unclaimed Tile for 10 Eth.
    function buyTile(uint x, uint y) payable {
        uint location = getPos(x, y);
        uint price;
        address owner;

        if (owners[location] == msg.sender) {
            throw; // You already own this pixel silly!
        }
        // If Unowned by the Bank
        if (owners[location] == 0x0) {
            price = 2000000000000000000;
            owner = creator;
        }

        // If the pixel isn't for sale, don't sell it!
        if (price == 0) {
            throw;
        }

        if (owner.send(price)) {
            owners[location] = msg.sender;
            prices[location] = 0; // Set Price to 0.
            TileUpdated(x, y);
        }
        else {throw;}
    }

    // Set an already owned Tile to whatever you'd like.
    function setTile(uint x, uint y, string image, string url, uint price) {
        uint location = getPos(x, y);
        if (owners[location] != msg.sender) {throw;} // Pixel not owned by you!
        if (bytes(image).length != 768) {throw;} // Incorrect String Length Provided!
        else {
            images[location] = image;
            urls[location] = url;
            prices[location] = price;
            TileUpdated(x, y);
        }
    }
}
