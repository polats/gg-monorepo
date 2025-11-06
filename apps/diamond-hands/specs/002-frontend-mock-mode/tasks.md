# Tasks: Frontend Mock Mode for UI Testing

**Input**: Design documents from `/specs/002-frontend-mock-mode/`  
**Prerequisites**: plan.md (required), research.md, data-model.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extracted: TypeScript 5, Next.js 14.2.6, React 18, @worldcoin/minikit-js
2. Load optional design documents:
   → data-model.md: MockUser, MockWallet, MockTransaction, EnvironmentConfig entities
   → research.md: React Context + Environment Variables, Proxy Pattern decisions
   → quickstart.md: 5 mock personas, environment configuration, testing scenarios
3. Generate tasks by category:
   → Setup: environment detection, mock infrastructure
   → Tests: integration tests for mock functionality
   → Core: mock MiniKit, user management, component enhancement
   → Integration: React context, environment detection
   → Polish: visual indicators, developer tools, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Environment Detection

- [x] T001 Create environment configuration utility in lib/mock/environment.ts
- [x] T002 [P] Add mock mode environment variables to .env.local
- [x] T003 [P] Install development dependencies for mock testing (if needed)

## Phase 3.2: Tests First (TDD) ✅ COMPLETED - ALL TESTS FAILING AS REQUIRED
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Integration test mock mode activation in __tests__/mock-mode/activation.test.tsx
- [x] T005 [P] Integration test MiniKit mock responses in __tests__/mock-mode/minikit-simulation.test.tsx
- [x] T006 [P] Integration test user persona switching in __tests__/mock-mode/user-switching.test.tsx
- [x] T007 [P] Integration test component behavior with mock data in __tests__/mock-mode/component-integration.test.tsx
- [x] T008 [P] Integration test production safety (mock code removal) in __tests__/mock-mode/production-safety.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Mock Infrastructure
- [x] T009 [P] MockUser types and interfaces in lib/mock/types.ts
- [x] T010 [P] Mock user profiles and personas in lib/mock/mock-users.ts
- [x] T011 [P] Mock MiniKit SDK simulation in lib/mock/mock-minikit.ts
- [x] T012 [P] Mock response generator utility in lib/mock/response-generator.ts

### React Context & Hooks
- [x] T013 [P] React Context for mock mode state in components/providers/MockModeProvider.tsx
- [x] T014 [P] Custom hook for mock mode functionality in lib/hooks/useMockMode.ts

### Component Integration
- [x] T015 Enhance MiniKit provider with mock detection in components/minikit-provider.tsx
- [x] T016 Extend Login component with mock capability in components/Login/index.tsx
- [x] T017 [P] Extend Pay component with mock transaction flow in components/Pay/index.tsx
- [x] T018 [P] Extend Verify component with mock responses in components/Verify/index.tsx

## Phase 3.4: Integration & User Experience

- [ ] T019 [P] Visual mock mode indicators component in components/MockIndicators/index.tsx
- [ ] T020 [P] Developer console utilities for user switching in lib/mock/developer-console.ts
- [ ] T021 Mock mode session persistence with localStorage in lib/mock/session-storage.ts
- [ ] T022 Global mock mode initialization and window object setup in lib/mock/global-setup.ts

## Phase 3.5: Polish & Developer Tools

- [ ] T023 [P] Unit tests for mock response generation in __tests__/unit/mock-response-generator.test.ts
- [ ] T024 [P] Unit tests for user persona management in __tests__/unit/mock-users.test.ts
- [ ] T025 [P] Unit tests for environment detection in __tests__/unit/environment.test.ts
- [ ] T026 [P] Performance tests for mock response timing in __tests__/performance/mock-timing.test.ts
- [ ] T027 Mock mode debugging and logging utilities in lib/mock/debug-logger.ts
- [ ] T028 Update Next.js configuration for tree-shaking in next.config.js
- [ ] T029 Run quickstart.md testing scenarios and validate all mock personas work

## Dependencies

**Setup → Tests → Core → Integration → Polish**

- Tests (T004-T008) before implementation (T009-T022)
- T001 blocks T009, T013, T015 (environment detection needed first)
- T009 blocks T010, T011, T014 (types needed first)
- T013 blocks T015, T016, T017, T018 (context provider needed for components)
- T015 blocks T016, T017, T018 (enhanced provider needed for components)
- Implementation (T009-T022) before polish (T023-T029)

## Parallel Example

```
# Launch T004-T008 together (Tests Phase):
Task: "Integration test mock mode activation in __tests__/mock-mode/activation.test.tsx"
Task: "Integration test MiniKit mock responses in __tests__/mock-mode/minikit-simulation.test.tsx"
Task: "Integration test user persona switching in __tests__/mock-mode/user-switching.test.tsx"
Task: "Integration test component behavior with mock data in __tests__/mock-mode/component-integration.test.tsx"
Task: "Integration test production safety in __tests__/mock-mode/production-safety.test.tsx"

# Launch T009-T012 together (Mock Infrastructure):
Task: "MockUser types and interfaces in lib/mock/types.ts"
Task: "Mock user profiles and personas in lib/mock/mock-users.ts"
Task: "Mock MiniKit SDK simulation in lib/mock/mock-minikit.ts"
Task: "Mock response generator utility in lib/mock/response-generator.ts"

# Launch T017-T018 together (Component Extensions):
Task: "Extend Pay component with mock transaction flow in components/Pay/index.tsx"
Task: "Extend Verify component with mock responses in components/Verify/index.tsx"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Mock mode must be completely disabled in production builds
- Visual indicators required when mock mode is active
- Support for 5 mock personas: new-user, active-user, power-user, vip-user, problem-user

## Task Generation Rules
*Applied during main() execution*

1. **From Data Model**:
   - MockUser, MockWallet, MockTransaction entities → type definition tasks [P]
   - React Context structure → provider and hook tasks
   - Environment configuration → setup tasks

2. **From Research Decisions**:
   - React Context + Environment Variables → context provider task
   - Proxy Pattern for MiniKit → mock SDK simulation task
   - Component-level integration → component enhancement tasks

3. **From Quickstart Scenarios**:
   - Mock persona testing → user switching integration tests [P]
   - Production safety → tree-shaking and build configuration tests [P]
   - Developer experience → visual indicators and debugging tools

4. **Ordering**:
   - Environment Setup → Tests → Mock Infrastructure → React Integration → Component Enhancement → Developer Tools

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All quickstart scenarios have corresponding tests
- [x] All data model entities have implementation tasks  
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Production safety requirements covered
- [x] Environment detection and configuration included
- [x] Visual indicators and developer experience covered