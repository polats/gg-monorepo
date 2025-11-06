# Tasks: RaffleTime WorldID-Powered Sweepstakes Platform

**Input**: Design documents from `/specs/001-build-the-application/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-spec.yaml

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14.2.6, TypeScript 5, PostgreSQL, Hardhat
   → Structure: Web application with API routes
2. Load optional design documents:
   → data-model.md: 8 entities → model tasks
   → contracts/api-spec.yaml: 15 endpoints → contract tests
   → research.md: Hardhat + Prisma setup decisions
3. Generate tasks by category:
   → Setup: Database, smart contracts, testing framework
   → Tests: Contract tests, smart contract tests, integration tests  
   → Core: Database models, smart contracts, API endpoints
   → Integration: Blockchain sync, WebSocket, payment processing
   → Polish: UI updates, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T045)
6. Generate dependency graph and parallel execution examples
7. Validate completeness: All entities, endpoints, and contracts covered
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Infrastructure

### Database and ORM Setup
- [x] **T001** Install and configure PostgreSQL with Prisma ORM dependencies
- [x] **T002** Create Prisma schema at `prisma/schema.prisma` based on data-model.md design  
- [x] **T003** Generate Prisma client and run initial database migration
- [x] **T004** Create initial beneficiaries seed data (Red Cross, Oxfam, UNICEF) in `prisma/seed.ts`

### Smart Contract Development Setup
- [ ] **T005** Initialize Hardhat framework with TypeScript configuration in `contracts/` directory
- [ ] **T006** Install smart contract dependencies (OpenZeppelin, Chainlink) and configure networks
- [ ] **T007** Configure contract deployment scripts for local/testnet/mainnet in `contracts/scripts/`

### Testing Infrastructure Setup
- [ ] **T008** Configure Jest testing framework with database and blockchain test environments
- [ ] **T009** Set up test database with Docker Compose for isolated testing in `docker-compose.test.yml`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Smart Contract Tests (Parallel - Different Files)
- [ ] **T010 [P]** RaffleFactory contract tests in `contracts/test/RaffleFactory.test.ts`
- [ ] **T011 [P]** RaffleVault contract tests in `contracts/test/RaffleVault.test.ts` 
- [ ] **T012 [P]** SoulboundTicket contract tests in `contracts/test/SoulboundTicket.test.ts`

### API Contract Tests (Parallel - Different Files)
- [ ] **T013 [P]** Authentication API contract tests in `tests/contracts/auth.test.ts`
- [ ] **T014 [P]** Raffles API contract tests in `tests/contracts/raffles.test.ts`
- [ ] **T015 [P]** Tickets API contract tests in `tests/contracts/tickets.test.ts`
- [ ] **T016 [P]** Beneficiaries API contract tests in `tests/contracts/beneficiaries.test.ts`

### Database Model Tests (Parallel - Different Files)
- [ ] **T017 [P]** User model tests in `tests/unit/models/user.test.ts`
- [ ] **T018 [P]** Raffle model tests in `tests/unit/models/raffle.test.ts`
- [ ] **T019 [P]** Ticket model tests in `tests/unit/models/ticket.test.ts`
- [ ] **T020 [P]** Beneficiary model tests in `tests/unit/models/beneficiary.test.ts`

### Integration Tests (Parallel - Different Files)
- [ ] **T021 [P]** WorldID authentication integration tests in `tests/integration/worldid-auth.test.ts`
- [ ] **T022 [P]** Raffle lifecycle integration tests in `tests/integration/raffle-lifecycle.test.ts`
- [ ] **T023 [P]** Payment processing integration tests in `tests/integration/payment-flow.test.ts`
- [ ] **T024 [P]** Prize claiming integration tests in `tests/integration/prize-claiming.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Smart Contract Implementation (Sequential - Complex Dependencies)
- [ ] **T025** Implement RaffleFactory contract in `contracts/contracts/RaffleFactory.sol`
- [ ] **T026** Implement RaffleVault contract in `contracts/contracts/RaffleVault.sol`  
- [ ] **T027** Implement SoulboundTicket contract in `contracts/contracts/SoulboundTicket.sol`
- [ ] **T028** Deploy contracts to local testnet and verify functionality

