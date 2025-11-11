# Design Document

## Overview

The Bazaar is a framework-agnostic P2P marketplace library that integrates the x402 payment protocol for virtual item trading. It consists of three main packages:

1. **@bazaar/core** - Shared types, interfaces, and utilities
2. **@bazaar/server** - Backend SDK for handling 402 responses and payment verification
3. **@bazaar/client** - Frontend SDK for initiating purchases and wallet integration

The library uses an adapter pattern to support different storage backends (Redis, MongoDB, etc.) and different item systems (gems, NFTs, skins, etc.), making it easy to integrate into any game or application.

## Architecture

### High-Level Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                  │  HTTP   │                 │
│  Game Client    │────────>│  Game Server     │────────>│  Facilitator    │
│  + Bazaar SDK   │         │  + Bazaar SDK    │         │  (x402.org)     │
│                 │         │                  │         │                 │
│ • Browse items  │         │ • 402 response   │         │ • Verify tx     │
│ • Initiate buy  │         │ • Verify payment │         │ • Confirm       │
│ • Sign tx       │         │ • Transfer item  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │                            │
                                      ▼                            ▼
                            ┌──────────────────┐       ┌─────────────────┐
                            │  Storage Adapter │       │  Solana         │
                            │  (Redis/Mongo)   │       │  Blockchain     │
                            └──────────────────┘       └─────────────────┘
```

### Package Structure

```
packages/bazaar/
├── core/                    # @bazaar/core
│   ├── src/
│   │   ├── types/
│   │   │   ├── listing.ts   # Listing types
│   │   │   ├── payment.ts   # x402 payment types
│   │   │   ├── mystery.ts   # Mystery box types
│   │   │   └── index.ts
│   │   ├── adapters/
│   │   │   ├── storage.ts   # Storage adapter interface
│   │   │   ├── item.ts      # Item adapter interface
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── conversion.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json

├── server/                  # @bazaar/server
│   ├── src/
│   │   ├── marketplace.ts   # Main marketplace class
│   │   ├── listing-manager.ts
│   │   ├── mystery-box-manager.ts
│   │   ├── payment-verifier.ts
│   │   ├── adapters/
│   │   │   ├── redis-storage.ts
│   │   │   ├── memory-storage.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── client/                  # @bazaar/client
│   ├── src/
│   │   ├── bazaar-client.ts # Main client class
│   │   ├── wallet-connector.ts
│   │   ├── payment-handler.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── examples/
    └── goblin-gardens/      # Integration example
        ├── gem-item-adapter.ts
        ├── server-integration.ts
        └── client-integration.ts
```

## Components and Interfaces

### Core Types (@bazaar/core)

#### Listing Type
```typescript
interface Listing {
  id: string;
  itemId: string;
  itemType: string;
  itemData: any; // Game-specific item data
  sellerWallet: string;
  sellerUsername: string;
  priceUSDC: number; // Price in USDC (with decimals)
  status: 'active' | 'sold' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
}
```

#### Mystery Box Type
```typescript
interface MysteryBoxTier {
  id: string;
  name: string;
  priceUSDC: number;
  description: string;
  rarityWeights: Record<string, number>; // e.g., { common: 50, rare: 30, epic: 20 }
}

interface MysteryBoxPurchase {
  id: string;
  tierId: string;
  buyerWallet: string;
  buyerUsername: string;
  priceUSDC: number;
  itemGenerated: any;
  txHash: string;
  timestamp: number;
}
```

#### x402 Payment Types
```typescript
interface PaymentRequirements {
  scheme: 'exact';
  network: 'solana-devnet' | 'solana-mainnet';
  maxAmountRequired: string; // USDC amount in smallest unit
  resource: string;
  description: string;
  mimeType: string;
  payTo: string; // Seller wallet
  maxTimeoutSeconds: number;
  asset: string; // USDC mint address
}

interface PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: 'solana-devnet' | 'solana-mainnet';
  payload: {
    signature: string; // Solana tx signature
    from: string; // Buyer wallet
    to: string; // Seller wallet
    amount: string; // USDC amount
    mint: string; // USDC mint
  };
}
```

### Storage Adapter Interface

```typescript
interface StorageAdapter {
  // Listings
  createListing(listing: Listing): Promise<void>;
  getListing(listingId: string): Promise<Listing | null>;
  getActiveListings(options: PaginationOptions): Promise<PaginatedResult<Listing>>;
  updateListingStatus(listingId: string, status: Listing['status']): Promise<void>;
  getListingsByUser(username: string): Promise<Listing[]>;
  
