# Manual Testing Guide: Gem Balance API Integration

This guide provides step-by-step instructions to manually verify all aspects of the gem balance API integration.

## Prerequisites

1. Start the development server: `npm run dev`
2. Open browser DevTools (Console and Network tabs)
3. Clear browser storage before each test session

## Test 1: Real-time Balance Updates When Adding Gems

**Objective:** Verify gem balance header updates in real-time when gems are added via /api/gems/add

### Steps:
1. Navigate to homepage
2. Note the initial gem balance in the header (should be 0)
3. Click "Purchase Gems" button
4. Select any gem tier (e.g., "Value Pack")
5. Complete the X402 payment flow (on devnet)
6. Observe the purchase success page

### Expected Results:
- ✅ Gem balance header updates immediately after purchase
- ✅ Balance shows correct amount (e.g., 550 for Value Pack)
- ✅ Animation plays when balance updates
- ✅ Network tab shows POST to `/api/gems/add` with 200 response
- ✅ Console shows no errors

### Verification:
```javascript
// In browser console, check the API response:
fetch('/api/gems/balance')
  .then(r => r.json())
  .then(console.log)
// Should show: { balance: 550, lifetime: 550, spent: 0 }
```

---

## Test 2: Real-time Balance Updates When Spending Gems

**Objective:** Test gem balance decreases correctly when gems are spent via /api/gems/spend

### Steps:
1. Ensure you have gems in your balance (complete Test 1 first)
2. Navigate to gacha page (when implemented)
3. Click "Pull" button to perform a gacha pull (costs 10 gems)
4. Observe the balance in the header

### Expected Results:
- ✅ Balance decreases by 10 gems immediately
- ✅ Header updates without page refresh
- ✅ Network tab shows POST to `/api/gems/spend` with 200 response
- ✅ If insufficient gems, pull button is disabled

### Manual API Test:
```javascript
// In browser console:
fetch('/api/gems/spend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 10, description: 'Test spend' })
})
  .then(r => r.json())
  .then(console.log)
// Should show: { success: true, balance: 540, spent: 10, deducted: 10 }
```

---

## Test 3: Balance Persistence Across Page Refreshes

**Objective:** Confirm balance persists across page refreshes and browser sessions using storage layer

### Steps:
1. Purchase gems (e.g., 550 gems)
2. Note the balance in the header
3. Refresh the page (F5 or Cmd+R)
4. Check the balance in the header
5. Navigate to different pages (home → gems → purchase)
6. Check balance remains consistent

### Expected Results:
- ✅ Balance persists after page refresh
- ✅ Balance is the same across all pages
- ✅ Network tab shows GET to `/api/gems/balance` on page load
- ✅ Balance matches server-side storage

### Verification:
```javascript
// Check sessionStorage (client-side cache):
JSON.parse(sessionStorage.getItem('gem-balance'))

// Check server-side storage:
fetch('/api/gems/balance')
  .then(r => r.json())
  .then(console.log)

// Both should match
```

---

## Test 4: Optimistic UI Updates with Server Validation Rollback

**Objective:** Test optimistic UI updates with server-side validation rollback on failure

### Steps:

#### Test 4a: Successful Operation (No Rollback)
1. Open DevTools Network tab
2. Purchase gems normally
3. Observe the UI updates immediately (optimistic)
4. Verify server confirms the update

#### Test 4b: Server Rejection (Rollback)
1. Open DevTools Console
2. Simulate server error by intercepting the request:
```javascript
// Temporarily override fetch to simulate server error
const originalFetch = window.fetch
window.fetch = function(...args) {
  if (args[0] === '/api/gems/spend') {
    return Promise.resolve(new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    ))
  }
  return originalFetch.apply(this, args)
}
```
3. Try to spend gems
4. Observe the balance rolls back to previous value

#### Test 4c: Network Error (Rollback for spend, keep for add)
1. Open DevTools and go offline (Network tab → Offline)
2. Try to spend gems
3. Observe rollback behavior
4. Go back online
5. Try to add gems (purchase)
6. Observe optimistic update is kept

### Expected Results:
- ✅ UI updates immediately (optimistic)
- ✅ On server error, balance rolls back to previous value
- ✅ Console shows rollback message
- ✅ On success, balance syncs with server response
- ✅ Spend operations rollback on network error (safe)
- ✅ Add operations keep optimistic update on network error

---

## Test 5: Balance Updates After Successful Purchase Flow

**Objective:** Verify balance updates work correctly after successful purchase flow

### Steps:
1. Start with 0 gems
2. Navigate to `/gems` page
3. Click "Purchase Now" on Starter Pack ($0.01, 100 gems)
4. Complete X402 payment
5. Observe purchase success page
6. Check balance in header
7. Navigate to homepage
8. Check balance still shows 100 gems
9. Repeat with Value Pack (should show 650 gems total)

### Expected Results:
- ✅ Balance updates immediately on purchase success page
- ✅ Balance persists when navigating away
- ✅ Multiple purchases accumulate correctly
- ✅ Lifetime gems tracked correctly
- ✅ Network tab shows `/api/gems/add` called once per purchase

### Verification:
```javascript
// Check full balance details:
fetch('/api/gems/balance')
  .then(r => r.json())
  .then(data => {
    console.log('Current:', data.balance)
    console.log('Lifetime:', data.lifetime)
    console.log('Spent:', data.spent)
  })
```

---

## Test 6: Concurrent Balance Updates (No Race Conditions)

**Objective:** Test concurrent balance updates to ensure no race conditions

### Steps:

