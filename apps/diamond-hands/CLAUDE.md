# RaffleTime Development Context for Claude Code

## Project Overview
RaffleTime is a WorldID-powered zero-loss on-chain sweepstakes platform where users purchase tickets with WLD tokens, vote for charity beneficiaries, and claim prizes through soulbound NFT tickets.

## Current Architecture
- **Frontend**: Next.js 14.2.6 with TypeScript, Tailwind CSS
- **Authentication**: WorldCoin MiniKit SDK with WorldID verification
- **Blockchain**: Ethereum-compatible smart contracts, Viem for Web3
- **Database**: PostgreSQL with Prisma ORM (to be implemented)
- **Testing**: TDD approach with Jest + React Testing Library

## Existing Foundation (DO NOT REBUILD)
### ✅ Working Components
- WorldID authentication system (`components/Login/`)
- Raffle type definitions (`types/raffle.ts`)
- UI components: RaffleList, RaffleDetails, CreateRaffle, TicketPurchase
- Mock data layer (`lib/mock-data.ts`) - TO BE REPLACED
- Basic API routes structure

### ❌ Implementation Gaps
- Smart contracts (RaffleFactory, RaffleVault, SoulboundTicket)
- Database layer and Prisma schema
- Real WLD payment processing
- NFT ticket minting system
- Prize distribution mechanism
- Real-time WebSocket updates

## Smart Contract Architecture
```
RaffleFactory (master contract)
├── Creates RaffleVault per raffle
├── Manages operator deposits (10 WLD)
├── Handles raffle lifecycle states
└── Integrates with Chainlink VRF

RaffleVault (per-raffle contract)  
├── Holds WLD deposits during active period
├── Mints SoulboundTicket NFTs
├── Records beneficiary votes
└── Distributes prizes after drawing

SoulboundTicket (ERC-721 extension)
├── Non-transferable raffle tickets
├── Contains metadata: raffleId, beneficiaryVote, purchasePrice
└── Enables prize claiming with ownership proof
```

## Database Schema Key Tables
- `users` - WorldID-verified participants
- `raffles` - Raffle configurations and state
- `tickets` - NFT ticket ownership records  
- `beneficiaries` - Verified charity organizations
- `beneficiary_votes` - User votes for charities
- `prize_distributions` - Winner selection and payouts
- `audit_logs` - Complete audit trail

## Development Principles
1. **Build on existing UI foundation** - extend rather than replace
2. **Test-Driven Development** - write failing tests before implementation
3. **Real dependencies in tests** - use actual blockchain networks for integration
4. **Blockchain as source of truth** - database mirrors contract state
5. **Security first** - financial operations require highest confidence

## Key Integration Points
- WorldCoin MiniKit for payments and verification
- Chainlink VRF for provable randomness in winner selection
- PostgreSQL triggers for real-time WebSocket events
- Viem library for all blockchain interactions

## File Structure Extensions Needed
```
lib/
├── contracts/          # Smart contract interactions (NEW)
├── database/          # Prisma schema and operations (NEW)  
├── payments/          # WLD token processing (NEW)
└── worldid/           # Extend existing verification

tests/                 # Comprehensive test suite (NEW)
├── contracts/         # Smart contract unit tests
├── integration/       # API and flow tests  
└── e2e/              # End-to-end user journeys

prisma/               # Database schema and migrations (NEW)
└── schema.prisma
```

## Current Task Context
Working on Spec-Driven Development lifecycle:
- ✅ Main platform specification complete (`specs/001-build-the-application/`)
  - Tasks T001-T004 completed: Database infrastructure setup
  - PostgreSQL + Prisma schema deployed with seed data
- ✅ Frontend mock mode feature (`specs/002-frontend-mock-mode/`)
  - Enables UI testing without WorldCoin app dependency
  - Environment-based activation for development only
  - Mock user personas and simulated MiniKit responses
- 🚧 Pre-Launch Minigame Mode (`specs/003-when-app-is/`)
  - Diamond-hands minigame displays when NEXT_PUBLIC_APP_LAUNCHED=false
  - Ported from React/Vite to Next.js with Framer Motion
  - Client-side only, no persistence required

## Implementation Priority Order
1. **Database Setup**: Implement Prisma schema and migrations
2. **Smart Contracts**: Deploy RaffleFactory, RaffleVault, SoulboundTicket  
3. **Payment Integration**: Connect real WLD token transfers
4. **Backend Integration**: Replace mock data with database queries
5. **Real-time Features**: WebSocket updates and live prize pools
6. **Prize Distribution**: Winner selection and claiming mechanisms

## Testing Strategy
- Smart contracts tested with Hardhat on local blockchain
- API integration tests with real PostgreSQL database
- Frontend tests mock blockchain calls but test real UI flows
- E2E tests run full user journeys on testnets

## Security Considerations
- All financial operations auditable on-chain
- Multi-signature vaults for large prize pools
- Rate limiting on sensitive operations  
- Comprehensive input validation
- WorldID prevents Sybil attacks

## Performance Targets
- <200ms response times (95th percentile)
- Support 1000+ concurrent users
- Real-time updates <1 second propagation
- Handle 100+ concurrent raffles

Remember: This is a financial application handling real value. Prioritize correctness and security over speed of development.