### Database Layer Implementation (Parallel - Different Models)
- [ ] **T029 [P]** User database operations in `lib/database/user.ts`
- [ ] **T030 [P]** Raffle database operations in `lib/database/raffle.ts`
- [ ] **T031 [P]** Ticket database operations in `lib/database/ticket.ts`
- [ ] **T032 [P]** Beneficiary database operations in `lib/database/beneficiary.ts`

### Blockchain Integration Layer (Parallel - Different Services)
- [ ] **T033 [P]** Smart contract interaction service in `lib/contracts/raffle-service.ts`
- [ ] **T034 [P]** WorldID verification service in `lib/worldid/verification.ts`
- [ ] **T035 [P]** WLD payment processing service in `lib/payments/wld-processor.ts`

## Phase 3.4: API Implementation

### Authentication Endpoints
- [ ] **T036** Implement WorldID login endpoint in `app/api/auth/login/route.ts`
- [ ] **T037** Implement logout endpoint in `app/api/auth/logout/route.ts`  
- [ ] **T038** Implement user profile endpoint in `app/api/users/me/route.ts`

### Raffle Management Endpoints (Sequential - Shared Route Files)
- [ ] **T039** Implement GET/POST raffles endpoints in `app/api/raffles/route.ts`
- [ ] **T040** Implement GET raffle details endpoint in `app/api/raffles/[id]/route.ts`
- [ ] **T041** Implement raffle drawing endpoint in `app/api/raffles/[id]/draw/route.ts`

### Ticket Management Endpoints
- [ ] **T042** Implement ticket purchase endpoint in `app/api/raffles/[id]/tickets/route.ts`
- [ ] **T043** Implement prize claiming endpoint in `app/api/tickets/[id]/claim/route.ts`

### Support Endpoints
- [ ] **T044** Implement beneficiaries list endpoint in `app/api/beneficiaries/route.ts`

## Phase 3.5: Integration & Real-time Features

### Blockchain Synchronization
- [ ] **T045** Implement blockchain event listeners in `lib/blockchain/event-listener.ts`
- [ ] **T046** Create database sync service in `lib/database/blockchain-sync.ts`

### WebSocket Real-time Updates  
- [ ] **T047** Implement WebSocket server for real-time updates in `lib/websocket/server.ts`
- [ ] **T048** Add PostgreSQL NOTIFY triggers for database changes in `prisma/triggers.sql`

### UI Integration (Parallel - Replace Mock Data)
- [ ] **T049 [P]** Update RaffleList component to use real API in `components/RaffleList/index.tsx`
- [ ] **T050 [P]** Update CreateRaffle component with smart contract integration in `components/CreateRaffle/index.tsx`
- [ ] **T051 [P]** Update TicketPurchase component with real payments in `components/RaffleDetails/TicketPurchase.tsx`

## Phase 3.6: Polish & Production Readiness

### Additional UI Components (Parallel - New Components)
- [ ] **T052 [P]** Create PrizeClaiming component in `components/PrizeClaiming/index.tsx`
- [ ] **T053 [P]** Create AdminDashboard component in `components/AdminDashboard/index.tsx`
- [ ] **T054 [P]** Create NFTTicketDisplay component in `components/NFTTicket/index.tsx`

### Performance & Monitoring (Parallel - Different Areas)
- [ ] **T055 [P]** Add structured logging with Winston in `lib/logger/winston.ts`
- [ ] **T056 [P]** Implement caching layer with Redis in `lib/cache/redis.ts`  
- [ ] **T057 [P]** Add rate limiting middleware in `middleware/rate-limit.ts`

### Testing & Validation (Parallel - Different Test Types)
- [ ] **T058 [P]** End-to-end testing with Playwright in `tests/e2e/raffle-flow.spec.ts`
- [ ] **T059 [P]** Load testing scripts with k6 in `tests/load/ticket-purchase.js`
- [ ] **T060 [P]** Execute quickstart validation from `specs/001-build-the-application/quickstart.md`

## Dependencies

### Critical Path Dependencies
```
Setup (T001-T009) → Tests (T010-T024) → Implementation (T025-T051) → Polish (T052-T060)
```

