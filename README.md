### What is PixelMap.io?

A little over a decade ago, a website called MillionDollarHomePage.com was created by Alex Tew.  The page consisted (and still consists) of a 1000x1000 pixel grid, with a total of 1,000,000 pixels being sold for $1 each.  Because the pixels themselves were too small to be seen individually, they were sold in 10x10 pixel tiles for $100 each.  The purchasers of each tile then provided a 10x10 pixel image to be used, as well as optionally a URL for the tile to link to.  Once an image had been configured for a given tile however, it could never be changed (nor could the ownership of the tile).

In many ways, **PixelMap.io** is similar to the MillionDollarHomepage.  There are a total of 1,016,064 pixels for sale (on a 1,296 x 784 grid).  This grid is broken up into 3,969 16x16 tiles, each at an initial price of 2 Ethereum.  However, unlike the MillionDollarHomepage.com, every single tile is controlled by a single contract on the Ethereum Blockchain.  This lends itself to the following benefits.

* Each tile is truly owned by the entity that purchases it.  Because the data is stored on the Blockchain, nothing short of every single Ethereum node shutting down can eliminate the data.
* The contract is designed so that in the event that a tile owner would like to update the image, change the URL the tile points to, or sell the tile for any amount they'd like, they can, without any central authority facilitating or controlling any part of the process.
* In the event that PixelMap.io itself were to ever go down, the data, owner, and URLs for every single pixel remains on the Blockchain, and any site could easily replicate and display the overall image.  Essentially, the backend and database of the PixelMap.io is invincible as long as the Blockchain exists.  Additionally, we are looking into using Golem and/or IPFS to fully distribute the frontend as well.
* The project is completely Open Source, which means anyone can view the code, audit the Solidity contract, or even set up more frontends if they'd like.  For instance, if someone wanted to set up an easier-to-use tile editor for PixelMap.io, they could, as all of the data is stored safely on the Ethereum blockchain.

### Running PixelMap.io
We've created a Dockerfile to make it as easy as possible to spin up your own Pixelmap.io server (for learning purposes, making improvements, etc.)
To get started, just install Docker, then run:

```docker run -p 80:80 -d --name pixelmap pixelmap/pixelmap```

The real pixelmap.io server itself is hosted on AWS and configured using just a tiny cloud config script & this Dockerfile.  If you'd like to host an identical clone, just select the Ubuntu 16.04 AMI and use the following Cloud Config, and you'll have a brand new pixelmap server up within minutes! :).

```
#cloud-config
hostname: "pixelmap"
runcmd:
  - curl -sSL https://get.docker.com/ | sh
  - /usr/bin/docker run -p 80:80 -d --name pixelmap pixelmap/pixelmap
```

### PixelMap.io Solidity Contract

All pixel data for PixelMap.io is stored in 1 Tile Struct, consisting of 4 mapping variables, one for storing the owner, image, url, and price, for every single tile.  Each tile is initially unowned, and is purchasable for 2 Ethereum.  Once purchased, (using the buyTile function), the owner is set, and the price of the tile is set to 0.  A tile with a price of 0 cannot be purchased, and the price can only be changed by the owner of the tile.  The setTile function allows an owner to update the image, URL, and price of any tiles that they own.  If the price is set to a number above 0, then it essentially is up for sale, with the sale price going to the original owner.

Each 16x16 tile image is stored as a 768 character hexadecimal string.  The color of each pixel is determined by a 3 character short hexadecimal color, which means the 768 char string is the exact size needed to store 256 pixels, starting from left to right.  As an example, let's look at storing the following image on PixelMap.io.

![Star Tile](docs/star.png "Star Tile Example")

This tile is stored as the following one-line string:
```
390390390390390390390000000390390390390390390390390390390390390390000FF0FF0000390390390390390390390390390390390390000FF0FF0000390390390390390390390390390390390000FF0FF0FF0FF0000390390390390390000000000000000000FF0FF0FF0FF0000000000000000000000FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0000390000FF0FF0FF0FF0000FF0FF0000FF0FF0FF0FF0000390390390000FF0FF0FF0000FF0FF0000FF0FF0FF0000390390390390390000FF0FF0000FF0FF0000FF0FF0000390390390390390390000FF0FF0FF0FF0FF0FF0FF0FF0000390390390390390000FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0000390390390390000FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0000390390390000FF0FF0FF0FF0FF0000000FF0FF0FF0FF0FF0000390390000FF0FF0FF0000000390390000000FF0FF0FF0000390000FF0FF0000000390390390390390390000000FF0FF0000000000000390390390390390390390390390390000000000
```

However, if you break the string apart into 16 lines, it looks like the following:
![StarHex](docs/starhex.png "Starhex")

The 3 digit color codes can be easily referenced here: [https://en.wikipedia.org/wiki/Web_colors#Web-safe_colors](https://en.wikipedia.org/wiki/Web_colors#Web-safe_colors)
On this image, the following colors were used:

![Colors](docs/colors.png "Star Used Colors")

We're currently working on a tile editor that should make it MUCH easier to
generate the hexadecimal string, but it's currently a WIP.

Once a pixel is updated, the website should update within about 5-10 minutes.  If for any reason it doesn't work, feel free to contact me at ken@devopslibrary.com.

### Testing PixelMap.io

PixelMap.io includes comprehensive test suites for both the frontend and backend components. We've created a simple test runner script to make it easy to run tests and generate coverage reports.

#### Running Tests

To run all tests (frontend and backend):

```bash
./run-tests.sh
```

To run only frontend tests:

```bash
./run-tests.sh -f
# or
./run-tests.sh --frontend
```

To run only backend tests:

```bash
./run-tests.sh -b
# or
./run-tests.sh --backend
```

#### Generating Coverage Reports

To generate coverage reports for all tests:

```bash
./run-tests.sh -c
# or
./run-tests.sh --coverage
```

You can also combine options:

```bash
# Run frontend tests with coverage
./run-tests.sh -f -c

# Run backend tests with coverage
./run-tests.sh -b -c
```

After generating coverage reports, you can view them by opening the HTML files in your browser:
- Frontend coverage: `frontend/coverage/lcov-report/index.html`
- Backend coverage: `backend/coverage.html`

#### Combined Coverage Report

To generate a combined coverage report that provides access to both frontend and backend coverage in a single interface:

```bash
./run-tests.sh -m
# or
./run-tests.sh --combined
```

This will run all tests with coverage and generate a combined report at:
- Combined coverage: `coverage-combined/index.html`

You can also run the combined coverage report directly with npm:

```bash
npm run test:coverage:combined
```

#### Coverage Configuration

The frontend coverage is configured to exclude the following directories and files:
- `.next/` - Next.js build output
- `coverage/` - Coverage reports
- `out/` - Static export output
- `*.config.js` - Configuration files
- `.eslintrc.js` - ESLint configuration

If you need to exclude additional files or directories from coverage reports, you can modify the `collectCoverageFrom` array in `frontend/jest.config.js`.

For more options and help:

```bash
./run-tests.sh -h
# or
./run-tests.sh --help
```
```
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

```
