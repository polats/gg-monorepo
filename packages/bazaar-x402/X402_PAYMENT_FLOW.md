# X402 Payment Flow Guide

## Quick Reference

This document explains the correct x402 payment flow implementation in bazaar-x402.

## Flow Diagram

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Server  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ 1. GET /api/purchase                         │
     │─────────────────────────────────────────────>│
     │                                              │
     │ 2. 402 Payment Required                      │
     │    + Payment Requirements                    │
     │<─────────────────────────────────────────────│
     │                                              │
     │ 3. Create Transaction                        │
     │    (USDC transfer)                           │
     │                                              │
     │ 4. Sign Transaction                          │
     │    (wallet.signTransaction)                  │
     │                                              │
     │ 5. GET /api/purchase                         │
     │    + X-Payment header                        │
     │    + Signed Transaction (base64)             │
     │─────────────────────────────────────────────>│
     │                                              │
     │                                              │ 6. Verify Transaction
     │                                              │    - Check amount
     │                                              │    - Check recipient
     │                                              │    - Check mint
     │                                              │
     │                                              │ 7. Broadcast Transaction
     │                                              │    (sendRawTransaction)
     │                                              │
     │                                              │ 8. Wait for Confirmation
     │                                              │    (confirmTransaction)
     │                                              │
     │ 9. 200 OK                                    │
     │    + Purchase Result                         │
     │    + Transaction Signature                   │
     │<─────────────────────────────────────────────│
     │                                              │
```

## Implementation

### Client Side

```javascript
// 1. Initial request returns 402
const response = await fetch('/api/purchase/listing-123');
if (response.status === 402) {
  const data = await response.json();
  // Extract requirements from x402 response structure
  const requirements = data.requirements.accepts[0];
  
  // 2. Create and sign transaction
  const transaction = createUSDCTransfer(requirements);
  const signedTx = await wallet.signTransaction(transaction);
  
  // 3. Serialize and encode
  const serializedTx = signedTx.serialize().toString('base64');
  
  // 4. Create payment payload
  const paymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: requirements.network,
    payload: {
      signature: '', // Server fills this
      from: wallet.publicKey.toBase58(),
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
      signedTransaction: serializedTx, // KEY: Send signed tx
    }
  };
  
  // 5. Retry with X-Payment header
  const paymentHeader = btoa(JSON.stringify(paymentPayload));
  const finalResponse = await fetch('/api/purchase/listing-123', {
    headers: { 'X-Payment': paymentHeader }
  });
  
  const result = await finalResponse.json();
  console.log('Purchase complete:', result);
}
```

### Server Side

```typescript
// 1. Check for X-Payment header
const paymentHeader = req.headers['x-payment'];

if (!paymentHeader) {
  // Return 402 Payment Required
  return res.status(402).json({
    paymentRequired: true,
    requirements: {
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: '25000', // 0.025 USDC
      payTo: sellerWallet,
      asset: USDC_MINT,
      // ...
    }
  });
}

// 2. Decode payment payload
const payload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());

// 3. Verify transaction details
if (payload.payload.amount !== expectedAmount) {
  return res.status(400).json({ error: 'Amount mismatch' });
}

// 4. Broadcast signed transaction
const txBuffer = Buffer.from(payload.payload.signedTransaction, 'base64');
const signature = await connection.sendRawTransaction(txBuffer);

// 5. Wait for confirmation
await connection.confirmTransaction(signature, 'confirmed');

// 6. Return success
res.json({
  success: true,
  txHash: signature,
  item: purchasedItem
});
```

## Key Points

### ✅ DO

- Sign transaction on client
- Send **signed transaction** to server
- Let server broadcast the transaction
- Let server wait for confirmation
- Verify all transaction details on server

### ❌ DON'T

- Broadcast transaction from client
- Send only the signature to server
- Skip server-side verification
- Trust client-provided signatures without verification

## Security Considerations

1. **Amount Verification**: Always verify the amount matches expected price
2. **Recipient Verification**: Ensure funds go to correct wallet
3. **Mint Verification**: Confirm correct token (USDC) is used
4. **Replay Protection**: Implement nonce checking (future enhancement)
5. **Transaction Validation**: Parse and validate transaction instructions

## Error Handling

```javascript
try {
  const result = await handleX402Purchase(url, wallet);
  console.log('Success:', result);
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    // Show balance error
  } else if (error.message.includes('Transaction failed')) {
    // Show transaction error
  } else {
    // Show generic error
  }
}
```

## Testing

```bash
# Mock mode (no real transactions)
PAYMENT_MODE=mock pnpm start

# Production mode (real Solana transactions)
PAYMENT_MODE=production SOLANA_NETWORK=devnet pnpm start
```

## Common Issues

### "Cannot read properties of undefined (reading '_bn')"

This error occurs when the payment requirements are not parsed correctly from the 402 response.

**Problem:**
```javascript
// Wrong - trying to use the full response object
const requirements = paymentRequirements.requirements;
```

**Solution:**
```javascript
// Correct - extract from x402 structure
const x402Response = paymentRequirements.requirements;
const requirements = x402Response.accepts[0];
```

The server returns:
```json
{
  "paymentRequired": true,
  "requirements": {
    "x402Version": 1,
    "accepts": [
      {
        "scheme": "exact",
        "network": "solana-devnet",
        "maxAmountRequired": "25000",
        // ... actual requirements
      }
    ]
  }
}
```

### "Transaction not found on blockchain"

This can happen if:
1. Transaction wasn't broadcast successfully
2. RPC node is slow to index the transaction
3. Network congestion

**Solution:** The facilitator includes retry logic with polling. Increase `maxPollAttempts` if needed.

### "Insufficient balance"

Make sure the wallet has:
1. Enough USDC for the purchase
2. Enough SOL for transaction fees (even though server may pay)

## References

- [x402 Protocol Specification](https://github.com/coinbase/x402)
- `reference-projects/x402/x402-facilitator-express-server/`
- `reference-projects/x402/silkroad/`
- `packages/bazaar-x402/fixes/X402_CLIENT_PAYMENT_FLOW_FIX.md`
