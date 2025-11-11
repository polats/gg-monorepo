# X402 Payment Flow Debugging

## Issue

After user signs transaction, the server returns 402 again instead of processing the payment. Need comprehensive debugging to troubleshoot the payment flow.

## Debugging Added

### Client Side (`x402-payment-handler.jsx`)

Added logging for:
- Payment header creation
- Request details
- Server response status
- Error responses

```javascript
console.log('🔍 Sending payment to server...');
console.log('🔍 URL:', url);
console.log('🔍 Payment header length:', paymentHeader.length);
console.log('🔍 Payment header (first 100 chars):', paymentHeader.substring(0, 100));

const finalResponse = await fetch(url, {
  headers: {
    'X-Payment': paymentHeader,
  },
});

console.log('🔍 Server response status:', finalResponse.status);
```

### Server Side (`server.ts`)

Added logging for:
- Request details (listing ID, buyer, wallet)
- All request headers
- X-Payment header presence
- Payment verification flow
- Error details

```typescript
console.log('\n🔍 ===== PURCHASE REQUEST =====');
console.log('🔍 Listing ID:', listingId);
console.log('🔍 Buyer:', buyer);
console.log('🔍 Buyer Wallet:', buyerWallet);
console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
console.log('🔍 X-Payment header present:', !!req.headers['x-payment']);
```

### Facilitator (`x402-facilitator.ts`)

Added logging for:
- Payment verification start
- Expected values (amount, recipient, network)
- Decoded payload
- Transaction broadcasting
- Confirmation status
- Success/failure details

```typescript
console.log('🔍 FACILITATOR: Starting payment verification');
console.log('🔍 FACILITATOR: Expected amount:', params.expectedAmount);
console.log('🔍 FACILITATOR: Expected recipient:', params.expectedRecipient);
console.log('🔍 FACILITATOR: Network:', params.network);
console.log('🔍 FACILITATOR: Decoded payload:', JSON.stringify(payload, null, 2));
```

## How to Use

### 1. Start Server with Debugging

```bash
cd packages/bazaar-x402/example
PAYMENT_MODE=production pnpm start
```

### 2. Open Browser Console

Open DevTools (F12) and go to Console tab to see client-side logs.

### 3. Watch Server Terminal

Server logs will show in the terminal where you started the server.

### 4. Make a Purchase

Try to purchase an item and watch the logs flow through:

**Client logs:**
```
🔍 Sending payment to server...
🔍 URL: http://localhost:3001/api/bazaar/purchase-with-currency/listing-123...
🔍 Payment header length: 1234
🔍 Payment header (first 100 chars): eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoic29sYW5hLWRldm5ldCIsInBheWxvYWQiOnsic2lnbmF0dXJlIjoiIiwiZnJvbSI6Ijln...
🔍 Server response status: 200
```

**Server logs:**
```
🔍 ===== PURCHASE REQUEST =====
🔍 Listing ID: listing-123
🔍 Buyer: TestUser
🔍 Buyer Wallet: 9gJenaJYRCFbahPMtcfaWZ4LnCFtaqzriw5tcMwWBiuW
🔍 Headers: { "x-payment": "eyJ4NDAyVmVyc2lvbiI6..." }
🔍 X-Payment header present: true
🔍 DEBUG: X-Payment header present - verifying payment
```

**Facilitator logs:**
```
🔍 FACILITATOR: Starting payment verification
🔍 FACILITATOR: Expected amount: 0.025
🔍 FACILITATOR: Expected recipient: 5Ueu3rRwUbpvgcB2FWLKqwkeHZTVAvFJ7CF1RUsHHwDd
🔍 FACILITATOR: Network: solana-devnet
🔍 FACILITATOR: Decoded payload: { ... }
🔍 FACILITATOR: Broadcasting client-signed transaction...
🔍 FACILITATOR: Transaction broadcast successful: 5Kx...
🔍 FACILITATOR: Waiting for confirmation...
🔍 FACILITATOR: Transaction confirmed on-chain
🔍 FACILITATOR: Payment verification successful!
```

## Common Issues to Look For

### Issue 1: X-Payment Header Not Sent

**Symptoms:**
```
🔍 X-Payment header present: false
🔍 DEBUG: No X-Payment header - returning 402 Payment Required
```

**Causes:**
- CORS issue blocking headers
- Client not setting header correctly
- Header being stripped by proxy/middleware

**Solution:**
- Check CORS configuration
- Verify header is set in fetch request
- Check for middleware that might strip headers

### Issue 2: Payment Header Decoding Fails

**Symptoms:**
```
🔍 FACILITATOR: Failed to decode payment header
```

**Causes:**
- Invalid base64 encoding
- Malformed JSON
- Wrong payload structure

**Solution:**
- Check client encoding logic
- Verify payload structure matches PaymentPayload type
- Test base64 encoding/decoding

### Issue 3: Transaction Broadcasting Fails

**Symptoms:**
```
🔍 FACILITATOR: Failed to broadcast transaction: ...
```

**Causes:**
- Invalid transaction
- Insufficient balance
- Network issues
- Invalid RPC endpoint

**Solution:**
- Check wallet has sufficient USDC and SOL
- Verify RPC endpoint is correct
- Check transaction structure
- Verify token accounts exist

### Issue 4: Transaction Confirmation Fails

**Symptoms:**
```
🔍 FACILITATOR: Transaction failed on-chain: ...
```

**Causes:**
- Transaction rejected by network
- Insufficient fees
- Invalid instruction
- Account doesn't exist

**Solution:**
- Check transaction error details
- Verify all accounts exist
- Check instruction parameters
- Ensure sufficient SOL for fees

## Debugging Checklist

When troubleshooting payment issues, check:

- [ ] Client creates payment header correctly
- [ ] Client sends X-Payment header in request
- [ ] Server receives X-Payment header
- [ ] Server calls verifyPurchase with header
- [ ] Facilitator decodes payload successfully
- [ ] Facilitator validates all fields
- [ ] Transaction broadcasts successfully
- [ ] Transaction confirms on-chain
- [ ] Purchase completes in marketplace

## Files Modified

1. `packages/bazaar-x402/example/public/components/x402-payment-handler.jsx`
2. `packages/bazaar-x402/example/server.ts`
3. `packages/bazaar-x402/core/src/utils/x402-facilitator.ts`

## Removing Debug Logs

Once issues are resolved, you can remove or comment out the debug logs, or use a logging library with log levels to control verbosity in production.

```typescript
// Option 1: Comment out
// console.log('🔍 DEBUG: ...');

// Option 2: Use environment variable
if (process.env.DEBUG === 'true') {
  console.log('🔍 DEBUG: ...');
}

// Option 3: Use logging library
import debug from 'debug';
const log = debug('bazaar:x402');
log('Payment verification started');
```
