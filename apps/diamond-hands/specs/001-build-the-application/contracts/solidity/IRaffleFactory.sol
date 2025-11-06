// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IRaffleVault.sol";
import "./ISoulboundTicket.sol";

/**
 * @title IRaffleFactory
 * @dev Interface for creating and managing raffles
 * @notice Core contract that handles raffle creation, deposits, and lifecycle management
 */
interface IRaffleFactory {
    /**
     * @dev Raffle configuration parameters
     */
    struct RaffleConfig {
        address operator;           // Raffle creator/operator
        uint256 ticketPrice;       // Price per ticket in WLD
        uint8 maxEntriesPerUser;   // Maximum tickets per user (1-100)
        uint8 numWinners;          // Number of winners (0 for charity-only)
        uint8 winnerPercentage;    // Percentage for winners (0-100)
        address[] beneficiaries;   // Allowed charity addresses
        uint8 beneficiaryPercentage; // Percentage for beneficiaries (0-100)
        uint256 entryStart;        // Entry period start timestamp
        uint256 entryEnd;          // Entry period end timestamp
        string metadataURI;        // IPFS URI for raffle metadata
    }

    /**
     * @dev Raffle state enumeration
     */
    enum RaffleStatus {
        Upcoming,    // Created but entry period hasn't started
        Active,      // Accepting entries
        Drawing,     // Entry ended, waiting for randomness
        Completed,   // Winners selected, prizes distributed
        Cancelled,   // Cancelled with refunds available
        Refunding    // Below minimum participants, refunds available
    }

    /**
     * @dev Events
     */
    event RaffleCreated(
        uint256 indexed raffleId,
        address indexed operator,
        address vaultAddress,
        uint256 ticketPrice,
        uint256 entryStart,
        uint256 entryEnd
    );

    event RaffleStatusChanged(
        uint256 indexed raffleId,
        RaffleStatus oldStatus,
        RaffleStatus newStatus
    );

    event OperatorDepositReceived(
        uint256 indexed raffleId,
        address indexed operator,
        uint256 amount
    );

    event OperatorDepositReturned(
        uint256 indexed raffleId,
        address indexed operator,
        uint256 amount
    );

    event MinimumParticipantsNotMet(
        uint256 indexed raffleId,
        uint256 participantCount,
        uint256 minimumRequired
    );

    /**
     * @dev Create a new raffle with operator deposit
     * @param config Raffle configuration parameters
     * @return raffleId The unique identifier for the created raffle
     * @return vaultAddress The address of the created raffle vault contract
     */
    function createRaffle(RaffleConfig calldata config) 
        external 
        payable 
        returns (uint256 raffleId, address vaultAddress);

    /**
     * @dev Get raffle configuration
     * @param raffleId The raffle identifier
     * @return config The raffle configuration
     */
    function getRaffleConfig(uint256 raffleId) 
        external 
        view 
        returns (RaffleConfig memory config);

    /**
     * @dev Get current raffle status
     * @param raffleId The raffle identifier
     * @return status Current status of the raffle
     */
    function getRaffleStatus(uint256 raffleId) 
        external 
        view 
        returns (RaffleStatus status);

    /**
     * @dev Get raffle vault contract address
     * @param raffleId The raffle identifier
     * @return vaultAddress The address of the raffle's vault contract
     */
    function getRaffleVault(uint256 raffleId) 
        external 
        view 
        returns (address vaultAddress);

    /**
     * @dev Get ticket NFT contract address
     * @param raffleId The raffle identifier
     * @return ticketAddress The address of the raffle's ticket contract
     */
    function getRaffleTickets(uint256 raffleId) 
        external 
        view 
        returns (address ticketAddress);

    /**
     * @dev Update raffle status (called by vault contracts)
     * @param raffleId The raffle identifier
     * @param newStatus The new status to set
     */
    function updateRaffleStatus(uint256 raffleId, RaffleStatus newStatus) 
        external;

    /**
     * @dev Check if minimum participants requirement is met
     * @param raffleId The raffle identifier
     * @return isMet True if minimum participants requirement is satisfied
     * @return participantCount Current number of participants
     * @return minimumRequired Minimum participants required
     */
    function checkMinimumParticipants(uint256 raffleId) 
        external 
        view 
        returns (bool isMet, uint256 participantCount, uint256 minimumRequired);

    /**
     * @dev Initiate raffle drawing (operator only)
     * @param raffleId The raffle identifier
     * @return vrfRequestId The Chainlink VRF request ID
     */
    function initiateDrawing(uint256 raffleId) 
        external 
        returns (uint256 vrfRequestId);

    /**
     * @dev Handle emergency cancellation (operator only)
     * @param raffleId The raffle identifier
     * @param reason Cancellation reason
     */
    function emergencyCancel(uint256 raffleId, string calldata reason) 
        external;

    /**
     * @dev Return operator deposit after raffle completion
     * @param raffleId The raffle identifier
     */
    function returnOperatorDeposit(uint256 raffleId) 
        external;

    /**
     * @dev Get total number of raffles created
     * @return count Total raffle count
     */
    function getRaffleCount() 
        external 
        view 
        returns (uint256 count);

    /**
     * @dev Get list of raffles by status
     * @param status The status to filter by
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return raffleIds Array of raffle IDs matching the status
     */
    function getRafflesByStatus(
        RaffleStatus status, 
        uint256 offset, 
        uint256 limit
    ) external view returns (uint256[] memory raffleIds);

    /**
     * @dev Get raffles created by specific operator
     * @param operator The operator address
     * @param offset Starting index for pagination  
     * @param limit Maximum number of results
     * @return raffleIds Array of raffle IDs created by the operator
     */
    function getRafflesByOperator(
        address operator,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory raffleIds);

    /**
     * @dev Protocol configuration constants
     */
    function OPERATOR_DEPOSIT_AMOUNT() external pure returns (uint256);
    function OPERATOR_REFUND_AMOUNT() external pure returns (uint256);
    function PROTOCOL_FEE_AMOUNT() external pure returns (uint256);
    function MIN_TICKET_PRICE() external pure returns (uint256);
    function MAX_TICKET_PRICE() external pure returns (uint256);
    function MAX_ENTRIES_PER_USER() external pure returns (uint8);
}