# X402 Currency Adapter Implementation

This document describes the X402CurrencyAdapter implementation for production mode with real Solana USDC payments.

## Overview

The `X402CurrencyAdapter` implements the `CurrencyAdapter` interface for production use with the x402 payment protocol. It provides:

- On-chain USDC balance queries
- x402 payment protocol integration (402 Payment Required responses)
- Payment verification via blockchain
- Transaction history tracking
- Balance caching to reduce RPC calls

## Architecture

```
X402CurrencyAdapter
├── Solana Connection (RPC)
├── X402Facilitator (payment verification)
├── Balance Cache (30s default)
└── Transaction Storage (in-memory)
```

## Usage

### Basic Setup

```typescript
import { X402CurrencyAdapter } from '@bazaar-x402/core';

const adapter = new X402CurrencyAdapter({
  network: 'solana-devnet', // or 'solana-mainnet'
  devnetRpcUrl: 'https://api.devnet.solana.com',
  mainnetRpcUrl: 'https://api.mainnet-beta.solana.com',
  usdcMintDevnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  usdcMintMainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  maxPollAttempts: 10,
  pollIntervalMs: 2000,
  balanceCacheDuration: 30, // seconds
});
```

### Query Balance

```typescript
// Query on-chain USDC balance
const balance = await adapter.getBalance('wallet-address');
console.log(`Balance: ${balance.amount} ${balance.currency}`);
// Output: Balance: 100.5 USDC
```

### Purchase Flow

#### Step 1: Initiate Purchase (Returns 402)

```typescript
const initiation = await adapter.initiatePurchase({
  buyerId: 'buyer-wallet',
  sellerId: 'seller-wallet',
  amount: 10.5, // USDC
  resource: '/api/listings/123',
  description: 'Premium Item',
  timeoutSeconds: 30,
});

if (initiation.paymentRequired) {
  // Return 402 response to client with payment requirements
  return {
    status: 402,
    body: initiation.requirements,
  };
}
```

#### Step 2: Client Signs Transaction

The client receives the 402 response and:
1. Prompts user to sign a Solana transaction
2. Broadcasts transaction to blockchain
3. Retries the request with `X-Payment` header containing payment proof

#### Step 3: Verify Payment

```typescript
// Extract X-Payment header from request
const paymentHeader = request.headers.get('x-payment');

if (paymentHeader) {
  const result = await adapter.verifyPurchase({
    paymentHeader,
    expectedAmount: 10.5,
    expectedRecipient: 'seller-wallet',
  });
  
  if (result.success) {
    console.log(`Payment verified: ${result.txHash}`);
    // Complete the purchase
  } else {
    console.error(`Payment failed: ${result.error}`);
  }
}
```

### Transaction History

```typescript
// Get transaction history with pagination
const transactions = await adapter.getTransactions('user-wallet', {
  page: 1,
  limit: 20,
  sortOrder: 'desc',
});

transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} USDC - ${tx.txId}`);
});
```

### Record Transaction

```typescript
await adapter.recordTransaction({
  id: 'unique-id',
  userId: 'buyer-wallet',
  type: 'listing_purchase',
  amount: 10.5,
  txId: 'solana-tx-signature',
  networkId: 'solana-devnet',
  timestamp: Date.now(),
  listingId: '123',
  itemId: 'item-456',
});
```

## Configuration

### Network Configuration

**Devnet (Testing)**
```typescript
{
  network: 'solana-devnet',
  devnetRpcUrl: 'https://api.devnet.solana.com',
  usdcMintDevnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
}
```

**Mainnet (Production)**
```typescript
{
  network: 'solana-mainnet',
  mainnetRpcUrl: 'https://api.mainnet-beta.solana.com',
  usdcMintMainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}
```

### Polling Configuration

```typescript
{
  maxPollAttempts: 10,      // Max retries for transaction confirmation
  pollIntervalMs: 2000,     // Wait 2s between retries
}
```

### Balance Caching

```typescript
{
  balanceCacheDuration: 30, // Cache balance for 30 seconds
}
```

## Payment Verification

The adapter uses `X402Facilitator` to verify payments on-chain:

1. **Decode Payment Header**: Extract payment payload from Base64
2. **Validate Structure**: Check x402 version, scheme, network
3. **Verify Amount**: Ensure payment amount matches expected price
4. **Verify Recipient**: Ensure payment went to correct wallet
5. **Verify Mint**: Ensure payment used correct USDC mint
6. **Verify On-Chain**: Poll Solana blockchain for transaction confirmation

## Error Handling

### Unsupported Operations

```typescript
// These methods throw errors in production mode:
await adapter.deduct(userId, amount);
// Error: deduct() is not supported in production mode

await adapter.add(userId, amount);
// Error: add() is not supported in production mode
```

### Payment Verification Failures

```typescript
const result = await adapter.verifyPurchase(params);

if (!result.success) {
  switch (result.error) {
    case 'Network mismatch':
      // Transaction on wrong network
      break;
    case 'Insufficient amount':
      // Payment amount too low
      break;
    case 'Recipient mismatch':
      // Payment went to wrong wallet
      break;
    case 'Transaction not found':
      // Transaction not confirmed on-chain
      break;
  }
}
```

## Balance Caching

Balance queries are cached to reduce RPC calls:

- Default cache duration: 30 seconds
- Cache invalidated on transaction recording
- Stale cache returned on RPC errors

```typescript
// First call: queries blockchain
const balance1 = await adapter.getBalance('wallet');

