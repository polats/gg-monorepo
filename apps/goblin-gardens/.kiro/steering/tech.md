# Technology Stack: Goblin Gardens

## Core Technologies

### Frontend
- **React 19**: UI framework with concurrent features
- **React Three Fiber 9**: React renderer for Three.js
- **Three.js 0.178**: 3D graphics library for WebGL rendering
- **@react-three/rapier 2.1**: Physics engine integration (Rapier WASM)
- **@react-three/drei 10**: Useful helpers for R3F (OrbitControls, Stats, etc.)
- **@react-three/postprocessing 3**: Post-processing effects
- **react-router-dom 7**: Client-side routing for demo modes

### Physics & Performance
- **Rapier**: High-performance 3D physics engine (WASM)
- **detect-gpu 5**: Automatic device performance detection
- **r3f-perf 7**: Performance monitoring for React Three Fiber
- **leva 0.10**: Debug controls and tweaking UI

### Backend
- **Devvit 0.12**: Reddit's developer platform
- **Express 5**: Server-side HTTP framework
- **Redis**: Data persistence layer (via Devvit)
- **@devvit/web**: Devvit web integration SDK

### Utilities
- **seedrandom 3**: Deterministic random number generation
- **@use-gesture/react 10**: Touch and mouse gesture handling
- **@react-three/csg 3**: Constructive solid geometry operations

### Build System
- **Vite 6**: Build tool for both client and server bundles
- **TypeScript 5.8**: Primary language with strict type checking
- **ESLint 9**: Code quality with TypeScript rules
- **Prettier 3**: Consistent code formatting
- **tsx 4**: TypeScript execution for local dev server
- **concurrently 9**: Run multiple dev processes in parallel

## Common Commands

```bash
# Development (runs client, server, and devvit in parallel)
npm run dev

# Local development (client + API server, no Devvit)
npm run dev:local

# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Publish for review
npm run launch

# Code quality checks
npm run check

# Individual builds
npm run build:client
npm run build:server

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run prettier
```

## Development Workflow

### Local Development (Recommended for Iteration)
1. Run `npm run dev:local` for fastest development
2. Client serves on `http://localhost:5173` with Vite HMR
3. Mock API server runs on `http://localhost:3000`
4. Features:
   - Instant startup (no Reddit auth)
   - Hot module reloading
   - In-memory storage (Map replaces Redis)
   - Multi-user testing via session usernames
   - CORS enabled for cross-origin requests

### Full Devvit Testing (For Integration)
1. Run `npm run dev` to start all services
2. Devvit creates test subreddit (r/goblin_gardens_dev)
3. Open playtest URL in browser (~30s startup)
4. Test with real Reddit authentication and Redis
5. Features:
   - Real Reddit usernames
   - Persistent Redis storage
   - Production-like environment
   - Multi-user testing with real users

### Build Process
- Client builds to `dist/client` with code splitting
- Server builds to `dist/server` as CommonJS module
- Vite handles React, TypeScript, and asset bundling
- Draco decoder copied to public for GLTF compression

### Local Testing Setup
- **Devvit Shim** (`src/client/devvit-shim.ts`): Mocks @devvit/client for local mode
- **Local Server** (`src/server/local.ts`): Express server with in-memory storage
- **Session Usernames**: Each browser tab gets unique username (Player_ABC123)
- **Multi-User Testing**: Open multiple tabs to test trading between users

## Key Dependencies Explained

### React Three Fiber Ecosystem
- **@react-three/fiber**: Core React renderer for Three.js
- **@react-three/drei**: Pre-built components (OrbitControls, Text3D, etc.)
- **@react-three/rapier**: Physics integration with hooks
- **@react-three/rapier-addons**: Additional physics utilities
- **@react-three/postprocessing**: Bloom, SSAO, etc.

### Physics Engine
- **Rapier**: Rust-based physics compiled to WASM
- Supports rigid bodies, colliders, joints, sensors
- Instanced rigid bodies for performance
- Sleeping optimization for static objects

### Performance Tools
- **detect-gpu**: Detects GPU tier (low/medium/high)
- **r3f-perf**: Real-time FPS, memory, and render stats
- **leva**: Debug UI for tweaking physics parameters

### Type Safety
- Strict TypeScript across client, server, and shared
- Project references for modular compilation
- Shared types in `src/shared/types/`

## Architecture Patterns

### React Three Fiber
- Declarative 3D scene graph
- React components map to Three.js objects
- `useFrame` hook for animation loops
- Automatic memory management

### Physics Integration
- `<Physics>` wrapper provides Rapier context
- `<RigidBody>` components for physics objects
- `<InstancedRigidBodies>` for hundreds of objects
- Manual matrix sync for performance

### State Management
- React hooks for local state
- Redis for persistent state (via Devvit)
- No global state library needed
- API calls for server sync

### Performance Optimization
- Instanced rendering (single draw call for many objects)
- Adaptive physics timestep based on device tier
- Sleeping bodies skip updates
- Code splitting with React.lazy

## Browser Compatibility

- Modern browsers with WebGL 2.0 support
- Mobile Safari (iOS 13+)
- Chrome/Edge (desktop and mobile)
- Firefox (desktop and mobile)
- No IE11 support (uses ES modules)

## Development Tools

- **Vite dev server**: Fast HMR for client code
- **tsx**: Run TypeScript server code directly
- **ESLint**: Catch errors during development
- **Prettier**: Auto-format on save
- **TypeScript**: Type checking in editor
- **React DevTools**: Component inspection
- **Three.js Inspector**: 3D scene debugging