  // Mystery Boxes
  getMysteryBoxTier(tierId: string): Promise<MysteryBoxTier | null>;
  getAllMysteryBoxTiers(): Promise<MysteryBoxTier[]>;
  recordMysteryBoxPurchase(purchase: MysteryBoxPurchase): Promise<void>;
  
  // Transactions
  recordTransaction(tx: Transaction): Promise<void>;
  getTransactionsByUser(username: string): Promise<Transaction[]>;
  
  // Atomic operations
  executeAtomicTrade(operations: TradeOperation[]): Promise<void>;
}
```

### Item Adapter Interface

```typescript
interface ItemAdapter<TItem = any> {
  // Validation
  validateItemOwnership(itemId: string, username: string): Promise<boolean>;
  validateItemExists(itemId: string): Promise<boolean>;
  
  // Listing management
  lockItem(itemId: string, username: string): Promise<void>;
  unlockItem(itemId: string, username: string): Promise<void>;
  
  // Transfer
  transferItem(itemId: string, fromUsername: string, toUsername: string): Promise<void>;
  
  // Mystery box
  generateRandomItem(tierId: string, rarityWeights: Record<string, number>): Promise<TItem>;
  grantItemToUser(item: TItem, username: string): Promise<void>;
  
  // Serialization
  serializeItem(item: TItem): any;
  deserializeItem(data: any): TItem;
}
```

## Server SDK Design (@bazaar/server)

### Marketplace Class

The main entry point for server-side integration:

```typescript
class BazaarMarketplace {
  constructor(config: {
    storageAdapter: StorageAdapter;
    itemAdapter: ItemAdapter;
    network: 'solana-devnet' | 'solana-mainnet';
    usdcMint: string;
    facilitatorUrl?: string;
  });
  
  // Listing management
  async createListing(params: CreateListingParams): Promise<Listing>;
  async cancelListing(listingId: string, username: string): Promise<void>;
  async getActiveListings(options: PaginationOptions): Promise<PaginatedResult<Listing>>;
  
  // Purchase flow
  async handlePurchaseRequest(listingId: string): Promise<PaymentRequiredResponse>;
  async verifyAndCompletePurchase(listingId: string, paymentHeader: string): Promise<PurchaseResult>;
  
  // Mystery boxes
  async handleMysteryBoxRequest(tierId: string): Promise<PaymentRequiredResponse>;
  async verifyAndCompleteMysteryBox(tierId: string, paymentHeader: string): Promise<MysteryBoxResult>;
}
```

### Express Middleware Integration

```typescript
function createBazaarRoutes(marketplace: BazaarMarketplace): Router {
  const router = express.Router();
  
  // GET /api/bazaar/listings - Get active listings
  router.get('/listings', async (req, res) => { ... });
  
  // POST /api/bazaar/listings - Create listing
  router.post('/listings', async (req, res) => { ... });
  
  // DELETE /api/bazaar/listings/:id - Cancel listing
  router.delete('/listings/:id', async (req, res) => { ... });
  
  // GET /api/bazaar/purchase/:listingId - Returns 402 or completes purchase
  router.get('/purchase/:listingId', async (req, res) => {
    const paymentHeader = req.headers['x-payment'];
    
    if (!paymentHeader) {
      // Return 402 Payment Required
      const response = await marketplace.handlePurchaseRequest(listingId);
      res.status(402).json(response);
    } else {
      // Verify payment and complete purchase
      const result = await marketplace.verifyAndCompletePurchase(listingId, paymentHeader);
      res.json(result);
    }
  });
  
  // GET /api/bazaar/mystery-box/:tierId - Returns 402 or completes purchase
  router.get('/mystery-box/:tierId', async (req, res) => { ... });
  
  return router;
}
```

### Payment Verification Flow

```typescript
class PaymentVerifier {
  constructor(config: {
    network: 'solana-devnet' | 'solana-mainnet';
    rpcUrl: string;
    usdcMint: string;
  });
  
