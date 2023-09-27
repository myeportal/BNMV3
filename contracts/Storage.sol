// SPDX-License-Identifier: CPL
pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './FractionToken.sol';

/// @title Contract to store NFTs for fractionalization
/// @author Bryce Palichuk 
/// @notice Contract that stores NFTs used in fractionalization for the blocknewsmedia.us site
contract Storage is IERC721Receiver, Ownable {
    mapping(address => mapping(uint => bool)) isNftDeposited;
    mapping(address => mapping(uint => address)) nftOwner;
    mapping(address => mapping(uint => bool)) isNftChangingOwner;

    mapping(address => mapping(uint => bool)) isNftFractionalised;
    mapping(address => mapping(uint => address)) fractionTokenAddressFromNft;
    mapping(baseFractionToken => address) nftAddressFromFraction;
    mapping(baseFractionToken => uint) nftIdFromFraction;

    mapping(address => nftDepositFolder) depositFolder;

    struct nftDepositFolder {
        address[] nftAddresses;
        uint[] nftIds;
    }

    address contractDeployer;

    constructor() {
        contractDeployer = msg.sender;
    }

    modifier contractDeployerOnly {
        require (msg.sender == contractDeployer, "Only contract deployer can call this function");
        _;
    }
    
    /// @notice Called from owner address of NFT wanting to fractionalize
    /// @param _nftAddress - BNMV2 contract address 
    /// @param _nftId - Id of deposit NFT
    function depositNft(address _nftAddress, uint256 _nftId) public payable {
        // this contract must be approved first
        require(msg.value == (100000000000000000 wei), "Please pay 0.1 Matic");
        ERC721 nft = ERC721(_nftAddress);
        nft.safeTransferFrom(msg.sender, address(this), _nftId);
    
        isNftDeposited[_nftAddress][_nftId] = true;
        nftOwner[_nftAddress][_nftId] = msg.sender;

        depositFolder[msg.sender].nftAddresses.push(_nftAddress);
        depositFolder[msg.sender].nftIds.push(_nftId);
    }

    /// @notice Called from owner address of NFT wanting to fractionalize
    /// @param _nftAddress - BNMV2 contract address 
    /// @param _nftId - Id of deposit NFT
    /// @param _tokenName - NFT owner inputted token name
    /// @param _tokenTicker - NFT owner inputted token ticker
    /// @param _supply - NFT owner inputted token supply
    function createFraction(
        address _nftAddress,
        uint256 _nftId,
        string memory _tokenName,
        string memory _tokenTicker,
        uint256 _supply
        ) public {
        require(isNftDeposited[_nftAddress][_nftId], "This NFT hasn't been deposited yet");
        require(nftOwner[_nftAddress][_nftId] == msg.sender, "You do not own this NFT");
        isNftFractionalised[_nftAddress][_nftId] = true;

        baseFractionToken FractionToken = new baseFractionToken(_nftAddress,
                                                                _nftId,
                                                                msg.sender,
                                                                _tokenName,
                                                                _tokenTicker,
                                                                _supply,                                                                
                                                                address (this)
        );
        fractionTokenAddressFromNft[_nftAddress][_nftId] = address (FractionToken);
    }

    /// @notice Called from owner address of all fractionalized tokens
    /// @param _nftAddress - BNMV2 contract address 
    /// @param _nftId - Id of deposit NFT
    function withdrawNft(address _nftAddress, uint256 _nftId) public {
        ERC721 nft = ERC721(_nftAddress);
        baseFractionToken FractionToken = baseFractionToken(fractionTokenAddressFromNft[_nftAddress][_nftId]);
        
        require(isNftDeposited[_nftAddress][_nftId] == true, "This NFT is not withdrawn");
        require(isNftFractionalised[_nftAddress][_nftId] == false ||
                FractionToken.balanceOf(msg.sender) == FractionToken.totalSupply(), 
                "NFT cannot be withdrawn, either the NFT has been withdrawn or you do not own the total supply of fraction tokens"
                );
        require(nftOwner[_nftAddress][_nftId] == msg.sender, "This address does not own this NFT");

        nftOwner[_nftAddress][_nftId] = 0x0000000000000000000000000000000000000000;

        for (uint i = 0; i < depositFolder[msg.sender].nftAddresses.length; i++) {
            if (depositFolder[msg.sender].nftAddresses[i] == _nftAddress &&
                depositFolder[msg.sender].nftIds[i] == _nftId) {
                
                delete depositFolder[msg.sender].nftAddresses[i];
                delete depositFolder[msg.sender].nftIds[i];
                break;
            }
        }

        nft.safeTransferFrom(address(this), msg.sender, _nftId);
    }

    // onlyOwner functions
    function withdrawFunds() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    // Getter functions
    function isNftActive(address _nftAddress, uint _nftId) public view returns(bool) {
        bool hasDeposited = isNftDeposited[_nftAddress][_nftId];
        bool hasFractionalise = isNftFractionalised[_nftAddress][_nftId];
        if (hasDeposited && hasFractionalise) {
            return true;
        } else {
            return false;
        }
    }
    
    function getNftOwner(address _nftAddress, uint _nftId) public view returns(address) {
        return nftOwner[_nftAddress][_nftId];
    }
    function getIsChangingNftOwner(address _nftAddress, uint _nftId) public view returns(bool) {
        return isNftChangingOwner[_nftAddress][_nftId];
    }
    function getFractionAddressFromNft(address _nftAddress, uint _nftId) public view returns(address) {
        return fractionTokenAddressFromNft[_nftAddress][_nftId];
    }
    function getNftIdFromFraction(baseFractionToken _fractionToken) public view returns (uint) {
        return nftIdFromFraction[_fractionToken];
    }
    
    function getNftAddressFromFraction(baseFractionToken _fractionToken) public view returns(address) {
        return nftAddressFromFraction[_fractionToken];
    }

    function getIsNftDeposited(address _nftAddress, uint _nftId) public view returns (bool) {
        return isNftDeposited[_nftAddress][_nftId];
    }

    function getIsNftFractionalised(address _nftAddress, uint _nftId) public view returns (bool) {
        return isNftFractionalised[_nftAddress][_nftId];
    }

    function getUserDepositedNftAddress(address _address) public view returns (address[] memory) {
        return (depositFolder[_address].nftAddresses);
    }

    function getUserDepositedNftIds(address _address) public view returns (uint[] memory) {
        return (depositFolder[_address].nftIds);
    }

    // Override function

    function onERC721Received(
        address,
        address from,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        // require(from == address(), "Cannot send nfts to Vault dirrectly");
        
        return IERC721Receiver.onERC721Received.selector;
    }
}
