# Bazaar x402

A P2P marketplace library for trading virtual items with real USDC payments on Solana using the x402 payment protocol.

## Quick Start

### Installation

```bash
npm install @bazaar-x402/server @bazaar-x402/core
# or
pnpm add @bazaar-x402/server @bazaar-x402/core
```

### Server Setup (3 steps)

```typescript
import express from 'express';
import { BazaarMarketplace, createBazaarRoutes } from '@bazaar-x402/server';
import { MemoryStorageAdapter, MockPaymentAdapter } from '@bazaar-x402/server';
import { loadAndValidateConfig, createCurrencyAdapter } from '@bazaar-x402/core';

const app = express();
app.use(express.json());

// 1. Load configuration
const config = loadAndValidateConfig(process.env);

// 2. Create marketplace
const marketplace = new BazaarMarketplace({
  storageAdapter: new MemoryStorageAdapter(),
  paymentAdapter: new MockPaymentAdapter(),
  itemAdapter: yourItemAdapter, // Implement IItemAdapter
  mockMode: config.mode === 'mock',
});

// 3. Add routes
const router = express.Router();
createBazaarRoutes(marketplace, router);
app.use('/api/bazaar', router);

app.listen(3001);
```

### Environment Variables

```bash
# Mock mode (no real payments)
PAYMENT_MODE=mock

# Production mode (real USDC on Solana)
PAYMENT_MODE=production
SOLANA_NETWORK=devnet  # or mainnet
```

### Client Setup (React + Solana Wallet)

```typescript
import { handleX402Purchase } from './x402-payment-handler';

// In your component
const purchaseItem = async (listingId) => {
  const url = `/api/bazaar/purchase-with-currency/${listingId}?buyer=${username}&buyerWallet=${walletAddress}`;
  
  const result = await handleX402Purchase(url, wallet, (status) => {
    console.log(status); // "Signing transaction...", "Broadcasting...", etc.
  });
  
  console.log('Purchase complete!', result);
};
```

## Payment Modes

### Mock Mode (Development)
- No real transactions
- In-memory balance tracking
- Fast testing
- No wallet required

```bash
PAYMENT_MODE=mock pnpm start
```

### Production Mode (Real Payments)
- Real USDC on Solana
- x402 payment protocol
- On-chain verification
- Requires Solana wallet with USDC

```bash
PAYMENT_MODE=production SOLANA_NETWORK=devnet pnpm start
```

## Features

- ✅ **P2P Marketplace** - Direct player-to-player trading
- ✅ **Real USDC Payments** - Solana blockchain integration
- ✅ **x402 Protocol** - Secure payment verification
- ✅ **Mystery Boxes** - Randomized item drops
- ✅ **Mock Mode** - Test without real money
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Framework Agnostic** - Works with any backend

## Architecture

```
@bazaar-x402/
├── core/          # Shared types, utilities, x402 protocol
├── server/        # Backend marketplace logic
├── client/        # Frontend SDK (optional)
└── example/       # Full working example
```

## Item Adapter

Implement `IItemAdapter` to connect your game's items:

```typescript
import { IItemAdapter } from '@bazaar-x402/core';

class MyItemAdapter implements IItemAdapter {
  async getItemsByOwner(userId: string) {
    // Return user's items from your database
    return await db.items.findMany({ where: { owner: userId } });
  }
  
  async transferItem(itemId: string, fromUser: string, toUser: string) {
    // Transfer item ownership in your database
    await db.items.update({
      where: { id: itemId },
      data: { owner: toUser }
    });
  }
  
  async grantItemToUser(item: any, userId: string) {
    // Create new item for user
    await db.items.create({
      data: { ...item, owner: userId }
    });
  }
}
```

## API Endpoints

The marketplace automatically creates these endpoints:

- `GET /api/bazaar/listings` - Get all active listings
- `POST /api/bazaar/listings` - Create a listing
- `GET /api/bazaar/purchase/:id` - Purchase an item
- `GET /api/bazaar/mystery-box/:tier` - Open mystery box
- `GET /api/bazaar/mystery-box-tiers` - Get available tiers

## x402 Payment Flow

1. Client requests purchase → Server returns `402 Payment Required`
2. Client signs Solana transaction with wallet
3. Client sends signed transaction to server
4. Server broadcasts transaction and waits for confirmation
5. Server completes purchase and transfers item

## Requirements for Production

- Solana wallet (Phantom, Solflare, etc.)
- USDC token account
- SOL for transaction fees
- Valid Solana RPC endpoint

## Example

See `packages/bazaar-x402/example/` for a complete working implementation with:
- Express server
- React frontend
- Solana wallet integration
- Both mock and production modes

```bash
cd packages/bazaar-x402/example
pnpm install
pnpm start
```

## Documentation

- [Configuration Guide](./CONFIGURATION.md) - Environment setup
- [X402 Payment Flow](./X402_PAYMENT_FLOW.md) - Payment protocol details
- [Example README](./example/README.md) - Running the example app

## Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter @bazaar-x402/core test
pnpm --filter @bazaar-x402/server test
```

## License

MIT
