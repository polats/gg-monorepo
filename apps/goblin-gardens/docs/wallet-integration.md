# Solana Wallet Integration

## Overview

Goblin Gardens now supports linking Solana wallets to guest accounts. This allows players to:
- Associate their wallet with their game progress
- Prepare for future features like NFT gems, marketplace trading, and token rewards
- Maintain account ownership across sessions

## Implementation

### Components

**WalletProvider** (`src/client/components/WalletProvider.tsx`)
- Wraps the app with Solana wallet adapter context
- Supports Phantom and Solflare wallets
- Configurable network (devnet/mainnet-beta)

**WalletButton** (`src/client/components/WalletButton.tsx`)
- UI component for wallet connection and linking
- Handles signature verification
- Shows linked wallet status
- Auto-links on wallet connection

### API Endpoints

**POST /api/wallet/link**
- Links a Solana wallet to the current guest account
- Requires signature verification to prove wallet ownership
- Prevents duplicate wallet associations

**GET /api/wallet/linked**
- Returns the linked wallet address for the current user
- Returns null if no wallet is linked

### Data Storage

Wallet associations are stored in Redis with bidirectional mapping:
- `wallet:{address}` → username
- `user:{username}:wallet` → address

This allows:
- Looking up which account owns a wallet
- Looking up which wallet is linked to an account
- Preventing duplicate associations

## Usage

### For Players

1. Navigate to the Profile tab (🧌 icon)
2. Click "Connect Wallet" button
3. Select your wallet (Phantom, Solflare, etc.)
4. Approve the connection in your wallet
5. Click "Link Wallet to Account"
6. Sign the message in your wallet to prove ownership
7. Your wallet is now linked!

### For Developers

```typescript
import { linkWallet, getLinkedWallet } from './utils/api-client';

// Check if user has a linked wallet
const { walletAddress } = await getLinkedWallet();

// Link a wallet (requires signature)
const result = await linkWallet(
  walletAddress,
  signature,
  message
);
```

## Security

- Signature verification ensures wallet ownership
- Each wallet can only be linked to one account
- Each account can only have one linked wallet
- Changing wallets removes the old association

## Future Enhancements

- NFT gem minting
- Marketplace trading with USDC/SOL
- Token rewards for gameplay
- Cross-platform account recovery
- Wallet-based authentication