  async verifyPayment(params: {
    paymentHeader: string;
    expectedAmount: number;
    expectedRecipient: string;
  }): Promise<VerificationResult>;
  
  private async verifyTransactionOnChain(
    signature: string,
    from: string,
    to: string,
    amount: string,
    mint: string
  ): Promise<boolean>;
}
```

**Verification Steps:**
1. Decode Base64 payment header
2. Validate x402 version and scheme
3. Validate network matches configuration
4. Validate amount matches listing price
5. Validate recipient matches seller wallet
6. Validate mint matches USDC
7. Query Solana blockchain for transaction
8. Verify transaction succeeded and is confirmed
9. Return verification result

### Redis Storage Adapter

```typescript
class RedisStorageAdapter implements StorageAdapter {
  constructor(redis: RedisAdapter);
  
  // Listings stored as: bazaar:listing:{listingId}
  // Active listings index: bazaar:listings:active (sorted set by timestamp)
  // User listings index: bazaar:listings:user:{username} (set)
  
  async createListing(listing: Listing): Promise<void> {
    await this.redis.set(`bazaar:listing:${listing.id}`, JSON.stringify(listing));
    await this.redis.zAdd('bazaar:listings:active', { 
      member: listing.id, 
      score: listing.createdAt 
    });
    await this.redis.sAdd(`bazaar:listings:user:${listing.sellerUsername}`, listing.id);
  }
  
  // ... other methods
}
```

## Client SDK Design (@bazaar/client)

### BazaarClient Class

```typescript
class BazaarClient {
  constructor(config: {
    apiBaseUrl: string;
    walletAdapter: WalletAdapter; // Solana wallet integration
    network: 'solana-devnet' | 'solana-mainnet';
  });
  
  // Listings
  async getActiveListings(options?: PaginationOptions): Promise<Listing[]>;
  async createListing(params: CreateListingParams): Promise<Listing>;
  async cancelListing(listingId: string): Promise<void>;
  async getMyListings(): Promise<Listing[]>;
  
  // Purchases
  async purchaseItem(listingId: string): Promise<PurchaseResult>;
  async purchaseMysteryBox(tierId: string): Promise<MysteryBoxResult>;
  
  // Mystery boxes
  async getMysteryBoxTiers(): Promise<MysteryBoxTier[]>;
}
```

### Purchase Flow Implementation

```typescript
async purchaseItem(listingId: string): Promise<PurchaseResult> {
  // 1. Request purchase (will get 402)
  const response = await fetch(`${this.apiBaseUrl}/bazaar/purchase/${listingId}`);
  
  if (response.status !== 402) {
    throw new Error('Expected 402 Payment Required');
  }
  
  const paymentRequired = await response.json() as PaymentRequiredResponse;
  const requirements = paymentRequired.accepts[0];
  
  // 2. Create and sign Solana transaction
  const transaction = await this.createUSDCTransfer({
    to: requirements.payTo,
    amount: requirements.maxAmountRequired,
    mint: requirements.asset,
  });
  
  const signature = await this.walletAdapter.signAndSendTransaction(transaction);
  
  // 3. Create payment payload
  const paymentPayload: PaymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: this.network,
    payload: {
      signature,
      from: this.walletAdapter.publicKey.toString(),
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
    },
  };
  
  // 4. Encode and retry request with payment header
  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  
  const purchaseResponse = await fetch(`${this.apiBaseUrl}/bazaar/purchase/${listingId}`, {
    headers: {
      'X-Payment': paymentHeader,
    },
  });
  
  return await purchaseResponse.json();
}
```

### Wallet Adapter Interface

```typescript
interface WalletAdapter {
  publicKey: PublicKey;
  connected: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signAndSendTransaction(transaction: Transaction): Promise<string>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
}
```

## Data Models

### Listing Storage Schema

**Redis:**
```
Key: bazaar:listing:{listingId}
Value: JSON string of Listing object

Key: bazaar:listings:active (sorted set)
Members: listingId
Scores: timestamp

