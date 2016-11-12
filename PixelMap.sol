pragma solidity ^0.4.2;
contract PixelMap {
    mapping (uint => address) public owners;
    mapping (uint => string) public images;
    mapping (uint => string) public urls;
    mapping (uint => uint) public prices;
    address creator;
    event TileUpdated(uint x, uint y, string image, string url, uint price, address owner);
    event OwnerUpdated(uint x, uint y, address owner);

    // Constructor
    function PixelMap() {
        creator = msg.sender;
    }
    // Given X & Y, return Tile number.
    function getPos(uint x, uint y) returns (uint) {
        return y*81+x;
    }

    // Get Tile information at X,Y position.
    function getTile(uint x, uint y) returns (address, string, string) {
        uint location = getPos(x, y);
        return (owners[location], urls[location], images[location]);
    }

    // Purchase an unclaimed Tile for 10 Eth.
    function buyTile(uint x, uint y) payable {
        uint location = getPos(x, y);
        uint price = 2000000000000000000;
        if (owners[location] == msg.sender) {
            throw; // You already own this pixel silly!
        }
        // If Unowned by the Bank
        if (owners[location] == 0x0) {
            if (msg.value == 2000000000000000000) {
                // Send to Creator
                if (creator.send(2000000000000000000)) {
                    owners[location] = msg.sender;
                    prices[location] = 0; // Set Price to 0.  0 is not for sale.
                    OwnerUpdated(x, y, msg.sender);
                }
                else {throw;}
            }
            else {
                throw; // 10 Eth not supplied
            }
        }
        else {
            if (owners[location] != 0x0) {
                price = prices[location];
                if (price == 0) {throw;} // Tile not for sale!
                else {
                    if (msg.value == price) {
                        if (owners[location].send(price)) {
                            // Set New Owner
                            owners[location] = msg.sender;
                            prices[location] = 0; // Set Price to 0.
                            OwnerUpdated(x, y, msg.sender);
                        }
                        else {throw;}
                    }
                }
            }
        }
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
            TileUpdated(x, y, image, url, price, msg.sender);
        }
    }
}
