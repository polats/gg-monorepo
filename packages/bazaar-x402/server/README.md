# @bazaar-x402/server

Server SDK for Bazaar x402 marketplace with x402 payment integration.

## Overview

This package provides the backend functionality for running a P2P marketplace with cryptocurrency payments. It includes:

- **BazaarMarketplace**: Main marketplace class for managing listings and purchases
- **Payment Verification**: On-chain transaction verification for Solana/USDC
- **Storage Adapters**: Redis and in-memory storage implementations
- **Express Integration**: Ready-to-use middleware for Express apps

## Installation

```bash
pnpm add @bazaar-x402/server @bazaar-x402/core
```

## Quick Start

```typescript
import { BazaarMarketplace } from '@bazaar-x402/server';
import { RedisStorageAdapter } from '@bazaar-x402/server/adapters';

const marketplace = new BazaarMarketplace({
  storageAdapter: new RedisStorageAdapter(redis),
  itemAdapter: new MyGameItemAdapter(),
  network: 'solana-devnet',
  usdcMint: process.env.USDC_MINT_ADDRESS,
});

// Create listing
const listing = await marketplace.createListing({
  itemId: 'item-123',
  itemType: 'gem',
  sellerUsername: 'player1',
  sellerWallet: 'wallet-address',
  priceUSDC: 5.0,
});
```

## Express Integration

```typescript
import { createBazaarRoutes } from '@bazaar-x402/server/express';
import express from 'express';

const app = express();
const bazaarRoutes = createBazaarRoutes(marketplace);
app.use('/api', bazaarRoutes);
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

## Mock Mode

For development without real payments:

```typescript
import { MockPaymentAdapter } from '@bazaar-x402/server/adapters';

const marketplace = new BazaarMarketplace({
  storageAdapter,
  itemAdapter,
  paymentAdapter: new MockPaymentAdapter(), // Bypass payment verification
});
```

## Package Structure

```
src/
├── marketplace.ts          # Main marketplace class
├── listing-manager.ts      # Listing management
├── mystery-box-manager.ts  # Mystery box system
├── payment-verifier.ts     # Payment verification
├── adapters/               # Storage adapters
└── express.ts              # Express middleware
```
