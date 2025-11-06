// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IRaffleVault
 * @dev Interface for individual raffle vault contracts that handle WLD custody
 * @notice Each raffle has its own vault contract for transparent fund management
 */
interface IRaffleVault {
    /**
     * @dev Participant information
     */
    struct Participant {
        address user;               // Participant address
        uint8 ticketCount;         // Number of tickets purchased
        address beneficiaryVote;   // Voted beneficiary address
        uint256 totalPaid;         // Total WLD paid
        uint256 firstTicketId;     // First NFT ticket ID owned
    }

    /**
     * @dev Prize distribution information
     */
    struct PrizeDistribution {
        uint256 totalPool;         // Total WLD collected
        uint256 winnerPool;        // Amount for winners
        uint256 beneficiaryPool;   // Amount for beneficiaries
        address winningBeneficiary; // Most voted beneficiary
        uint256[] winningTicketIds; // Winning ticket NFT IDs
        bool distributed;          // Whether prizes have been distributed
    }

    /**
     * @dev Events
     */
    event TicketsPurchased(
        address indexed user,
        uint8 quantity,
        uint256 totalCost,
        address beneficiaryVote,
        uint256[] ticketIds
    );

    event BeneficiaryVoteCast(
        address indexed user,
        address indexed beneficiary,
        uint8 voteWeight
    );

    event RandomnessRequested(
        uint256 indexed vrfRequestId,
        uint256 participantCount
    );

    event WinnersSelected(
        uint256[] winningTicketIds,
        address[] winningUsers,
        uint256 randomSeed
    );

    event BeneficiarySelected(
        address indexed winningBeneficiary,
        uint256 totalVotes
    );

    event PrizesDistributed(
        uint256 totalPool,
        uint256 winnerPool,
        uint256 beneficiaryPool,
        address winningBeneficiary
    );

    event PrizeClaimed(
        uint256 indexed ticketId,
        address indexed claimer,
        uint256 amount
    );

    event RefundIssued(
        address indexed user,
        uint256 amount,
        uint8 ticketCount
    );

    event EmergencyWithdrawal(
        address indexed operator,
        uint256 amount,
        string reason
    );

    /**
     * @dev Purchase tickets for the raffle
     * @param quantity Number of tickets to purchase (1-100)
     * @param beneficiaryVote Address of preferred beneficiary
     * @return ticketIds Array of minted NFT ticket IDs
     */
    function purchaseTickets(uint8 quantity, address beneficiaryVote) 
        external 
        payable 
        returns (uint256[] memory ticketIds);

    /**
     * @dev Get participant information
     * @param user The participant address
     * @return participant Participant details
     */
    function getParticipant(address user) 
        external 
        view 
        returns (Participant memory participant);

    /**
     * @dev Get total number of unique participants
     * @return count Number of unique participants
     */
    function getParticipantCount() 
        external 
        view 
        returns (uint256 count);

    /**
     * @dev Get current prize pool information
     * @return totalPool Total WLD collected
     * @return ticketCount Total tickets sold
     */
    function getPrizePool() 
        external 
        view 
        returns (uint256 totalPool, uint256 ticketCount);

    /**
     * @dev Get beneficiary vote tallies
     * @param beneficiary The beneficiary address to check
     * @return votes Number of votes received
     */
    function getBeneficiaryVotes(address beneficiary) 
        external 
        view 
        returns (uint256 votes);

    /**
     * @dev Get all beneficiary addresses with their vote counts
     * @return beneficiaries Array of beneficiary addresses
     * @return voteCounts Array of corresponding vote counts
     */
    function getAllBeneficiaryVotes() 
        external 
        view 
        returns (address[] memory beneficiaries, uint256[] memory voteCounts);

    /**
     * @dev Request randomness for winner selection (operator only)
     * @return vrfRequestId The Chainlink VRF request ID
     */
    function requestRandomness() 
        external 
        returns (uint256 vrfRequestId);

    /**
     * @dev Fulfill randomness callback (VRF Coordinator only)
     * @param requestId The VRF request ID
     * @param randomness The random number provided by VRF
     */
    function fulfillRandomness(uint256 requestId, uint256 randomness) 
        external;

    /**
     * @dev Claim prize for winning ticket
     * @param ticketId The winning NFT ticket ID
     * @param recipient Address to receive the prize
     */
    function claimPrize(uint256 ticketId, address recipient) 
        external;

    /**
     * @dev Claim refund for cancelled/invalid raffle
     * @param ticketIds Array of ticket IDs to refund
     */
    function claimRefund(uint256[] calldata ticketIds) 
        external;

    /**
     * @dev Distribute prizes to winners and beneficiaries
     * @dev Can be called by anyone after winners are selected
     */
    function distributePrizes() 
        external;

    /**
     * @dev Check if ticket is eligible for prize claim
     * @param ticketId The NFT ticket ID
     * @return isWinning True if ticket won a prize
     * @return prizeAmount Amount of WLD prize
     * @return isClaimed True if already claimed
     */
    function checkPrizeEligibility(uint256 ticketId) 
        external 
        view 
        returns (bool isWinning, uint256 prizeAmount, bool isClaimed);

    /**
     * @dev Get prize distribution details
     * @return distribution Complete prize distribution information
     */
    function getPrizeDistribution() 
        external 
        view 
        returns (PrizeDistribution memory distribution);

    /**
     * @dev Emergency withdrawal (operator only, for cancelled raffles)
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal
     */
    function emergencyWithdraw(uint256 amount, string calldata reason) 
        external;

    /**
     * @dev Check if raffle can start drawing phase
     * @return canDraw True if raffle meets minimum participants
     * @return participantCount Current participant count
     * @return minimumRequired Minimum participants required
     */
    function canStartDrawing() 
        external 
        view 
        returns (bool canDraw, uint256 participantCount, uint256 minimumRequired);

    /**
     * @dev Get raffle configuration from factory
     * @return operator Raffle operator address
     * @return ticketPrice Price per ticket in WLD
     * @return maxEntriesPerUser Maximum tickets per user
     * @return numWinners Number of winners
     * @return winnerPercentage Percentage for winners
     * @return beneficiaryPercentage Percentage for beneficiaries
     * @return entryStart Entry period start timestamp
     * @return entryEnd Entry period end timestamp
     */
    function getRaffleConfig() 
        external 
        view 
        returns (
            address operator,
            uint256 ticketPrice,
            uint8 maxEntriesPerUser,
            uint8 numWinners,
            uint8 winnerPercentage,
            uint8 beneficiaryPercentage,
            uint256 entryStart,
            uint256 entryEnd
        );

    /**
     * @dev Get raffle factory contract address
     * @return factory Address of the RaffleFactory contract
     */
    function raffleFactory() external view returns (address factory);

    /**
     * @dev Get raffle ID
     * @return raffleId The unique raffle identifier
     */
    function raffleId() external view returns (uint256 raffleId);

    /**
     * @dev Get ticket NFT contract address
     * @return ticketContract Address of the SoulboundTicket contract
     */
    function ticketContract() external view returns (address ticketContract);

    /**
     * @dev Get VRF request ID for transparency
     * @return requestId Current VRF request ID (0 if none)
     */
    function vrfRequestId() external view returns (uint256 requestId);
}