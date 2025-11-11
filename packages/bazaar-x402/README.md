# Bazaar x402

A reusable P2P marketplace library for virtual item trading using the x402 payment protocol on Solana.

## Overview

Bazaar x402 is a framework-agnostic marketplace library that enables virtual item trading with USDC payments. It's designed to be easily integrated into any game or application with minimal code changes.

## Packages

This is a monorepo containing three packages:

### [@bazaar-x402/core](./core)
Core types, interfaces, and utilities shared by both server and client.

- Type definitions for listings, payments, mystery boxes
- Storage and item adapter interfaces
- Validation and conversion utilities

### [@bazaar-x402/server](./server)
Backend SDK for handling x402 payment flows and marketplace management.

- BazaarMarketplace class for managing listings
- Payment verification on Solana blockchain
- Storage adapters (Redis, in-memory)
- Express middleware integration

### [@bazaar-x402/client](./client)
Frontend SDK for browsing listings and making purchases.

- BazaarClient class for API interactions
- Wallet integration (Solana)
- Automatic x402 payment flow handling
- Mock mode for development

## Quick Start

### Installation

```bash
# Install all packages
pnpm add @bazaar-x402/core @bazaar-x402/server @bazaar-x402/client
```

### Server Setup

```typescript
import { BazaarMarketplace, RedisStorageAdapter } from '@bazaar-x402/server';
import { createBazaarRoutes } from '@bazaar-x402/server/express';

// Create marketplace instance
const marketplace = new BazaarMarketplace({
  storageAdapter: new RedisStorageAdapter(redis),
  itemAdapter: new MyGameItemAdapter(),
  network: 'solana-devnet',
  usdcMint: process.env.USDC_MINT_ADDRESS,
});

// Add routes to Express app
const bazaarRoutes = createBazaarRoutes(marketplace);
app.use('/api', bazaarRoutes);
```

### Client Setup

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

## Features

- **x402 Payment Protocol**: HTTP-based cryptocurrency payments
- **Adapter Pattern**: Support for any storage backend and item system
- **Mock Mode**: Develop without real payments or wallet setup
- **TypeScript**: Full type safety across all packages
- **Framework Agnostic**: Works with any web framework
- **Express Integration**: Ready-to-use middleware

## Development

### Build All Packages

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Type Checking

```bash
pnpm type-check
```

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Game Client    │  HTTP   │  Game Server     │  HTTP   │  Facilitator    │
│  + @bazaar/     │────────>│  + @bazaar/      │────────>│  (x402.org)     │
│    client       │         │    server        │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │                            │
                                      ▼                            ▼
                            ┌──────────────────┐       ┌─────────────────┐
                            │  Storage Adapter │       │  Solana         │
                            │  (Redis/Mongo)   │       │  Blockchain     │
                            └──────────────────┘       └─────────────────┘
```

## Documentation

- [Core Package](./core/README.md)
- [Server Package](./server/README.md)
- [Client Package](./client/README.md)
- [Integration Guide](./docs/integration-guide.md) _(coming soon)_
- [API Reference](./docs/api-reference.md) _(coming soon)_

## Examples

- [Goblin Gardens Integration](./examples/goblin-gardens) _(coming soon)_
- [Basic Marketplace](./examples/basic) _(coming soon)_

## License

MIT
