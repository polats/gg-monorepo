# Implementation Plan: Frontend Mock Mode for UI Testing

**Branch**: `002-frontend-mock-mode` | **Date**: 2025-09-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-frontend-mock-mode/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected existing Next.js project with WorldCoin MiniKit integration
   → Set Structure Decision based on project type (web application)
3. Evaluate Constitution Check section below
   → Template constitution, applying simplicity principles
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → No NEEDS CLARIFICATION remain in spec
5. Execute Phase 1 → data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Add frontend mock mode to bypass WorldID/MiniKit requirements for UI testing in development environments. Technical approach creates environment-aware mock layer that simulates WorldCoin functionality without requiring the World app, enabling comprehensive UI testing in standard browsers.

## Technical Context
**Language/Version**: TypeScript 5, Next.js 14.2.6  
**Primary Dependencies**: @worldcoin/minikit-js 1.6.1, React 18  
**Storage**: Local storage for mock user state persistence  
**Testing**: Jest + React Testing Library (existing setup)  
**Target Platform**: Web application (development environment focus)
**Project Type**: web - Next.js frontend enhancement  
**Performance Goals**: No performance impact on production, instant mock responses in development  
**Constraints**: Development-only activation, maintain production WorldID integrity, visual mock indicators  
**Scale/Scope**: Single developer feature, affects all UI components using WorldID/MiniKit

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js app enhancement - no new projects)
- Using framework directly? (Yes - React hooks and Next.js environment variables)
- Single data model? (Yes - mock user data structure)
- Avoiding patterns? (No complex state management - simple React context)

**Architecture**:
- EVERY feature as library? (Mock utilities as reusable components)
- Libraries listed: 
  - mock-minikit: Simulates MiniKit SDK responses
  - mock-user-provider: React context for mock user state
- CLI per library: (No CLI needed - environment variable activation)
- Library docs: Developer documentation for mock mode usage

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (Tests for mock functionality before implementation)
- Git commits show tests before implementation? (Will enforce in tasks)
- Order: Contract→Integration→E2E→Unit strictly followed? (Yes)
- Real dependencies used? (Mock mode tests use actual React Testing Library)
- Integration tests for: Mock mode activation, MiniKit bypass, user state simulation
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? (Console warnings when mock mode active)
- Frontend logs → backend? (Mock mode activity logging)
- Error context sufficient? (Clear mock vs real mode indicators)

**Versioning**:
- Version number assigned? (1.1.0 - minor feature addition)
- BUILD increments on every change? (Automated via CI/CD)
- Breaking changes handled? (No breaking changes - additive feature)

## Project Structure

### Documentation (this feature)
```
specs/002-frontend-mock-mode/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Next.js structure extension
lib/
├── mock/                # Mock utilities (NEW)
│   ├── mock-minikit.ts  # MiniKit SDK simulation
│   ├── mock-users.ts    # Mock user profiles
│   └── environment.ts   # Environment detection
└── hooks/               # Custom React hooks (NEW)
    └── useMockMode.ts   # Mock mode state management

components/
├── providers/           # React context providers (NEW)
│   └── MockModeProvider.tsx
├── Login/              # Existing: extend with mock capability
├── Pay/                # Existing: extend with mock capability
├── Verify/             # Existing: extend with mock capability
└── minikit-provider.tsx # Existing: enhance with mock detection
```

**Structure Decision**: Web application (Option 2) - extending existing Next.js structure

## Phase 0: Outline & Research

Research focuses on mock implementation patterns and environment-based feature toggles:

1. **Mock Implementation Patterns**:
   - Research: React context patterns for development-only features
   - Research: Environment variable best practices in Next.js
   - Research: Mock object patterns for SDK simulation

2. **WorldCoin MiniKit Integration**:
   - Research: Existing MiniKit usage patterns in codebase
   - Research: Command simulation strategies (walletAuth, pay, verify)
   - Research: User state management and persistence

3. **Development Environment Setup**:
   - Research: Next.js environment variable configuration
   - Research: Build-time vs runtime feature toggles
   - Research: Visual development indicators and debugging tools

**Output**: research.md with mock implementation decisions and patterns

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - MockUser: Profile data structure
   - MockWallet: Simulated wallet information
   - EnvironmentConfig: Feature toggle configuration
   - MockMiniKit: SDK response simulation

2. **No API contracts needed**:
   - Frontend-only feature with no backend endpoints
   - Uses existing component interfaces

3. **Generate component tests** from requirements:
   - Mock mode activation tests
   - MiniKit command simulation tests
   - User state management tests
   - Environment detection tests

4. **Extract test scenarios** from user stories:
   - Developer UI testing workflow
   - Mock user profile switching
   - Production safety verification
   - Component integration with mock data

5. **Update CLAUDE.md incrementally**:
   - Add mock mode development context
   - Include testing workflow instructions
   - Document mock vs production distinctions

**Output**: data-model.md, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Build on existing component architecture - enhance rather than replace
- Focus on development experience and testing workflow
- Ensure zero impact on production functionality
- Maintain clear separation between mock and real implementations

**Task Categories**:
1. **Mock Infrastructure** (4-6 tasks):
   - Environment detection and configuration
   - Mock MiniKit SDK implementation
   - Mock user profile management
   - Visual development indicators

2. **Component Enhancement** (6-8 tasks):
   - Extend existing Login component with mock capability
   - Enhance Pay component with mock transaction flow
   - Update Verify component with mock responses
   - Modify MiniKit provider for mock detection

3. **Developer Experience** (3-5 tasks):
   - Mock user switching interface
   - Development documentation
   - Testing utilities and helpers

**Ordering Strategy**:
- Phase A: Mock Infrastructure (foundation)
- Phase B: Component Enhancement (integration)
- Phase C: Developer Experience (usability)

**Estimated Output**: 12-15 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, verify mock mode functionality)

## Complexity Tracking
*No constitutional violations identified - simple additive feature*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None identified | - | - |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research approach defined (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (none in spec)
- [x] Complexity deviations documented (none identified)

---
*Based on Constitution template - See `/memory/constitution.md`*