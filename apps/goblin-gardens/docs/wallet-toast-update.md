# Wallet Toast Notification Update

## Overview

Updated wallet toast notifications to be more descriptive instead of using generic coin types (gold/bronze).

## Changes Made

### 1. Added New Toast Type

Added `'wallet'` to the toast type union:

```typescript
type: 'coin' | 'gem' | 'growing' | 'offering' | 'insufficient_coins' | 
      'scrounge_location' | 'sold' | 'bought' | 'wallet'
```

### 2. Added Wallet-Specific Properties

```typescript
walletAction?: 'linked' | 'unlinked'; // For 'wallet' type toasts
```

### 3. Updated Toast Messages

**Before:**
- Link: Generic "Wallet linked successfully!" with gold coin icon
- Unlink: Generic "Wallet unlinked" with bronze coin icon

**After:**
- Link: `"Wallet {address} linked to account"` with 🔗 icon
- Unlink: `"Wallet disconnected from account"` with 🔓 icon

### 4. Custom Styling for Wallet Toasts

**Linked Wallet:**
- Background: Green `rgba(76, 175, 80, 0.9)`
- Border: Green `#4CAF50`
- Icon: 🔗 (link emoji)
- Title: "Wallet Linked"

**Unlinked Wallet:**
- Background: Gray `rgba(100, 100, 100, 0.9)`
- Border: Gray `#999`
- Icon: 🔓 (unlock emoji)
- Title: "Wallet Unlinked"

### 5. Toast Rendering

Added dedicated wallet toast rendering section:

```typescript
{toast.type === 'wallet' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 24 }}>
      {toast.walletAction === 'linked' ? '🔗' : '🔓'}
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
        {toast.walletAction === 'linked' ? 'Wallet Linked' : 'Wallet Unlinked'}
      </span>
      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11 }}>
        {toast.message}
      </span>
    </div>
  </div>
)}
```

## Visual Comparison

### Before
```
┌─────────────────────────────────┐
│ 🪙 Gold Coin                    │
│ Wallet linked successfully!     │
└─────────────────────────────────┘
```

### After
```
┌─────────────────────────────────┐
│ 🔗 Wallet Linked                │
│ Wallet 7xKX...9mPq linked       │
│ to account                      │
└─────────────────────────────────┘
```

## Benefits

1. **More Descriptive** - Shows actual wallet address (truncated)
2. **Clear Icons** - 🔗 for linked, 🔓 for unlinked
3. **Better Context** - Users know exactly what happened
4. **Consistent Design** - Follows pattern of other toast types (sold, bought)
5. **Professional** - Looks more polished than generic coin notifications

## User Experience

When users link their wallet:
- See green toast with link icon
- Message shows truncated wallet address
- Clear "Wallet Linked" title
- Disappears after 3 seconds

When users unlink their wallet:
- See gray toast with unlock icon
- Message confirms disconnection
- Clear "Wallet Unlinked" title
- Disappears after 3 seconds

## Implementation Details

- Toast type: `'wallet'`
- Duration: 3 seconds
- Position: Top center (slides down)
- Animation: Smooth slide-down entrance
- Auto-dismiss: Yes
