# Project Structure: Goblin Gardens

## Root Configuration
- `devvit.json`: Devvit app configuration with post/server entry points
- `package.json`: Dependencies and build scripts (includes React Three Fiber stack)
- `tsconfig.json`: TypeScript project references (build-only)
- `eslint.config.js`: ESLint configuration with environment-specific rules

## Source Organization

### `/src/client/`
React Three Fiber application with Rapier physics

**Main Entry Points:**
- `main.ts`: Bootstrap that launches PileDemo directly
- `PileDemo.tsx`: Main game component (4000+ lines) - the core game
- `DemoApp.tsx`: Physics examples showcase (for reference/testing)
- `index.html`: HTML template with canvas container
- `index.css`: Global styling

**Component Organization:**
- `components/game/3d/`: 3D scene components
  - `CanvasText.tsx`: 3D text rendering
  - `FallingObjects.tsx`: Instanced physics objects (coins, gems, rocks)
  - `ParticleExplosion.tsx`: Visual effects
  - `Lighting.tsx`: Animated fire lights
  - `Floor.tsx`: Shadow plane and colliders
  - `DragZone.tsx`: Interactive drag area visualization
  - `DebugVisuals.tsx`: Debug helpers (axes, indicators)
  - `PointerForceField.tsx`: Mouse/touch interaction physics

- `components/game/ui/`: React UI overlays
  - `PerformanceInfo.tsx`: FPS and device tier display
  - `GemList.tsx`: Inventory management UI
  - `CoinDisplay.tsx`: Coin balance and cost displays

- `components/icons/`: SVG icon components
  - `GemIcons.tsx`: Gem type icons

- `components/`: Shared 3D utilities
  - `CustomDragControls.tsx`: Drag interaction system
  - `DraggableRigidBody.tsx`: Physics-enabled dragging

**Utilities:**
- `utils/colorUtils.ts`: Color palettes and gem/coin colors
- `utils/gemGeneration.ts`: Procedural gem creation with rarities
- `utils/gemValue.ts`: **CRITICAL** - Value calculation (must match server)
- `utils/gemSorting.ts`: Inventory sorting algorithms
- `utils/objectGeneration.tsx`: Instanced mesh generation
- `utils/performanceDetection.ts`: Device tier detection
- `utils/spawnPositions.ts`: Spawn zone coordinates
- `utils/mobileHandlers.ts`: Touch event helpers
- `utils/vector-utils.ts`: 3D math utilities

**Constants:**
- `constants/game.ts`: Level configs, location configs, faucet settings

**Types:**
- `types/game.ts`: Game-specific TypeScript types

**Assets:**
- `public/`: Textures, HDR environments, fonts, Draco decoder
- `models/`: GLTF/GLB 3D models (mushrooms, objects)

### `/src/server/`
Express server with Devvit integration

**Main Server:**
- `index.ts`: Express routes and API endpoints
  - `/api/init`: Initialize player session
  - `/api/player-state/save`: Persist player inventory
  - `/api/player-state/load`: Load player inventory
  - `/api/offers`: Get active marketplace offers
  - `/api/offers/update`: Create/update player's offer
  - `/api/offers/remove`: Remove player's offer
  - `/api/trade/execute`: **ATOMIC** trade transaction
  - `/internal/*`: Devvit lifecycle hooks

**Business Logic:**
- `core/post.ts`: Reddit post creation

**Key Server Functions:**
- `calculateGemValue()`: **CRITICAL** - Must match client calculation exactly
- `getUserPlayerStateKey()`: Redis key generation
- `formatLastActive()`: Timestamp formatting

### `/src/shared/`
Shared types between client and server

**Types:**
- `types/api.ts`: API request/response types
  - `PlayerState`: Coins + gems inventory
  - `Gem`: Full gem object with all properties
  - `ActiveOffer`: Marketplace offer structure
  - Trading request/response types

## Build Output
- `dist/client/`: Built React app with code splitting
- `dist/server/`: Built server bundle (`index.cjs`)

## Architecture Patterns

### React Three Fiber + Rapier
- Declarative 3D scene graph with React components
- Physics simulation via `@react-three/rapier`
- Instanced rendering for performance (hundreds of objects)
- `useFrame` hooks for animation loops

### Physics Optimization
- **Tier-based physics**: Adaptive timestep and solver iterations
- **Sleeping bodies**: Objects at rest skip updates
- **Instanced meshes**: Single draw call for many objects
- **Matrix synchronization**: Manual sync between physics and visuals

### State Management
- React hooks for local state
- Redis for persistent player state
- Sorted sets for marketplace indexing
- Atomic transactions for trading

### Client-Server Sync
- **Value calculation**: Identical logic in client and server
- **Type safety**: Shared TypeScript types
- **API-first**: All state changes via REST endpoints
- **Optimistic updates**: Client updates immediately, syncs with server

## Critical Synchronization Points

⚠️ **These must stay in sync:**

1. **Gem Value Calculation**
   - `src/client/utils/gemValue.ts::calculateGemValue()`
   - `src/server/index.ts::calculateGemValue()`
   - Any mismatch enables trading exploits

2. **Spawn Positions**
   - `src/client/utils/spawnPositions.ts` (constants)
   - `src/client/constants/game.ts` (faucet positions)
   - `src/client/components/game/3d/FallingObjects.tsx` (spawn logic)

3. **Type Definitions**
   - `src/shared/types/api.ts` (API contracts)
   - `src/client/types/game.ts` (game types)
   - Server and client must use identical types

## Performance Considerations

- **Mobile-first**: Touch controls, responsive UI
- **Device detection**: Automatic tier selection
- **Physics budget**: Low tier = 30fps physics, High = 60fps
- **Visual quality**: Always high (shadows, lighting, full object counts)
- **Code splitting**: React lazy loading for demo components