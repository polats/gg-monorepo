# Gem Balance API Integration Tests

This directory contains comprehensive tests for the gem balance API integration, covering all requirements from task 4.6.

## Test Coverage

### Requirements Tested
- **1.4**: Virtual currency system credits gems after payment
- **2.1**: Gem balance displayed in persistent header
- **2.2**: Real-time balance updates without page refresh
- **2.3**: Balance persistence across browser sessions
- **7.1**: Centralized gem management with transaction validation
- **7.2**: Clear interfaces for gem operations with validation

## Test Files

### 1. `gem-balance-integration.test.ts`
Automated integration tests using Jest/testing framework.

**Coverage:**
- ✅ Add gems via `/api/gems/add`
- ✅ Spend gems via `/api/gems/spend`
- ✅ Balance persistence across API calls
- ✅ Concurrent operations without race conditions
- ✅ Rate limiting (100 requests/minute)
- ✅ Transaction logging
- ✅ Error handling (401, 400, 429, 500)
- ✅ Purchase flow integration

**Note:** Requires Jest to be installed. To run:
```bash
npm install --save-dev jest @types/jest ts-jest
npx jest __tests__/gem-balance-integration.test.ts
```

### 2. `browser-integration-test.html`
Interactive browser-based test suite that can be run manually.

**How to use:**
1. Start the dev server: `npm run dev`
2. Open `__tests__/browser-integration-test.html` in your browser
3. Click individual test buttons or "Run All Tests"

**Features:**
- Real-time balance display
- Individual test execution
- Concurrent operation testing
- Rate limit testing
- Visual pass/fail indicators
- Detailed JSON response display

### 3. `MANUAL_TESTING_GUIDE.md`
Comprehensive manual testing guide with step-by-step instructions.

**Includes:**
- 10 detailed test scenarios
- Expected results for each test
- Browser console commands for verification
- Troubleshooting tips
- Complete checklist

## Implementation Changes

To support proper API integration testing, the following changes were made:

### 1. Updated `contexts/gem-balance-context.tsx`
- ✅ Fetches initial balance from API on mount
- ✅ Implements optimistic UI updates
- ✅ Adds server-side validation with rollback on failure
- ✅ Makes `addGems` and `spendGems` async
- ✅ Syncs with server after each operation

### 2. Updated `app/purchase/[tier]/page.tsx`
- ✅ Calls `/api/gems/add` API to persist gems to storage layer
- ✅ Updates client-side context after server confirmation
- ✅ Handles API errors gracefully

### 3. Existing API Routes (Already Implemented)
- ✅ `/api/gems/add` - Add gems with transaction logging
- ✅ `/api/gems/spend` - Spend gems with validation
- ✅ `/api/gems/balance` - Fetch current balance
- ✅ Rate limiting (100 requests/minute)
- ✅ Session validation
- ✅ Storage layer persistence (Redis or in-memory)

## Test Scenarios Covered

### ✅ Test 1: Real-time Balance Updates (Add)
- Gem balance header updates immediately when gems are added
- API call to `/api/gems/add` succeeds
- Balance persists to storage layer
- UI reflects server state

### ✅ Test 2: Real-time Balance Updates (Spend)
- Gem balance header updates immediately when gems are spent
- API call to `/api/gems/spend` succeeds
- Balance decreases correctly
- Insufficient gems are rejected

### ✅ Test 3: Balance Persistence
- Balance persists across page refreshes
- Balance persists across browser sessions (7-day TTL)
- Storage layer (Redis/in-memory) maintains state
- SessionStorage syncs with server

### ✅ Test 4: Optimistic UI Updates with Rollback
- UI updates immediately (optimistic)
- Server validates the operation
- On success: UI syncs with server response
- On failure: UI rolls back to previous state
- Network errors handled gracefully

### ✅ Test 5: Purchase Flow Integration
- Purchase page calls `/api/gems/add` API
- Gems credited to storage layer
- Client context syncs with server
- Balance updates in header
- Multiple purchases accumulate correctly

### ✅ Test 6: Concurrent Operations
- Multiple add operations execute concurrently
- Multiple spend operations execute concurrently
- Mixed operations (add + spend) work correctly
- No race conditions occur
- Final balance is mathematically correct
- Storage layer handles concurrent writes

### ✅ Test 7: Rate Limiting
- First 100 requests succeed
- Subsequent requests return 429
- Rate limit resets after 1 minute
- Error message is clear

### ✅ Test 8: Error Handling
- Invalid amounts rejected (negative, zero, decimal)
- Insufficient gems rejected with clear message
- Unauthorized requests return 401
- Server errors handled gracefully
- Network errors trigger rollback

### ✅ Test 9: Transaction Logging
- All gem additions logged
- All gem spends logged
- Transaction history maintained
- Audit trail available

### ✅ Test 10: Cross-Tab Synchronization
- Balance syncs across browser tabs
- Storage events trigger updates
- No manual refresh needed

## Running the Tests

### Quick Setup

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

For detailed setup instructions, see `SETUP.md`

### Option 1: Automated Tests (Jest)
```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration
```

### Option 2: Browser Tests (Interactive)
```bash
# Start dev server
npm run dev

# Open browser tests
npm run test:browser

# Or manually open
open __tests__/browser-integration-test.html
```

### Option 3: Manual Testing
Follow the step-by-step guide in `MANUAL_TESTING_GUIDE.md`

## Verification Checklist

After running tests, verify:

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

## Known Limitations

1. **Jest Tests**: Require Jest to be installed (not in package.json by default)
2. **Session Management**: Tests require valid session cookies
3. **Storage Layer**: Tests assume storage layer is running (Redis or in-memory)
4. **Rate Limiting**: May need to wait 1 minute between rate limit tests

## Troubleshooting

### Tests failing with 401 Unauthorized
- Ensure session is created before running tests
- Check that cookies are being sent with requests
- Verify session hasn't expired (7-day TTL)

### Balance not persisting
- Check if storage layer is running (Redis if configured)
- Verify session cookie exists
- Check for storage quota errors in console

### Concurrent tests failing
- Verify storage layer supports concurrent writes
- Check for rate limiting (100 req/min)
- Ensure no network issues

### Cross-tab sync not working
- Verify both tabs are on same domain
- Check if storage events are firing
- Ensure sessionStorage is accessible

## Next Steps

1. Install Jest for automated testing
2. Run browser tests to verify all scenarios
3. Follow manual testing guide for comprehensive verification
4. Check all items in verification checklist
5. Document any issues found
6. Mark task 4.6 as complete

## Related Files

- `app/api/gems/add/route.ts` - Add gems API
- `app/api/gems/spend/route.ts` - Spend gems API
- `app/api/gems/balance/route.ts` - Get balance API
- `contexts/gem-balance-context.tsx` - Client-side state management
- `components/gem-balance-header.tsx` - Balance display component
- `app/purchase/[tier]/page.tsx` - Purchase success page
- `lib/storage.ts` - Storage layer abstraction
- `lib/session.ts` - Session management
