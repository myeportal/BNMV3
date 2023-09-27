// SPDX-License-Identifier: CPL
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// NFT Token Royalties Interface
import "./ERC2981/IERC2981Royalties.sol";

/// @title NFT Contract to mint news articles as NFTs
/// @author Lukas Knutti <hello@rootine.ch>
/// @notice To mint/buy/sell articles as NFTs please head to blocknewsmedia.us
/// @custom:security-contact hello@rootine.ch
contract BlockNewsMediaToken is
    ERC721,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    ERC721Burnable
{
    using Counters for Counters.Counter;

    mapping(uint256 => Item) public items;

    struct Item {
        uint256 id;
        address creator;
        string uri;
    }

    struct RoyaltyInfo {
        address recipient;
        uint24 amount;
    }

    event TokenMinted(address _from, string _uri);

    /// @dev address to receive all royalty payments
    address private constant ROYALTIES_RECEIVER =
        0x006bf71a17584635a5407f6f32f1694ae4328def;

    Counters.Counter private _tokenIds;
    RoyaltyInfo private _royalties;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor() ERC721("BlockNewsMedia", "BNM") {
        /// @dev grant default roles to contract owner
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        /// @dev set royalties to 1.75%
        _setRoyalties(ROYALTIES_RECEIVER, 175);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Called with the uri of the token metadata to mint a new token
    /// @param uriOfToken - the uri to the ipfs hosted token metadata
    /// @return tokenId - the ID of the token minted
    function createItem(string memory uriOfToken)
        public
        whenNotPaused
        returns (uint256)
    {
        require(
            bytes(uriOfToken).length > 0,
            "BlockNewsMediaToken: No Token URI supplied"
        );
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();

        _safeMint(msg.sender, newItemId);

        items[newItemId] = Item(newItemId, msg.sender, uriOfToken);

        _setTokenURI(newItemId, uriOfToken);

        emit TokenMinted(msg.sender, uriOfToken);

        return newItemId;
    }

    /// @notice Called with the ID of the token to burn the token
    /// @param tokenId - token ID of the token to burn
    /// @return success - a bool to indicate the burn success
    function destoryItem(uint256 tokenId) public whenNotPaused returns (bool) {
        require(
            _exists(tokenId),
            "BlockNewsMediaToken: Burn for nonexistent token"
        );
        delete items[tokenId];
        burn(tokenId);
        return true;
    }

    /// @notice Implements the EIP-2981 standard into this contract
    /// @param salesPrice - Price of the token sell on the marketplace
    /// @return receiver - Returns royalty receiver address
    /// @return royaltyAmount - Returns royalty amount in the same unit that was used on the marketplace which has to be paid to the royaltyReceiver
    /// @dev As we use contract-wide royalties this is not used here
    function royaltyInfo(uint256, uint256 salesPrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        RoyaltyInfo memory royalties = _royalties;
        receiver = royalties.recipient;
        royaltyAmount = (salesPrice * royalties.amount) / 10000;
        return (receiver, royaltyAmount);
    }

    /// @notice Allows to set the royalties on the contract
    /// @param recipient - the royalties recipient
    /// @param value - royalties value (between 0 and 10000)
    function setRoyalties(address recipient, uint256 value)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setRoyalties(recipient, value);
    }

    /// @notice Implements the ERC721 standard into this contract so marketplaces can get the metadata for a token
    /// @param tokenId - token ID to get the metadata url from
    /// @return uri - returns uri to the token metadata
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return super.tokenURI(tokenId);
    }

    /// @notice Implements the EIP-165 standard into this contract for other contracts to identify interfaes
    /// @param interfaceId - interface ID to check or support
    /// @return bool - returns if the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981Royalties).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // Internal Functions

    /// @dev Sets token royalties
    /// @param recipient recipient of the royalties
    /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function _setRoyalties(address recipient, uint256 value) internal {
        require(value <= 10000, "ERC2981Royalties: Too high");
        _royalties = RoyaltyInfo(recipient, uint24(value));
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }
}
