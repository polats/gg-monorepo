# Quickstart Guide: Frontend Mock Mode

**Feature**: Frontend Mock Mode for UI Testing  
**Date**: 2025-09-08  
**Purpose**: Enable comprehensive UI testing without WorldCoin app dependency

## Prerequisites

### Development Environment
- Node.js 18+ installed
- Next.js development server running
- Standard web browser (Chrome, Firefox, Safari, Edge)
- No WorldCoin app installation required

### Environment Configuration
Create or update `.env.local` with mock mode settings:
```bash
# Enable mock mode in development
NEXT_PUBLIC_MOCK_MODE=true
NEXT_PUBLIC_SHOW_MOCK_INDICATORS=true
NEXT_PUBLIC_MOCK_DEBUG=false

# Mock mode configuration
NEXT_PUBLIC_MOCK_AUTO_LOGIN=false
NEXT_PUBLIC_MOCK_SIMULATE_DELAY=false
NEXT_PUBLIC_MOCK_DEFAULT_PERSONA=active-user
```

## 1. Basic Mock Mode Activation

### Enable Mock Mode
```bash
# Set environment variables
export NEXT_PUBLIC_MOCK_MODE=true
export NEXT_PUBLIC_SHOW_MOCK_INDICATORS=true

# Start development server
npm run dev
```

### Verify Mock Mode Activation
1. Navigate to `http://localhost:3000`
2. Look for yellow banner: "🧪 Mock Mode Active - Development Testing Only"
3. Check browser console for mock mode initialization logs
4. Confirm WorldID/MiniKit checks are bypassed

**Expected Result**: Application loads without WorldCoin app requirement, mock banner visible

## 2. Mock User Authentication Testing

### Test Auto-Login (Mock Mode)
1. With mock mode active, click "Login" button
2. No WorldCoin app prompt should appear
3. User should be instantly authenticated
4. Profile should show mock wallet address and username

**Expected Result**: 
- Instant authentication without external prompts
- Mock user profile displayed (e.g., "ActiveTester" with 0x2345... address)
- Login state persists across page refreshes

### Test Manual User Switching
```typescript
// Developer console commands
// Switch to different mock personas
window.__MOCK_MODE__.switchUser('new-user')
window.__MOCK_MODE__.switchUser('power-user') 
window.__MOCK_MODE__.switchUser('vip-user')
```

**Expected Result**: UI updates immediately with new user profile information

## 3. Payment Flow Testing

### Test Mock Payment Success
1. Navigate to raffle ticket purchase interface
2. Select ticket quantity and click "Purchase"
3. Mock payment should complete instantly
4. Transaction hash should be generated and displayed

**Mock Payment Response**:
```json
{
  "status": "success",
  "transaction_hash": "0xa1b2c3d4e5f6...",
  "amount": "5.0",
  "timestamp": "2025-09-08T22:30:00Z"
}
```

### Test Mock Payment Scenarios
```typescript
// Developer console commands
// Test insufficient funds
window.__MOCK_MODE__.simulateError('insufficient_funds')

// Test user cancellation
window.__MOCK_MODE__.simulateError('user_cancelled')

// Test network error
window.__MOCK_MODE__.simulateError('network_error')
```

**Expected Result**: Each error scenario displays appropriate UI feedback and error messages

## 4. WorldID Verification Testing

### Test Mock Verification Success
1. Navigate to verification-required feature
2. Click verify button
3. Mock verification should complete instantly
4. Success state should be displayed

**Mock Verification Response**:
```json
{
  "status": "success",
  "verification_level": "device",
  "nullifier_hash": "0x1234567890abcdef...",
  "proof": "mock_proof_data"
}
```

### Test Verification Error Scenarios
```typescript
// Test verification failure
window.__MOCK_MODE__.simulateError('verification_failed')

// Test already verified error
window.__MOCK_MODE__.simulateError('already_verified')
```

**Expected Result**: Verification error states properly handled and displayed

## 5. User Persona Testing

### Available Mock Personas

#### New User (`new-user`)
- **Profile**: NewTester, 0x1234...7890
- **Balance**: 0 WLD
- **Verification**: ✓ Verified
- **Use Case**: Onboarding flow testing

#### Active User (`active-user`) 
- **Profile**: ActiveTester, 0x2345...8901
- **Balance**: 100 WLD
- **Verification**: ✓ Verified  
- **Use Case**: Standard feature testing

#### Power User (`power-user`)
- **Profile**: PowerTester, 0x3456...9012
- **Balance**: 1,000 WLD
- **Verification**: ✓ Verified
- **Use Case**: Heavy usage scenarios

#### VIP User (`vip-user`)
- **Profile**: VIPTester, 0x4567...0123
- **Balance**: 10,000 WLD
- **Verification**: ✓ Verified
- **Use Case**: Premium feature testing

