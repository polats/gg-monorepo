# Vercel Catch-All Route Fix

## Problem

API endpoints were returning 404 errors with message "The page could not be found":
```
POST /api/player-state/save → 404
POST /api/offers/update → 404
```

## Root Cause

The catch-all API route was named `api/[...path].ts`, but Vercel's convention uses `[...slug].ts` for catch-all routes. While both should work in theory, `[...slug].ts` is the more standard pattern used in Vercel documentation and examples.

## Solution

Renamed the catch-all route file:
```bash
api/[...path].ts → api/[...slug].ts
```

## How Vercel Catch-All Routes Work

Vercel automatically detects files in the `api/` directory and creates serverless functions for them:

- `api/hello.ts` → `/api/hello`
- `api/user/[id].ts` → `/api/user/:id` (dynamic route)
- `api/[...slug].ts` → `/api/*` (catch-all route)

The catch-all route `[...slug].ts` will match any path under `/api/` that doesn't have a more specific route.

## File Structure

```
apps/goblin-gardens/
├── api/
│   ├── [...slug].ts      # Catch-all API handler
│   └── tsconfig.json      # TypeScript config for API
├── src/
│   ├── client/            # Frontend code
│   ├── server/            # Server code (for local/Devvit)
│   └── shared/            # Shared types
└── vercel.json            # Vercel configuration
```

## Deployment

After this change, deploy to Vercel:

```bash
vercel --prod
```

All API endpoints should now work correctly:
- `/api/health`
- `/api/init`
- `/api/player-state/save`
- `/api/player-state/load`
- `/api/offers`
- `/api/offers/update`
- `/api/offers/remove`
- `/api/trade/execute`

## Testing

Test the endpoints using the guide in `docs/api-endpoint-testing.md`.

## References

- [Vercel API Routes Documentation](https://vercel.com/docs/functions/serverless-functions)
- [Vercel Dynamic Routes](https://vercel.com/docs/functions/serverless-functions/routing)
