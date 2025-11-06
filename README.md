# Goblin Gardens Monorepo

A pnpm workspace monorepo containing Diamond Hands and Goblin Gardens applications with shared packages.

## 📁 Project Structure

```
gg-monorepo/
├── apps/
│   ├── diamond-hands/      # World mini app for raffles and prizes
│   └── goblin-gardens/      # 3D game (Reddit + World dual platform)
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Common utility functions
│   └── platform/            # Platform detection (World/Reddit/Local)
├── pnpm-workspace.yaml      # Workspace configuration
└── package.json             # Root package manager
```

## 🎮 Applications

### Diamond Hands
- **Framework**: Next.js 14 (App Router)
- **Platform**: World (Worldcoin)
- **Features**: Raffle system, WorldID verification, wallet integration
- **Database**: PostgreSQL + Prisma

### Goblin Gardens
- **Framework**: Vite + React
- **Platform**: Reddit (Devvit) + World (dual platform support)
- **Features**: 3D physics-based gem collection, trading marketplace
- **Tech**: React Three Fiber, Rapier physics engine

## 📦 Shared Packages

### @gg/types
Common TypeScript type definitions:
- Platform types (World, Reddit, Local)
- User types (WorldUser, RedditUser)
- Game types and enums
- API response types

### @gg/utils
Utility functions:
- String manipulation (truncateAddress, slugify)
- Number formatting (formatCurrency, formatNumber)
- Date utilities (timeAgo, formatDate)
- Validation helpers
- Async utilities (retry, timeout)
- Type-safe localStorage wrapper

### @gg/platform
Platform detection and unified interfaces:
- Automatic platform detection
- Environment configuration
- Feature detection (wallet support, 3D rendering, etc.)
- Platform-specific initialization

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- pnpm >= 9

### Installation

```bash
# Install all dependencies
pnpm install

# Build shared packages
pnpm build
```

### Development

```bash
# Run both apps concurrently
pnpm dev

# Run specific app
pnpm dev:diamond    # Diamond Hands
pnpm dev:goblin     # Goblin Gardens

# Build all packages and apps
pnpm build

# Run tests
pnpm test

# Lint all workspaces
pnpm lint
```

## 🏗️ Architecture

### Monorepo Benefits
- **Code Sharing**: Common types, utilities, and platform logic
- **Unified Dependencies**: Shared devDependencies at root level
- **Atomic Changes**: Make cross-project changes in single commits
- **Type Safety**: Shared types ensure consistency across apps

### Workspace Dependencies
Apps can reference shared packages using workspace protocol:

```json
{
  "dependencies": {
    "@gg/types": "workspace:*",
    "@gg/utils": "workspace:*",
    "@gg/platform": "workspace:*"
  }
}
```

## 🌐 Dual Platform Support

Goblin Gardens runs on both World and Reddit platforms:

```typescript
import { getCurrentPlatform, Platform } from '@gg/platform';

const platform = getCurrentPlatform();

if (platform === Platform.World) {
  // Initialize MiniKit
} else if (platform === Platform.Reddit) {
  // Initialize Devvit
}
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in development mode |
| `pnpm dev:diamond` | Run Diamond Hands only |
| `pnpm dev:goblin` | Run Goblin Gardens only |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all workspaces |
| `pnpm clean` | Clean all node_modules and build artifacts |

## 🔗 Integration Plan

### Phase 1: ✅ Complete
- pnpm workspace setup
- Shared packages created
- Monorepo structure

### Phase 2: In Progress
- Add World MiniKit to Goblin Gardens
- Set up unified routing
- Cross-app component imports

### Phase 3: Planned
- Unified authentication
- Diamond Hands as mini-game route
- Shared game engine components

## 🛠️ Tech Stack

### Frameworks
- Next.js 14 (Diamond Hands)
- Vite 6 (Goblin Gardens)
- React 18/19

### Platform SDKs
- @worldcoin/minikit-js (World)
- @devvit/web (Reddit)

### 3D & Physics
- React Three Fiber
- Rapier physics
- Three.js

### Database
- PostgreSQL (Diamond Hands)
- Redis (Goblin Gardens - via Devvit)

### Build Tools
- pnpm workspaces
- tsup (package bundling)
- TypeScript 5.8

## 📄 License

Private monorepo - All rights reserved

## 🤝 Contributing

This is a private monorepo. For development:

1. Create feature branch from `main`
2. Make changes in relevant app or package
3. Test locally with `pnpm dev`
4. Submit PR for review

## 📚 Documentation

- [Diamond Hands README](./apps/diamond-hands/README.md)
- [Goblin Gardens README](./apps/goblin-gardens/README.md)
- [@gg/types README](./packages/types/README.md)
- [@gg/utils README](./packages/utils/README.md)
- [@gg/platform README](./packages/platform/README.md)
