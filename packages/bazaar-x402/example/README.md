# Bazaar x402 Example Application

This is a standalone example demonstrating how to use the Bazaar x402 marketplace SDK. It includes both a server and a client implementation running in **mock mode** (no real payments required).

## Features

- 📝 **Create Listings**: List items for sale with custom prices
- 🛍️ **Browse Marketplace**: View all active listings
- 💰 **Purchase Items**: Buy items with mock payments (no wallet required)
- 🎁 **Mystery Boxes**: Purchase randomized items from tiered boxes
- 🔧 **Mock Mode**: Everything works without real blockchain transactions

## Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Build Packages

Build the required packages:

```bash
pnpm --filter @bazaar-x402/core build
pnpm --filter @bazaar-x402/server build
pnpm --filter @bazaar-x402/client build
```

### 3. Start the Server

```bash
cd packages/bazaar-x402/example
pnpm dev
```

The server will start on `http://localhost:3001`

### 4. Open the Demo

Open your browser to `http://localhost:3001`

You'll see a web interface with three sections:
- **Create Listing**: Form to create new marketplace listings
- **Active Listings**: Browse and purchase items
- **Mystery Boxes**: Purchase randomized items

## How It Works

### Server (`server.ts`)

The server sets up an Express app with the Bazaar marketplace:

```typescript
import { BazaarMarketplace, createBazaarRoutes } from '@bazaar-x402/server';

const marketplace = new BazaarMarketplace({
  storageAdapter: new MemoryStorageAdapter(),
  paymentAdapter: new MockPaymentAdapter(),
  itemAdapter: new SimpleItemAdapter(),
  mockMode: true, // No real payments
});

app.use('/api', createBazaarRoutes(marketplace));
```

### Item Adapter (`simple-item-adapter.ts`)

A simple implementation of the `ItemAdapter` interface that manages demo items:

- Validates item ownership
- Locks/unlocks items during listing
- Transfers items between users
- Generates random items for mystery boxes

### Client (`public/app.js`)

A vanilla JavaScript client that demonstrates:

- Creating listings via POST `/api/bazaar/listings`
- Fetching listings via GET `/api/bazaar/listings`
- Purchasing items via GET `/api/bazaar/purchase/:listingId`
- Purchasing mystery boxes via GET `/api/bazaar/mystery-box/:tierId`

## Mock Mode vs Real Mode

This example runs in **mock mode**, which means:

✅ **Mock Mode** (Current):
- No wallet connection required
- No blockchain transactions
- Instant purchases with GET requests
- Perfect for development and testing

🔐 **Real Mode** (Production):
- Requires Solana wallet connection
- Real USDC payments on-chain
- x402 payment protocol (402 Payment Required)
- Payment verification before item transfer

To switch to real mode, you would:
1. Replace `MockPaymentAdapter` with `RealPaymentAdapter`
2. Set `mockMode: false` in marketplace config
3. Configure Solana RPC endpoint
4. Update client to handle x402 payment flow

## API Endpoints

### Listings

- `GET /api/bazaar/listings` - Get active listings
- `POST /api/bazaar/listings` - Create a new listing
- `DELETE /api/bazaar/listings/:id` - Cancel a listing
- `GET /api/bazaar/listings/my` - Get your listings

### Purchases

- `GET /api/bazaar/purchase/:listingId` - Purchase an item (mock mode)
- `GET /api/bazaar/mystery-box/:tierId` - Purchase mystery box (mock mode)
- `GET /api/bazaar/mystery-box/tiers` - Get available mystery box tiers

## Customization

### Adding Your Own Items

Edit `simple-item-adapter.ts` to add more demo items:

```typescript
private createDemoItems() {
  const demoItems: SimpleItem[] = [
    {
      id: 'my-item',
      name: 'My Custom Item',
      description: 'A unique item',
      rarity: 'epic',
      owner: 'player1',
    },
  ];
  // ...
}
```

### Configuring Mystery Box Tiers

The mystery box tiers are configured in the marketplace setup. You can customize them by passing a `mysteryBoxTiers` array to the `BazaarMarketplace` constructor.

## Next Steps

- **Integrate with Your Game**: Replace `SimpleItemAdapter` with your game's item system
- **Add Real Payments**: Switch to `RealPaymentAdapter` for production
- **Add Storage**: Use `RedisStorageAdapter` for persistent data
- **Add Authentication**: Integrate with your auth system

## Learn More

- [Bazaar x402 Documentation](../README.md)
- [Server SDK](../server/README.md)
- [Client SDK](../client/README.md)
- [x402 Protocol](https://x402.org)

## Troubleshooting

**Server won't start:**
- Make sure you've built all packages first
- Check that port 3001 is available

**Can't create listings:**
- Verify the item ID exists in `SimpleItemAdapter`
- Check the browser console for errors

**Purchases fail:**
- In mock mode, purchases should always succeed
- Check server logs for error details