Key: bazaar:listings:user:{username} (set)
Members: listingId
```

**MongoDB (alternative):**
```javascript
{
  _id: ObjectId,
  listingId: String (indexed),
  itemId: String,
  itemType: String,
  itemData: Object,
  sellerWallet: String (indexed),
  sellerUsername: String (indexed),
  priceUSDC: Number,
  status: String (indexed),
  createdAt: Date (indexed),
  expiresAt: Date,
}
```

### Transaction Storage Schema

**Redis:**
```
Key: bazaar:transaction:{txId}
Value: JSON string of Transaction object

Key: bazaar:transactions:user:{username} (list)
Values: txId (newest first)
```

### Mystery Box Storage Schema

**Redis:**
```
Key: bazaar:mysterybox:tier:{tierId}
Value: JSON string of MysteryBoxTier object

Key: bazaar:mysterybox:purchase:{purchaseId}
Value: JSON string of MysteryBoxPurchase object

Key: bazaar:mysterybox:purchases:user:{username} (list)
Values: purchaseId (newest first)
```

## Error Handling

### Server-Side Errors

```typescript
class BazaarError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

// Error codes
const ErrorCodes = {
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  ITEM_NOT_OWNED: 'ITEM_NOT_OWNED',
  ITEM_ALREADY_LISTED: 'ITEM_ALREADY_LISTED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  INSUFFICIENT_PAYMENT: 'INSUFFICIENT_PAYMENT',
  INVALID_RECIPIENT: 'INVALID_RECIPIENT',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  MYSTERY_BOX_TIER_NOT_FOUND: 'MYSTERY_BOX_TIER_NOT_FOUND',
};
```

### Client-Side Error Handling

```typescript
try {
  const result = await bazaarClient.purchaseItem(listingId);
  console.log('Purchase successful:', result);
} catch (error) {
  if (error instanceof BazaarError) {
    switch (error.code) {
      case 'LISTING_NOT_FOUND':
        showToast('This item is no longer available');
        break;
      case 'PAYMENT_VERIFICATION_FAILED':
        showToast('Payment verification failed. Please try again.');
        break;
      case 'INSUFFICIENT_PAYMENT':
        showToast('Payment amount was insufficient');
        break;
      default:
        showToast('Purchase failed. Please try again.');
    }
  }
}
```

## Testing Strategy

### Unit Tests

**Core Package:**
- Type validation utilities
- Conversion functions (USDC decimals, etc.)
- Error classes

**Server Package:**
- Payment verification logic (mocked Solana RPC)
- Listing management (mocked storage)
- Mystery box generation (mocked item adapter)
- Storage adapters (Redis and in-memory)

**Client Package:**
- API request formatting
- Payment payload encoding
- Wallet adapter mocking

### Integration Tests

**Server Integration:**
- Full purchase flow with test Solana transactions
- Atomic trade execution
- Concurrent purchase handling
- Listing expiration

**Client Integration:**
- End-to-end purchase flow with mock wallet
- Error handling scenarios
- Network failure recovery

### Example Test Cases

```typescript
describe('BazaarMarketplace', () => {
  it('should create a listing and lock the item', async () => {
    const listing = await marketplace.createListing({
      itemId: 'gem-123',
      itemType: 'gem',
      sellerUsername: 'player1',
      sellerWallet: 'wallet1',
      priceUSDC: 5.0,
    });
    
    expect(listing.status).toBe('active');
    expect(await itemAdapter.isLocked('gem-123')).toBe(true);
  });
  
  it('should verify payment and transfer item', async () => {
    // Create listing
    const listing = await marketplace.createListing({ ... });
    
    // Simulate payment
    const paymentHeader = createMockPaymentHeader({
      signature: 'mock-tx-sig',
      from: 'buyer-wallet',
      to: listing.sellerWallet,
      amount: listing.priceUSDC,
    });
    
    // Complete purchase
    const result = await marketplace.verifyAndCompletePurchase(
      listing.id,
      paymentHeader
    );
    
    expect(result.success).toBe(true);
    expect(await itemAdapter.getOwner('gem-123')).toBe('buyer1');
  });
});
```

## Goblin Gardens Integration Example

### Gem Item Adapter

```typescript
class GemItemAdapter implements ItemAdapter<Gem> {
  constructor(private redis: RedisAdapter) {}
  
