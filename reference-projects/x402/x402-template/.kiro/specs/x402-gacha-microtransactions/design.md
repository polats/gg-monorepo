# Design Document

## Overview

This design transforms the X402 Next.js Solana template into a complete microtransaction gaming system. The architecture leverages the existing X402 payment middleware while adding a virtual currency economy and gacha mechanics. The system demonstrates practical blockchain payment integration for gaming, showing how cryptocurrency payments can seamlessly integrate with traditional in-game economies.

The design maintains the simplicity of the original template while extending it with stateful game mechanics, ensuring developers can easily understand both the X402 payment flow and the virtual economy implementation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Homepage   │  │ Gem Purchase │  │ Gacha System │      │
│  │              │  │    Pages     │  │   & Collection│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         └──────────────────┼───────────────────┘             │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Gem Balance    │                        │
│                   │    Context      │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Middleware Layer                           │
│                   ┌────────▼────────┐                         │
│                   │ X402 Payment    │                         │
│                   │   Middleware    │                         │
│                   └────────┬────────┘                         │
│                            │                                  │
│              ┌─────────────┼─────────────┐                    │
│              │             │             │                    │
│      ┌───────▼──────┐ ┌───▼────┐ ┌─────▼──────┐            │
│      │ Session Mgmt │ │Payment │ │  Route     │            │
│      │              │ │Verify  │ │  Protection│            │
│      └──────────────┘ └────────┘ └────────────┘            │
└────────────────────────────┬──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                   External Services                           │
│         ┌──────────────────┼──────────────────┐               │
│         │                  │                  │               │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐       │
│  │  Coinbase   │  │   X402.org      │  │   Solana   │       │
│  │     Pay     │  │  Facilitator    │  │ Blockchain │       │
│  └─────────────┘  └─────────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Payment Flow:**
1. Player clicks gem purchase tier → X402 middleware intercepts
2. Middleware returns 402 with payment requirements
3. Coinbase Pay widget displays → Player completes payment
4. Facilitator verifies transaction on Solana blockchain
5. Session created → Gems credited to player balance
6. Player redirected to success page with updated balance

**Gacha Flow:**
1. Player clicks gacha pull button → Client validates gem balance
2. Gems deducted from balance → Random item generated
3. Item added to collection → UI updates with animation
4. Balance context notifies all components → Header updates

## Components and Interfaces

### 1. X402 Payment Middleware (Enhanced)

**File:** `middleware.ts`

**Purpose:** Handles cryptocurrency payment verification and session management for gem purchases

**Configuration:**
```typescript
interface GemTier {
  route: string
  price: string
  gems: number
  bonus: number
  description: string
}

const GEM_TIERS: GemTier[] = [
  {
    route: '/purchase/starter',
    price: '$1.00',
    gems: 100,
    bonus: 0,
    description: 'Starter Pack - 100 gems'
  },
  {
    route: '/purchase/value',
    price: '$5.00',
    gems: 550,
    bonus: 10,
    description: 'Value Pack - 550 gems (10% bonus)'
  },
  {
    route: '/purchase/premium',
    price: '$10.00',
    gems: 1200,
    bonus: 20,
    description: 'Premium Pack - 1200 gems (20% bonus)'
  }
]
```

**Key Responsibilities:**
- Intercept requests to gem purchase routes
- Return 402 Payment Required for unauthenticated requests
- Verify payments via X402 facilitator
- Create session tokens after successful payment
- Pass gem tier information to purchase pages via URL parameters

### 2. Gem Balance Context

**File:** `contexts/gem-balance-context.tsx`

**Purpose:** Centralized state management for player's gem balance

**Interface:**
```typescript
interface GemBalanceContextType {
  balance: number
  addGems: (amount: number) => void
  spendGems: (amount: number) => boolean
  canAfford: (amount: number) => boolean
}

interface GemTransaction {
  type: 'purchase' | 'spend'
  amount: number
  timestamp: number
  description: string
}
```

**Key Responsibilities:**
- Maintain current gem balance in React Context
- Provide methods for adding and spending gems
- Validate transactions (prevent negative balance)
- Persist balance to sessionStorage
- Emit balance change events for UI updates

**Storage Strategy:**
- Use sessionStorage for balance persistence
- Clear on browser close (session-based economy)
- Sync across tabs using storage events

### 3. Gem Balance Header

**File:** `components/gem-balance-header.tsx`

**Purpose:** Persistent display of player's gem balance across all pages

**Interface:**
```typescript
interface GemBalanceHeaderProps {
  showPurchaseButton?: boolean
}
```

**Key Responsibilities:**
- Display current gem balance with gem icon
- Subscribe to balance context for real-time updates
- Provide quick link to gem purchase page
- Responsive layout for mobile and desktop

**Visual Design:**
- Fixed position at top of viewport
- Gradient background matching app theme
- Animated balance updates on change
- Gem icon + numerical value + "Purchase" CTA

