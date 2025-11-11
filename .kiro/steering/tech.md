# Technology Stack

## Build System

- **Package Manager**: pnpm (v9.0.0+) with workspaces
- **Monorepo Structure**: pnpm workspaces with apps and packages
- **TypeScript**: v5.8.2 across all packages

## Frameworks & Libraries

### Goblin Gardens
- **Framework**: Vite 6 + React 19
- **3D/Physics**: React Three Fiber, Rapier physics, Three.js
- **Backend**: Express 5 + Redis
- **Platform SDKs**: @devvit/web (Reddit), @worldcoin/minikit-js (World)
- **Testing**: Vitest with jsdom

### Diamond Hands
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma
- **Platform**: @worldcoin/minikit-js, @worldcoin/minikit-react
- **Testing**: Jest

### Bazaar x402 (Shared Package)
- **Build**: tsup for dual CJS/ESM output
- **Blockchain**: @solana/web3.js
- **Testing**: Vitest
- **Adapters**: Redis, in-memory storage

## Common Commands

### Root Level
```bash
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in parallel
pnpm dev:diamond          # Run Diamond Hands only
pnpm dev:goblin           # Run Goblin Gardens only
pnpm build                # Build all packages and apps
pnpm test                 # Run all tests
pnpm lint                 # Lint all workspaces
```

### Goblin Gardens
```bash
pnpm dev:local            # Local dev with mock API (fast iteration)
pnpm dev:reddit           # Full Devvit testing with Reddit
pnpm test                 # Run tests with Vitest
pnpm test:coverage        # Run tests with coverage
pnpm build                # Build client and server
pnpm deploy               # Deploy to Reddit (Devvit)
```

### Diamond Hands
```bash
pnpm dev                  # Next.js development server
pnpm build                # Production build
pnpm test                 # Run Jest tests
```

### Bazaar x402 Packages
```bash
pnpm build                # Build with tsup (CJS + ESM)
pnpm dev                  # Watch mode
pnpm test                 # Run Vitest tests
```

## Development Patterns

- **Workspace Protocol**: Use `workspace:*` for internal package dependencies
- **Dual Module Format**: Packages export both CJS and ESM
- **Mock Mode**: All apps support local development without external services
- **Type Safety**: Shared types via @bazaar-x402/core and workspace packages

## x402 Implementation Reference

When implementing x402 payment functionality, use `reference-projects/x402/` as reference:

### Payment Flow Patterns
- **402 Response**: See `silkroad/app/api/purchase/route.ts` for HTTP 402 response structure
- **Payment Verification**: See `x402-facilitator-express-server/src/routes/verify.ts` for on-chain verification
- **Transaction Settlement**: See `x402-facilitator-express-server/src/routes/settle.ts` for sponsored transactions
- **Replay Protection**: See `x402-facilitator-express-server/src/lib/nonce-database.ts` for nonce management

### Integration Approaches
- **Full Custom**: Follow `silkroad/lib/x402/` for custom implementation with full control
- **Middleware**: Follow `x402-template/middleware.ts` for Next.js middleware approach
- **Facilitator Service**: Follow `x402-facilitator-express-server/` for separate facilitator architecture

### Key Concepts
- **Instant Finality**: Client funds move immediately to merchant (sponsored transactions)
- **Nonce System**: Cryptographic nonces prevent replay attacks
- **Payment Headers**: Use `X-PAYMENT` header for payment proof
- **On-chain Verification**: Always verify transactions on Solana blockchain
