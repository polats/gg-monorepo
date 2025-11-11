# Balance Still Zero After Purchase - Debugging Guide

## Quick Debug Steps

### 1. Open Browser Console
Press F12 or Right-click → Inspect → Console tab

### 2. Complete a Purchase
Go through the purchase flow and watch the console logs

### 3. Look for These Logs

**Expected logs (working correctly):**
```
[PurchasePage] useEffect triggered { tier: 'starter', ... }
[PurchasePage] Starting credit process for 100 gems
[PurchasePage] Calling addGems...
[GemBalance] addGems called: { amount: 100, description: 'Starter Pack purchase' }
[GemBalance] Optimistic update: { prev: { current: 0, ... }, newBalance: { current: 100, ... } }
[GemBalanceHeader] Rendering with balance: 100  ← Should see this!
[GemBalance] Calling API /api/gems/add...
[GemBalance] Server response: { success: true, balance: 100, ... }
[GemBalance] Balance synced with server
[PurchasePage] addGems completed successfully
```

**Problem indicators:**
```
❌ [GemBalance] Server rejected gem addition, rolling back
❌ [GemBalance] Failed to sync gem addition with server
❌ Error: 401 Unauthorized
❌ Error: Network request failed
```

### 4. Click the Debug Button
On the purchase success page, click the "🐛 Debug" button to see the server balance

### 5. Check Network Tab
DevTools → Network tab → Look for:
- `/api/gems/add` - Should return 200 with `{ success: true, balance: 100, ... }`
- Check the Response tab to see what the server returned

## Common Issues

### Issue 1: Balance Shows 0 in Header But Console Shows 100

**Symptom:**
```
[GemBalance] Optimistic update: { newBalance: { current: 100 } }
[GemBalanceHeader] Rendering with balance: 0  ← Wrong!
```

**Cause:** React state not updating properly

**Fix:** Check if GemBalanceProvider is wrapping the entire app

**Verify:**
```javascript
// In console:
document.querySelector('header') // Should exist
```

### Issue 2: API Call Fails

**Symptom:**
```
[GemBalance] Calling API /api/gems/add...
[GemBalance] Server rejected gem addition, rolling back
```

**Cause:** API returned error

**Debug:**
1. Check Network tab for `/api/gems/add` response
2. Look at Response tab - what error message?
3. Check if session exists (cookies)

**Common errors:**
- 401: No session → Should auto-create, check logs
- 400: Invalid amount → Check what amount was sent
- 500: Server error → Check server logs

### Issue 3: addGems Never Called

**Symptom:**
```
[PurchasePage] useEffect triggered
[PurchasePage] Already credited, skipping
```

**Cause:** `credited` state is already true

**Fix:** This is normal on re-renders. The gems should have been added on first render.

**Check:** Look for earlier logs where addGems was called

### Issue 4: Network Error

**Symptom:**
```
[GemBalance] Failed to sync gem addition with server: TypeError: Failed to fetch
```

**Cause:** Network request failed

**Possible reasons:**
- Dev server not running
- CORS issue
- Network connectivity

**Fix:**
1. Verify dev server is running: `npm run dev`
2. Check server is on http://localhost:3000
3. Try refreshing the page

### Issue 5: Session Not Created

**Symptom:**
```
[GemBalance] Initializing session and fetching balance...
[GemBalance] No session found, creating new session...
[GemBalance] Failed to create session
```

**Cause:** Session creation failed

**Debug:**
1. Check Network tab for `/api/session/create`
2. Look at response - what error?
3. Check if cookies are enabled

**Fix:**
```javascript
// In console, check cookies:
document.cookie

// Should include: sessionId=...
```

## Manual Tests

### Test 1: Check Current Balance
```javascript
// In browser console:
fetch('/api/gems/balance', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

// Should show: { balance: 100, lifetime: 100, spent: 0 }
```

### Test 2: Check SessionStorage
```javascript
// In browser console:
JSON.parse(sessionStorage.getItem('gem-balance'))

// Should show: { current: 100, lifetime: 100, spent: 0 }
```

### Test 3: Check Session Cookie
```javascript
// In browser console:
document.cookie

// Should include: sessionId=<some-uuid>
```

### Test 4: Manually Add Gems
```javascript
// In browser console:
fetch('/api/gems/add', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 50, description: 'Manual test' })
})
  .then(r => r.json())
  .then(console.log)

// Should return: { success: true, balance: 150, ... }
// Then refresh page - header should show 150
```

## Debug Button

I've added a "🐛 Debug" button to the purchase success page.

**Click it to see:**
- Current server-side balance
- Lifetime gems
- Spent gems

**If it shows balance: 0:**
- The API call to add gems failed
- Check console for error logs
- Check Network tab for failed requests

**If it shows balance: 100:**
- Server has the correct balance
- Problem is with UI update
- Check React DevTools

## Step-by-Step Debugging

### Step 1: Clear Everything
```javascript
// In console:
sessionStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})
location.reload()
```

### Step 2: Watch Console
Keep console open and watch for logs

### Step 3: Complete Purchase
Go through purchase flow

### Step 4: Check Each Log
Verify each expected log appears:
- ✅ Session created
- ✅ addGems called
- ✅ Optimistic update
- ✅ API called
- ✅ Server response
- ✅ Balance synced
- ✅ Header rendered with new balance

### Step 5: Click Debug Button
See what server says

### Step 6: Share Logs
Copy all console logs and share them

## What to Share

If balance is still zero, please share:

1. **All console logs** (copy/paste entire console)
2. **Network tab** - screenshot of `/api/gems/add` request/response
3. **Debug button output** - what does it show?
4. **Cookies** - result of `document.cookie`
5. **SessionStorage** - result of `sessionStorage.getItem('gem-balance')`

## Expected Working Flow

```
1. User visits purchase page
   → [PurchasePage] useEffect triggered

2. addGems called
   → [GemBalance] addGems called: { amount: 100 }

3. Optimistic update
   → [GemBalance] Optimistic update: { current: 100 }
   → [GemBalanceHeader] Rendering with balance: 100

4. API call
   → [GemBalance] Calling API /api/gems/add...
   → Network: POST /api/gems/add → 200 OK

5. Server response
   → [GemBalance] Server response: { success: true, balance: 100 }
   → [GemBalance] Balance synced with server

6. Final state
   → Header shows: 100 gems
   → Debug button shows: { balance: 100 }
   → SessionStorage: { current: 100 }
```

## Quick Fixes

### Fix 1: Force Balance Update
```javascript
// In console:
sessionStorage.setItem('gem-balance', JSON.stringify({
  current: 100,
  lifetime: 100,
  spent: 0
}))
location.reload()
```

### Fix 2: Recreate Session
```javascript
// In console:
fetch('/api/session/create', {
  method: 'POST',
  credentials: 'include'
}).then(() => location.reload())
```

### Fix 3: Manual Add
```javascript
// In console:
fetch('/api/gems/add', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 100 })
}).then(() => location.reload())
```

## Next Steps

1. Complete a purchase
2. Open console immediately
3. Copy ALL logs
4. Click Debug button
5. Share the logs and debug output

This will help identify exactly where the flow is breaking!
