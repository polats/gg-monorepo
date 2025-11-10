# Kiro Configuration Updates - Goblin Gardens

This document summarizes the updates made to Kiro steering rules and agent hooks to better support the Goblin Gardens project.

## Summary of Changes

### Steering Files Updated

1. **product.md** - Completely rewritten
   - Changed from generic "Earth visualization" to detailed Goblin Gardens description
   - Added game mechanics overview (Scrounge, Garden, Trading)
   - Documented gem system, economy, and performance optimization
   - Included Goblincore aesthetic and design philosophy

2. **structure.md** - Completely rewritten
   - Updated to reflect React Three Fiber + Rapier architecture
   - Documented actual component organization (3d/, ui/, utils/)
   - Added critical synchronization points (gem value, spawn positions, types)
   - Included performance considerations and mobile-first approach

3. **tech.md** - Completely rewritten
   - Added complete React Three Fiber stack (@react-three/fiber, drei, rapier)
   - Documented React 19, physics engine, performance tools
   - Updated build commands and development workflow
   - Added explanations of key dependencies

### New Steering Files Created

4. **game-mechanics.md** - NEW
   - Comprehensive documentation of all game systems
   - Gem value calculation formula (CRITICAL for security)
   - Growth system, trading system, economy
   - Physics optimization tiers
   - Common pitfalls and testing checklist

5. **three-fiber-patterns.md** - NEW (conditional: only for client files)
   - React Three Fiber best practices
   - Rapier physics integration patterns
   - Performance optimization techniques
   - Mobile optimization strategies
   - Goblin Gardens-specific patterns
   - Common pitfalls and debugging tips

6. **local-development.md** - NEW
   - Local testing setup and architecture
   - Multi-user testing with session usernames
   - Local vs Devvit mode comparison
   - Debugging and troubleshooting guide
   - Best practices for development workflow

### Agent Hooks - Deleted

- **client-readme-updater.kiro.hook** - DELETED
  - Reason: Too noisy, triggered on every client file change
  - Better to update README manually when needed

- **template-cleanup-hook.kiro.hook** - DELETED
  - Reason: No longer relevant (template already customized)

### Agent Hooks - Created

6. **gem-value-validator.kiro.hook** - NEW
   - Triggers: When gemValue.ts or server index.ts changes
   - Purpose: Validates client/server value calculations match
   - Security: Prevents trading exploits from calculation mismatches
   - Action: Compares constants and formula between client and server

7. **physics-performance-check.kiro.hook** - NEW
   - Triggers: When physics components or configs change
   - Purpose: Catches performance issues before they ship
   - Checks: Object counts, physics settings, frame loop optimization
   - Action: Suggests optimizations for mobile devices

8. **api-type-sync.kiro.hook** - NEW
   - Triggers: When API types or server endpoints change
   - Purpose: Keeps client and server type definitions in sync
   - Checks: Shared types, request/response pairs, endpoint paths
   - Action: Reports mismatches and suggests updates

9. **devvit-shim-validator.kiro.hook** - NEW
   - Triggers: When client code or devvit-shim.ts changes
   - Purpose: Ensures local development compatibility
   - Checks: @devvit/client imports have shim fallbacks
   - Action: Suggests mock implementations for missing functions

10. **local-server-sync.kiro.hook** - NEW
    - Triggers: When server index.ts or local.ts changes
    - Purpose: Keeps local mock server in sync with production
    - Checks: API endpoints, types, critical logic (gem values)
    - Action: Flags discrepancies between servers

11. **local-to-devvit-checklist.kiro.hook** - NEW (Manual)
    - Triggers: When server or client code changes (disabled by default)
    - Purpose: Provides transition checklist for Devvit testing
    - Checks: Code compatibility, build process, configuration
    - Action: Generates pre-flight checklist and testing steps

12. **multi-user-test-helper.kiro.hook** - NEW (Manual)
    - Triggers: When trading/multiplayer code changes (disabled by default)
    - Purpose: Generates multi-user test scenarios
    - Checks: Recent changes to trading system
    - Action: Provides step-by-step testing instructions for multiple tabs

### Agent Hooks - Updated

9. **splash-screen-generator.kiro.hook** - UPDATED
   - Changed: Disabled by default (was auto-triggering)
   - Updated: Goblincore-specific design requirements
   - Reason: Too noisy to auto-trigger, better as manual tool

10. **devvit-fetch-guide.kiro.hook** - KEPT AS-IS
    - Still useful for external API guidance
    - No changes needed

### Other Files Updated

11. **README.md** - Completely rewritten
    - Changed from template description to Goblin Gardens game description
    - Added gameplay overview, features, and mechanics
    - Updated commands and project structure
    - Added gem value formula and economy explanation

## What These Changes Accomplish

### Better Context for AI
- Steering files now describe the actual game, not a template
- AI understands the gem system, trading, and physics
- Clear documentation of critical sync points

### Security & Quality
- Gem value validator prevents trading exploits
- Physics performance check catches mobile issues
- API type sync prevents client/server mismatches

### Developer Experience
- Three.js patterns guide for R3F best practices
- Game mechanics reference for understanding systems
- Reduced noise from auto-triggering hooks

### Maintainability
- Critical synchronization points documented
- Common pitfalls listed with solutions
- Testing checklists for new features

## How to Use

### For Development
1. Read `game-mechanics.md` to understand game systems
2. Reference `three-fiber-patterns.md` when writing 3D components
3. Check `structure.md` for project organization
4. Use `tech.md` for technology stack reference
5. Follow `local-development.md` for local testing workflow

### For AI Assistance
- Steering files are automatically included in AI context
- Hooks trigger automatically on relevant file changes
- AI will validate critical changes (gem values, types, etc.)

### For Manual Tasks
- Enable `splash-screen-generator.kiro.hook` when updating splash screen
- Run `npm run check` before committing
- Test on mobile device after physics changes

## Critical Reminders

⚠️ **ALWAYS keep these in sync:**
1. Gem value calculation (client utils/gemValue.ts ↔ server index.ts)
2. Spawn positions (utils/spawnPositions.ts ↔ constants/game.ts ↔ FallingObjects.tsx)
3. Type definitions (shared/types/api.ts ↔ client ↔ server)

⚠️ **NEVER access physics bodies:**
- During scene transitions (check `isTransitioningRef.current`)
- Without null checks
- In multiple useFrame loops (use MasterPhysicsLoop)

⚠️ **ALWAYS test on:**
- Mobile device (touch controls)
- Low-end device (performance)
- Multiple users (trading)

## Next Steps

Consider creating these additional hooks in the future:
- **trading-system-validator**: Validates atomic transaction logic
- **spawn-position-sync**: Ensures faucets and spawn positions match
- **mobile-touch-validator**: Checks touch target sizes and scroll detection
- **redis-key-validator**: Ensures Redis key naming conventions are followed
- **performance-regression-detector**: Compares FPS before/after changes

## Questions?

Refer to the individual steering files for detailed information:
- `.kiro/steering/product.md` - What is Goblin Gardens?
- `.kiro/steering/structure.md` - How is the code organized?
- `.kiro/steering/tech.md` - What technologies are used?
- `.kiro/steering/game-mechanics.md` - How do game systems work?
- `.kiro/steering/three-fiber-patterns.md` - How to write R3F code?
