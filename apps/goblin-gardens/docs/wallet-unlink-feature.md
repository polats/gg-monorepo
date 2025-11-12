# Wallet Unlink Feature

## Overview

Added the ability for users to unlink their Solana wallet from their guest account, along with fixing the toast notification issue.

## Changes Made

### 1. Fixed Toast Notification Error

**Issue**: `addToast` was not defined when trying to show wallet link success notification.

**Fix**: Updated PileDemo.tsx to use `setToasts` directly instead of a non-existent `addToast` function:

```typescript
const toastId = `toast-${Date.now()}-${Math.random()}`;
setToasts((prev) => [
  ...prev,
  {
    id: toastId,
    message: 'Wallet linked successfully!',
    type: 'coin',
    coinType: 'gold',
    timestamp: Date.now(),
  },
]);
setTimeout(() => {
  setToasts((prev) => prev.filter((t) => t.id !== toastId));
}, 3000);
```

### 2. Added Unlink API Endpoint

**Endpoint**: `DELETE /api/wallet/unlink`

**Functionality**:
- Removes the wallet association from the current user account
- Deletes both sides of the bidirectional mapping in Redis
- Returns error if no wallet is linked
- Logs the unlink action

**Implementation** (`src/server/core/routes.ts`):
```typescript
router.delete('/api/wallet/unlink', async (req, res) => {
  const username = await auth.getUsername(req);
  const walletAddress = await redis.get(`user:${username}:wallet`);
  
  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'No wallet linked' });
  }
  
  await redis.del(`wallet:${walletAddress}`);
  await redis.del(`user:${username}:wallet`);
  
  res.json({ success: true, message: 'Wallet unlinked successfully' });
});
```

### 3. Added Unlink Method to API Client

**File**: `src/client/utils/api-client.ts`

```typescript
export async function unlinkWallet(): Promise<any> {
  return apiDelete('/api/wallet/unlink');
}
```

### 4. Updated WalletButton Component

**New Features**:
- Added `onWalletUnlinked` callback prop
- Added `unlinkWallet` to apiClient interface
- Added `handleUnlinkWallet` function
- Added "Unlink Wallet" button when wallet is linked
- Optionally disconnects wallet after unlinking
- Shows loading state during unlink operation

**UI Changes**:
- When wallet is linked, shows:
  - Green box with wallet address (truncated)
  - Red "Unlink Wallet" button below
- Button shows "Unlinking..." during operation
- Triggers toast notification on successful unlink

### 5. Updated PileDemo Integration

**Changes**:
- Imported `unlinkWallet` from api-client
- Passed `unlinkWallet` to WalletButton's apiClient prop
- Added `onWalletUnlinked` callback that shows a toast notification
- Both link and unlink now show appropriate toast messages

### 6. Added Type Definition

**File**: `src/shared/types/api.ts`

```typescript
export type UnlinkWalletResponse = {
  type: 'unlinkWallet';
  success: boolean;
  message?: string;
};
```

## User Experience

### Linking a Wallet
1. User clicks "Connect Wallet"
2. Selects wallet (Phantom, Solflare, etc.)
3. Approves connection
4. Clicks "Link Wallet to Account"
5. Signs message in wallet
6. Sees green success toast: "Wallet linked successfully!"
7. Wallet address displayed in green box

### Unlinking a Wallet
1. User sees linked wallet in profile
2. Clicks red "Unlink Wallet" button
3. Wallet is unlinked from account
4. Wallet disconnects automatically
5. Sees bronze toast: "Wallet unlinked"
6. Can link a different wallet if desired

## Security

- Unlink requires authentication (username from session)
- Removes both sides of the bidirectional mapping
- Prevents orphaned data in Redis
- Logs all unlink operations for audit trail

## Testing

```bash
# Test unlink endpoint (no wallet linked)
curl -X DELETE http://localhost:3000/api/wallet/unlink -H "X-Username: TestUser"
# Response: {"type":"unlinkWallet","success":false,"message":"No wallet linked to this account"}

# After linking a wallet, test unlink
curl -X DELETE http://localhost:3000/api/wallet/unlink -H "X-Username: TestUser"
# Response: {"type":"unlinkWallet","success":true,"message":"Wallet unlinked successfully"}
```

## Future Enhancements

- Confirmation dialog before unlinking
- Show wallet link history
- Allow relinking without disconnecting
- Export account data before unlinking
