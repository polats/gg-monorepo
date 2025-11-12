# Wallet API Route Fix

## Issue

The wallet API endpoints were returning 404 errors when called from the client.

## Root Cause

The wallet routes were registered without the `/api` prefix:
- `/wallet/link` instead of `/api/wallet/link`
- `/wallet/linked` instead of `/api/wallet/linked`

All other routes in the application use the `/api` prefix, so the wallet routes needed to match this pattern.

## Fix

Updated `src/server/core/routes.ts` to add the `/api` prefix to both wallet endpoints:

```typescript
// Before
router.post('/wallet/link', ...)
router.get('/wallet/linked', ...)

// After
router.post('/api/wallet/link', ...)
router.get('/api/wallet/linked', ...)
```

## Verification

Tested both endpoints:

```bash
# GET endpoint - returns null when no wallet linked
curl -X GET http://localhost:3000/api/wallet/linked -H "X-Username: TestUser"
# Response: {"type":"getLinkedWallet","walletAddress":null}

# POST endpoint - properly validates signatures
curl -X POST http://localhost:3000/api/wallet/link \
  -H "Content-Type: application/json" \
  -H "X-Username: TestUser" \
  -d '{"walletAddress":"test","signature":"test","message":"test"}'
# Response: {"type":"linkWallet","success":false,"message":"Signature verification failed"}
```

Both endpoints are now working correctly and properly integrated with the rest of the API.