#### Problem User (`problem-user`)
- **Profile**: ErrorTester, 0x5678...1234
- **Balance**: 0.01 WLD
- **Verification**: ❌ Unverified
- **Use Case**: Error condition testing

### Switch Between Personas
1. Open browser developer console
2. Use persona switching commands:
   ```javascript
   // Switch to specific persona
   window.__MOCK_MODE__.switchUser('power-user')
   
   // Get current mock user info
   console.log(window.__MOCK_MODE__.getCurrentUser())
   
   // List available personas
   console.log(window.__MOCK_MODE__.getAvailablePersonas())
   ```

**Expected Result**: UI immediately updates with new persona's profile and capabilities

## 6. Complete User Journey Testing

### Scenario 1: New User Onboarding
1. Set mock persona to `new-user`
2. Navigate through login flow
3. Explore available raffles
4. Attempt small ticket purchase
5. Verify UI handles first-time user appropriately

### Scenario 2: Active User Raffle Participation
1. Set mock persona to `active-user`
2. Login and browse active raffles
3. Purchase multiple tickets for different raffles
4. Vote for different beneficiaries
5. Check transaction history

### Scenario 3: Power User Management
1. Set mock persona to `power-user`
2. Test raffle creation workflow
3. Manage multiple active raffles as operator
4. Process large ticket purchases
5. Verify advanced features accessible

### Scenario 4: Error Handling
1. Set mock persona to `problem-user`
2. Trigger various error scenarios
3. Test insufficient funds handling
4. Test unverified user restrictions
5. Verify error messages and recovery options

## 7. Production Safety Testing

### Verify Mock Mode Disabled in Production
```bash
# Build for production
npm run build
npm start

# Mock mode should be completely disabled
# No mock banners, no mock users, no bypassed flows
```

**Expected Result**: 
- No mock mode indicators visible
- WorldID verification required as normal
- No mock code included in production bundle

### Bundle Analysis
```bash
# Analyze production bundle
npm run build
npx @next/bundle-analyzer

# Verify no mock code in production bundle
grep -r "mock" .next/static/ || echo "No mock code found in production"
```

**Expected Result**: Mock code completely removed from production builds

## 8. Developer Debug Features

### Mock Mode Debug Console
```javascript
// Enable debug logging
window.__MOCK_MODE__.setDebugLevel('verbose')

// View mock interaction history
window.__MOCK_MODE__.getInteractionLog()

// Clear mock session data
window.__MOCK_MODE__.resetSession()

// Export mock session for sharing
window.__MOCK_MODE__.exportSession()
```

### Mock Data Inspection
```javascript
// Inspect current mock state
window.__MOCK_MODE__.inspectState()

// View available mock responses
window.__MOCK_MODE__.getAvailableResponses('walletAuth')

// Test custom mock scenarios
window.__MOCK_MODE__.addCustomScenario('payment', {
  status: 'error',
  error_code: 'custom_test_error'
})
```

## 9. Integration Testing Checklist

### UI Component Testing
- [ ] Login component works with mock authentication
- [ ] Payment components process mock transactions
- [ ] Verification flows complete with mock responses
- [ ] User profile displays mock user information
- [ ] Navigation works with mock user states

### User Flow Testing
- [ ] Complete raffle creation workflow
- [ ] End-to-end ticket purchasing flow
- [ ] Prize claiming process simulation
- [ ] Beneficiary voting functionality
- [ ] User profile management

### Error Scenario Testing
- [ ] Network error handling
- [ ] Insufficient funds scenarios
- [ ] User cancellation flows
- [ ] Verification failures
- [ ] Invalid transaction states

### Performance Testing
- [ ] Mock responses return quickly (< 50ms)
- [ ] No performance degradation with mock mode
- [ ] Memory usage remains stable
- [ ] UI remains responsive during mock operations

## 10. Troubleshooting

### Mock Mode Not Activating
```bash
# Check environment variables
echo $NEXT_PUBLIC_MOCK_MODE
echo $NODE_ENV

# Verify development environment
npm run dev -- --help

# Clear browser cache and localStorage
# Chrome: DevTools > Application > Clear Storage
```

### Mock User Not Persisting
```javascript
// Check localStorage
console.log(localStorage.getItem('raffletime_mock_session'))

// Reset mock session
window.__MOCK_MODE__.resetSession()

// Enable session persistence
window.__MOCK_MODE__.setPreference('preserveSession', true)
```

### Mock Responses Not Working
```javascript
// Check mock mode status
console.log(window.__MOCK_MODE__.isActive())

// Verify mock response registry
console.log(window.__MOCK_MODE__.getRegisteredResponses())

// Test individual mock functions
window.__MOCK_MODE__.testResponse('walletAuth', 'success')
```

This quickstart guide provides comprehensive testing coverage for the frontend mock mode feature, ensuring developers can effectively test all UI components and user flows without external WorldCoin dependencies.