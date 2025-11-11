# Debugging Header Update Issue

## Changes Made

### 1. Fixed Purchase Page (`app/purchase/[tier]/page.tsx`)
- Changed to use `await addGems()` instead of calling API directly
- This prevents double API calls
- Properly handles async flow

### 2. Fixed Context (`contexts/gem-balance-context.tsx`)
- Removed `gemBalance` from useCallback dependencies
- Uses functional updates to avoid stale closures
- Added comprehensive console logging for debugging
- **Added automatic session creation** - creates session if 401 Unauthorized
- Added `credentials: 'include'` to all fetch calls

### 3. Added Logging to Header (`components/gem-balance-header.tsx`)
- Logs every time the header re-renders with current balance

### 4. Fixed 401 Unauthorized Error
- Context now automatically creates a session on first load if none exists
- All API calls include credentials to send cookies
- Session is created before fetching balance

## How to Test

### 1. Open Browser DevTools
```
Right-click → Inspect → Console tab
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Navigate to Purchase Flow
1. Go to http://localhost:3000
2. Click "Purchase Gems"
3. Select any tier (e.g., "Starter Pack")
4. Complete the X402 payment (on devnet)

### 4. Watch Console Logs

You should see logs like this:

```
// On initial load:
[GemBalance] Initializing session and fetching balance...
[GemBalance] No session found, creating new session...
[GemBalance] Session created, fetching balance...
[GemBalance] Received balance from API: { balance: 0, lifetime: 0, spent: 0 }
[GemBalanceHeader] Rendering with balance: 0

// After purchase:
[GemBalance] addGems called: { amount: 100, description: 'Starter Pack purchase' }
[GemBalance] Optimistic update: { prev: {...}, newBalance: {...} }
[GemBalanceHeader] Rendering with balance: 100  // ← Header should update here
[GemBalance] Calling API /api/gems/add...
[GemBalance] Server response: { success: true, balance: 100, ... }
[GemBalance] Balance synced with server
[GemBalanceHeader] Rendering with balance: 100  // ← Header updates again after server sync
```

## Expected Behavior

1. **Initial Load:**
   - Header shows 0 gems
   - Context fetches balance from API

2. **After Purchase:**
   - Header updates immediately (optimistic update)
   - Shows new balance (e.g., 100 gems)
   - API call confirms the update
   - Header may re-render with server-confirmed balance

3. **Navigation:**
   - Balance persists when navigating to other pages
   - Header always shows current balance

## Troubleshooting

### 401 Unauthorized Error

**This is now fixed automatically!**

The context will:
1. Try to fetch balance
2. If 401, create a new session
3. Retry fetching balance with new session

**If you still see 401 errors:**
- Check browser console for session creation logs
- Verify cookies are enabled in browser
- Check Network tab → Cookies to see if sessionId is set
- Try clearing all cookies and refreshing

### Header Not Updating

**Check Console Logs:**
```javascript
// Look for these logs:
[GemBalance] addGems called: ...
[GemBalance] Optimistic update: ...
[GemBalanceHeader] Rendering with balance: ...
```

**If you see "addGems called" but no header update:**
- Check if GemBalanceProvider is wrapping the app
- Check if header component is inside the provider
- Look for React errors in console

**If you don't see "addGems called":**
- Check if purchase page is calling addGems
- Look for errors in purchase page useEffect
- Check network tab for API calls

### Double API Calls

**If you see two calls to `/api/gems/add`:**
- This was the old bug (now fixed)
- Clear browser cache and reload
- Make sure you're using the updated code

### Balance Shows 0 After Purchase

**Check:**
1. API response in Network tab
2. Console logs for errors
3. SessionStorage in DevTools → Application → Session Storage

**Verify API Response:**
```javascript
// In console:
fetch('/api/gems/balance')
  .then(r => r.json())
  .then(console.log)
```

### Balance Not Persisting

**Check SessionStorage:**
```javascript
// In console:
JSON.parse(sessionStorage.getItem('gem-balance'))
```

**Should show:**
```json
{
  "current": 100,
  "lifetime": 100,
  "spent": 0
}
```

## Manual Test

### Test 1: Purchase Flow
```
1. Start at homepage (balance: 0)
2. Click "Purchase Gems"
3. Select "Starter Pack"
4. Complete payment
5. ✅ Header should show 100 gems immediately
6. Navigate to homepage
7. ✅ Header should still show 100 gems
```

### Test 2: Multiple Purchases
```
1. Purchase Starter Pack (100 gems)
2. ✅ Header shows 100
3. Purchase Value Pack (550 gems)
4. ✅ Header shows 650
5. Refresh page
6. ✅ Header still shows 650
```

### Test 3: Cross-Tab Sync
```
1. Open app in Tab 1
2. Purchase gems (balance: 100)
3. Open app in Tab 2
4. ✅ Tab 2 should show 100 gems
5. Purchase gems in Tab 1 (balance: 200)
6. ✅ Tab 2 should update to 200 gems
```

## Debugging Commands

### Check Current Balance
```javascript
// In browser console:
const balance = JSON.parse(sessionStorage.getItem('gem-balance'))
console.log('Client balance:', balance)

fetch('/api/gems/balance')
  .then(r => r.json())
  .then(data => console.log('Server balance:', data))
```

### Force Balance Update
```javascript
// In browser console (for testing):
window.dispatchEvent(new StorageEvent('storage', {
  key: 'gem-balance',
  newValue: JSON.stringify({ current: 999, lifetime: 999, spent: 0 })
}))
```

### Clear Balance
```javascript
// In browser console:
sessionStorage.removeItem('gem-balance')
sessionStorage.removeItem('gem-transactions')
location.reload()
```

## What Was Fixed

### Before (Broken):
```typescript
// Purchase page called API directly
fetch('/api/gems/add', {...})
  .then(() => {
    addGems(amount) // This also calls API - DOUBLE CALL!
  })

// Context had stale closure issue
const addGems = useCallback(..., [gemBalance]) // Re-created on every change
```

### After (Fixed):
```typescript
// Purchase page uses context method
await addGems(amount) // Single call, handles everything

// Context uses functional updates
const addGems = useCallback(..., []) // Stable reference
setGemBalance(prev => ...) // No stale closure
```

## Success Criteria

✅ Header updates immediately after purchase
✅ Balance persists across page refreshes
✅ Balance persists across browser sessions
✅ No double API calls
✅ Console logs show proper flow
✅ No React errors in console

## Next Steps

1. Test the purchase flow
2. Check console logs
3. Verify header updates
4. Test persistence
5. If issues persist, share console logs

## Remove Logging (Production)

Once everything works, remove console.log statements:

```bash
# Search for logging statements
grep -r "console.log.*GemBalance" .

# Remove them from:
# - contexts/gem-balance-context.tsx
# - components/gem-balance-header.tsx
```

Or keep them for debugging in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[GemBalance] ...')
}
```
