# Research: RaffleTime Implementation Architecture

**Feature**: RaffleTime WorldID-Powered Sweepstakes Platform  
**Date**: 2025-09-08  
**Status**: Complete

## Smart Contract Architecture Decisions

### Decision: Ethereum-Compatible Smart Contracts with Hardhat Framework
**Rationale**: 
- WorldCoin's WLD token is ERC-20 compatible on Ethereum mainnet and World Chain
- Existing viem 2.23.5 dependency provides excellent Ethereum integration
- Hardhat offers best-in-class testing and deployment tools for complex contract suites

**Implementation Pattern**:
- **RaffleFactory**: Master contract for creating and managing raffles
- **RaffleVault**: Individual contract per raffle for WLD token custody
- **SoulboundTicket**: ERC-721 extension with transfer restrictions
- **VRFOracle**: Integration with Chainlink VRF for verifiable randomness

**Alternatives Considered**:
- Foundry: More gas efficient but less ecosystem tooling
- OpenZeppelin upgradeable contracts: Adds complexity, immutable raffles preferred

### Decision: Soulbound NFT Implementation via ERC-721 with Transfer Restrictions
**Rationale**:
- ERC-721 provides standard NFT infrastructure with metadata support  
- Override transfer functions to enforce soulbound behavior
- Metadata includes raffle ID, beneficiary vote, and participation proof

**Implementation Pattern**:
```solidity
contract SoulboundTicket is ERC721 {
    // Override all transfer functions to revert
    function transferFrom() public pure override {
        revert("Soulbound: transfers disabled");
    }
    
    // Prize claiming via signature verification
    function claimPrize(uint256 tokenId, bytes calldata proof) external;
}
```

**Alternatives Considered**:
- ERC-1155 batch tokens: Overkill for individual ticket tracking
- Custom contract standard: Reduces composability with existing tools

### Decision: Chainlink VRF v2 for Verifiable Randomness
**Rationale**:
- Industry standard for blockchain randomness with cryptographic proofs
- Prevents manipulation by raffle operators or miners
- Integrates well with Ethereum ecosystem

**Implementation Pattern**:
- Request randomness when raffle ends and minimum participants met
- Use callback pattern to select winners when randomness fulfilled  
- Store proof of randomness generation in raffle metadata

**Alternatives Considered**:
- Block hash randomness: Manipulatable by miners
- Off-chain randomness with signatures: Less verifiable, requires trusted party

## Database Design Decisions

### Decision: PostgreSQL with Prisma ORM
**Rationale**:
- PostgreSQL provides ACID transactions needed for financial operations
- JSON column support for flexible raffle metadata
- Excellent indexing performance for real-time queries
- Prisma generates type-safe database client matching TypeScript types

**Schema Strategy**:
- Mirror smart contract events in database for fast queries
- Separate tables for Users, Raffles, Tickets, BeneficiaryVotes, PrizeDistributions
- Event sourcing pattern for audit trail of all state changes

**Performance Optimizations**:
- Composite indexes on (raffle_id, user_id) for ticket queries
- Partial indexes on raffle status for active raffle filtering
- Database replication for read-heavy operations

**Alternatives Considered**:
- MongoDB: Flexible but lacks ACID guarantees needed for financial data
- SQLite: Too limited for production scale and concurrent access

### Decision: Real-time Synchronization via WebSockets + Database Triggers
**Rationale**:
- Users need live updates on raffle participation and prize pools
- PostgreSQL triggers can emit events on data changes
- WebSocket connections provide low-latency bidirectional communication

**Implementation Pattern**:
- Next.js API routes with Socket.IO for WebSocket management
- PostgreSQL triggers call NOTIFY for relevant table changes
- Node.js listens to NOTIFY events and broadcasts to connected clients

**Alternatives Considered**:
- Polling: Higher latency and server resource usage
- Server-Sent Events: Unidirectional, can't handle user interactions

## Payment Processing Architecture

### Decision: Direct WLD Token Integration via WorldCoin MiniKit
**Rationale**:
- WorldCoin MiniKit SDK already integrated and working in codebase
- Direct token transfers eliminate third-party payment processor fees
- Native integration with WorldID verification flow

**Transaction Flow**:
1. User initiates ticket purchase via MiniKit payment interface
2. Frontend confirms WLD balance and initiates transfer to raffle vault
3. Smart contract validates payment and mints NFT ticket
4. Database records transaction and updates raffle state
5. WebSocket notifies all clients of participation increase

**Error Handling Strategy**:
- Transaction timeouts: 5-minute expiry with automatic refund
- Failed transfers: Retry mechanism with exponential backoff
- Partial failures: Idempotent operations with transaction IDs

