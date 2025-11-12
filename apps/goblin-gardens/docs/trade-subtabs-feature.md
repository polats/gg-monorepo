# Trade Tab Subtabs Feature

## Overview

Added "Town" and "Bazaar" subtabs to the Trade tab, similar to how the Garden tab has "Grow" and "My Offer" subtabs.

## Implementation

### 1. Added Trade Action State

```typescript
const [tradeAction, setTradeAction] = useState<'town' | 'bazaar'>('town');
```

### 2. Created Subtab Buttons

Added two buttons below the Trade tab content:

**Town Button:**
- Icon: 🏘️ (houses emoji)
- Color: Purple (matches Trade tab color)
- Active state: `#7c4a6f` background with `#bf6fb3` border
- Label: "Town"

**Bazaar Button:**
- Icon: 🏪 (convenience store emoji)
- Color: Brown/tan
- Active state: `#8b6f47` background with `#d4a574` border
- Label: "Bazaar"

### 3. Split Trade Tab Content

**Town Subtab:**
- Shows existing P2P trading functionality
- "Your Offer" section
- "Other Gobs" list with search
- Purchase buttons for available offers
- Infinite scroll for loading more traders

**Bazaar Subtab:**
- Coming soon placeholder
- Large 🏪 icon
- "Bazaar" title
- Description: "The Bazaar marketplace is coming soon! Trade gems with USDC using the x402 payment protocol."
- Helpful tip: "💡 Link your Solana wallet in the Profile tab to prepare for Bazaar trading"

## UI Structure

```
┌─────────────────────────────────┐
│ Trade Tab Content               │
│                                 │
│ [Town content or Bazaar content]│
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [🏘️ Town] [🏪 Bazaar]          │ ← Subtab buttons
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Main Tab Navigation]           │
└─────────────────────────────────┘
```

## User Experience

### Switching Between Subtabs

1. User clicks Trade tab (🏺 icon)
2. Sees Town subtab by default (existing P2P trading)
3. Can click Bazaar button to see coming soon message
4. Active subtab is highlighted with colored background and border
5. Inactive subtab has transparent background

### Town Subtab (Default)

- Full P2P trading functionality
- Search for other players
- View and purchase gem offers
- See your own offer status
- Infinite scroll for more traders

### Bazaar Subtab (Coming Soon)

- Centered placeholder content
- Clear messaging about future functionality
- Encourages wallet linking in preparation
- Professional "coming soon" design

## Design Consistency

Follows the same pattern as Garden tab:
- Subtab buttons positioned above main tab navigation
- Active/inactive states with color coding
- Smooth transitions
- Mobile-friendly touch targets
- Consistent spacing and styling

## Future Integration

The Bazaar subtab is ready for integration with:
- Bazaar x402 marketplace package
- USDC/SOL payment processing
- On-chain gem trading
- Wallet-based transactions
- x402 payment protocol

## Code Changes

**Files Modified:**
- `apps/goblin-gardens/src/client/PileDemo.tsx`

**Changes:**
1. Added `tradeAction` state variable
2. Added Trade Actions button section
3. Wrapped Town content in conditional render
4. Added Bazaar placeholder content
5. Updated scroll handler to only fetch on Town subtab

## Benefits

1. **Clear Separation** - P2P trading vs marketplace trading
2. **Future-Ready** - Bazaar placeholder prepared for integration
3. **User Guidance** - Encourages wallet linking
4. **Consistent UX** - Matches Garden tab pattern
5. **Professional** - Clean coming soon message
