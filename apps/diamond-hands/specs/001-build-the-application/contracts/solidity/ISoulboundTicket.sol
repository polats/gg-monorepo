// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/**
 * @title ISoulboundTicket
 * @dev Interface for soulbound NFT raffle tickets
 * @notice ERC-721 tokens that cannot be transferred, representing raffle participation
 */
interface ISoulboundTicket is IERC721, IERC721Metadata {
    /**
     * @dev Ticket metadata structure
     */
    struct TicketMetadata {
        uint256 raffleId;          // Associated raffle ID
        address originalOwner;     // Original purchaser (immutable)
        address beneficiaryVote;   // Voted beneficiary address
        uint256 purchasePrice;     // WLD amount paid
        uint256 purchaseTimestamp; // When ticket was purchased
        uint8 ticketNumber;        // Ticket number for this user (1-100)
        bool isWinningTicket;      // Whether this ticket won
        uint256 prizeAmount;       // Prize amount if winning ticket
        bool prizeClaimed;         // Whether prize has been claimed
    }

    /**
     * @dev Prize claim information
     */
    struct PrizeClaimInfo {
        bool isEligible;          // Can claim prize
        uint256 amount;           // Prize amount in WLD
        bool isClaimed;           // Already claimed
        uint256 claimedAt;        // Claim timestamp
        address claimedBy;        // Address that claimed
    }

    /**
     * @dev Events
     */
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 indexed raffleId,
        address beneficiaryVote,
        uint256 purchasePrice
    );

    event WinnerStatusUpdated(
        uint256 indexed tokenId,
        bool isWinner,
        uint256 prizeAmount
    );

    event PrizeClaimed(
        uint256 indexed tokenId,
        address indexed claimer,
        address indexed recipient,
        uint256 amount
    );

    event TransferAttempted(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        string reason
    );

    /**
     * @dev Mint new raffle ticket
     * @param to Address to mint ticket to
     * @param raffleId Associated raffle ID
     * @param beneficiaryVote Voted beneficiary address
     * @param purchasePrice WLD amount paid for ticket
     * @return tokenId The minted token ID
     */
    function mintTicket(
        address to,
        uint256 raffleId,
        address beneficiaryVote,
        uint256 purchasePrice
    ) external returns (uint256 tokenId);

    /**
     * @dev Batch mint multiple tickets
     * @param to Address to mint tickets to
     * @param raffleId Associated raffle ID
     * @param beneficiaryVote Voted beneficiary address
     * @param purchasePrice WLD amount paid per ticket
     * @param quantity Number of tickets to mint
     * @return tokenIds Array of minted token IDs
     */
    function batchMintTickets(
        address to,
        uint256 raffleId,
        address beneficiaryVote,
        uint256 purchasePrice,
        uint8 quantity
    ) external returns (uint256[] memory tokenIds);

    /**
     * @dev Update winner status for ticket
     * @param tokenId The token ID to update
     * @param isWinner Whether ticket is a winner
     * @param prizeAmount Prize amount if winner
     */
    function setWinnerStatus(
        uint256 tokenId,
        bool isWinner,
        uint256 prizeAmount
    ) external;

    /**
     * @dev Claim prize for winning ticket
     * @param tokenId The winning ticket ID
     * @param recipient Address to receive prize
     * @return success True if claim was successful
     */
    function claimPrize(uint256 tokenId, address recipient) 
        external 
        returns (bool success);

    /**
     * @dev Get complete ticket metadata
     * @param tokenId The token ID
     * @return metadata Complete ticket metadata
     */
    function getTicketMetadata(uint256 tokenId) 
        external 
        view 
        returns (TicketMetadata memory metadata);

    /**
     * @dev Get prize claim information
     * @param tokenId The token ID
     * @return claimInfo Prize claim details
     */
    function getPrizeClaimInfo(uint256 tokenId) 
        external 
        view 
        returns (PrizeClaimInfo memory claimInfo);

    /**
     * @dev Get all tickets owned by address for specific raffle
     * @param owner The owner address
     * @param raffleId The raffle ID to filter by
     * @return tokenIds Array of token IDs owned by address for raffle
     */
    function getTicketsByOwnerAndRaffle(address owner, uint256 raffleId) 
        external 
        view 
        returns (uint256[] memory tokenIds);

    /**
     * @dev Get all winning tickets for a raffle
     * @param raffleId The raffle ID
     * @return tokenIds Array of winning ticket IDs
     */
    function getWinningTickets(uint256 raffleId) 
        external 
        view 
        returns (uint256[] memory tokenIds);

    /**
     * @dev Get ticket count for owner in specific raffle
     * @param owner The owner address
     * @param raffleId The raffle ID
     * @return count Number of tickets owned
     */
    function getTicketCount(address owner, uint256 raffleId) 
        external 
        view 
        returns (uint8 count);

    /**
     * @dev Check if address owns any tickets for raffle
     * @param owner The address to check
     * @param raffleId The raffle ID
     * @return hasTickets True if owner has tickets for raffle
     */
    function hasTicketsForRaffle(address owner, uint256 raffleId) 
        external 
        view 
        returns (bool hasTickets);

    /**
     * @dev Get next token ID to be minted
     * @return nextTokenId The next token ID
     */
    function getNextTokenId() 
        external 
        view 
        returns (uint256 nextTokenId);

    /**
     * @dev Get total number of tickets minted for raffle
     * @param raffleId The raffle ID
     * @return count Total tickets for raffle
     */
    function getRaffleTicketCount(uint256 raffleId) 
        external 
        view 
        returns (uint256 count);

    /**
     * @dev Generate JSON metadata for token
     * @param tokenId The token ID
     * @return json JSON metadata string
     */
    function generateMetadata(uint256 tokenId) 
        external 
        view 
        returns (string memory json);

    /**
     * @dev Override transfer functions to make tokens soulbound
     * @dev These functions should revert with descriptive messages
     */
    function transferFrom(address from, address to, uint256 tokenId) 
        external 
        pure 
        override;

    function safeTransferFrom(address from, address to, uint256 tokenId) 
        external 
        pure 
        override;

    function safeTransferFrom(
        address from, 
        address to, 
        uint256 tokenId, 
        bytes calldata data
    ) external pure override;

    function approve(address to, uint256 tokenId) 
        external 
        pure 
        override;

    function setApprovalForAll(address operator, bool approved) 
        external 
        pure 
        override;

    function getApproved(uint256 tokenId) 
        external 
        pure 
        override 
        returns (address operator);

    function isApprovedForAll(address owner, address operator) 
        external 
        pure 
        override 
        returns (bool);

    /**
     * @dev Emergency functions for contract administration
     */
    function pause() external;
    function unpause() external;
    function isPaused() external view returns (bool);

    /**
     * @dev Get contract version
     * @return version Contract version string
     */
    function version() external pure returns (string memory version);

    /**
     * @dev Get raffle vault contract that can mint tickets
     * @return vault Address of associated raffle vault
     */
    function raffleVault() external view returns (address vault);
}