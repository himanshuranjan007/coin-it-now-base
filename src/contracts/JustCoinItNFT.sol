
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title JustCoinItNFT
 * @dev Contract for minting social media posts as NFTs on Base Mainnet
 */
contract JustCoinItNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mint price in wei (0.001 ETH)
    uint256 public constant mintPrice = 1000000000000000; // 0.001 ether
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Event emitted when a new token is minted
    event TokenMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("JustCoinIt", "JCOIN") {}
    
    /**
     * @dev Sets the base URI for token metadata
     * @param baseURI The new base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Returns the current mint price
     * @return The mint price in wei
     */
    function getMintPrice() public pure returns (uint256) {
        return mintPrice;
    }
    
    /**
     * @dev Allows users to mint a new token with metadata
     * @param tokenURI The IPFS URI containing the post metadata
     * @return The ID of the newly minted token
     */
    function mintToken(string memory tokenURI) public payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient funds for minting");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit TokenMinted(msg.sender, newTokenId, tokenURI);
        
        // Return any excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
        
        return newTokenId;
    }
    
    /**
     * @dev Allows the owner to withdraw funds from the contract
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
