# Vercel Session Usernames Fix

## Problem

When deploying to Vercel, all players were using the same username (`anonymous`), which caused:
- All players sharing the same player state (coins and gems)
- Trading conflicts and data corruption
- Inability to test multi-user features
- Poor user experience

## Root Cause

The username generation logic in `PileDemo.tsx` only created unique session-based usernames for local development (`username === 'LocalDevUser'`). On Vercel, the username was `undefined` or `'anonymous'`, so it didn't trigger the session username generation.

## Solution

Updated the username logic to generate session-based usernames for **both** local development and Vercel deployments:

### Changes Made

#### 1. Client-Side Username Logic (`PileDemo.tsx`)

**Before:**
```typescript
const isLocalDev = username === 'LocalDevUser' || !username;

if (!isLocalDev) {
  // Production mode - use username from Reddit API
  const prodUsername = username!;
  setApiUsername(prodUsername);
  return prodUsername;
}
```

**After:**
```typescript
const hasRealUsername = username && username !== 'LocalDevUser' && username !== 'anonymous';

if (hasRealUsername) {
  // Reddit/Devvit mode - use username from Reddit API
  console.log(`[AUTH] Using Reddit username: ${username}`);
  setApiUsername(username);
  return username;
}
```

Key changes:
- Check for **real Reddit username** instead of checking for local dev
- Generate session usernames when username is `undefined`, `'LocalDevUser'`, or `'anonymous'`
- Renamed `localDevUsername` to `sessionUsername` in sessionStorage for clarity

#### 2. Server-Side Auth Adapter (`auth-adapter.ts`)

**Before:**
```typescript
if (!username) {
  throw new Error('Authentication required');
}
```

**After:**
```typescript
if (!username) {
  // Fallback to anonymous if no username provided
  console.warn('[Auth] No username provided in request, using anonymous');
  return 'anonymous';
}
```

Key changes:
- Graceful fallback instead of throwing error
- Logs warning for debugging
- Prevents server crashes when username is missing

## How It Works Now

### On Vercel

1. User opens the app in a browser tab
2. No Reddit username is available (`username` is `undefined` or `'anonymous'`)
3. Client checks `sessionStorage.getItem('sessionUsername')`
4. If not found, generates a new username like `Player_ABC123`
5. Stores it in sessionStorage for the tab
6. All API calls include `X-Username: Player_ABC123` header
7. Server uses this username for player state isolation

### On Local Dev

Same behavior as Vercel - each tab gets a unique session username.

### On Reddit/Devvit

1. User is authenticated via Reddit
2. Real Reddit username is available (e.g., `u/johndoe`)
3. Client uses the Reddit username directly
4. No session username generation needed

## Benefits

✅ **Multi-user testing**: Each browser tab is a different player  
✅ **Data isolation**: Each player has their own coins and gems  
✅ **Trading works**: Players can trade with each other  
✅ **No authentication required**: Players can start playing immediately  
✅ **Consistent behavior**: Same logic works on local dev and Vercel  

## Testing

### Single Player

1. Open Vercel deployment in a browser
2. Check console for: `[SESSION] Generated new username: Player_XXXXXX`
3. Play the game, collect items
4. Refresh the page
5. Check console for: `[SESSION] Using stored username: Player_XXXXXX`
6. Verify your items are still there (same username = same player state)

### Multi-Player Trading

1. Open Vercel deployment in Tab 1
2. Note the username in console: `Player_ABC123`
3. Collect some gems and create an offer
4. Open Vercel deployment in Tab 2 (new tab)
5. Note the different username: `Player_XYZ789`
6. Browse marketplace and see Tab 1's offer
7. Buy gems from Tab 1's player
8. Verify trade completes successfully

### Clearing Session

To reset a tab's username:
```javascript
// In browser console
sessionStorage.removeItem('sessionUsername');
location.reload();
```

## Files Changed

- `apps/goblin-gardens/src/client/PileDemo.tsx` - Username generation logic
- `apps/goblin-gardens/src/server/adapters/auth-adapter.ts` - Graceful fallback
- `apps/goblin-gardens/docs/session-usernames.md` - Documentation (new)
- `apps/goblin-gardens/docs/vercel-session-usernames-fix.md` - This file (new)

## Related Documentation

- [Session-Based Usernames](./session-usernames.md) - Detailed explanation of the system
- [Vercel Deployment](./vercel-deployment.md) - Deployment guide
- [Local Development](../../../.kiro/steering/local-development.md) - Local testing guide

## Future Improvements

1. **localStorage persistence**: Store username in localStorage for cross-tab persistence
2. **Custom usernames**: Allow players to set their own display names
3. **Username validation**: Prevent duplicate or inappropriate usernames
4. **Session recovery**: Allow players to recover their session with a code
5. **Account linking**: Link session usernames to Reddit accounts when available
