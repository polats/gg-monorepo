# 🧪 x402 Test Scripts

## Devnet Payment Test

Standalone test script to verify x402 payment flow on Solana devnet.

### Prerequisites

1. **SOL for fees**: Script will auto-airdrop devnet SOL
2. **Devnet USDC**: Required for testing

#### Get Devnet USDC:
- Visit: https://spl-token-faucet.com/?token=USDC-Dev
- Or use: https://faucet.circle.com/ (Circle's official devnet faucet)
- Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### Running the Test

```bash
npm run testx402
```

### What It Does

1. ✅ Creates/loads test wallets (buyer & seller)
2. ✅ Airdrops SOL for transaction fees
3. ✅ Shows initial USDC balances
4. ✅ Generates 402 Payment Required response
5. ✅ Creates SPL token transfer transaction
6. ✅ Signs & broadcasts transaction
7. ✅ Verifies payment on-chain
8. ✅ Shows final balances
9. ✅ Confirms funds moved correctly

### Expected Output

```
🚀 x402 Solana Devnet Payment Test
===================================

📝 BUYER wallet: ABC...XYZ
📝 SELLER wallet: DEF...UVW

💰 Initial Balances
💵 Buyer USDC:  10.00 USDC
💵 Seller USDC: 0.00 USDC

📋 Step 1: Generate 402 Payment Required
💳 Price: 1 USDC
👤 Seller: DEF...UVW

💳 Step 2: Buyer Creates Payment
✍️ Signing transaction...
📡 Broadcasting transaction...
✅ Transaction sent!
📝 Signature: 5Jx...abc

✅ Step 3: Verify Payment
🔍 Verifying payment on-chain...
✅ Transaction confirmed

💰 Final Balances
💵 Buyer USDC:  9.00 USDC (-1.00)
💵 Seller USDC: 1.00 USDC (+1.00)

🎉 Test Complete!
✅ x402 payment flow works perfectly!
```

### Test Wallets

Wallets are stored in `scripts/.test-wallets/` (gitignored).
- `buyer.json` - Test buyer wallet
- `seller.json` - Test seller wallet

**⚠️ These are devnet wallets - never use for mainnet!**

### Troubleshooting

**"Insufficient USDC"**
- Visit faucet links above
- Send to buyer address shown in output

**"Airdrop failed"**
- Devnet is rate-limited
- Wait a few minutes and retry
- Or manually send SOL to buyer address

**"Transaction failed"**
- Check Solana Explorer link
- Ensure devnet is operational: https://status.solana.com/

### Next Steps

Once this test passes:
1. Integrate x402 flow into `/app/api/purchase/route.ts`
2. Build frontend transaction signing
3. Test end-to-end in the app

