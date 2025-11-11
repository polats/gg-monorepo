# Quick Start: Testing Gem Balance API Integration

## 🚀 Fastest Way to Test (Recommended)

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Start the Dev Server
```bash
npm run dev
```

### 3. Run Tests

**Option A: Automated Tests**
```bash
npm test
```

**Option B: Browser Tests (Visual)**
```bash
npm run test:browser
# Then click "Run All Tests" button
```

**That's it!** You'll see test results with pass/fail indicators.

---

## 📦 Available Commands

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:integration # Run integration tests only
npm run test:browser  # Open browser tests
npm run verify        # Verify implementation
```

---

## 📋 What Gets Tested

When you click "Run All Tests", the following scenarios are automatically verified:

1. ✅ **Add Gems** - Verifies `/api/gems/add` works correctly
2. ✅ **Spend Gems** - Verifies `/api/gems/spend` works correctly
3. ✅ **Invalid Amounts** - Verifies validation rejects bad input
4. ✅ **Insufficient Gems** - Verifies can't spend more than you have
5. ✅ **Concurrent Operations** - Verifies no race conditions
6. ✅ **Balance Persistence** - Verifies balance survives page refresh

---

## 🔍 Individual Test Scenarios

### Test Real-Time Balance Updates
1. Click "Add Gems" button
2. Watch the balance at the top update immediately
3. ✅ Pass if balance increases

### Test Concurrent Operations
1. Click "Add 5x100 Gems (Concurrent)"
2. Wait for completion
3. ✅ Pass if balance increases by 500 (no race conditions)

### Test Rate Limiting
1. Click "Send 105 Requests"
2. Wait for completion
3. ✅ Pass if some requests return 429 (rate limited)

### Test Purchase Flow
1. Click "Simulate Starter Pack"
2. Watch balance increase by 100
3. ✅ Pass if balance updates correctly

---

## 🛠️ Manual Testing (Optional)

For comprehensive manual testing, follow:
- `__tests__/MANUAL_TESTING_GUIDE.md`

---

## 📊 Verify Implementation

Run the verification script to ensure everything is set up correctly:

```bash
./__tests__/verify-implementation.sh
```

Expected output: **25/25 checks passed** ✅

---

## 🐛 Troubleshooting

### Balance shows "Error loading balance"
- **Solution:** Make sure dev server is running (`npm run dev`)
- **Solution:** Check browser console for errors
- **Solution:** Verify you have a valid session (refresh page)

### Tests fail with "Network error"
- **Solution:** Ensure dev server is running on `http://localhost:3000`
- **Solution:** Check if port 3000 is available
- **Solution:** Try restarting the dev server

### Rate limit test doesn't show rate limiting
- **Solution:** Wait 1 minute and try again (rate limit resets)
- **Solution:** Clear browser storage and refresh

### Balance not persisting after refresh
- **Solution:** Check if storage layer is running (Redis or in-memory)
- **Solution:** Verify session cookie exists (check DevTools → Application → Cookies)
- **Solution:** Check if session expired (7-day TTL)

---

## 📚 Additional Resources

- **Full Test Documentation:** `__tests__/README.md`
- **Manual Testing Guide:** `__tests__/MANUAL_TESTING_GUIDE.md`
- **Implementation Details:** `__tests__/IMPLEMENTATION_SUMMARY.md`
- **Automated Tests:** `__tests__/gem-balance-integration.test.ts`

---

## ✅ Success Criteria

Your implementation is working correctly if:

- [ ] Browser tests show all tests passing (green)
- [ ] Balance updates in real-time when you add/spend gems
- [ ] Balance persists after page refresh
- [ ] Concurrent operations complete without errors
- [ ] Rate limiting prevents excessive requests
- [ ] Error messages are clear and helpful
- [ ] No console errors during normal operation

---

## 🎯 Next Steps

Once all tests pass:

1. ✅ Mark task 4.6 as complete
2. Review implementation summary
3. Proceed to next task in the spec
4. Consider adding E2E tests for full user flows

---

## 💡 Pro Tips

- **Use Browser DevTools:** Network tab shows all API calls
- **Check Console:** Logs show detailed operation info
- **Test Concurrency:** Run multiple operations simultaneously
- **Test Edge Cases:** Try invalid inputs, insufficient gems, etc.
- **Verify Persistence:** Refresh page and check balance remains

---

## 🎮 Happy Testing!

The gem balance API integration is fully implemented and tested. Enjoy building your gacha system!