#### Test 6a: Concurrent Additions
1. Open browser console
2. Execute multiple add operations simultaneously:
```javascript
// Add gems 5 times concurrently
Promise.all([
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  }),
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  }),
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  }),
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  }),
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  })
]).then(() => {
  return fetch('/api/gems/balance').then(r => r.json())
}).then(console.log)
// Should show balance: 500 (5 × 100)
```

#### Test 6b: Concurrent Spending
1. Ensure you have at least 100 gems
2. Execute multiple spend operations:
```javascript
// Spend gems 5 times concurrently (10 each)
Promise.all([
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  })
]).then(responses => {
  return Promise.all(responses.map(r => r.json()))
}).then(console.log)
// All should succeed if you had >= 50 gems
```

#### Test 6c: Concurrent Mixed Operations
1. Execute mixed add and spend operations:
```javascript
Promise.all([
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 100 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 })
  }),
  fetch('/api/gems/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 50 })
  }),
  fetch('/api/gems/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 20 })
  })
]).then(() => {
  return fetch('/api/gems/balance').then(r => r.json())
}).then(data => {
  console.log('Final balance:', data.balance)
  console.log('Lifetime:', data.lifetime)
  console.log('Spent:', data.spent)
})
```

### Expected Results:
- ✅ All concurrent operations complete successfully
- ✅ Final balance is mathematically correct
- ✅ No gems are lost or duplicated
- ✅ Lifetime and spent totals are accurate
- ✅ No race condition errors in console
- ✅ Storage layer handles concurrent writes correctly

---

## Test 7: Rate Limiting

**Objective:** Verify rate limiting prevents abuse

### Steps:
1. Open browser console
2. Execute rapid requests:
```javascript
// Try to exceed rate limit (100 requests per minute)
const requests = []
for (let i = 0; i < 105; i++) {
  requests.push(
    fetch('/api/gems/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1 })
    })
  )
}

Promise.all(requests).then(responses => {
  const statuses = responses.map(r => r.status)
  console.log('200 responses:', statuses.filter(s => s === 200).length)
  console.log('429 responses:', statuses.filter(s => s === 429).length)
})
```

### Expected Results:
- ✅ First 100 requests succeed (200 status)
- ✅ Subsequent requests return 429 (Too Many Requests)
- ✅ Error message indicates rate limit exceeded
- ✅ Rate limit resets after 1 minute

---

## Test 8: Cross-Tab Synchronization

**Objective:** Verify balance syncs across multiple browser tabs

### Steps:
1. Open the app in Tab 1
2. Note the balance
3. Open the app in Tab 2 (same browser)
4. In Tab 1, purchase gems
5. Observe Tab 2

### Expected Results:
- ✅ Tab 2 balance updates automatically (via storage events)
- ✅ Both tabs show the same balance
- ✅ No manual refresh needed

---

## Test 9: Error Handling

**Objective:** Verify proper error handling for various scenarios

### Test 9a: Insufficient Gems
1. Ensure balance is less than 10 gems
2. Try to spend 10 gems
3. Observe error message

### Test 9b: Invalid Amount
```javascript
// Try invalid amounts:
fetch('/api/gems/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: -10 })
}).then(r => r.json()).then(console.log)
// Should return 400 error

fetch('/api/gems/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1.5 })
}).then(r => r.json()).then(console.log)
// Should return 400 error
```

### Test 9c: No Session
```javascript
// Clear cookies and try to access API:
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})

fetch('/api/gems/balance')
  .then(r => r.json())
  .then(console.log)
// Should return 401 Unauthorized
```

### Expected Results:
- ✅ Clear error messages for all error cases
- ✅ UI handles errors gracefully
- ✅ No crashes or undefined states
- ✅ Appropriate HTTP status codes

---

## Test 10: Storage Layer Persistence

**Objective:** Verify data persists in storage layer (Redis or in-memory)

### Steps:
1. Purchase gems
2. Check storage backend:

#### For In-Memory Storage:
- Balance is stored in memory
- Survives page refreshes within same server session
- Clears when server restarts

#### For Redis Storage:
- Balance persists across server restarts
- TTL of 7 days
- Can verify with Redis CLI:
```bash
redis-cli
> KEYS gems:*
> GET gems:<session-id>
```

### Expected Results:
- ✅ Balance persists according to storage backend
- ✅ TTL is set correctly (7 days)
- ✅ Data structure is correct
- ✅ Transactions are logged

---

## Summary Checklist

After completing all tests, verify:

- [ ] Balance updates in real-time when gems are added
- [ ] Balance updates in real-time when gems are spent
- [ ] Balance persists across page refreshes
- [ ] Balance persists across browser sessions
- [ ] Optimistic UI updates work correctly
- [ ] Server validation rollback works on errors
- [ ] Purchase flow credits gems correctly
- [ ] Multiple purchases accumulate correctly
- [ ] Concurrent operations don't cause race conditions
- [ ] Rate limiting prevents abuse
- [ ] Cross-tab synchronization works
- [ ] Error handling is robust
- [ ] Storage layer persists data correctly
- [ ] No console errors during normal operation
- [ ] Network requests are efficient (no unnecessary calls)

---

## Troubleshooting

### Balance not updating:
- Check browser console for errors
- Verify session cookie exists
- Check Network tab for failed API calls
- Verify storage layer is running (Redis if configured)

### Balance not persisting:
- Check if session expired (7 day TTL)
- Verify storage layer is working
- Check for storage quota errors

### Concurrent operations failing:
- Check rate limiting (100 req/min)
- Verify storage layer supports concurrent writes
- Check for network issues

### Cross-tab sync not working:
- Verify both tabs are on same domain
- Check if storage events are firing
- Ensure sessionStorage is accessible
