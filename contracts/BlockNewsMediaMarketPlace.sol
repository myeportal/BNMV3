// SPDX-License-Identifier: CPL
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Smart Contract to Sell/Buy NFTs in the BNM Ecosystem.
/// @author Lukas Knutti <hello@rootine.ch>
/// @notice To mint/buy/sell articles as NFTs please head to blocknewsmedia.us
/// @custom:security-contact hello@rootine.ch
contract BlockNewsMediaMarketPlace is Pausable, AccessControl {
    using Counters for Counters.Counter;

    struct AuctionItem {
        uint256 id;
        address tokenAddress;
        uint256 tokenId;
        address payable seller;
        uint256 askingPrice;
        bool isSold;
    }

    struct RoyaltyInfo {
        address recipient;
        uint24 amount;
    }

    AuctionItem[] public itemsForSale;

    /// @dev address to receive all royalty payments
    address payable private constant ROYALTIES_RECEIVER =
        payable(0x006bf71a17584635a5407f6f32f1694ae4328def);

    mapping(address => mapping(uint256 => bool)) activeItems;

    event ItemAdded(
        uint256 id,
        uint256 tokenId,
        address tokenAddress,
        uint256 askingPrice
    );
    
    event ItemSold(uint256 id, address buyer, uint256 askingPrice);

    Counters.Counter private _itemsSold;
    RoyaltyInfo private _royalties;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor() {
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

    modifier OnlyItemOwner(address tokenAddress, uint256 tokenId) {
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.ownerOf(tokenId) == msg.sender);
        _;
    }

    modifier HasTransferApproval(address tokenAddress, uint256 tokenId) {
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.getApproved(tokenId) == address(this));
        _;
    }

    modifier ItemExists(uint256 id) {
        require(itemsForSale[id].id == id, "Could not find item");
        _;
    }

    modifier IsForSale(uint256 id) {
        require(itemsForSale[id].isSold == false, "Item is already sold!");
        _;
    }

    /// @dev Lists an NFT on the marketplace with a fixed price
    /// @param tokenId id of the token
    /// @param tokenAddress contract address of the NFT contract
    /// @param askingPrice price in wei to buy this nft
    function addItemToMarket(
        uint256 tokenId,
        address tokenAddress,
        uint256 askingPrice
    )
        external
        OnlyItemOwner(tokenAddress, tokenId)
        HasTransferApproval(tokenAddress, tokenId)
        returns (uint256)
    {
        require(
            activeItems[tokenAddress][tokenId] == false,
            "Item is already up for sale!"
        );
        uint256 newItemId = itemsForSale.length;
        itemsForSale.push(
            AuctionItem(
                newItemId,
                tokenAddress,
                tokenId,
                payable(msg.sender),
                askingPrice,
                false
            )
        );
        activeItems[tokenAddress][tokenId] = true;

        assert(itemsForSale[newItemId].id == newItemId);
        emit ItemAdded(newItemId, tokenId, tokenAddress, askingPrice);
        return newItemId;
    }

    /// @dev Buys an NFT from the marketplace
    /// @param id id returned by addItemToMarket
    function buyItem(uint256 id)
        external
        payable
        ItemExists(id)
        IsForSale(id)
        HasTransferApproval(
            itemsForSale[id].tokenAddress,
            itemsForSale[id].tokenId
        )
    {
        require(
            msg.value >= itemsForSale[id].askingPrice,
            "Not enough funds sent"
        );
        require(
            msg.sender != itemsForSale[id].seller,
            "Seller can't buy a token he listed"
        );

        itemsForSale[id].isSold = true;
        activeItems[itemsForSale[id].tokenAddress][
            itemsForSale[id].tokenId
        ] = false;
        IERC721(itemsForSale[id].tokenAddress).safeTransferFrom(
            itemsForSale[id].seller,
            msg.sender,
            itemsForSale[id].tokenId
        );
        uint256 amountWithoutRoyalties = msg.value -
            ((msg.value / 10000) * _royalties.amount);
        uint256 royaltiesAmount = (msg.value / 10000) * _royalties.amount;
        itemsForSale[id].seller.transfer(amountWithoutRoyalties);

        // transfer royalties to ROYALTIES_RECEIVER
        ROYALTIES_RECEIVER.transfer(royaltiesAmount);

        _itemsSold.increment();

        emit ItemSold(id, msg.sender, itemsForSale[id].askingPrice);
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

    /// @dev gets the amount of token sold
    function itemsSold() external view returns (uint256) {
        return _itemsSold.current();
    }

    // Internal Functions

    /// @dev Sets token royalties
    /// @param recipient recipient of the royalties
    /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function _setRoyalties(address recipient, uint256 value) internal {
        require(value <= 10000, "ERC2981Royalties: Too high");
        _royalties = RoyaltyInfo(recipient, uint24(value));
    }
}