### 4. Gem Purchase Pages

**File:** `app/purchase/[tier]/page.tsx`

**Purpose:** Success pages after completing gem purchase payment

**Dynamic Routes:**
- `/purchase/starter` - 100 gems for $1.00
- `/purchase/value` - 550 gems for $5.00
- `/purchase/premium` - 1200 gems for $10.00

**Key Responsibilities:**
- Extract tier information from route parameter
- Credit gems to player balance via context
- Display purchase confirmation with gem amount
- Show bonus percentage if applicable
- Provide navigation to gacha system

**UI Elements:**
- Success message with gem amount
- Visual representation of gems acquired
- Bonus indicator for value/premium tiers
- "Start Playing" CTA to gacha page
- Transaction summary

### 5. Gacha System

**File:** `app/gacha/page.tsx`

**Purpose:** Main gacha pull interface where players spend gems

**Key Responsibilities:**
- Display gacha pull button (costs 10 gems)
- Validate sufficient gem balance before pull
- Trigger gacha pull animation
- Generate random item with weighted rarity
- Update collection with new item
- Deduct gems from balance

**Gacha Pull Logic:**
```typescript
interface GachaItem {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image: string
  obtainedAt: number
}

const RARITY_WEIGHTS = {
  common: 60,    // 60%
  rare: 30,      // 30%
  epic: 8,       // 8%
  legendary: 2   // 2%
}
```

**Animation States:**
- Idle: Button ready to pull
- Pulling: Animated loading (1.5s minimum)
- Revealing: Item reveal with rarity-based animation
- Complete: Display item with collection update

### 6. Gacha Collection

**File:** `components/gacha-collection.tsx`

**Purpose:** Display all items obtained by player

**Interface:**
```typescript
interface GachaCollectionProps {
  items: GachaItem[]
}
```

**Key Responsibilities:**
- Render grid of collected items
- Group items by rarity
- Display item details (name, rarity, image)
- Show acquisition timestamp
- Handle empty state

