# @bazaar-x402/client

Client SDK for Bazaar x402 marketplace with wallet integration.

## Overview

This package provides the frontend functionality for interacting with a Bazaar x402 marketplace. It includes:

- **BazaarClient**: Main client class for API interactions
- **Wallet Integration**: Solana wallet adapter support
- **x402 Payment Flow**: Automatic handling of payment protocol
- **Mock Mode**: Development mode without real payments

## Installation

```bash
pnpm add @bazaar-x402/client @bazaar-x402/core
```

## Quick Start

```typescript
import { BazaarClient } from '@bazaar-x402/client';
import { useWallet } from '@solana/wallet-adapter-react';

const wallet = useWallet();

const bazaarClient = new BazaarClient({
  apiBaseUrl: '/api',
  walletAdapter: wallet,
  network: 'solana-devnet',
});

// Browse listings
const listings = await bazaarClient.getActiveListings();

// Purchase item
const result = await bazaarClient.purchaseItem(listingId);
```

## React Hook Example

```typescript
import { useMemo } from 'react';
import { BazaarClient } from '@bazaar-x402/client';
import { useWallet } from '@solana/wallet-adapter-react';

export function useBazaar() {
  const wallet = useWallet();
  
  const bazaarClient = useMemo(() => {
    return new BazaarClient({
      apiBaseUrl: '/api',
      walletAdapter: wallet,
      network: import.meta.env.VITE_SOLANA_NETWORK,
    });
  }, [wallet]);
  
  return bazaarClient;
}
```

## Mock Mode

For development without wallet setup:

```typescript
import { BazaarClient, MockWalletAdapter } from '@bazaar-x402/client';

const bazaarClient = new BazaarClient({
  apiBaseUrl: '/api',
  walletAdapter: new MockWalletAdapter(),
  network: 'solana-devnet',
  mockMode: true, // Skip x402 payment flow
});
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

## Package Structure

```
src/
├── bazaar-client.ts      # Main client class
├── wallet-connector.ts   # Wallet integration
├── payment-handler.ts    # x402 payment flow
└── mock-wallet-adapter.ts # Mock wallet for testing
```
