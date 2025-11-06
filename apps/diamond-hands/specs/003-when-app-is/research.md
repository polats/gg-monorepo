# Phase 0: Research & Technical Decisions

## Executive Summary
This document consolidates research findings for implementing the pre-launch minigame mode feature. All technical unknowns have been resolved through analysis of the existing codebase and reference implementation.

## Research Findings

### 1. Framer Motion Integration with Next.js
**Decision**: Use dynamic imports with `ssr: false` for Framer Motion components
**Rationale**: Prevents SSR hydration mismatches while maintaining animation performance
**Alternatives Considered**:
- Direct imports: Rejected due to SSR hydration issues
- CSS-only animations: Rejected due to limited interaction capabilities
- React Spring: Rejected to maintain consistency with reference implementation

**Implementation Pattern**:
```typescript
const GameScreen = dynamic(
  () => import('./minigame/GameScreen'),
  { ssr: false }
);
```

### 2. Asset Handling: Vite → Next.js Migration
**Decision**: Convert Figma assets to public folder static assets
**Rationale**: Next.js doesn't support Vite's figma: protocol imports
**Alternatives Considered**:
- Base64 encoding: Rejected due to bundle size increase
- CDN hosting: Rejected to maintain offline capability
- next/image optimization: Selected for performance benefits

**Migration Pattern**:
```typescript
// From: import diamondImg from 'figma:asset/a873c9fb942c6e4d973274b08ebacd928c30e2f2.png';
// To: import diamondImg from '/images/minigame/diamond.png';
```

### 3. Environment Variable Configuration
**Decision**: Use `NEXT_PUBLIC_APP_LAUNCHED` environment variable
**Rationale**: Client-side accessible, follows Next.js conventions
**Alternatives Considered**:
- Server-side API check: Rejected due to unnecessary complexity
- Build-time configuration: Rejected as it prevents runtime switching
- Feature flags service: Rejected as overkill for binary state

**Default Behavior**:
- Missing/undefined variable = pre-launch mode (show minigame)
- `NEXT_PUBLIC_APP_LAUNCHED=true` = launch mode (show main app)

### 4. Component Architecture
**Decision**: Modular component structure in `components/minigame/`
**Rationale**: Maintains separation from main app, enables easy removal post-launch
**Alternatives Considered**:
- Inline in main app: Rejected due to coupling concerns
- Separate package: Rejected as unnecessarily complex
- Dynamic route: Selected for clean URL structure

### 5. State Management
**Decision**: Local React state with Context API for game state
**Rationale**: No persistence required, simple state transitions
**Alternatives Considered**:
- Redux: Rejected as overkill for isolated feature
- Zustand: Rejected to minimize dependencies
- localStorage: Rejected as persistence not required

### 6. Animation Performance
**Decision**: Use React.memo and useMemo for animation components
**Rationale**: Maintains 60fps target from reference implementation
**Alternatives Considered**:
- No optimization: Rejected due to performance requirements
- Web Workers: Rejected as unnecessary for simple animations
- RAF manual control: Rejected in favor of Framer Motion

### 7. Testing Strategy
**Decision**: Jest + React Testing Library for component tests
**Rationale**: Already configured in project, matches existing patterns
**Alternatives Considered**:
- Playwright e2e: Consider for future comprehensive testing
- Vitest: Rejected to maintain consistency with existing setup
- Cypress: Rejected in favor of simpler RTL approach

## Integration Points

### With Existing Codebase
1. **Layout.tsx**: No changes required, providers already wrap app
2. **MiniKitProvider**: Game works within existing provider structure
3. **MockModeProvider**: Compatible with mock mode for testing
4. **Routing**: New `/minigame` route for dedicated game page

### With Reference Implementation
1. **Component Structure**: 1:1 mapping of game components
2. **Game Logic**: Direct port of price calculation algorithm
3. **UI Elements**: Reuse Tailwind classes and patterns
4. **Assets**: Convert and optimize for Next.js

## Technical Constraints Resolved

1. **SSR Compatibility**: ✓ Dynamic imports with ssr: false
2. **Asset Loading**: ✓ Public folder with next/image
3. **Environment Detection**: ✓ NEXT_PUBLIC_ prefix for client access
4. **Animation Performance**: ✓ Framer Motion with optimization
5. **Type Safety**: ✓ Full TypeScript coverage maintained

## Dependencies Analysis

### Required New Dependencies
```json
{
  "framer-motion": "^11.0.0"  // For animations
}
```

### Existing Dependencies Used
- React 18 (already installed)
- Next.js 14.2.6 (already installed)
- Tailwind CSS (already installed)
- TypeScript (already installed)

## Risk Assessment

### Low Risk
- Component isolation prevents impact on main app
- Environment variable provides clean toggle
- No database or blockchain interactions

### Mitigations
- Feature flag allows instant rollback
- Modular structure enables clean removal
- Comprehensive tests ensure no regressions

## Conclusion
All technical unknowns have been resolved. The implementation path is clear with no blocking dependencies or architectural concerns. The feature can be implemented following the existing Next.js patterns while maintaining the gameplay experience from the reference implementation.