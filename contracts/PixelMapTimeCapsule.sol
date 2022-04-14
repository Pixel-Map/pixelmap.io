// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PixelMapTimeCapsule is ERC721Enumerable,Ownable {
   
    // contractURI, BaseTokenURI, extension
	string private _contractURI;
    string public _baseTokenURI = 'ipfs://QmUAwy3qSmTAdz9fvUmkwfmrjsLbbup5LusXzXJ9TpcddH';
	
    uint256 public constant MAX_SUPPLY = 324; // Max NFT Supply
    bool public locked;

    constructor() payable ERC721("PixelMap Time Capsule I", "PXMTCI") {
    }
	
    /**
     * Lock modifier for locking contract to make it unchangable
     */
    modifier notLocked {
        require(!locked, "Contract metadata methods are locked");
        _;
    }
	
	// Owner function to lock Metadata forever
    function lockMetadata() external onlyOwner {
        locked = true;
    }
	    
    /**
     * minting as owner
     */
	
	function MultiMintOwner(uint256 mintAmount) external onlyOwner {
        require(totalSupply() + mintAmount <= MAX_SUPPLY, "Minting: All tokens minted");
		// Mint NFT
		for (uint256 i = 0; i < mintAmount; i++) {
            uint256 mintIndex = totalSupply() + 1; // Start with TokenID 1
            _safeMint(_msgSender(), mintIndex);
        }
    }
    
	
    /**
     * @dev set metadata only when it's not locked
     */  
	    
    function setContractURI(string calldata URI) external onlyOwner notLocked {
        _contractURI = URI;
    }

    function setBaseTokenURI(string memory __baseTokenURI) public onlyOwner notLocked {
        _baseTokenURI = __baseTokenURI;
    }
    
    /**
     * @dev Returns a URI for contract metadata
     */
	function contractURI() public view returns (string memory) {
        return _contractURI;
    }
	
    /**
     * @dev Returns a URI for a given token ID's metadata
     */
    function tokenURI(uint256) public view override returns (string memory) {
        return string(abi.encodePacked(_baseTokenURI));
    }
}