**Visual Design:**
- Responsive grid (1-4 columns based on viewport)
- Rarity-based color coding:
  - Common: Gray (#6B7280)
  - Rare: Blue (#3B82F6)
  - Epic: Purple (#9333EA)
  - Legendary: Gold (#F59E0B)
- Card-based layout with hover effects
- Rarity badge on each item

### 7. Gacha Item Generator

**File:** `lib/gacha-generator.ts`

**Purpose:** Server-side logic for generating random gacha items

**Interface:**
```typescript
interface GachaGeneratorConfig {
  rarityWeights: Record<Rarity, number>
  itemPool: Record<Rarity, ItemTemplate[]>
}

function generateGachaItem(): GachaItem
function calculateRarity(): Rarity
```

**Key Responsibilities:**
- Implement weighted random selection
- Select item from rarity-specific pool
- Generate unique item ID
- Return complete item object

**Item Pool Structure:**
```typescript
const ITEM_POOL = {
  common: [
    { name: 'Bronze Sword', image: '/items/bronze-sword.png' },
    { name: 'Wooden Shield', image: '/items/wooden-shield.png' },
    // ... more common items
  ],
  rare: [
    { name: 'Silver Bow', image: '/items/silver-bow.png' },
    // ... more rare items
  ],
  epic: [
    { name: 'Dragon Scale Armor', image: '/items/dragon-armor.png' },
    // ... more epic items
  ],
  legendary: [
    { name: 'Excalibur', image: '/items/excalibur.png' },
    // ... more legendary items
  ]
}
```

### 8. Homepage (Updated)

**File:** `app/page.tsx`

**Purpose:** Landing page with navigation to gem purchase and gacha system

**Key Changes:**
- Replace "cheap/expensive content" with gem purchase tiers
- Add "Play Gacha" button (requires gems)
- Display X402 protocol explanation
- Show example flow diagram
- Link to documentation

## Data Models

### Gem Balance Model

```typescript
interface GemBalance {
  current: number
  lifetime: number  // Total gems ever purchased
  spent: number     // Total gems spent
}
```

**Storage:** sessionStorage key `gem-balance`

### Gacha Collection Model

```typescript
interface GachaCollection {
  items: GachaItem[]
  totalPulls: number
  rarityCount: Record<Rarity, number>
}
```

**Storage:** sessionStorage key `gacha-collection`

### Session Model (X402)

```typescript
interface X402Session {
  token: string
  expiresAt: number
  paidRoutes: string[]
}
```

**Storage:** HTTP-only cookie (managed by x402-next)

## Error Handling

### Payment Errors

**Insufficient Funds:**
- Display clear error message in Coinbase Pay widget
- Suggest alternative payment methods
- Show minimum required amount

**Payment Verification Failed:**
- Retry verification automatically (max 3 attempts)
- Display error message with support contact
- Log error details for debugging

**Network Errors:**
- Show user-friendly error message
- Provide retry button
- Fallback to cached data if available

### Gacha System Errors

**Insufficient Gems:**
- Disable gacha pull button
- Display required gem amount
- Show "Purchase Gems" CTA

**Item Generation Failed:**
- Retry generation automatically
- Refund gems if persistent failure
- Log error for investigation

**Collection Storage Failed:**
- Display warning message
- Continue operation (item still generated)
- Attempt to restore from backup

### Context Errors

**Balance Sync Failed:**
- Use last known good balance
- Display warning indicator
- Attempt to resync on next action

**Storage Quota Exceeded:**
- Clear old transaction history
- Maintain only essential data
- Notify user of storage limitation

## Testing Strategy

### Unit Tests

**Gem Balance Context:**
- Test addGems increases balance correctly
- Test spendGems decreases balance and returns true
- Test spendGems returns false for insufficient balance
- Test canAfford returns correct boolean
- Test balance persistence to sessionStorage

**Gacha Generator:**
- Test rarity distribution matches weights (statistical test)
- Test all rarities can be generated
- Test item selection from correct rarity pool
- Test unique ID generation
- Test item structure completeness

**Gacha Collection:**
- Test item addition to collection
- Test rarity counting
- Test collection persistence
- Test empty state handling

### Integration Tests

**Payment to Gems Flow:**
- Test complete payment flow from click to gem credit
- Test session creation after payment
- Test gem balance update after purchase
- Test navigation to success page
- Test multiple purchases accumulate correctly

**Gacha Pull Flow:**
- Test gem deduction on pull
- Test item generation and addition to collection
- Test balance update in header
- Test insufficient gems prevents pull
- Test collection display updates

### E2E Tests

**Complete User Journey:**
1. Land on homepage
2. Click gem purchase tier
3. Complete payment (mock)
4. Verify gems credited
5. Navigate to gacha page
6. Perform gacha pull
7. Verify item in collection
8. Verify gem balance decreased
9. Perform multiple pulls
10. View complete collection

### Manual Testing Checklist

**X402 Payment Flow:**
- [ ] 402 response displays Coinbase Pay widget
- [ ] Payment completes successfully on devnet
- [ ] Session persists across page navigation
- [ ] Gems credited match purchase tier
- [ ] Bonus gems calculated correctly

**Gacha Mechanics:**
- [ ] Pull button disabled with insufficient gems
- [ ] Animation plays for minimum duration
- [ ] Rarity distribution feels correct over 100 pulls
- [ ] Legendary items have special effects
- [ ] Collection displays all obtained items

**Responsive Design:**
- [ ] Mobile layout works on iOS Safari
- [ ] Mobile layout works on Android Chrome
- [ ] Touch targets meet 44px minimum
- [ ] Coinbase Pay widget responsive
- [ ] Collection grid adapts to screen size

**Cross-Browser:**
- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] Mobile browsers

## Security Considerations

### Payment Security

- X402 middleware handles all payment verification
- No client-side payment validation (trust blockchain)
- Session tokens are HTTP-only cookies
- HTTPS required for production (Coinbase Pay requirement)

### Balance Manipulation Prevention

- All gem transactions validated server-side via context
- No direct balance modification from client
- Session-based storage prevents cross-session manipulation
- Balance cannot go negative (validation in spendGems)

### Data Privacy

- No personal information stored
- No account system required
- Session-based data cleared on browser close
- No tracking or analytics by default

## Performance Considerations

### Optimization Strategies

**Code Splitting:**
- Lazy load gacha collection component
- Lazy load Coinbase Pay widget
- Split gem purchase pages by route

**Caching:**
- Cache gacha item images with Next.js Image
- Cache static assets with aggressive headers
- Use SWR for balance context if needed

**Animation Performance:**
- Use CSS transforms for animations
- Avoid layout thrashing
- Use requestAnimationFrame for smooth animations
- Limit particle effects on mobile

### Bundle Size

- Keep x402-next as only major dependency
- Use tree-shaking for unused code
- Optimize images with Next.js Image
- Target < 200KB initial bundle

## Deployment Considerations

### Environment Configuration

**Development (Devnet):**
```env
NEXT_PUBLIC_NETWORK=solana-devnet
NEXT_PUBLIC_RECEIVER_ADDRESS=<test_wallet>
NEXT_PUBLIC_CDP_CLIENT_KEY=<test_key>
```

**Production (Mainnet):**
```env
NEXT_PUBLIC_NETWORK=solana-mainnet-beta
NEXT_PUBLIC_RECEIVER_ADDRESS=<production_wallet>
NEXT_PUBLIC_CDP_CLIENT_KEY=<production_key>
```

### Monitoring

- Log all payment transactions
- Track gacha pull statistics
- Monitor error rates
- Alert on payment verification failures

### Scaling Considerations

- Stateless architecture (session-based)
- No database required
- Horizontal scaling supported
- CDN for static assets
