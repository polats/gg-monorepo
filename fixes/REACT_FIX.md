# React Version Conflict - FIXED ✅

## Problem
You encountered the "Invalid hook call" error in Goblin Gardens, which was caused by React version conflicts in the monorepo:
- **Diamond Hands** uses React 18
- **Goblin Gardens** uses React 19
- pnpm was hoisting both versions, causing conflicts

## Solution Applied

### 1. Updated `.npmrc` Configuration
Added React isolation rules to prevent hoisting:

```ini
# Prevent React from being hoisted to avoid version conflicts
public-hoist-pattern[]=!react
public-hoist-pattern[]=!react-dom
public-hoist-pattern[]=!@types/react
public-hoist-pattern[]=!@types/react-dom
```

This ensures each app gets its own isolated React version.

### 2. Cleaned and Reinstalled
- Removed all `node_modules`
- Reinstalled with `pnpm install`
- Cleared Goblin Gardens build cache

### 3. Verified Isolation
Confirmed each app has the correct React version:
- ✅ Diamond Hands: React 18.3.1
- ✅ Goblin Gardens: React 19.0.0

## Test the Fix

### Start Goblin Gardens
```bash
cd apps/goblin-gardens
pnpm dev:local
```

The "Invalid hook call" error should now be gone! 🎉

### Start Diamond Hands
```bash
cd apps/diamond-hands
pnpm dev
```

Both apps can now run simultaneously without conflicts.

## Why This Happened

In a monorepo, pnpm normally "hoists" shared dependencies to the root `node_modules` to save disk space. However, when apps require **different major versions** of the same package (like React 18 vs React 19), hoisting causes conflicts.

React specifically requires a **single copy** per app - having multiple copies causes the "Invalid hook call" error.

## How We Fixed It

The `public-hoist-pattern[]=!react` syntax tells pnpm:
- ✅ Hoist most packages (saves space)
- ❌ **DON'T** hoist React packages (prevents conflicts)
- 📦 Keep React isolated in each app's dependency tree

This gives us the best of both worlds:
- Each app gets its required React version
- Other packages are still shared to save space
- No version conflicts

## Verification Commands

Check React versions anytime:
```bash
# Diamond Hands
cd apps/diamond-hands && pnpm list react

# Goblin Gardens
cd apps/goblin-gardens && pnpm list react
```

Both should show their respective versions without conflicts.

## If You Still See Errors

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear Vite Cache**:
   ```bash
   cd apps/goblin-gardens
   rm -rf dist .vite node_modules/.vite
   ```
3. **Restart Dev Server**: Kill the process and run `pnpm dev:local` again

## Going Forward

This configuration is permanent - new installations will automatically maintain React isolation. You don't need to do anything special when:
- Adding new dependencies
- Running `pnpm install`
- Working on either app

The monorepo will now handle React versions correctly! 🚀