  async validateItemOwnership(itemId: string, username: string): Promise<boolean> {
    const playerState = await this.loadPlayerState(username);
    return playerState.gems.some(gem => gem.id === itemId);
  }
  
  async lockItem(itemId: string, username: string): Promise<void> {
    const playerState = await this.loadPlayerState(username);
    const gem = playerState.gems.find(g => g.id === itemId);
    if (!gem) throw new Error('Gem not found');
    
    gem.isOffering = true; // Reuse existing flag
    await this.savePlayerState(username, playerState);
  }
  
  async transferItem(itemId: string, fromUsername: string, toUsername: string): Promise<void> {
    const fromState = await this.loadPlayerState(fromUsername);
    const toState = await this.loadPlayerState(toUsername);
    
    const gemIndex = fromState.gems.findIndex(g => g.id === itemId);
    if (gemIndex === -1) throw new Error('Gem not found');
    
    const gem = fromState.gems[gemIndex];
    gem.isOffering = false;
    gem.isGrowing = false;
    
    fromState.gems.splice(gemIndex, 1);
    toState.gems.push(gem);
    
    await this.savePlayerState(fromUsername, fromState);
    await this.savePlayerState(toUsername, toState);
  }
  
  async generateRandomItem(tierId: string, rarityWeights: Record<string, number>): Promise<Gem> {
    // Use existing gem generation logic
    return generateGem(rarityWeights);
  }
  
  // ... other methods
}
```

### Server Integration

```typescript
// apps/goblin-gardens/src/server/bazaar-integration.ts
import { BazaarMarketplace, RedisStorageAdapter } from '@bazaar/server';
import { createBazaarRoutes } from '@bazaar/server/express';
import { GemItemAdapter } from './gem-item-adapter';

export function setupBazaar(redis: RedisAdapter): Router {
  const itemAdapter = new GemItemAdapter(redis);
  const storageAdapter = new RedisStorageAdapter(redis);
  
  const marketplace = new BazaarMarketplace({
    storageAdapter,
    itemAdapter,
    network: process.env.SOLANA_NETWORK as 'solana-devnet' | 'solana-mainnet',
    usdcMint: process.env.USDC_MINT_ADDRESS!,
    facilitatorUrl: 'https://x402.org/facilitator',
  });
  
  return createBazaarRoutes(marketplace);
}

// In main server file
const bazaarRoutes = setupBazaar(redis);
app.use('/api', bazaarRoutes);
```

### Client Integration

```typescript
// apps/goblin-gardens/src/client/bazaar-integration.ts
import { BazaarClient } from '@bazaar/client';
import { useWallet } from '@solana/wallet-adapter-react';

export function useBazaar() {
  const wallet = useWallet();
  
  const bazaarClient = useMemo(() => {
    return new BazaarClient({
      apiBaseUrl: '/api',
      walletAdapter: wallet,
      network: import.meta.env.VITE_SOLANA_NETWORK,
    });
  }, [wallet]);
  
  return bazaarClient;
}

// In component
function GemListingButton({ gem }: { gem: Gem }) {
  const bazaar = useBazaar();
  const [isListing, setIsListing] = useState(false);
  
  const handleList = async () => {
    setIsListing(true);
    try {
      await bazaar.createListing({
        itemId: gem.id,
        itemType: 'gem',
        itemData: gem,
        priceUSDC: 5.0,
      });
      showToast('Gem listed successfully!');
    } catch (error) {
      showToast('Failed to list gem');
    } finally {
      setIsListing(false);
    }
  };
  
  return (
    <button onClick={handleList} disabled={isListing}>
      List for $5 USDC
    </button>
  );
}
```

## Configuration

### Environment Variables

**Server:**
```env
SOLANA_NETWORK=solana-devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
BAZAAR_FACILITATOR_URL=https://x402.org/facilitator
```

**Client:**
```env
VITE_SOLANA_NETWORK=solana-devnet
VITE_API_BASE_URL=/api
```

### Mystery Box Configuration

```typescript
const mysteryBoxTiers: MysteryBoxTier[] = [
  {
    id: 'starter',
    name: 'Starter Box',
    priceUSDC: 1.0,
    description: 'Random common or uncommon gem',
    rarityWeights: {
      common: 70,
      uncommon: 30,
    },
  },
  {
    id: 'premium',
    name: 'Premium Box',
    priceUSDC: 5.0,
    description: 'Random rare or epic gem',
    rarityWeights: {
      rare: 60,
      epic: 35,
      legendary: 5,
    },
  },
];
```

## Security Considerations

### Payment Verification

1. **On-Chain Verification**: All transactions must be verified on Solana blockchain
2. **Amount Validation**: Payment amount must exactly match listing price
3. **Recipient Validation**: Payment must go to seller's wallet
4. **Token Validation**: Payment must use correct USDC mint address
5. **Replay Protection**: Transaction signatures are unique and cannot be reused

### Item Transfer Security

1. **Ownership Validation**: Verify seller owns item before listing
2. **Lock Mechanism**: Lock items during listing to prevent double-spending
3. **Atomic Operations**: Use atomic transactions for trade execution
4. **State Consistency**: Verify item state before and after transfer

### Rate Limiting

```typescript
// Recommended rate limits
const RATE_LIMITS = {
  createListing: { max: 10, window: '1h' },
  purchaseItem: { max: 20, window: '1h' },
  purchaseMysteryBox: { max: 50, window: '1h' },
};
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache active listings for 30 seconds
const listingsCache = new Map<string, { data: Listing[], timestamp: number }>();

