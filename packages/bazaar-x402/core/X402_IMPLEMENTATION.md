# x402 Protocol Implementation

This document describes the x402 payment protocol implementation in the `@bazaar-x402/core` package.

## Overview

The x402 protocol enables HTTP 402 Payment Required responses for blockchain-based payments. This implementation supports Solana USDC transactions on both devnet and mainnet.

## Components

### 1. Protocol Types (`src/types/payment.ts`)

**Constants:**
- `X402_VERSION = 1` - Protocol version
- `X_PAYMENT_HEADER = 'x-payment'` - Request header for payment proof
- `X_PAYMENT_RESPONSE_HEADER = 'x-payment-response'` - Response header for payment confirmation

**Key Types:**
- `PaymentRequirements` - Defines what payment is required (amount, recipient, network, etc.)
- `PaymentRequiredResponse` - HTTP 402 response structure
- `PaymentPayload` - Payment proof sent in X-Payment header
- `VerificationResult` - Result of payment verification

### 2. Protocol Utilities (`src/utils/x402.ts`)

**Encoding/Decoding:**
- `encodePaymentHeader(payload)` - Encode payment payload to Base64 for X-Payment header
- `decodePaymentHeader(encoded)` - Decode and validate payment payload from Base64
- `isValidPaymentPayload(payload)` - Validate payment payload structure

**Payment Requirements:**
- `createPaymentRequirements(params, network?, timeout?)` - Create payment requirements object
- `createPaymentRequiredResponse(params, network?, timeout?)` - Create full 402 response
- `USDC_MINT_ADDRESSES` - Network-specific USDC mint addresses

**Helper Functions:**
- `extractPaymentHeader(headers)` - Extract payment header from request
- Uses existing `usdcToSmallestUnit()` from conversion utilities

## Usage Examples

### Creating a 402 Payment Required Response

```typescript
import { createPaymentRequiredResponse } from '@bazaar-x402/core';

const response = createPaymentRequiredResponse(
  {
    priceUSDC: 10.5,
    sellerWallet: 'seller-wallet-address',
    resource: '/api/listings/123',
    description: 'Premium Item',
  },
  'solana-mainnet',
  30 // timeout in seconds
);

// Returns:
// {
//   x402Version: 1,
//   accepts: [{
//     scheme: 'exact',
//     network: 'solana-mainnet',
//     maxAmountRequired: '10500000', // 10.5 USDC in smallest unit
//     resource: '/api/listings/123',
//     description: 'Premium Item',
//     mimeType: 'application/json',
//     payTo: 'seller-wallet-address',
//     maxTimeoutSeconds: 30,
//     asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // mainnet USDC
//   }]
// }
```

### Decoding and Validating Payment Header

```typescript
import { extractPaymentHeader, decodePaymentHeader } from '@bazaar-x402/core';

// Extract from request
const paymentHeaderValue = extractPaymentHeader(request.headers);

if (!paymentHeaderValue) {
  // Return 402 Payment Required
}

// Decode and validate
const payload = decodePaymentHeader(paymentHeaderValue);

if (!payload) {
  // Invalid payment payload
}

// Use payload for verification
console.log(payload.payload.signature); // Transaction signature
console.log(payload.payload.amount);    // Amount in smallest unit
```

### Encoding Payment Payload (Client-Side)

```typescript
import { encodePaymentHeader } from '@bazaar-x402/core';

const payload = {
  x402Version: 1,
  scheme: 'exact',
  network: 'solana-mainnet',
  payload: {
    signature: transactionSignature,
    from: buyerWallet,
    to: sellerWallet,
    amount: '10500000',
    mint: usdcMintAddress,
  },
};

const encoded = encodePaymentHeader(payload);

// Send in X-Payment header
fetch('/api/purchase', {
  headers: {
    'X-Payment': encoded,
  },
});
```

## Network Configuration

### Devnet (Testing)
- Network: `'solana-devnet'`
- USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Use for development and testing with test USDC

### Mainnet (Production)
- Network: `'solana-mainnet'`
- USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Use for production with real USDC

## USDC Conversion

USDC uses 6 decimal places. The utilities handle conversion automatically:

- 1 USDC = 1,000,000 smallest units
- 0.5 USDC = 500,000 smallest units
- 10.25 USDC = 10,250,000 smallest units

Use `usdcToSmallestUnit()` and `smallestUnitToUsdc()` from conversion utilities for manual conversions.

## Testing

Comprehensive tests are available in `src/utils/__tests__/x402.test.ts`:

```bash
pnpm test -- x402
```

Tests cover:
- Payment header encoding/decoding
- Payload validation
- Payment requirements creation
- Header extraction
- Error handling

## Next Steps

This implementation provides the foundation for:
1. **X402Facilitator** - Payment verification against Solana blockchain
2. **X402CurrencyAdapter** - Integration with currency adapter interface
3. **Express Middleware** - Automatic 402 response handling
4. **Client SDK** - Wallet integration and payment signing

See the design document for the complete architecture.
