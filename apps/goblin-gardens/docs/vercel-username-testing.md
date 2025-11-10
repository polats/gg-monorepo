# Vercel Username Testing Checklist

## Pre-Deployment Testing (Local)

Before deploying to Vercel, test the session username system locally:

### Test 1: Single Tab Persistence

1. Start local dev server: `npm run dev:local`
2. Open `http://localhost:5173` in browser
3. Open browser console
4. Verify log: `[SESSION] Generated new username: Player_XXXXXX`
5. Note the username (e.g., `Player_ABC123`)
6. Collect some items (coins/gems)
7. Refresh the page
8. Verify log: `[SESSION] Using stored username: Player_ABC123`
9. Verify items are still in inventory

**Expected Result:** ✅ Same username after refresh, items persist

### Test 2: Multi-Tab Isolation

1. Keep Tab 1 open from Test 1
2. Open `http://localhost:5173` in a **new tab** (Tab 2)
3. Check console in Tab 2
4. Verify log: `[SESSION] Generated new username: Player_YYYYYY`
5. Verify Tab 2 has a **different** username than Tab 1
6. Collect items in Tab 2
7. Switch to Tab 1
8. Verify Tab 1 still has its original username and items

**Expected Result:** ✅ Each tab has unique username and isolated inventory

### Test 3: Trading Between Tabs

1. In Tab 1: Collect gems and create an offer
2. In Tab 2: Go to "Trade" section
3. Verify Tab 1's offer appears in marketplace
4. Verify offer shows Tab 1's username (e.g., `Player_ABC123`)
5. In Tab 2: Purchase gems from Tab 1's offer
6. Verify trade completes successfully
7. Switch to Tab 1
8. Verify gems are removed from Tab 1's inventory
9. Verify coins are added to Tab 1's balance

**Expected Result:** ✅ Trading works between different session usernames

### Test 4: Session Clearing

1. In Tab 1, open browser console
2. Run: `sessionStorage.removeItem('sessionUsername')`
3. Refresh the page
4. Verify log: `[SESSION] Generated new username: Player_ZZZZZZ`
5. Verify new username is **different** from original
6. Verify inventory is **empty** (new player)

**Expected Result:** ✅ Clearing session creates new player identity

## Post-Deployment Testing (Vercel)

After deploying to Vercel, test the same scenarios:

### Test 5: Vercel Single Tab

1. Open Vercel deployment URL
2. Open browser console
3. Verify log: `[SESSION] Generated new username: Player_XXXXXX`
4. Collect items
5. Refresh page
6. Verify log: `[SESSION] Using stored username: Player_XXXXXX`
7. Verify items persist

**Expected Result:** ✅ Session usernames work on Vercel

### Test 6: Vercel Multi-Tab

1. Open Vercel URL in Tab 1
2. Note username in console
3. Open Vercel URL in Tab 2 (new tab)
4. Verify Tab 2 has **different** username
5. Collect items in both tabs
6. Verify each tab maintains separate inventory

**Expected Result:** ✅ Multi-tab isolation works on Vercel

### Test 7: Vercel Trading

1. In Tab 1: Create an offer with gems
2. In Tab 2: Browse marketplace
3. Verify Tab 1's offer appears
4. Purchase gems from Tab 1
5. Verify trade completes
6. Check both tabs for updated inventories

**Expected Result:** ✅ Trading works between Vercel tabs

### Test 8: API Headers

1. Open Vercel deployment
2. Open browser DevTools → Network tab
3. Perform any action (collect items, save state, etc.)
4. Find an API request (e.g., `/api/player-state/save`)
5. Check Request Headers
6. Verify `X-Username: Player_XXXXXX` header is present

**Expected Result:** ✅ Username is sent in all API requests

## Troubleshooting

### Issue: All players share same inventory

**Symptoms:**
- Multiple tabs show same items
- Trading doesn't work
- Items disappear when switching tabs

**Diagnosis:**
1. Check console logs in each tab
2. Verify each tab has **different** username
3. Check Network tab for `X-Username` header

**Solution:**
- If usernames are the same: Clear sessionStorage and reload
- If header is missing: Check `api-client.ts` implementation
- If server ignores header: Check `auth-adapter.ts` implementation

### Issue: Username changes on every refresh

**Symptoms:**
- New username generated on each page load
- Items don't persist
- Console shows "Generated" instead of "Using stored"

**Diagnosis:**
1. Check sessionStorage: `sessionStorage.getItem('sessionUsername')`
2. Verify browser allows sessionStorage (not in private mode)

**Solution:**
- Exit private/incognito mode
- Check browser settings for sessionStorage permissions
- Verify no browser extensions are clearing storage

### Issue: Trading fails with "Authentication required"

**Symptoms:**
- Trade button doesn't work
- Console shows authentication error
- Server returns 401/403

**Diagnosis:**
1. Check Network tab for failed request
2. Verify `X-Username` header is present
3. Check server logs for auth errors

**Solution:**
- Verify `setApiUsername()` is called in PileDemo
- Check `auth-adapter.ts` for proper header reading
- Ensure `api-client.ts` includes username in headers

## Success Criteria

All tests should pass with these results:

- ✅ Each browser tab gets a unique username
- ✅ Usernames persist across page refreshes within same tab
- ✅ Each username has isolated player state (coins, gems)
- ✅ Trading works between different usernames
- ✅ API requests include `X-Username` header
- ✅ Server correctly reads and uses the username
- ✅ Clearing sessionStorage creates new player identity

## Regression Testing

After any changes to username logic, re-run all tests to ensure:

1. Reddit/Devvit mode still uses real usernames
2. Local dev mode generates session usernames
3. Vercel mode generates session usernames
4. Multi-tab testing works in all environments
5. Trading works between different users
6. Player state isolation is maintained
