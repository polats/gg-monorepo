# Implementation Plan: Pre-Launch Minigame Mode

**Branch**: `003-when-app-is` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-when-app-is/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: Next.js web application
   → Set Structure Decision: Existing Next.js structure
3. Fill the Constitution Check section based on the content of the constitution document
   → Constitution principles evaluated
4. Evaluate Constitution Check section below
   → All checks passed
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → Analyzed existing minigame code structure
   → Identified integration points with Next.js
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → Data model defined for game state
   → API contracts created for environment detection
   → Quickstart guide written
7. Re-evaluate Constitution Check section
   → All checks still passing
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Task generation approach defined
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement a pre-launch minigame mode that displays the diamond-hands game when the application is not in launched mode. The system checks an environment variable (`NEXT_PUBLIC_APP_LAUNCHED`) to determine whether to show the minigame or the main RaffleTime platform. The minigame will be ported from an existing React/Vite implementation to Next.js, maintaining the same gameplay mechanics and user flow.

## Technical Context
**Language/Version**: TypeScript 5.x / Next.js 14.2.6
**Primary Dependencies**: React 18, Framer Motion, WorldCoin MiniKit, Tailwind CSS
**Storage**: Local state only (no persistence required for minigame)
**Testing**: Jest with React Testing Library
**Target Platform**: Web browsers (mobile & desktop)
**Project Type**: web - Next.js application with integrated minigame
**Performance Goals**: 60fps animations, instant mode switching
**Constraints**: Must integrate with existing MiniKit provider, maintain existing app structure
**Scale/Scope**: Single minigame with 4 screens (tutorial, home, deposit, game)
**User Implementation Details**: Using the game code example in minigame-references/diamond-hands, implement the same game in the currently running next and minikit framework

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Test-First Development**: Will write tests for launch mode detection and game components
- [x] **Code Quality Standards**: Following existing Next.js patterns, TypeScript strict mode
- [x] **Security-First Architecture**: No sensitive data in minigame, environment variable for config
- [x] **Performance Optimization**: Using React optimization patterns from reference implementation
- [x] **User Experience Consistency**: Maintaining design consistency with main app

## Project Structure

### Documentation (this feature)
```
specs/003-when-app-is/
├── plan.md              # This file (COMPLETE)
├── research.md          # Phase 0 output (COMPLETE)
├── data-model.md        # Phase 1 output (COMPLETE)
├── quickstart.md        # Phase 1 output (COMPLETE)
├── contracts/           # Phase 1 output (COMPLETE)
│   └── api-contract.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created)
```

### Source Code (repository root)
```
# Existing Next.js structure
app/
├── page.tsx             # Main entry point - add launch mode check
├── minigame/           # NEW: Minigame components
│   └── page.tsx        # Minigame route
components/
├── minigame/           # NEW: Minigame components
│   ├── Tutorial.tsx
│   ├── HomeScreen.tsx
│   ├── DepositWorkflow.tsx
│   ├── GameScreen.tsx
│   └── CircularCountdown.tsx
└── providers/
    └── LaunchModeProvider.tsx  # NEW: Launch mode context

tests/
├── integration/
│   └── launch-mode.test.tsx
└── unit/
    └── minigame/
        └── game-logic.test.tsx
```

**Structure Decision**: Maintain existing Next.js structure with minigame additions

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - ✓ How to integrate Framer Motion with Next.js
   - ✓ Asset handling differences between Vite and Next.js
   - ✓ Environment variable best practices in Next.js

2. **Generate and dispatch research agents**:
   ```
   ✓ Research: Framer Motion in Next.js App Router
   ✓ Research: Image optimization in Next.js vs Vite
   ✓ Research: Client-side environment variables in Next.js
   ```

3. **Consolidate findings** in `research.md`:
   - Decision: Use next/dynamic for Framer Motion components
   - Rationale: Avoids SSR hydration issues
   - Alternatives considered: Direct import (rejected due to SSR issues)

**Output**: research.md with all clarifications resolved ✓

## Phase 1: Design & Contracts
*Prerequisites: research.md complete ✓*

1. **Extract entities from feature spec** → `data-model.md`:
   - LaunchConfiguration entity
   - GameSession entity
   - GameState management

2. **Generate API contracts** from functional requirements:
   - Environment detection endpoint
   - Game state management (client-side only)
   - Output to `/contracts/api-contract.yaml`

3. **Generate contract tests** from contracts:
   - Launch mode detection tests
   - Game component rendering tests
   - State transition tests

4. **Extract test scenarios** from user stories:
   - Pre-launch mode displays minigame
   - Launch mode displays main app
   - Game mechanics function correctly

5. **Update CLAUDE.md incrementally**:
   - Added minigame integration context
   - Updated with launch mode feature
   - Maintained under 150 lines

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md ✓

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs:
  - Environment variable configuration tasks
  - Component migration tasks (Tutorial, HomeScreen, etc.)
  - Integration tasks for launch mode detection
  - Test implementation tasks

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order:
  1. Environment configuration
  2. Launch mode provider
  3. Minigame components
  4. Integration with main app
- Mark [P] for parallel execution where possible

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - all solutions follow constitutional principles*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach defined)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*