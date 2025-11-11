# Bazaar x402 Example Application

This is a standalone example demonstrating how to use the Bazaar x402 marketplace SDK. It includes both a server and a client implementation running in **mock mode** (no real payments required).

## Features

- 📝 **Create Listings**: List items for sale with custom prices
- 🛍️ **Browse Marketplace**: View all active listings
- 💰 **Purchase Items**: Buy items with currency balance
- 🎁 **Mystery Boxes**: Purchase randomized items from tiered boxes
- 💵 **Currency System**: Track balances and transaction history
- 📊 **Transaction History**: View all purchases and sales with pagination
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

### 3. Configure Environment (Optional)

Copy the example environment file and customize if needed:

```bash
cd packages/bazaar-x402/example
cp .env.example .env
```

The default configuration uses mock mode with in-memory storage. See [Configuration](#configuration) for details.

### 4. Start the Server

```bash
cd packages/bazaar-x402/example
pnpm dev
```

The server will start on `http://localhost:3001`

### 5. Open the Demo

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

## Configuration

The example server uses environment variables for configuration. See `.env.example` for all available options.

### Payment Modes

**Mock Mode** (Default):
```bash
PAYMENT_MODE=mock
MOCK_DEFAULT_BALANCE=1000
MOCK_USE_REDIS=false
```

- No wallet connection required
- No blockchain transactions
- Instant purchases
- Perfect for development and testing

**Production Mode** (Devnet):
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=devnet
SOLANA_DEVNET_RPC=https://api.devnet.solana.com
USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

- Requires Solana wallet connection
- Real USDC payments on devnet
- x402 payment protocol (402 Payment Required)
- Payment verification before item transfer

**Production Mode** (Mainnet):
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=mainnet
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
USDC_MINT_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

- Real USDC payments on mainnet
- Use dedicated RPC provider for production
- Monitor transaction success rates

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENT_MODE` | `mock` | Payment mode: `mock` or `production` |
| `SOLANA_NETWORK` | `devnet` | Solana network: `devnet` or `mainnet` |
| `SOLANA_DEVNET_RPC` | `https://api.devnet.solana.com` | Devnet RPC endpoint |
| `SOLANA_MAINNET_RPC` | `https://api.mainnet-beta.solana.com` | Mainnet RPC endpoint |
| `USDC_MINT_DEVNET` | `4zMMC9...` | USDC mint address on devnet |
| `USDC_MINT_MAINNET` | `EPjFW...` | USDC mint address on mainnet |
| `MOCK_DEFAULT_BALANCE` | `1000` | Starting balance for new users (mock mode) |
| `MOCK_USE_REDIS` | `false` | Use Redis for persistent storage (mock mode) |
| `TX_POLL_MAX_ATTEMPTS` | `10` | Max transaction polling attempts |
| `TX_POLL_INTERVAL_MS` | `2000` | Interval between polling attempts (ms) |
| `BALANCE_CACHE_DURATION` | `30` | Balance cache duration (seconds) |

See `.env.example` for detailed documentation of all configuration options.

## API Endpoints

### Balance & Transactions

- `GET /api/balance/:userId` - Get user's current balance
- `POST /api/balance/add` - Add currency to user's balance (testing only)
- `GET /api/transactions/:userId` - Get user's transaction history with pagination

### Listings

- `GET /api/bazaar/listings` - Get active listings
- `POST /api/bazaar/listings` - Create a new listing
- `DELETE /api/bazaar/listings/:id` - Cancel a listing
- `GET /api/bazaar/listings/my` - Get your listings

### Purchases

- `GET /api/bazaar/purchase-with-currency/:listingId` - Purchase an item with currency
- `GET /api/bazaar/mystery-box-with-currency/:tierId` - Purchase mystery box with currency
- `GET /api/bazaar/mystery-box/tiers` - Get available mystery box tiers

### Inventory

- `GET /api/inventory/:username` - Get user's inventory

For detailed API documentation, see [API_ENDPOINTS.md](./API_ENDPOINTS.md)

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

## Testing the API

### Using the Test Script

Run the automated test script to verify all endpoints:

```bash
./test-endpoints.sh
```

This will test:
- Balance queries
- Adding currency
- Transaction history with pagination
- Mystery box purchases
- Error handling

### Manual Testing with curl

```bash
# Get balance
curl http://localhost:3001/api/balance/testuser

# Add currency
curl -X POST http://localhost:3001/api/balance/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"testuser","amount":100}'

# Get transactions
curl http://localhost:3001/api/transactions/testuser?page=1&limit=10

# Purchase mystery box
curl "http://localhost:3001/api/bazaar/mystery-box-with-currency/tier-common?buyer=testuser&buyerWallet=wallet-testuser"
```

## Devnet Testing Instructions

### Setting Up for Devnet Testing

1. **Switch to Production Mode**:
   ```bash
   # In .env file
   PAYMENT_MODE=production
   SOLANA_NETWORK=devnet
   ```

2. **Get Devnet USDC**:
   - Install Phantom wallet browser extension
   - Switch to Devnet in Phantom settings
   - Get devnet SOL from https://faucet.solana.com
   - Get devnet USDC from https://spl-token-faucet.com

3. **Test the Flow**:
   - Connect your Phantom wallet (on devnet)
   - Try purchasing a listing or mystery box
   - You'll see a 402 Payment Required response
   - Sign the transaction in Phantom
   - The purchase will complete after on-chain verification

### x402 Payment Flow

When running in production mode, purchases follow the x402 protocol:

1. **Initial Request**: Client requests purchase → Server returns 402 Payment Required
2. **Payment Requirements**: Server provides payment details (amount, recipient, network)
3. **Transaction Creation**: Client creates Solana USDC transfer transaction
4. **Wallet Signing**: User signs transaction in their wallet (Phantom, etc.)
5. **Broadcast**: Transaction is broadcast to Solana network
6. **Verification**: Server verifies transaction on-chain
7. **Completion**: Purchase completes and item is transferred

### Currency Flow Architecture

The example demonstrates the complete currency adapter pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Example Application                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Uses CurrencyAdapter Interface
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼──────────┐
│ MockCurrency   │      │ X402Currency      │
│ Adapter        │      │ Adapter           │
│ (Development)  │      │ (Production)      │
└───────┬────────┘      └────────┬──────────┘
        │                        │
        │                        │
┌───────▼────────┐      ┌────────▼──────────┐
│ In-Memory      │      │ Solana Blockchain │
│ Storage        │      │ (Devnet/Mainnet)  │
└────────────────┘      └───────────────────┘
```

**Mock Mode** (Default):
- In-memory currency balances
- Instant transactions
- No blockchain required
- Perfect for development

**Production Mode** (x402):
- Real USDC on Solana
- On-chain verification
- Transaction polling
- Network-specific configuration

## Troubleshooting

### Server Issues

**Server won't start:**
- Make sure you've built all packages first: `pnpm build`
- Check that port 3001 is available
- Verify environment variables are set correctly
- Check for TypeScript compilation errors

**Configuration errors:**
- Ensure `.env` file exists (copy from `.env.example`)
- Validate USDC mint addresses match the network
- Check RPC endpoints are accessible
- Verify `PAYMENT_MODE` is either 'mock' or 'production'

### Listing Issues

**Can't create listings:**
- Verify the item ID exists in `SimpleItemAdapter`
- Check the browser console for errors
- Ensure wallet is connected
- Verify item is not already listed

**Listings not appearing:**
- Click "Refresh Listings" button
- Check server logs for errors
- Verify storage adapter is working
- Check network tab for API errors

### Purchase Issues

**Purchases fail in mock mode:**
- Check user has sufficient balance
- Verify listing is still active
- Check server logs for detailed errors
- Ensure currency adapter is initialized

**Purchases fail in production mode:**
- Verify wallet has sufficient USDC balance
- Check wallet is on correct network (devnet/mainnet)
- Ensure transaction was broadcast successfully
- Check Solana explorer for transaction status
- Verify payment verification timeout settings

**402 Payment Required not working:**
- Confirm `PAYMENT_MODE=production` in `.env`
- Check x402 payment handler is integrated
- Verify wallet adapter is connected
- Check browser console for errors

### Balance Issues

**Balance not updating:**
- Check that currency adapter is properly initialized
- Verify transactions are being recorded
- Click refresh button to reload balance
- Check server logs for errors
- Verify API endpoint is responding

**Balance shows incorrect amount:**
- In mock mode: Check `MOCK_DEFAULT_BALANCE` setting
- In production mode: Verify on-chain USDC balance
- Check for failed transactions that weren't rolled back
- Verify currency adapter is using correct network

### Transaction History Issues

**Transactions not appearing:**
- Click refresh button to reload
- Check that transactions are being recorded
- Verify API endpoint `/api/transactions/:userId` is working
- Check browser console for errors

**Explorer links not working:**
- Verify transaction has `networkId` field
- Check transaction signature is valid
- Ensure using correct network (devnet/mainnet)
- Try copying transaction ID and searching manually

### Network Issues

**RPC connection errors:**
- Check RPC endpoint URLs in `.env`
- Try alternative RPC providers
- Verify network connectivity
- Check rate limits on public RPC endpoints

**Transaction polling timeout:**
- Increase `TX_POLL_MAX_ATTEMPTS` in `.env`
- Increase `TX_POLL_INTERVAL_MS` for slower networks
- Check Solana network status
- Verify transaction was actually broadcast

### Development Tips

**Fast iteration:**
- Use mock mode for rapid development
- Test with small amounts first in production
- Use devnet before mainnet
- Monitor server logs for detailed errors

**Debugging:**
- Enable verbose logging in currency adapter
- Check browser network tab for API calls
- Use Solana explorer to verify transactions
- Test with multiple wallets/users

**Common mistakes:**
- Forgetting to build packages after changes
- Using wrong network (devnet vs mainnet)
- Insufficient balance for gas fees
- Not waiting for transaction confirmation
