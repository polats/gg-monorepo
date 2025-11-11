# Bazaar x402 Example

A complete working example of a P2P marketplace with real USDC payments on Solana.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in mock mode (no real payments)
pnpm start

# Run in production mode (real USDC on Solana devnet)
PAYMENT_MODE=production pnpm start
```

Open http://localhost:3000 in your browser.

## Features

- 🛒 **Marketplace** - Buy and sell items with USDC
- 🎁 **Mystery Boxes** - Random item drops with different rarities
- 💰 **Dual Payment Modes** - Mock (testing) and Production (real payments)
- 🔗 **Solana Integration** - Real blockchain transactions
- 📊 **Transaction History** - Track all purchases and sales
- 🎨 **Clean UI** - Simple, functional interface

## Payment Modes

### Mock Mode (Default)
Perfect for development and testing:
- No wallet required
- No real money
- Instant transactions
- In-memory balance tracking

```bash
pnpm start
# or explicitly
PAYMENT_MODE=mock pnpm start
```

### Production Mode
Real USDC payments on Solana:
- Requires Solana wallet (Phantom, Solflare, etc.)
- Real USDC transactions
- On-chain verification
- Transaction fees apply

```bash
PAYMENT_MODE=production SOLANA_NETWORK=devnet pnpm start
```

## Configuration

Create `.env` file:

```bash
# Payment mode: mock or production
PAYMENT_MODE=mock

# Solana network (for production mode)
SOLANA_NETWORK=devnet

# Optional: Custom RPC endpoints
SOLANA_DEVNET_RPC=https://api.devnet.solana.com
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
```

## Using Production Mode

### Requirements

1. **Solana Wallet**
   - Install Phantom, Solflare, or another Solana wallet
   - Create or import a wallet

2. **Get Devnet SOL**
   ```bash
   solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet
   ```

3. **Get Devnet USDC**
   - Use a devnet USDC faucet
   - Or swap devnet SOL for devnet USDC

4. **Connect Wallet**
   - Click "Connect Wallet" in the app
   - Approve the connection

### Making a Purchase

1. Browse listings or mystery boxes
2. Click "Buy" on an item
3. Sign the transaction in your wallet
4. Wait for confirmation (~1-2 seconds)
5. Item appears in your inventory!

### Viewing Transactions

- Click "View on Solscan" to see transaction details
- Check your wallet for USDC balance changes
- View transaction history in the app

## Project Structure

```
example/
├── server.ts              # Express server with marketplace
├── simple-item-adapter.ts # Item management implementation
├── public/
│   ├── index.html         # Main HTML
│   ├── styles.css         # Styling
│   └── components/
│       ├── app.jsx                    # Main app component
│       ├── wallet-provider.jsx        # Solana wallet setup
│       ├── x402-payment-handler.jsx   # Payment flow logic
│       └── transaction-history.jsx    # Transaction display
└── .env                   # Configuration
```

## API Endpoints

The server provides these endpoints:

### Marketplace
- `GET /api/bazaar/listings` - Get all listings
- `POST /api/bazaar/listings` - Create a listing
- `GET /api/bazaar/purchase-with-currency/:id` - Purchase item

### Mystery Boxes
- `GET /api/bazaar/mystery-box-tiers` - Get available tiers
- `GET /api/bazaar/mystery-box-with-currency/:tier` - Open box

### Balance (Mock Mode)
- `GET /api/balance/:userId` - Get balance
- `POST /api/balance/add` - Add balance
- `GET /api/transactions/:userId` - Get transaction history

### Config
- `GET /api/config` - Get current payment mode
- `GET /api/inventory/:username` - Get user's items

## Sample Data

The server creates sample listings on startup:

- **Dragon Slayer** (Legendary Sword) - $0.025
- **Titanium Shield** (Epic Armor) - $0.015
- **Health Potion** (Rare Consumable) - $0.005
- **Staff of Wisdom** (Legendary Weapon) - $0.05
- **Boots of Speed** (Epic Armor) - $1.00

Mystery box tiers:
- **Common Box** - $0.01 (Common/Uncommon items)
- **Rare Box** - $0.05 (Rare/Epic items)
- **Legendary Box** - $0.10 (Epic/Legendary items)

## Development

### Adding New Items

Edit `simple-item-adapter.ts`:

```typescript
const sampleItems = [
  {
    id: 'my-item-001',
    name: 'My Cool Item',
    description: 'An awesome item',
    rarity: 'epic' as const,
    owner: 'SampleSeller1',
  },
  // ... more items
];
```

### Adding New Listings

Edit `server.ts`:

```typescript
const sampleListings = [
  {
    itemId: 'my-item-001',
    itemType: 'weapon',
    itemData: { description: 'An awesome item' },
    sellerUsername: 'SampleSeller1',
    sellerWallet: 'YOUR_WALLET_ADDRESS',
    priceUSDC: 0.10,
  },
  // ... more listings
];
```

### Customizing Mystery Boxes

Edit `server.ts`:

```typescript
marketplace.addMysteryBoxTier({
  id: 'custom-box',
  name: 'Custom Box',
  description: 'My custom mystery box',
  priceUSDC: 0.25,
  itemPool: [
    { rarity: 'legendary', weight: 5 },
    { rarity: 'epic', weight: 15 },
    { rarity: 'rare', weight: 30 },
    { rarity: 'uncommon', weight: 50 },
  ],
});
```

## Testing

### Mock Mode Testing
1. Start server: `pnpm start`
2. Open browser: http://localhost:3000
3. Add balance using "Add $10" button
4. Purchase items and mystery boxes
5. Check inventory and transaction history

### Production Mode Testing
1. Get devnet SOL and USDC
2. Start server: `PAYMENT_MODE=production pnpm start`
3. Connect wallet
4. Purchase an item
5. Check Solscan for transaction details

## Troubleshooting

### "Wallet not connected"
- Click "Connect Wallet" button
- Approve connection in wallet popup
- Refresh page if needed

### "Insufficient balance" (Mock Mode)
- Click "Add $10" button to add mock balance
- Balance is stored in memory (resets on refresh)

### "Insufficient balance" (Production Mode)
- Check wallet has enough USDC
- Check wallet has SOL for transaction fees
- Verify you're on correct network (devnet/mainnet)

### "Transaction failed"
- Check wallet has USDC token account
- Verify sufficient SOL for fees
- Check RPC endpoint is working
- Try again (network congestion)

### "Cannot read properties of undefined"
- Refresh the page
- Check browser console for errors
- Verify server is running

## Production Deployment

### Environment Variables

```bash
PAYMENT_MODE=production
SOLANA_NETWORK=mainnet
SOLANA_MAINNET_RPC=https://your-rpc-endpoint.com
```

### Security Considerations

1. **Use HTTPS** - Required for wallet connections
2. **Validate Inputs** - Server-side validation for all requests
3. **Rate Limiting** - Prevent abuse
4. **Error Handling** - Don't expose sensitive errors
5. **RPC Endpoint** - Use reliable, paid RPC for production

### Monitoring

- Monitor transaction success rates
- Track failed payments
- Alert on unusual activity
- Log all purchases for auditing

## Learn More

- [Main README](../README.md) - Library documentation
- [Configuration Guide](../CONFIGURATION.md) - Detailed config options
- [X402 Payment Flow](../X402_PAYMENT_FLOW.md) - How payments work
- [Solana Docs](https://docs.solana.com/) - Solana blockchain
- [x402 Protocol](https://github.com/coinbase/x402) - Payment protocol spec

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main documentation
3. Check browser console for errors
4. Check server logs for details
