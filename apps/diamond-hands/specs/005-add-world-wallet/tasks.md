# Tasks: World Wallet Login and Balance Display for Diamond Hands Minigame

**Input**: Design documents from `/specs/005-add-world-wallet/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend Components**: `components/` at repository root
- **Hooks**: `lib/hooks/`
- **Types**: `types/`
- **Tests**: `__tests__/` within component directories

## Phase 3.1: Setup
- [x] T001 Create type definitions for wallet entities in types/wallet.ts
- [x] T002 [P] Set up test environment for wallet components in __tests__/setup/wallet-test-utils.ts
- [x] T003 [P] Configure mock wallet data for testing in lib/mock/mock-wallet-data.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Unit test for WalletConnection component in components/WalletConnection/__tests__/WalletConnection.test.tsx
- [x] T005 [P] Unit test for useWalletConnection hook in lib/hooks/__tests__/useWalletConnection.test.ts
- [x] T006 [P] Unit test for useWalletBalance hook in lib/hooks/__tests__/useWalletBalance.test.ts
- [x] T007 [P] Integration test for wallet connection flow in __tests__/integration/wallet-connection-flow.test.tsx
- [x] T008 [P] Integration test for balance refresh in __tests__/integration/balance-refresh.test.tsx
- [x] T009 [P] Integration test for session persistence in __tests__/integration/session-persistence.test.tsx
- [x] T010 [P] Test for DepositWorkflow wallet integration in components/minigame/__tests__/DepositWorkflow.integration.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T011 [P] Create useWalletConnection hook with MiniKit integration in lib/hooks/useWalletConnection.ts
- [x] T012 [P] Create useWalletBalance hook for balance management in lib/hooks/useWalletBalance.ts
- [x] T013 [P] Create useWalletSession hook for localStorage persistence in lib/hooks/useWalletSession.ts
- [x] T014 [P] Implement WalletConnection component UI in components/WalletConnection/index.tsx
- [x] T015 [P] Implement BalanceDisplay component in components/WalletConnection/BalanceDisplay.tsx
- [x] T016 [P] Create wallet utility functions in lib/utils/wallet.ts
- [x] T017 Integrate WalletConnection into DepositWorkflow component at components/minigame/DepositWorkflow.tsx
- [x] T018 Add wallet state to MinigameApp navigation logic in components/minigame/MinigameApp.tsx

## Phase 3.4: Integration
- [x] T019 Connect wallet hooks to existing MiniKit provider
- [x] T020 Implement error handling for wallet operations
- [x] T021 Add wallet connection status to minigame header
- [x] T022 Implement balance validation for deposits
- [x] T023 Add mock mode support for wallet operations

## Phase 3.5: Polish
- [x] T024 [P] Add loading states and transitions for wallet UI in components/WalletConnection/LoadingStates.tsx
- [x] T025 [P] Create error message components in components/WalletConnection/ErrorMessages.tsx
- [x] T026 [P] Add accessibility attributes to wallet components
- [x] T027 Performance optimization for balance refresh
- [x] T028 [P] Update component documentation
- [x] T029 Run quickstart validation scenarios
- [x] T030 Verify mock mode works with all user personas

## Dependencies
- Type definitions (T001) before all implementation
- Tests (T004-T010) must fail before implementation (T011-T018)
- Hooks (T011-T013) before components (T014-T015)
- Component implementation before integration (T017-T018)
- Core complete before integration phase (T019-T023)
- All implementation before polish phase (T024-T030)

## Parallel Example
```bash
# Launch T004-T010 together (all test files):
Task: "Unit test for WalletConnection component"
Task: "Unit test for useWalletConnection hook"
Task: "Unit test for useWalletBalance hook"
Task: "Integration test for wallet connection flow"
Task: "Integration test for balance refresh"
Task: "Integration test for session persistence"
Task: "Test for DepositWorkflow wallet integration"

# Launch T011-T016 together (independent implementations):
Task: "Create useWalletConnection hook"
Task: "Create useWalletBalance hook"
Task: "Create useWalletSession hook"
Task: "Implement WalletConnection component"
Task: "Implement BalanceDisplay component"
Task: "Create wallet utility functions"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify all tests fail before implementing
- Use existing MiniKit patterns from components/Login/index.tsx
- Reuse mock infrastructure from lib/mock/
- Maintain consistency with existing UI patterns
- Test with both mock and real MiniKit modes

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - wallet-api.json → Generated connection, balance, and session tests

2. **From Data Model**:
   - WalletConnection entity → useWalletConnection hook and component
   - WalletBalance entity → useWalletBalance hook and BalanceDisplay
   - UserSession entity → useWalletSession hook for persistence

3. **From User Stories**:
   - First-time connection → T007 integration test
   - Balance refresh → T008 integration test
   - Session persistence → T009 integration test
   - Deposit validation → T022 implementation

4. **Ordering**:
   - Setup → Tests → Hooks → Components → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T004-T010)
- [x] All entities have implementation tasks (T011-T016)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration with existing codebase specified (T017-T018)
- [x] Mock mode support included (T023, T030)