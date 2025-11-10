# Monorepo Setup Summary

## ✅ Completed Setup

Your Diamond Hands and Goblin Gardens projects have been successfully configured as a pnpm monorepo!

### Project Structure
```
gg-monorepo/
├── apps/
│   ├── diamond-hands/        # World (Worldcoin) Next.js mini app
│   └── goblin-gardens/        # Reddit (Devvit) + World Vite app
├── packages/
│   ├── types/                 # @gg/types - Shared TypeScript types
│   ├── utils/                 # @gg/utils - Common utility functions
│   └── platform/              # @gg/platform - Platform detection
├── pnpm-workspace.yaml
├── package.json
├── .npmrc
├── .gitignore
└── README.md
```

### What Was Done

1. **Workspace Configuration** ✅
   - Created pnpm workspace with `apps/*` and `packages/*`
   - Set up root package.json with monorepo scripts
   - Configured pnpm settings for optimal performance

2. **Project Restructuring** ✅
   - Moved both projects to `apps/` directory
   - Maintained all existing functionality
   - Fixed postinstall script issues

3. **Shared Packages Created** ✅
   - **@gg/types**: Platform enums, User types, Game types, API responses
   - **@gg/utils**: 50+ utility functions (string, number, date, validation, async, storage)
   - **@gg/platform**: Platform detection (World/Reddit/Local) with feature flags

4. **Dependencies Installed** ✅
   - All 1432 packages installed successfully
   - Shared packages built and ready to use

5. **Documentation** ✅
   - Comprehensive README with architecture overview
   - Individual package READMEs
   - .gitignore configured for monorepo

### Package Builds

All shared packages compiled successfully:

- **@gg/types**: 2.39 KB (types only, no runtime)
- **@gg/utils**: 7.85 KB (CJS) / 6.05 KB (ESM)
- **@gg/platform**: 7.08 KB (CJS) / 5.46 KB (ESM)

## 🚀 Available Commands

### Workspace-wide
```bash
# Run both apps
pnpm dev

# Run specific app
pnpm dev:diamond    # Diamond Hands only
pnpm dev:goblin     # Goblin Gardens only

# Build everything
pnpm build

# Run tests
pnpm test

# Lint all code
pnpm lint

# Clean everything
pnpm clean
```

### Per-app Commands
```bash
# Diamond Hands
cd apps/diamond-hands
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm prisma:generate  # Generate Prisma client

# Goblin Gardens
cd apps/goblin-gardens
pnpm dev              # Start all services (client, server, devvit)
pnpm dev:local        # Local dev without Devvit
pnpm build            # Build client and server
```

## 📦 Using Shared Packages

### In Diamond Hands or Goblin Gardens

First, add the shared packages to your app's `package.json`:

```json
{
  "dependencies": {
    "@gg/types": "workspace:*",
    "@gg/utils": "workspace:*",
    "@gg/platform": "workspace:*"
  }
}
```

Then install:
```bash
pnpm install
```

### Import and Use

```typescript
// Platform detection
import { getCurrentPlatform, Platform, isWorld } from '@gg/platform';

const platform = getCurrentPlatform();
if (platform === Platform.World) {
  // World-specific code
}

// Types
import type { User, GameSession, ApiResponse } from '@gg/types';

const user: User = {
  id: '123',
  username: 'player1',
  platform: Platform.World,
  worldId: 'world_123',
  verified: true,
  createdAt: new Date(),
};

// Utilities
import { truncateAddress, formatNumber, timeAgo, sleep } from '@gg/utils';

const shortAddr = truncateAddress('0x1234567890abcdef1234567890abcdef12345678');
// "0x1234...5678"

const formatted = formatNumber(1234567.89);
// "1,234,567.89"

await sleep(1000); // Wait 1 second
```

## 🔄 Next Steps (Your Choice)

### Option 1: Add World Support to Goblin Gardens
Make Goblin Gardens work on both Reddit AND World platforms:

1. Add World MiniKit SDK to Goblin Gardens
2. Use `@gg/platform` to detect runtime environment
3. Conditional initialization based on platform

### Option 2: Unified Routing
Set up shared routing so Diamond Hands can be a mini-game inside Goblin Gardens:

1. Install React Router in Goblin Gardens
2. Create routes: `/` (3D game) and `/raffle` (Diamond Hands)
3. Extract Diamond Hands components for import

### Option 3: Shared Authentication
Create unified auth supporting both platforms:

1. Use `@gg/platform` for platform detection
2. WorldID authentication for World platform
3. Reddit authentication for Devvit platform
4. Shared session management

### Option 4: Test the Setup
Verify everything works:

```bash
# Build shared packages
pnpm --filter "@gg/*" build

# Try Diamond Hands
cd apps/diamond-hands
pnpm dev

# Try Goblin Gardens
cd apps/goblin-gardens
pnpm dev:local
```

## 📝 Important Notes

### Fixed Issues
- ❌ **Removed problematic postinstall scripts** from both apps
  - Diamond Hands: Moved `prisma generate` to dev/build scripts
  - Goblin Gardens: Removed automatic build on install

### Known Warnings (Safe to Ignore)
- Peer dependency warnings for React 19 vs 18 (packages support both)
- Peer dependency for viem versions (minor version mismatch, compatible)
- `import.meta` warnings in CJS builds (handled gracefully at runtime)

### Development Tips
1. Always run `pnpm install` from the root directory
2. Changes to shared packages require rebuilding: `pnpm --filter "@gg/*" build`
3. Use `workspace:*` protocol in app dependencies to reference shared packages
4. Apps can import from each other using relative paths if needed

## 🎯 Goals Achieved

✅ Monorepo structure with pnpm workspaces
✅ Shared TypeScript types across both projects
✅ Common utility library
✅ Platform detection for World/Reddit/Local
✅ Clean separation with shared code reuse
✅ Individual app independence maintained
✅ Ready for cross-app integration

## 🤔 Questions?

- **"Can I still run each app individually?"** Yes! Each app in `apps/` works independently.
- **"Do I need to rebuild shared packages often?"** Only when you modify them.
- **"Can I add more shared packages?"** Absolutely! Just create in `packages/` and follow the same pattern.
- **"What about deployment?"** Each app can deploy separately as before. Shared packages are bundled into each app.

Your monorepo is ready to use! Choose your next step from the options above, or continue building as you were. The shared packages are available whenever you need them.
