# Tasks: Pre-Launch Minigame Mode

**Input**: Design documents from `/specs/003-when-app-is/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14.2.6, TypeScript, Framer Motion
   → Structure: Existing Next.js with minigame additions
2. Load optional design documents:
   → data-model.md: LaunchConfiguration, GameSession, GameState, TutorialProgress
   → contracts/: api-contract.yaml with data schemas
   → research.md: Dynamic imports, asset migration, env vars
3. Generate tasks by category:
   → Setup: Dependencies, environment config
   → Tests: Launch mode detection, component tests
   → Core: Game components, state management
   → Integration: Route handling, provider integration
   → Polish: Performance, documentation
4. Apply task rules:
   → Component files can be parallel [P]
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T025)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js structure**: `app/`, `components/`, `tests/`
- Assets in `public/images/minigame/`
- Types in `types/minigame/`

## Phase 3.1: Setup & Dependencies
- [x] T001 Install framer-motion dependency: Added to package.json
- [x] T002 Environment configuration: App defaults to minigame unless `NEXT_PUBLIC_APP_LAUNCHED=true`
- [x] T003 [P] Create minigame asset directory structure at `public/images/minigame/`
- [x] T004 [P] Copy and optimize game assets from `minigame-references/diamond-hands/src/assets/` to `public/images/minigame/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Launch mode detection test in `tests/integration/launch-mode.test.tsx`
- [x] T006 [P] Tutorial component test in `tests/unit/minigame/tutorial.test.tsx`
- [x] T007 [P] GameScreen state transitions test in `tests/unit/minigame/game-logic.test.tsx`
- [x] T008 [P] CircularCountdown component test in `tests/unit/minigame/countdown.test.tsx`
- [x] T009 [P] Price volatility calculation test in `tests/unit/minigame/price-engine.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 Create TypeScript types for minigame in `types/minigame/index.ts` (LaunchConfiguration, GameSession, GameState, TutorialProgress)
- [x] T011 [P] Create LaunchModeProvider context in `components/providers/LaunchModeProvider.tsx`
- [x] T012 [P] Port Tutorial component to `components/minigame/Tutorial.tsx` with dynamic import wrapper
- [x] T013 [P] Port HomeScreen component to `components/minigame/HomeScreen.tsx`
- [x] T014 [P] Port DepositWorkflow component to `components/minigame/DepositWorkflow.tsx`
- [x] T015 [P] Port CircularCountdown component to `components/minigame/CircularCountdown.tsx`
- [x] T016 Port GameScreen component to `components/minigame/GameScreen.tsx` with price logic
- [x] T017 Create MinigameApp orchestrator component in `components/minigame/MinigameApp.tsx`
- [x] T018 Create minigame route page in `app/minigame/page.tsx`

## Phase 3.4: Integration
- [x] T019 Modify main `app/page.tsx` to check launch mode and conditionally render/redirect
- [x] T020 Integrate LaunchModeProvider in `app/layout.tsx` provider hierarchy
- [x] T021 Add dynamic imports with SSR disabled for Framer Motion components
- [x] T022 Configure image optimization for minigame assets (using public folder approach)

## Phase 3.5: Polish & Validation
- [x] T023 [P] Performance optimization: Add React.memo to animation components
- [x] T024 [P] Add loading states and error boundaries to minigame components
- [x] T025 Run full quickstart validation checklist: Build successful, TypeScript compilation clean for app code

## Dependencies
- Setup (T001-T004) must complete first
- Tests (T005-T009) before implementation (T010-T018)
- T010 (types) blocks all component implementations
- T011 (provider) blocks T020 (integration)
- All core components (T012-T017) before orchestrator (T017)
- T017 before route page (T018)
- Integration (T019-T022) after core implementation
- Polish (T023-T025) after everything else

## Parallel Execution Examples

### Setup Phase (T003-T004):
```bash
# Can run simultaneously as they touch different directories
Task: "Create minigame asset directory structure at public/images/minigame/"
Task: "Copy and optimize game assets to public/images/minigame/"
```

### Test Phase (T005-T009):
```bash
# All tests can run in parallel - different test files
Task: "Launch mode detection test in tests/integration/launch-mode.test.tsx"
Task: "Tutorial component test in tests/unit/minigame/tutorial.test.tsx"
Task: "GameScreen state transitions test in tests/unit/minigame/game-logic.test.tsx"
Task: "CircularCountdown component test in tests/unit/minigame/countdown.test.tsx"
Task: "Price volatility calculation test in tests/unit/minigame/price-engine.test.tsx"
```

### Component Implementation (T012-T016):
```bash
# Components in different files can be implemented in parallel
Task: "Port Tutorial component to components/minigame/Tutorial.tsx"
Task: "Port HomeScreen component to components/minigame/HomeScreen.tsx"
Task: "Port DepositWorkflow component to components/minigame/DepositWorkflow.tsx"
Task: "Port CircularCountdown component to components/minigame/CircularCountdown.tsx"
```

## Implementation Notes

### Asset Migration Pattern
```typescript
// From Vite: import diamondImg from 'figma:asset/a873c9fb.png';
// To Next.js: import diamondImg from '/images/minigame/diamond.png';
```

### Dynamic Import Pattern
```typescript
const GameScreen = dynamic(
  () => import('@/components/minigame/GameScreen'),
  { ssr: false }
);
```

### Environment Check Pattern
```typescript
const isLaunched = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
// Default to minigame if not set or false
```

## Validation Checklist
*GATE: All must be checked before marking feature complete*

- [ ] All contracts have corresponding tests (T005-T009)
- [ ] All entities have model/type definitions (T010)
- [ ] All tests come before implementation ✓
- [ ] Parallel tasks truly independent ✓
- [ ] Each task specifies exact file path ✓
- [ ] No task modifies same file as another [P] task ✓
- [ ] Launch mode detection works correctly
- [ ] Game flow matches reference implementation
- [ ] Performance targets met (60fps animations)
- [ ] No console errors in any browser

## Success Metrics
- Environment variable correctly controls app mode
- Minigame fully playable with all 4 screens
- Smooth transitions and animations
- No impact on main application functionality
- Easy to remove post-launch if needed

---
*Generated from design documents in `/specs/003-when-app-is/`*