async function getActiveListings(options: PaginationOptions): Promise<Listing[]> {
  const cacheKey = JSON.stringify(options);
  const cached = listingsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }
  
  const listings = await storageAdapter.getActiveListings(options);
  listingsCache.set(cacheKey, { data: listings, timestamp: Date.now() });
  
  return listings;
}
```

### Database Indexing

**Redis:**
- Use sorted sets for timestamp-based queries
- Use sets for user-specific queries
- Use hash maps for quick lookups

**MongoDB:**
- Index on `status` for active listings
- Index on `sellerUsername` for user listings
- Index on `createdAt` for sorting
- Compound index on `status + createdAt` for filtered queries

### Pagination

```typescript
interface PaginationOptions {
  cursor?: string; // Listing ID or timestamp
  limit?: number; // Default 20, max 100
  sortBy?: 'newest' | 'price_low' | 'price_high';
}
```

## Migration Path

### Phase 1: Core Library Development
1. Implement @bazaar/core types and interfaces
2. Implement @bazaar/server with Redis adapter
3. Implement @bazaar/client with basic wallet support
4. Write unit tests for all packages

### Phase 2: Goblin Gardens Integration
1. Create GemItemAdapter
2. Add bazaar routes to server
3. Add bazaar UI components to client
4. Test on devnet with test USDC

### Phase 3: Production Readiness
1. Add MongoDB storage adapter
2. Implement rate limiting
3. Add comprehensive error handling
4. Security audit
5. Load testing
6. Deploy to mainnet

## Documentation Requirements

### README.md
- Installation instructions
- Quick start guide
- Configuration options
- API reference links

### API Documentation
- JSDoc comments for all public methods
- TypeScript type definitions
- Example code snippets
- Error code reference

### Integration Guide
- Step-by-step integration tutorial
- Adapter implementation guide
- Goblin Gardens example walkthrough
- Troubleshooting section

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        Game Client                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              @bazaar/client                          │  │
│  │  • BazaarClient                                      │  │
│  │  • WalletAdapter                                     │  │
│  │  • PaymentHandler                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP + x402
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Game Server                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              @bazaar/server                          │  │
│  │  • BazaarMarketplace                                 │  │
│  │  • PaymentVerifier                                   │  │
│  │  • ListingManager                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Game-Specific Adapters                  │  │
│  │  • ItemAdapter (e.g., GemItemAdapter)                │  │
│  │  • StorageAdapter (Redis/MongoDB)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────┐
                            ▼                 ▼
                    ┌──────────────┐  ┌──────────────┐
                    │   Storage    │  │   Solana     │
                    │ (Redis/Mongo)│  │  Blockchain  │
                    └──────────────┘  └──────────────┘
```

## Mock Strategy for Development

### Overview

To enable rapid development and testing without requiring Solana wallet integration and real USDC transactions, the Bazaar library will support a mock mode that simulates the payment flow. This allows developers to build and test marketplace functionality before integrating x402.

