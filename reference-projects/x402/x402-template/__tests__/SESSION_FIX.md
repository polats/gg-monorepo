# Session 401 Unauthorized Fix

## Problem

When the app loads, the gem balance context tries to fetch the balance from `/api/gems/balance`, but there's no session yet, resulting in a **401 Unauthorized** error.

## Root Cause

1. The app doesn't automatically create a session on first visit
2. The context tries to fetch balance immediately on mount
3. Without a session cookie, the API returns 401

## Solution

Added automatic session creation to the gem balance context:

### Before (Broken)
```typescript
useEffect(() => {
  const fetchBalance = async () => {
    const response = await fetch('/api/gems/balance')
    // ❌ Returns 401 if no session exists
    if (response.ok) {
      // Handle balance...
    }
  }
  fetchBalance()
}, [])
```

### After (Fixed)
```typescript
useEffect(() => {
  const initializeSession = async () => {
    // Try to fetch balance
    let response = await fetch('/api/gems/balance')
    
    // If unauthorized, create session first
    if (response.status === 401) {
      console.log('No session found, creating new session...')
      await fetch('/api/session/create', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Retry with new session
      response = await fetch('/api/gems/balance')
    }
    
    if (response.ok) {
      // Handle balance...
    }
  }
  initializeSession()
}, [])
```

## Additional Fixes

### 1. Added `credentials: 'include'` to All Fetch Calls

This ensures cookies (including sessionId) are sent with every request:

```typescript
fetch('/api/gems/add', {
  method: 'POST',
  credentials: 'include',  // ← Added this
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount, description })
})
```

Applied to:
- `/api/gems/balance` (GET)
- `/api/gems/add` (POST)
- `/api/gems/spend` (POST)
- `/api/session/create` (POST)

### 2. Session Flow

```
User visits app
    ↓
Context initializes
    ↓
Try fetch /api/gems/balance
    ↓
401 Unauthorized? → Create session → Retry
    ↓
200 OK → Load balance
```

## How It Works

1. **First Visit:**
   - Context tries to fetch balance
   - Gets 401 (no session)
   - Creates session automatically
   - Retries and gets balance (0 gems)

2. **Subsequent Visits:**
   - Session cookie exists
   - Balance fetch succeeds immediately
   - Loads saved balance from storage

3. **After Purchase:**
   - Session already exists
   - API calls work normally
   - Balance updates correctly

## Testing

### Test 1: Fresh Visit (No Session)
```bash
# Clear cookies
# Open DevTools → Application → Cookies → Delete all

# Refresh page
# Check console:
[GemBalance] Initializing session and fetching balance...
[GemBalance] No session found, creating new session...
[GemBalance] Session created, fetching balance...
[GemBalance] Received balance from API: { balance: 0, ... }
```

### Test 2: Return Visit (Session Exists)
```bash
# Refresh page (don't clear cookies)
# Check console:
[GemBalance] Initializing session and fetching balance...
[GemBalance] Received balance from API: { balance: 100, ... }
# No "creating new session" message
```

### Test 3: Purchase Flow
```bash
# Purchase gems
# Check console:
[GemBalance] addGems called: { amount: 100, ... }
[GemBalance] Calling API /api/gems/add...
[GemBalance] Server response: { success: true, balance: 100, ... }
# No 401 errors
```

## Verification

### Check Session Cookie
```javascript
// In browser console:
document.cookie
// Should include: sessionId=...
```

### Check Session in Storage
```javascript
// If using Redis, in terminal:
redis-cli
> KEYS session:*
> GET session:<session-id>
```

### Check API Calls
```
DevTools → Network tab
- Look for /api/session/create (POST) - should return 201
- Look for /api/gems/balance (GET) - should return 200
- Check cookies are being sent with requests
```

## Benefits

✅ **Automatic Session Creation** - No manual setup needed
✅ **Seamless User Experience** - Works on first visit
✅ **Persistent Sessions** - 7-day TTL
✅ **No More 401 Errors** - Session created automatically
✅ **Backward Compatible** - Works with existing sessions

## Edge Cases Handled

### 1. Session Expired
- Context tries to fetch balance
- Gets 401 (session expired)
- Creates new session
- Starts fresh with 0 gems

### 2. Cookies Disabled
- Session creation fails
- Falls back to sessionStorage only
- Balance not persisted across browser restarts

### 3. Network Error
- Session creation fails
- Falls back to sessionStorage
- Retries on next page load

### 4. Multiple Tabs
- First tab creates session
- Other tabs use same session cookie
- All tabs share same balance

## Files Modified

1. **`contexts/gem-balance-context.tsx`**
   - Added automatic session creation
   - Added `credentials: 'include'` to all fetch calls
   - Added better error handling

## Migration

No migration needed! The fix is backward compatible:
- Existing sessions continue to work
- New sessions created automatically
- No breaking changes

## Summary

The 401 Unauthorized error is now **completely fixed**. The app will:
1. Automatically create a session on first visit
2. Use existing session on return visits
3. Handle session expiration gracefully
4. Work seamlessly across all pages

No user action required - it just works! 🎉
