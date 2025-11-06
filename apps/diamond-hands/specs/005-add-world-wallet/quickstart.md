# Quickstart: World Wallet Login and Balance Display

## Prerequisites
- Node.js 18+ installed
- WorldCoin MiniApp environment or browser with MiniKit mock mode
- RaffleTime project setup complete

## Setup Instructions

### 1. Enable Mock Mode (Development)
```bash
# Set environment variables in .env.local
NEXT_PUBLIC_MOCK_MODE=true
NEXT_PUBLIC_MOCK_AUTO_LOGIN=true
NEXT_PUBLIC_MOCK_DEBUG=true
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Start Development Server
```bash
npm run dev
# or
yarn dev
```

### 4. Navigate to Minigame
Open browser to: `http://localhost:3000/minigame`

## Testing Wallet Connection

### Scenario 1: First-Time Connection
1. Load the Diamond Hands minigame
2. Navigate to the deposit screen
3. Click "Connect World Wallet" button
4. Observe loading state during connection
5. Verify wallet address appears after successful connection
6. Verify balance displays as "100.00 WLD" (mock active-user)

**Expected Result**: Wallet connects and displays balance

### Scenario 2: Balance Refresh
1. With wallet connected, click the refresh icon next to balance
2. Observe loading spinner during refresh
3. Verify balance updates (in mock mode, stays the same)
4. Check last updated timestamp changes

**Expected Result**: Balance refreshes with updated timestamp

### Scenario 3: Wallet Disconnection
1. With wallet connected, click disconnect button
2. Confirm disconnection in dialog
3. Verify return to disconnected state
4. Verify "Connect World Wallet" button reappears

**Expected Result**: Clean disconnection with UI reset

### Scenario 4: Session Persistence
1. Connect wallet successfully
2. Refresh the page (F5)
3. Verify wallet automatically reconnects
4. Verify balance displays without manual reconnection

**Expected Result**: Session restored from localStorage

### Scenario 5: Insufficient Balance
1. Switch to problem-user persona (0.01 WLD)
2. Try to make a 100 WLD deposit
3. Verify error message about insufficient funds
4. Verify deposit is blocked

**Expected Result**: Proper validation prevents over-spending

## Testing with Different User Personas

### Switch Mock Users
```javascript
// In browser console (mock mode only)
window.localStorage.setItem('mockUserId', 'power-user');
location.reload();
```

### Available Personas
- `new-user`: 0 WLD (test onboarding)
- `active-user`: 100 WLD (default, standard testing)
- `power-user`: 1000 WLD (test larger deposits)
- `vip-user`: 10000 WLD (test premium features)
- `problem-user`: 0.01 WLD (test error scenarios)

## Testing Error Scenarios

### Scenario 1: MiniKit Not Available
1. Disable mock mode: `NEXT_PUBLIC_MOCK_MODE=false`
2. Access from regular browser (not WorldCoin app)
3. Click connect wallet
4. Verify error message: "World App required"

**Expected Result**: Graceful handling of missing MiniKit

### Scenario 2: Connection Timeout
1. In mock mode, set delay: `NEXT_PUBLIC_MOCK_DELAY=5000`
2. Click connect wallet
3. Verify loading state persists
4. After timeout, verify error message

**Expected Result**: Timeout handled with user feedback

### Scenario 3: Network Error
1. Use problem-user persona
2. Trigger balance refresh
3. Verify error message appears
4. Verify retry option available

**Expected Result**: Network errors handled gracefully

## Production Testing

### Setup for Production
```bash
# Build production bundle
npm run build

# Set production environment
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_APP_LAUNCHED=false

# Start production server
npm start
```

### Production Checklist
- [ ] Mock mode disabled in production
- [ ] Real MiniKit SDK loads correctly
- [ ] Wallet authentication works with real World App
- [ ] Balance displays actual WLD holdings
- [ ] Session persistence works across page loads
- [ ] Error messages are user-friendly
- [ ] No console errors or warnings
- [ ] Performance: Connection < 2 seconds
- [ ] UI responsive during loading states

## Debugging Tips

### Check MiniKit Status
```javascript
// In browser console
console.log('MiniKit installed:', window.MiniKit?.isInstalled());
console.log('Current user:', window.MiniKit?.user);
```

### Check Mock Mode
```javascript
// In browser console
console.log('Mock mode:', process.env.NEXT_PUBLIC_MOCK_MODE);
console.log('Mock user:', localStorage.getItem('mockUserId'));
```

### Clear Session
```javascript
// In browser console
localStorage.removeItem('worldWalletSession');
location.reload();
```

### Force Refresh Balance
```javascript
// In browser console
window.dispatchEvent(new CustomEvent('wallet:refresh'));
```

## Common Issues

### Issue: Wallet won't connect
**Solution**: Check MiniKit installation, verify mock mode settings

### Issue: Balance shows as 0
**Solution**: Check mock user persona, verify balance fetch

### Issue: Session not persisting
**Solution**: Check localStorage permissions, verify session key

### Issue: Connection takes too long
**Solution**: Check network, reduce mock delay, verify MiniKit response

## Integration Verification

Run these commands to verify the implementation:

```bash
# Run unit tests
npm test -- --testPathPattern=WalletConnection

# Run integration tests
npm test -- --testPathPattern=minigame

# Check type safety
npm run type-check

# Verify linting
npm run lint
```

All tests should pass before considering the feature complete.