### Mock Payment Adapter

```typescript
interface PaymentAdapter {
  verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult>;
  createPaymentRequirements(params: CreatePaymentParams): PaymentRequirements;
}

class MockPaymentAdapter implements PaymentAdapter {
  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    // Always return success in mock mode
    console.log('[MOCK] Payment verification bypassed:', params);
    return {
      success: true,
      txHash: `mock-tx-${Date.now()}`,
      networkId: 'solana-devnet',
    };
  }
  
  createPaymentRequirements(params: CreatePaymentParams): PaymentRequirements {
    // Return mock payment requirements
    return {
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: (params.priceUSDC * 1_000_000).toString(),
      resource: params.resource,
      description: params.description,
      mimeType: 'application/json',
      payTo: params.sellerWallet,
      maxTimeoutSeconds: 300,
      asset: 'MOCK_USDC_MINT',
    };
  }
}

class RealPaymentAdapter implements PaymentAdapter {
  constructor(private config: {
    network: 'solana-devnet' | 'solana-mainnet';
    rpcUrl: string;
    usdcMint: string;
  }) {}
  
  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    // Real Solana blockchain verification
    const verifier = new PaymentVerifier(this.config);
    return await verifier.verifyPayment(params);
  }
  
  createPaymentRequirements(params: CreatePaymentParams): PaymentRequirements {
    // Real payment requirements with actual USDC mint
    return {
      scheme: 'exact',
      network: this.config.network,
      maxAmountRequired: (params.priceUSDC * 1_000_000).toString(),
      resource: params.resource,
      description: params.description,
      mimeType: 'application/json',
      payTo: params.sellerWallet,
      maxTimeoutSeconds: 300,
      asset: this.config.usdcMint,
    };
  }
}
```

### Configuration

```typescript
class BazaarMarketplace {
  constructor(config: {
    storageAdapter: StorageAdapter;
    itemAdapter: ItemAdapter;
    paymentAdapter?: PaymentAdapter; // Optional, defaults to mock in dev
    network?: 'solana-devnet' | 'solana-mainnet';
    usdcMint?: string;
    facilitatorUrl?: string;
  }) {
    // Use mock adapter if no payment adapter provided
    this.paymentAdapter = config.paymentAdapter ?? new MockPaymentAdapter();
  }
}
```

### Environment-Based Mode Selection

```typescript
// Server setup
const paymentAdapter = process.env.BAZAAR_MOCK_MODE === 'true'
  ? new MockPaymentAdapter()
  : new RealPaymentAdapter({
      network: process.env.SOLANA_NETWORK as 'solana-devnet' | 'solana-mainnet',
      rpcUrl: process.env.SOLANA_RPC_URL!,
      usdcMint: process.env.USDC_MINT_ADDRESS!,
    });

const marketplace = new BazaarMarketplace({
  storageAdapter,
  itemAdapter,
  paymentAdapter,
});
```

### Mock Purchase Flow

**Without x402 (Mock Mode):**
```
1. Client: GET /api/bazaar/purchase/:listingId
   ↓
2. Server: Returns 200 OK immediately (no 402)
   {
     success: true,
     message: 'Purchase completed (mock mode)',
     item: { ... },
     mockTxHash: 'mock-tx-1234567890'
   }
   ↓
3. Server: Transfers item to buyer
   ↓
4. Client: Displays success message
```

**With x402 (Real Mode):**
```
1. Client: GET /api/bazaar/purchase/:listingId
   ↓
2. Server: Returns 402 Payment Required
   {
     x402Version: 1,
     accepts: [{ ... }]
   }
   ↓
3. Client: Signs Solana transaction
   ↓
4. Client: GET /api/bazaar/purchase/:listingId
   Headers: { X-Payment: <base64-payload> }
   ↓
5. Server: Verifies transaction on-chain
   ↓
6. Server: Returns 200 OK
   {
     success: true,
     item: { ... },
     txHash: 'real-solana-signature'
   }
```

### Mock Client Implementation