**Alternatives Considered**:
- Third-party processors: Add fees and complexity, reduce user experience
- Multi-token support: Scope creep, WLD-only maintains simplicity

### Decision: Multi-signature Vault Security for Large Prize Pools
**Rationale**:
- Prize pools may reach 100k+ WLD requiring enhanced security
- Multi-sig prevents single point of failure for fund custody
- Transparent on-chain governance for large community raffles

**Implementation Pattern**:
- Gnosis Safe integration for multi-signature functionality
- 3-of-5 signature requirement for prize distributions over 10k WLD
- Time delays for large withdrawals with community override capability

**Alternatives Considered**:
- Single signature contracts: Simpler but higher security risk
- Hardware security modules: Complex integration, reduces decentralization

## Integration Architecture Decisions

### Decision: Hybrid On-chain/Off-chain Architecture
**Rationale**:
- Critical operations (payments, winner selection) on-chain for transparency
- User interactions and real-time updates off-chain for performance
- Best of both worlds: security + user experience

**Data Flow**:
- Smart contracts are source of truth for financial state
- Database mirrors contract state with additional metadata
- Frontend reads from database for performance, writes via contracts

**Synchronization Strategy**:
- Event listeners monitor all contract events
- Database updates triggered by confirmed blockchain events
- Conflict resolution favors on-chain state in disputes

**Alternatives Considered**:
- Fully on-chain: Poor user experience, high gas costs
- Fully off-chain: Reduces transparency and trust

## Development and Testing Strategy

### Decision: Test-Driven Development with Real Dependencies
**Rationale**:
- Financial applications require highest confidence in correctness
- TDD ensures all edge cases considered before implementation
- Real blockchain testing catches integration issues early

**Testing Stack**:
- **Smart Contracts**: Hardhat with Waffle for contract testing
- **Backend**: Jest with real PostgreSQL test database
- **Frontend**: React Testing Library with MSW for API mocking
- **Integration**: Playwright for end-to-end user journeys

**Testing Environment**:
- Local blockchain (Hardhat Network) for fast contract iteration
- Staging environment with testnet (Sepolia/World Chain testnet)
- Real WLD tokens on testnets for payment flow validation

**Alternatives Considered**:
- Mock everything: Faster but misses integration failures
- Unit tests only: Insufficient for complex multi-system interactions

## Security and Compliance Considerations

### Decision: Security-First Development Approach
**Key Principles**:
- All financial operations auditable on-chain
- No private keys stored in application code  
- Rate limiting for all sensitive operations
- Comprehensive input validation and sanitization

**Audit Strategy**:
- Internal security review before testnet deployment
- External smart contract audit for mainnet launch
- Bug bounty program for ongoing security improvements

**Privacy Considerations**:
- WorldID verification provides privacy-preserving identity
- Minimal user data collection (wallet address only)
- GDPR compliance for EU users (right to data deletion)

**Alternatives Considered**:
- Move fast and fix later: Inappropriate for financial applications
- Over-engineering security: Balance security with usability

## Performance and Scalability Planning

### Decision: Horizontal Scaling Architecture
**Performance Targets**:
- <200ms response times for 95% of requests
- Support 1000+ concurrent users during popular raffles
- <100MB memory usage per active raffle

**Scaling Strategy**:
- Database read replicas for query performance
- CDN for static assets and images
- Kubernetes deployment for auto-scaling API servers
- Redis caching for frequently accessed data

**Monitoring and Observability**:
- Structured logging with Winston (JSON format)
- Error tracking with Sentry integration
- Performance monitoring with custom metrics
- Smart contract event monitoring and alerting

**Alternatives Considered**:
- Vertical scaling only: Limited by single machine capacity
- Microservices: Over-engineered for current scope

## Summary of Key Architectural Decisions

1. **Smart Contracts**: Ethereum-compatible with Hardhat, soulbound ERC-721 tickets
2. **Database**: PostgreSQL + Prisma for ACID compliance and performance  
3. **Real-time**: WebSockets + database triggers for live updates
4. **Payments**: Direct WLD integration via WorldCoin MiniKit SDK
5. **Security**: Multi-signature vaults, comprehensive testing, audit-first approach
6. **Architecture**: Hybrid on-chain/off-chain for security + performance balance
7. **Testing**: TDD with real dependencies, comprehensive integration testing
8. **Scaling**: Horizontal scaling with read replicas and caching

These decisions provide a solid foundation for building a production-ready RaffleTime platform that balances security, performance, and user experience while leveraging the existing Next.js + WorldCoin MiniKit foundation.