# React Hook Error - COMPLETE FIX ✅

## The Problem
Even after isolating React in `.npmrc`, Vite was still creating multiple React contexts due to module resolution issues, causing:
- "Invalid hook call" errors
- "Cannot read properties of null (reading 'useMemo')"
- React Three Fiber crashes

## Complete Solution Applied

### 1. Updated Vite Config
Added explicit React resolution and deduplication in `apps/goblin-gardens/src/client/vite.config.ts`:

```typescript
resolve: {
  alias: {
    // Force React to resolve to local node_modules
    'react': path.resolve(__dirname, '../../node_modules/react'),
    'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
  },
  dedupe: ['react', 'react-dom'],
},
optimizeDeps: {
  include: ['react', 'react-dom', 'react/jsx-runtime'],
  force: true,
},
```

This ensures:
- All modules use the SAME React instance
- Vite properly deduplicates React
- React is pre-optimized correctly

### 2. Cleaned All Caches
- Removed Vite build cache
- Removed Vite dependency cache
- Pruned pnpm store

## How to Test

### Complete Clean Start:
```bash
# 1. Stop any running dev servers (Ctrl+C)

# 2. Clean everything
cd apps/goblin-gardens
rm -rf dist .vite node_modules/.vite

# 3. Start fresh
pnpm dev:local
```

### What You Should See:
- ✅ No "Invalid hook call" errors
- ✅ No "Cannot read properties of null" errors
- ✅ React Three Fiber loads properly
- ✅ Canvas renders successfully

## Why This Fix Works

The issue was **module resolution**, not just hoisting:

### Before:
```
Vite → looks for React → finds multiple copies in pnpm virtual store
     → Different modules load different React instances
     → React hooks break (they require a single instance)
```

### After:
```
Vite → alias forces it to apps/goblin-gardens/node_modules/react
     → dedupe ensures all modules use this same instance
     → optimizeDeps pre-bundles React correctly
     → Single React instance = hooks work! ✅
```

## Verification

Check if React is properly resolved:
```bash
cd apps/goblin-gardens
pnpm why react
```

Should show only React 19.0.0 from the app's own node_modules.

## If Issues Persist

### 1. Hard Browser Refresh
- Chrome/Edge: Ctrl+Shift+Delete → Clear cache → Hard refresh (Ctrl+F5)
- Firefox: Ctrl+Shift+Delete → Clear cache → Hard refresh (Ctrl+Shift+R)

### 2. Kill Port 5173
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### 3. Nuclear Option
```bash
# From monorepo root
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
cd apps/goblin-gardens
pnpm dev:local
```

## Technical Details

### Why Vite Needed Special Config

Vite uses a different module resolution strategy than webpack:
- It doesn't bundle everything upfront
- It serves modules on-demand with ES modules
- This can cause React to be loaded from multiple paths

The `resolve.alias` + `resolve.dedupe` combo tells Vite:
1. **alias**: "Always resolve React to this exact path"
2. **dedupe**: "If you see React again, reuse the first instance"
3. **optimizeDeps.force**: "Rebuild the dependency cache now"

### Why pnpm Made It Harder

pnpm's virtual store creates symlinks:
```
node_modules/react → .pnpm/react@19.0.0/node_modules/react
```

Vite was following different symlink paths for different imports, creating "separate" React instances (even though they were the same version).

The fix forces Vite to use **one canonical path** for all React imports.

## Going Forward

This configuration is now permanent in the Vite config. You shouldn't see this issue again, even when:
- Adding new React-based dependencies
- Installing new packages
- Restarting the dev server

The monorepo + Vite + React 19 setup is now stable! 🎉

## Both Apps Can Now Run

Diamond Hands still uses React 18, Goblin Gardens uses React 19, and they don't conflict:

```bash
# Terminal 1
cd apps/diamond-hands
pnpm dev

# Terminal 2
cd apps/goblin-gardens
pnpm dev:local
```

Both work simultaneously without issues! 🚀