```typescript
class MockWalletAdapter implements WalletAdapter {
  publicKey = new PublicKey('MockWallet111111111111111111111111111111111');
  connected = true;
  
  async connect(): Promise<void> {
    console.log('[MOCK] Wallet connected');
  }
  
  async disconnect(): Promise<void> {
    console.log('[MOCK] Wallet disconnected');
  }
  
  async signAndSendTransaction(transaction: Transaction): Promise<string> {
    console.log('[MOCK] Transaction signed and sent');
    return `mock-tx-${Date.now()}`;
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    console.log('[MOCK] Transaction signed');
    return transaction;
  }
}

// Client setup
const walletAdapter = process.env.VITE_BAZAAR_MOCK_MODE === 'true'
  ? new MockWalletAdapter()
  : useWallet(); // Real Solana wallet

const bazaarClient = new BazaarClient({
  apiBaseUrl: '/api',
  walletAdapter,
  network: import.meta.env.VITE_SOLANA_NETWORK,
  mockMode: import.meta.env.VITE_BAZAAR_MOCK_MODE === 'true',
});
```

### Mock Mode Purchase Implementation

```typescript
class BazaarClient {
  async purchaseItem(listingId: string): Promise<PurchaseResult> {
    if (this.mockMode) {
      // Mock mode: Simple GET request, no payment flow
      const response = await fetch(`${this.apiBaseUrl}/bazaar/purchase/${listingId}`);
      return await response.json();
    }
    
    // Real mode: Full x402 payment flow
    return await this.executeX402Purchase(listingId);
  }
  
  private async executeX402Purchase(listingId: string): Promise<PurchaseResult> {
    // ... (existing x402 implementation)
  }
}
```

### Development Workflow

**Phase 1: Build with Mock Mode**
```bash
# Server
BAZAAR_MOCK_MODE=true npm run dev

# Client
VITE_BAZAAR_MOCK_MODE=true npm run dev
```

**Phase 2: Test with Real Payments**
```bash
# Server
BAZAAR_MOCK_MODE=false
SOLANA_NETWORK=solana-devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
npm run dev

# Client
VITE_BAZAAR_MOCK_MODE=false
VITE_SOLANA_NETWORK=solana-devnet
npm run dev
```

### Testing Strategy with Mocks

```typescript
describe('BazaarMarketplace - Mock Mode', () => {
  let marketplace: BazaarMarketplace;
  
  beforeEach(() => {
    marketplace = new BazaarMarketplace({
      storageAdapter: new MemoryStorageAdapter(),
      itemAdapter: new MockItemAdapter(),
      paymentAdapter: new MockPaymentAdapter(), // Use mock
    });
  });
  
  it('should complete purchase without payment verification', async () => {
    const listing = await marketplace.createListing({
      itemId: 'item-1',
      itemType: 'gem',
      sellerUsername: 'seller',
      sellerWallet: 'seller-wallet',
      priceUSDC: 5.0,
    });
    
    // Purchase without payment header (mock mode)
    const result = await marketplace.verifyAndCompletePurchase(
      listing.id,
      '' // Empty payment header in mock mode
    );
    
    expect(result.success).toBe(true);
    expect(result.txHash).toContain('mock-tx-');
  });
});
```

### UI Indicators for Mock Mode

```typescript
function BazaarHeader() {
  const mockMode = import.meta.env.VITE_BAZAAR_MOCK_MODE === 'true';
  
  return (
    <div className="bazaar-header">
      <h1>Bazaar Marketplace</h1>
      {mockMode && (
        <div className="mock-mode-badge">
          🧪 Mock Mode - No real payments
        </div>
      )}
    </div>
  );
}
```

### Benefits of Mock Strategy

1. **Faster Development**: Build marketplace UI and logic without wallet setup
2. **Easier Testing**: Test edge cases without real transactions
3. **Lower Barrier**: New developers can contribute without Solana knowledge
4. **Parallel Development**: Frontend and backend teams can work independently
5. **CI/CD Friendly**: Automated tests don't require blockchain access

### Migration from Mock to Real

```typescript
// Step 1: Develop with mock mode
BAZAAR_MOCK_MODE=true

// Step 2: Test with devnet
BAZAAR_MOCK_MODE=false
SOLANA_NETWORK=solana-devnet

// Step 3: Deploy to mainnet
BAZAAR_MOCK_MODE=false
SOLANA_NETWORK=solana-mainnet
```

No code changes required - just environment variables!