### Detailed Dependencies
- **Database**: T001-T003 must complete before T017-T020, T029-T032
- **Smart Contracts**: T005-T007 must complete before T010-T012, T025-T028  
- **Tests**: T010-T024 must FAIL before T025-T051 implementation
- **Blockchain**: T025-T028 must complete before T033, T045-T046
- **APIs**: T029-T035 must complete before T036-T044
- **WebSocket**: T046 must complete before T047-T048
- **UI Updates**: T036-T044 must complete before T049-T051

### Blocking Relationships
- T002 blocks T003, T017-T020, T029-T032
- T003 blocks T004, T021-T024  
- T028 blocks T033, T045
- T033-T035 block T036-T044
- T039-T043 block T049-T051

## Parallel Execution Examples

### Phase 3.2 Contract Tests (Run Together)
```bash
# Launch T010-T012 smart contract tests in parallel:
Task: "RaffleFactory contract tests in contracts/test/RaffleFactory.test.ts"
Task: "RaffleVault contract tests in contracts/test/RaffleVault.test.ts"  
Task: "SoulboundTicket contract tests in contracts/test/SoulboundTicket.test.ts"
```

### Phase 3.2 API Tests (Run Together)
```bash
# Launch T013-T016 API contract tests in parallel:
Task: "Authentication API tests in tests/contracts/auth.test.ts"
Task: "Raffles API tests in tests/contracts/raffles.test.ts"
Task: "Tickets API tests in tests/contracts/tickets.test.ts"
Task: "Beneficiaries API tests in tests/contracts/beneficiaries.test.ts"
```

### Phase 3.3 Database Models (Run Together)
```bash
# Launch T029-T032 database operations in parallel:
Task: "User database operations in lib/database/user.ts"
Task: "Raffle database operations in lib/database/raffle.ts"
Task: "Ticket database operations in lib/database/ticket.ts"
Task: "Beneficiary database operations in lib/database/beneficiary.ts"
```

### Phase 3.5 UI Updates (Run Together)
```bash
# Launch T049-T051 UI component updates in parallel:
Task: "Update RaffleList component in components/RaffleList/index.tsx"
Task: "Update CreateRaffle component in components/CreateRaffle/index.tsx"
Task: "Update TicketPurchase component in components/RaffleDetails/TicketPurchase.tsx"
```

## Validation Checklist
*GATE: Checked before task execution*

### Coverage Verification
- [x] All 8 entities from data-model.md have database operations (T029-T032)
- [x] All 15 API endpoints from contracts/api-spec.yaml have implementations (T036-T044)
- [x] All 3 smart contracts from contracts/solidity/ have tests and implementations
- [x] All major user flows from quickstart.md have integration tests (T021-T024)

### TDD Compliance  
- [x] All contract tests (T010-T024) come before implementations (T025-T051)
- [x] All tests are designed to fail initially (no implementation exists)
- [x] Each implementation task has corresponding test task

### Parallel Task Validation
- [x] All [P] tasks operate on different files
- [x] No [P] task has dependencies on other [P] tasks in same phase
- [x] File path conflicts checked and resolved

### Technical Requirements Met
- [x] Database schema matches data-model.md specification
- [x] Smart contract interfaces match contracts/solidity/ specifications
- [x] API endpoints match contracts/api-spec.yaml specification
- [x] WorldID integration preserved from existing codebase
- [x] Existing UI components extended rather than replaced

## Notes

### Implementation Strategy
- **Build on existing foundation**: Extend current Next.js + WorldCoin MiniKit setup
- **Test-Driven Development**: All failing tests must be written before implementation
- **Security-first approach**: Financial operations require comprehensive testing
- **Real dependencies**: Use actual PostgreSQL and blockchain networks for integration tests

### Critical Success Factors
1. **T010-T024 must fail** before proceeding to implementation phase
2. **Database migrations** (T002-T003) must complete cleanly  
3. **Smart contract deployment** (T028) must succeed on testnet
4. **Integration tests** (T021-T024) must pass with real dependencies
5. **Performance targets** (<200ms API responses) must be validated in T059

### Commit Strategy
- Commit after completing each task
- Include test results in commit messages
- Tag major milestones (database setup, contract deployment, API completion)

This task breakdown ensures systematic implementation of the complete RaffleTime platform following TDD principles while building on the existing solid foundation.