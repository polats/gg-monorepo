# Wallet Multi-Account Support

## Overview

Updated wallet linking to allow a single wallet to be linked to multiple guest accounts. This provides flexibility for users who want to associate the same wallet with different game sessions or accounts.

## Changes Made

### 1. Removed Duplicate Wallet Check

**Before:**
```typescript
// Check if wallet is already linked to another account
const existingUsername = await redis.get(`wallet:${walletAddress}`);
if (existingUsername && existingUsername !== username) {
  res.status(400).json({
    type: 'linkWallet',
    success: false,
    message: 'This wallet is already linked to another account',
  });
  return;
}
```

**After:**
- Removed this check entirely
- Users can now link the same wallet to multiple accounts

### 2. Changed Storage Strategy

**Before (Bidirectional):**
```typescript
// Store the association (bidirectional)
await redis.set(`wallet:${walletAddress}`, username);
await redis.set(`user:${username}:wallet`, walletAddress);
```

**After (One-Way):**
```typescript
// Store the association (one-way: user -> wallet)
// Note: Multiple users can link the same wallet
await redis.set(`user:${username}:wallet`, walletAddress);
```

**Rationale:**
- Only need to track which wallet is linked to each user
- Don't need reverse lookup (wallet -> user) since multiple users can share a wallet
- Simpler data model

### 3. Updated Unlink Logic

**Before:**
```typescript
// Remove bidirectional mapping
await redis.del(`wallet:${walletAddress}`);
await redis.del(`user:${username}:wallet`);
```

**After:**
```typescript
// Remove user's wallet association
await redis.del(`user:${username}:wallet`);
```

**Rationale:**
- Only remove the user's wallet link
- Don't affect other users who may have linked the same wallet

## Use Cases

### Multiple Browser Sessions
A user can link the same wallet to different browser sessions (different guest accounts):
- Session 1 (Player_ABC123) → Wallet 7xKX...9mPq
- Session 2 (Player_XYZ789) → Wallet 7xKX...9mPq

### Testing & Development
Developers can link the same wallet to multiple test accounts without conflicts.

### Account Recovery
Users can link their wallet to a new account if they lose access to their original session.

## Data Storage

### Redis Keys

**User to Wallet Mapping:**
```
user:{username}:wallet → {walletAddress}
```

**Example:**
```
user:Player_ABC123:wallet → "7xKXy...9mPq"
user:Player_XYZ789:wallet → "7xKXy...9mPq"  // Same wallet, different user
```

### No Reverse Mapping
- Removed `wallet:{address}` keys
- No longer track which users have linked a specific wallet
- Simpler and more flexible

## Security Considerations

### Signature Verification Still Required
- Each link request requires a valid signature
- Proves ownership of the wallet
- Prevents unauthorized linking

### Per-Account Limit
- Each account can only have ONE wallet linked at a time
- Linking a new wallet replaces the old one
- Old wallet association is cleaned up

### No Cross-Account Data Sharing
- Linking the same wallet to multiple accounts does NOT merge data
- Each account maintains separate:
  - Gems
  - Coins
  - Offers
  - Progress

## API Behavior

### Link Wallet
```bash
POST /api/wallet/link
{
  "walletAddress": "7xKXy...9mPq",
  "signature": "...",
  "message": "..."
}
```

**Success Response:**
```json
{
  "type": "linkWallet",
  "success": true,
  "message": "Wallet linked successfully",
  "walletAddress": "7xKXy...9mPq"
}
```

**No longer returns error for:**
- ❌ "This wallet is already linked to another account"

**Still returns error for:**
- ✅ "Missing required fields"
- ✅ "Invalid signature"
- ✅ "Signature verification failed"

### Unlink Wallet
```bash
DELETE /api/wallet/unlink
```

**Behavior:**
- Only removes the current user's wallet link
- Does not affect other users with the same wallet linked

## Future Considerations

### If Wallet-Based Features Are Added

If future features require unique wallet-to-account mapping (e.g., NFT ownership, token rewards), consider:

1. **Primary Account System**
   - First account to link a wallet becomes "primary"
   - Only primary account receives wallet-based benefits

2. **Wallet Verification**
   - Require signature verification for sensitive operations
   - Verify wallet ownership at transaction time

3. **Account Merging**
   - Allow users to merge accounts linked to the same wallet
   - Combine progress, gems, and coins

4. **Wallet Whitelist**
   - Restrict certain wallets to single account
   - Implement for verified/premium users

## Migration Notes

### Existing Data
- Existing `wallet:{address}` keys can be safely deleted
- They are no longer used by the system
- User associations (`user:{username}:wallet`) remain valid

### Cleanup Script (Optional)
```bash
# Remove old wallet -> user mappings
redis-cli --scan --pattern "wallet:*" | xargs redis-cli del
```

## Testing

### Test Scenarios

1. **Link Same Wallet to Multiple Accounts**
   - Create two guest accounts
   - Link same wallet to both
   - Verify both succeed

2. **Unlink from One Account**
   - Link wallet to Account A and Account B
   - Unlink from Account A
   - Verify Account B still has wallet linked

3. **Replace Wallet on Account**
   - Link Wallet 1 to Account A
   - Link Wallet 2 to Account A
   - Verify Wallet 1 is replaced with Wallet 2

4. **Signature Verification**
   - Attempt to link without signature
   - Verify error is returned
   - Security still enforced

## Benefits

✅ **Flexibility** - Users can link same wallet to multiple sessions
✅ **Simplicity** - Simpler data model (one-way mapping)
✅ **No Conflicts** - No "already linked" errors
✅ **Account Recovery** - Easy to link wallet to new account
✅ **Testing** - Easier for developers to test with one wallet
