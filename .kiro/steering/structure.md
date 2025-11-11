# Project Structure

## Monorepo Layout

```
gg-monorepo/
├── apps/                    # Applications
│   ├── diamond-hands/       # World mini app (Next.js)
│   └── goblin-gardens/      # 3D game (Vite + React)
├── packages/                # Shared packages
│   ├── bazaar-x402/         # Marketplace library (monorepo within monorepo)
│   │   ├── core/            # Shared types and utilities
│   │   ├── server/          # Backend SDK
│   │   ├── client/          # Frontend SDK
│   │   └── example/         # Integration example
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Common utility functions
│   └── platform/            # Platform detection
├── reference-projects/      # Reference implementations
└── fixes/                   # Documentation of fixes and solutions
```

## Application Structure

### Goblin Gardens
```
apps/goblin-gardens/
├── src/
│   ├── client/              # React Three Fiber app
│   │   ├── components/      # 3D and UI components
│   │   ├── utils/           # Game logic and calculations
│   │   ├── constants/       # Game configuration
│   │   └── PileDemo.tsx     # Main game component
│   ├── server/              # Express API server
│   │   ├── core/            # Business logic
│   │   ├── adapters/        # Redis, auth adapters
│   │   ├── local.ts         # Local dev server
│   │   └── vercel.ts        # Vercel deployment
│   └── shared/              # Shared types
├── api/                     # Vercel serverless functions
├── __tests__/               # Test fixtures and mocks
├── docs/                    # Technical documentation
└── tools/                   # Development tools
```

### Diamond Hands
```
apps/diamond-hands/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   ├── create/              # Create raffle page
│   ├── raffle/              # Raffle details
│   └── minigame/            # Mini-game integration
├── components/              # React components
├── lib/                     # Utilities and hooks
├── prisma/                  # Database schema
├── types/                   # TypeScript types
└── __tests__/               # Integration tests
```

### Bazaar x402 Package
```
packages/bazaar-x402/
├── core/                    # @bazaar-x402/core
│   └── src/
│       ├── types/           # Listing, payment, mystery box types
│       ├── adapters/        # Interface definitions
│       └── utils/           # Validation, conversion, errors
├── server/                  # @bazaar-x402/server
│   └── src/
│       ├── marketplace.ts   # Main marketplace class
│       ├── express.ts       # Express middleware
│       └── adapters/        # Storage implementations
└── client/                  # @bazaar-x402/client
    └── src/
        ├── bazaar-client.ts # Main client class
        └── wallet-adapter.ts # Wallet integration
```

## Key Conventions

- **Tests**: Co-located in `__tests__/` directories next to source files
- **Types**: Shared types in dedicated `types/` directories or packages
- **Adapters**: Interface-based adapters for storage, items, payments
- **Docs**: Technical documentation in `docs/` directories
- **Config**: Root-level config files (tsconfig, vite.config, etc.)
- **Mock Data**: Development mocks in `__tests__/mocks/` or `lib/mock/`

## Special Directories

- `.kiro/` - Kiro AI assistant configuration and specs
- `.claude/` - Claude AI skills and agents
- `.cursor/` - Cursor IDE rules and MCP configuration
- `reference-projects/` - External reference implementations
- `fixes/` - Historical documentation of bug fixes and solutions

## Reference Projects

### x402 Reference Implementations

Located in `reference-projects/x402/`, these are working implementations of the x402 payment protocol:

**silkroad/** - Full-featured marketplace application
- Next.js 15 + React 19 production implementation
- Complete x402 payment flow with Solana/USDC
- Payment verification, settlement, and delivery
- Token gating, admin dashboard, encryption
- Reference for: marketplace features, payment flows, database models

**x402-facilitator-express-server/** - Facilitator service implementation
- Express + TypeScript facilitator server
- Sponsored transactions with instant finality
- Nonce-based replay attack prevention
- Payment verification and settlement endpoints
- Reference for: facilitator logic, security patterns, transaction handling

**x402-template/** - Minimal Next.js starter
- Simple x402 integration using `x402-next` package
- Multiple price tiers and protected routes
- Session management and storage strategies
- Reference for: basic integration, middleware setup, simple payment gates

### When to Use Reference Projects

**Implementing x402 payments**: Check `x402-facilitator-express-server/` for:
- Payment verification logic (`src/routes/verify.ts`, `src/routes/settle.ts`)
- Nonce management and replay protection (`src/lib/nonce-database.ts`)
- Transaction signing and broadcasting (`src/lib/solana-utils.ts`)

**Building marketplace features**: Check `silkroad/` for:
- Listing management (`app/api/listings/`)
- Purchase flow (`app/api/purchase/route.ts`)
- x402 protocol implementation (`lib/x402/`)
- Database schemas (`models/`)

**Quick integration**: Check `x402-template/` for:
- Middleware configuration (`middleware.ts`)
- Protected route setup
- Session token handling