// Second call within 30s: returns cached value
const balance2 = await adapter.getBalance('wallet');

// Clear cache manually (for testing)
adapter.clearBalanceCache();
```

## Testing

### Mock Solana Connection

For testing, you can mock the Solana connection:

```typescript
import { Connection } from '@solana/web3.js';

const mockConnection = {
  getParsedTokenAccountsByOwner: vi.fn(),
  getTransaction: vi.fn(),
} as unknown as Connection;

// Inject mock connection via facilitator
```

### Test with Devnet

Use Solana devnet for integration testing:

1. Create test wallets
2. Get devnet USDC from faucet
3. Configure adapter with devnet settings
4. Test full payment flow

## Integration with Marketplace

### Mystery Box Purchase

```typescript
class MysteryBoxManager {
  constructor(private currencyAdapter: X402CurrencyAdapter) {}
  
  async purchase(userId: string, boxId: string, paymentHeader?: string) {
    const box = await this.getBox(boxId);
    
    // Initiate purchase (returns 402 if no payment header)
    if (!paymentHeader) {
      return await this.currencyAdapter.initiatePurchase({
        buyerId: userId,
        sellerId: 'system',
        amount: box.priceUSDC,
        resource: `/api/mystery-boxes/${boxId}`,
        description: box.name,
      });
    }
    
    // Verify payment
    const result = await this.currencyAdapter.verifyPurchase({
      paymentHeader,
      expectedAmount: box.priceUSDC,
      expectedRecipient: 'system-wallet',
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Generate box contents and record transaction
    const items = await this.generateContents(box);
    await this.currencyAdapter.recordTransaction({
      id: generateId(),
      userId,
      type: 'mystery_box_purchase',
      amount: box.priceUSDC,
      txId: result.txHash,
      networkId: result.networkId,
      timestamp: Date.now(),
      boxId,
      items: items.map(i => i.id),
    });
    
    return { items, txHash: result.txHash };
  }
}
```

### Listing Purchase

```typescript
class ListingManager {
  constructor(private currencyAdapter: X402CurrencyAdapter) {}
  
  async purchase(buyerId: string, listingId: string, paymentHeader?: string) {
    const listing = await this.getListing(listingId);
    
    // Initiate purchase (returns 402 if no payment header)
    if (!paymentHeader) {
      return await this.currencyAdapter.initiatePurchase({
        buyerId,
        sellerId: listing.sellerId,
        amount: listing.priceUSDC,
        resource: `/api/listings/${listingId}`,
        description: listing.title,
      });
    }
    
    // Verify payment
    const result = await this.currencyAdapter.verifyPurchase({
      paymentHeader,
      expectedAmount: listing.priceUSDC,
      expectedRecipient: listing.sellerId,
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Transfer item and record transactions
    await this.transferItem(listing.itemId, listing.sellerId, buyerId);
    
    // Record buyer transaction
    await this.currencyAdapter.recordTransaction({
      id: generateId(),
      userId: buyerId,
      type: 'listing_purchase',
      amount: listing.priceUSDC,
      txId: result.txHash,
      networkId: result.networkId,
      timestamp: Date.now(),
      listingId,
      itemId: listing.itemId,
    });
    
    // Record seller transaction
    await this.currencyAdapter.recordTransaction({
      id: generateId(),
      userId: listing.sellerId,
      type: 'listing_sale',
      amount: listing.priceUSDC,
      txId: result.txHash,
      networkId: result.networkId,
      timestamp: Date.now(),
      listingId,
      itemId: listing.itemId,
    });
    
    return { txHash: result.txHash };
  }
}
```

## Security Considerations

1. **Network Validation**: Always verify transactions on correct network
2. **Amount Validation**: Ensure payment amount matches expected price exactly
3. **Recipient Validation**: Verify payment went to correct seller wallet
4. **Mint Validation**: Ensure payment used correct USDC mint address
5. **Replay Prevention**: Transaction signatures are unique and cannot be reused
6. **Rate Limiting**: Implement rate limiting on verification endpoints

## Performance

- **Balance Queries**: Cached for 30s (configurable)
- **Transaction Polling**: Max 10 attempts × 2s = 20s timeout
- **RPC Calls**: Minimized through caching
- **Connection Pooling**: Single persistent Solana connection

## Monitoring

Log key events for monitoring:

```typescript
// Payment initiation
console.log('Payment initiated', { userId, amount, network });

// Payment verification
console.log('Payment verified', { txHash, amount, latency });

// Verification failure
console.error('Payment failed', { error, userId, amount });
```

## Migration from Mock Mode

To migrate from MockCurrencyAdapter to X402CurrencyAdapter:

1. Update configuration to use production mode
2. Configure Solana RPC endpoints
3. Test with devnet first
4. Deploy to production with mainnet
5. Monitor transaction success rate

## Troubleshooting

### Balance Query Fails

- Check RPC endpoint is accessible
- Verify wallet address is valid Solana public key
- Check USDC mint address is correct for network

### Payment Verification Fails

- Ensure transaction was broadcast to correct network
- Check transaction signature is valid
- Verify payment amount and recipient match requirements
- Increase polling attempts if network is slow

### Transaction Not Found

- Wait longer for confirmation (increase maxPollAttempts)
- Check transaction on Solana explorer
- Verify transaction was broadcast successfully

## Reference

- [x402 Protocol Specification](./X402_IMPLEMENTATION.md)
- [X402Facilitator Documentation](./X402_FACILITATOR_IMPLEMENTATION.md)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
