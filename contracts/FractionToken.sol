// SPDX-License-Identifier: CPL
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


/// @title Contract to fractionalize ERC721 NFTs
/// @author Bryce Palichuk 
/// @notice Contract that fractionalizes NFTs on the blocknewsmedia.us site
contract baseFractionToken is  ERC20,  ERC20Burnable {
    address NFTOwner;
    address StorageContractAddress;
    address AuctionContractAddress;

    address NftAddress;
    uint NftId;

    address[] tokenOwners;

    bool internal noLongerFractionToken;
    mapping(address => bool) isHolding;

    constructor(address _nftAddress, uint _nftId, address _nftOwner, string memory _tokenName, string memory _tokenTicker, uint _supply, address _storageContractAddress) ERC20(_tokenName, _tokenTicker) {
        NftAddress = _nftAddress;
        NftId = _nftId;
        NFTOwner = _nftOwner;
        _mint(NFTOwner, _supply);
        StorageContractAddress = _storageContractAddress;
        noLongerFractionToken = false;
    }

    /// @notice Called from owner address of tokens
    /// @param _amount - Amount of tokens being burnt (sent to zero address)
    function burn(uint256 _amount) public virtual override {
        _burn(_msgSender(), _amount);
    }

    /// @notice Set when all tokens are redeemed for the under-lying NFT
    function setNoLongerFractionTokenTrue() public {
        require(msg.sender == StorageContractAddress, "This function can only be called from the storage contract");
        noLongerFractionToken = true;
    }

    /// @notice Called when the NFT owner is updated
    /// @param _newOwner - Address of new owner
    function updateNFTOwner(address _newOwner) public {
        require(msg.sender == StorageContractAddress, "only storage contract can update this");

        NFTOwner = _newOwner;
    }
    
    // Getter functions 
    
    function getNftOwner() public view returns(address) {
        return NFTOwner;
    }

    function getNoLongerFractionToken() public view returns(bool) {
        return noLongerFractionToken;
    }

    function getNftAddress() public view returns(address) {
        return NftAddress;
    }

    function getNftId() public view returns(uint) {
        return NftId;
    }

    function returnTokenOwners() public view returns(address[] memory) {
        return tokenOwners;
    }
}
