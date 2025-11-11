# Production Mode Purchase Fix

## Issue

When trying to purchase items in production mode, the following error occurred:

```
Error: deduct() is not supported in production mode. 
Use initiatePurchase() and verifyPurchase() instead.
```

## Root Cause

The custom purchase endpoints (`/api/bazaar/purchase-with-currency/:listingId` and `/api/bazaar/mystery-box-with-currency/:tierId`) were designed for mock mode only. They directly call `currencyAdapter.deduct()` which is not supported in production mode.

In production mode with x402, the payment flow is:
1. Client requests purchase
2. Server returns 402 Payment Required with payment details
3. Client signs transaction with wallet
4. Client retries request with X-Payment header
5. Server verifies payment on-chain
6. Server completes purchase

## Fix Applied

Updated both custom endpoints to check the payment mode and handle each appropriately:

### Mock Mode (PAYMENT_MODE=mock)
- Check balance
- Deduct from buyer
- Add to seller
- Transfer item
- Record transactions
- Return success

### Production Mode (PAYMENT_MODE=production)
- Call `initiatePurchase()` to get payment requirements
- Return 402 Payment Required with payment details
- Client must sign transaction and retry with X-Payment header

## Code Changes

### Purchase Listing Endpoint

**Before:**
```typescript
// Always tried to deduct directly
const deductionResult = await currencyAdapter.deduct(buyer as string, listing.priceUSDC);
```

**After:**
```typescript
// Check mode first
if (config.mode === 'production') {
  // Return 402 Payment Required
  const initiation = await currencyAdapter.initiatePurchase({
    buyerId: buyer as string,
    sellerId: listing.sellerUsername,
    amount: listing.priceUSDC,
    resource: `/api/bazaar/purchase/${listingId}`,
    description: `Purchase ${listing.itemType} from ${listing.sellerUsername}`,
  });
  return res.status(402).json({
    error: 'Payment Required',
    message: 'Please sign the transaction with your wallet',
    paymentRequired: true,
    requirements: initiation.requirements,
  });
}

// Mock mode: deduct directly
const deductionResult = await currencyAdapter.deduct(buyer as string, listing.priceUSDC);
```

### Mystery Box Endpoint

Same pattern applied to `/api/bazaar/mystery-box-with-currency/:tierId`.

## Testing

### Mock Mode

```bash
# Set to mock mode
echo "PAYMENT_MODE=mock" > packages/bazaar-x402/example/.env

# Start server
cd packages/bazaar-x402/example
pnpm dev:server

# Test purchase
curl "http://localhost:3001/api/bazaar/purchase-with-currency/listing-123?buyer=testuser&buyerWallet=wallet-123"
```

Expected: Purchase completes immediately with success response.

### Production Mode

```bash
# Set to production mode
echo "PAYMENT_MODE=production" > packages/bazaar-x402/example/.env
echo "SOLANA_NETWORK=devnet" >> packages/bazaar-x402/example/.env

# Restart server
cd packages/bazaar-x402/example
pnpm dev:server

# Test purchase
curl "http://localhost:3001/api/bazaar/purchase-with-currency/listing-123?buyer=testuser&buyerWallet=wallet-123"
```

Expected: 402 Payment Required response with payment details:
```json
{
  "error": "Payment Required",
  "message": "Please sign the transaction with your wallet",
  "paymentRequired": true,
  "requirements": {
    "network": "solana-devnet",
    "payTo": "seller-wallet-address",
    "asset": "USDC-mint-address",
    "maxAmountRequired": 25.00,
    ...
  }
}
```

## Client Integration

The client (app.jsx) already has code to handle 402 responses in the `purchaseItem` function, but it currently just shows a message. To enable full x402 flow:

1. **Use the x402 payment handler**:
   ```javascript
   import { purchaseListingWithX402 } from './purchase-handlers.jsx';
   
   const result = await purchaseListingWithX402(
     listingId,
     username,
     walletAddress,
     wallet, // Solana wallet adapter
     (status) => showMessage(setListingsMessage, status, 'info')
   );
   ```

2. **Or implement the flow manually**:
   ```javascript
   // 1. Try purchase
   const response = await fetch(url);
   
   // 2. Handle 402
   if (response.status === 402) {
     const { requirements } = await response.json();
     
     // 3. Create and sign transaction
     const tx = createSolanaTransaction(requirements);
     const signedTx = await wallet.signTransaction(tx);
     const signature = await connection.sendRawTransaction(signedTx.serialize());
     await connection.confirmTransaction(signature);
     
     // 4. Retry with X-Payment header
     const paymentHeader = createPaymentHeader(signature, requirements);
     const finalResponse = await fetch(url, {
       headers: { 'X-Payment': paymentHeader }
     });
     
     // 5. Purchase complete
     const result = await finalResponse.json();
   }
   ```

## Important Notes

### Custom Endpoints vs Standard Endpoints

The custom endpoints (`/api/bazaar/purchase-with-currency/*`) are convenience endpoints that work in both modes but require different client handling.

For production x402 flow, you can also use the standard bazaar endpoints:
- `/api/bazaar/purchase/:listingId` - Standard purchase endpoint
- `/api/bazaar/mystery-box/:tierId` - Standard mystery box endpoint

These are provided by `createBazaarRoutes()` and handle the x402 flow automatically.

### Why 402 Payment Required?

The x402 protocol uses HTTP status code 402 (Payment Required) to indicate that payment is needed. This is a standard HTTP status code specifically designed for payment scenarios.

When the client receives a 402 response:
1. It knows payment is required
2. It gets the payment details from the response body
3. It can prompt the user to sign the transaction
4. It can retry the request with proof of payment

### Mock Mode vs Production Mode

**Mock Mode:**
- No wallet required
- No blockchain transactions
- Instant purchases
- In-memory balances
- Perfect for development

**Production Mode:**
- Wallet connection required
- Real blockchain transactions
- Transaction signing required
- On-chain verification
- Real USDC payments

## Related Files

- `server.ts` - Updated purchase endpoints
- `x402-payment-handler.jsx` - Client-side x402 handler
- `purchase-handlers.jsx` - Purchase wrapper functions
- `PRODUCTION_MODE_FIX.md` - Original mode switching fix
- `DEBUGGING_SUMMARY.md` - Configuration debugging

## Next Steps

1. **Test in mock mode**: Verify purchases work without wallet
2. **Test 402 response**: Verify production mode returns 402
3. **Integrate x402 handler**: Update client to handle 402 and sign transactions
4. **Test on devnet**: Get devnet USDC and test full flow
5. **Deploy to production**: Switch to mainnet configuration

## Troubleshooting

**Still getting deduct() error:**
- Make sure you restarted the server after the fix
- Check server logs show "Production mode - returning 402"
- Verify `config.mode === 'production'` in debug logs

**Not getting 402 response:**
- Check `.env` has `PAYMENT_MODE=production`
- Restart server after changing `.env`
- Check server logs for mode confirmation

**Client not handling 402:**
- Check browser console for errors
- Verify client code checks for `response.status === 402`
- Implement x402 payment handler or show appropriate message
