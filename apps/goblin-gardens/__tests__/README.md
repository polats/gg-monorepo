# Test Fixtures and Mocks

This directory contains reusable test utilities for the Goblin Gardens test suite.

## Directory Structure

```
__tests__/
├── fixtures/          # Test data factories
│   ├── gems.ts       # Gem creation utilities
│   ├── player-state.ts  # Player state factories
│   └── offers.ts     # Active offer factories
└── mocks/            # Mock implementations
    ├── redis.ts      # Redis adapter mock
    ├── auth.ts       # Auth adapter mock
    └── express.ts    # Express request/response mocks
```

## Fixtures

### Gem Fixtures (`fixtures/gems.ts`)

Create test gems with customizable properties:

```typescript
import { createTestGem, createTestGems, createDiverseGemCollection } from '../fixtures/gems';

// Create a single gem with defaults
const gem = createTestGem();

// Create a gem with custom properties
const legendaryDiamond = createTestGem({
  type: 'diamond',
  rarity: 'legendary',
  level: 10,
  isOffering: true
});

// Create multiple gems with same properties
const gems = createTestGems(5, { type: 'ruby', rarity: 'rare' });

// Create a diverse collection (different types, shapes, rarities)
const diverseGems = createDiverseGemCollection();
```

### Player State Fixtures (`fixtures/player-state.ts`)

Create test player states with coins and gems:

```typescript
import { 
  createTestPlayerState, 
  createPlayerStateWithBronze,
  createNewPlayerState,
  createWealthyPlayerState 
} from '../fixtures/player-state';

// Create player with default coins and 5 gems
const state = createTestPlayerState();

// Create player with custom coins
const richPlayer = createTestPlayerState({
  coins: { gold: 10, silver: 50, bronze: 100 }
});

// Create player with specific bronze amount (auto-converts to gold/silver/bronze)
const player = createPlayerStateWithBronze(15250); // 1 gold, 52 silver, 50 bronze

// Create new player (no coins, no gems)
const newPlayer = createNewPlayerState();

// Create wealthy player (100 gold, 500 silver, 999 bronze, 20 gems)
const wealthy = createWealthyPlayerState();
```

### Offer Fixtures (`fixtures/offers.ts`)

Create test marketplace offers:

```typescript
import { 
  createTestOffer, 
  createTestOffers,
  createOfferForUser,
  createMarketplaceOffers 
} from '../fixtures/offers';

// Create offer with defaults
const offer = createTestOffer();

// Create offer with custom properties
const premiumOffer = createTestOffer({
  username: 'Alice',
  totalValue: 20000,
  level: 15
});

// Create multiple offers
const offers = createTestOffers(5);

// Create offer for specific user
const aliceOffer = createOfferForUser('Alice', 3, 10000);

// Create marketplace with pagination testing (25 offers)
const marketplace = createMarketplaceOffers(25);
```

## Mocks

### Redis Mock (`mocks/redis.ts`)

Mock Redis adapter with in-memory storage:

```typescript
import { createMockRedisAdapter, createMockRedisAdapterWithData, resetMockRedis } from '../mocks/redis';

// Create empty mock
const mockRedis = createMockRedisAdapter();

// Use in tests
await mockRedis.set('key', 'value');
const value = await mockRedis.get('key');

// Assert on calls
expect(mockRedis.set).toHaveBeenCalledWith('key', 'value');
expect(mockRedis.get).toHaveBeenCalledWith('key');

// Create mock with pre-populated data
const mockRedisWithData = createMockRedisAdapterWithData(
  { 'counter': '42' },
  { 'leaderboard': [{ member: 'Alice', score: 100 }] }
);

// Reset mock between tests
resetMockRedis(mockRedis);
```

### Auth Mock (`mocks/auth.ts`)

Mock authentication adapter:

```typescript
import { 
  createMockAuthAdapter, 
  createMockAuthAdapterWithHeader,
  createMockAuthAdapterWithCustomLogic,
  resetMockAuth 
} from '../mocks/auth';

// Create mock with fixed username
const mockAuth = createMockAuthAdapter('Alice');
const username = await mockAuth.getUsername(req); // 'Alice'

// Create mock that reads from X-Username header
const mockAuthWithHeader = createMockAuthAdapterWithHeader('DefaultUser');
const username1 = await mockAuthWithHeader.getUsername(reqWithHeader); // From header
const username2 = await mockAuthWithHeader.getUsername(reqWithoutHeader); // 'DefaultUser'

// Create mock with custom logic
const mockAuthCustom = createMockAuthAdapterWithCustomLogic((req) => {
  return req.headers['x-username'] || 'Anonymous';
});

// Reset mock between tests
resetMockAuth(mockAuth);
```

### Express Mocks (`mocks/express.ts`)

Mock Express request and response objects:

```typescript
import { 
  createMockRequest, 
  createMockResponse,
  createAuthenticatedRequest,
  createPostRequest,
  createGetRequest,
  getResponseJson,
  getResponseStatus,
  resetMockResponse 
} from '../mocks/express';

// Create basic request
const req = createMockRequest();

// Create request with custom properties
const postReq = createMockRequest({
  method: 'POST',
  body: { data: 'value' },
  headers: { 'x-username': 'Alice' }
});

// Create authenticated request
const authReq = createAuthenticatedRequest('Alice');

// Create POST request with body
const postReq = createPostRequest({ playerState: {...} });

// Create GET request with query params
const getReq = createGetRequest({ cursor: '10', limit: '20' });

// Create response
const res = createMockResponse();

// Use in route handler
res.status(200).json({ success: true });

// Assert on calls
expect(res.status).toHaveBeenCalledWith(200);
expect(res.json).toHaveBeenCalledWith({ success: true });

// Extract response data
const jsonData = getResponseJson(res); // { success: true }
const statusCode = getResponseStatus(res); // 200

// Reset mock between tests
resetMockResponse(res);
```

## Best Practices

### Using Fixtures

1. **Start with defaults**: Use default factory functions and override only what you need
2. **Be specific**: Override properties to make test intent clear
3. **Reuse collections**: Use `createDiverseGemCollection()` for varied test data

### Using Mocks

1. **Track calls**: All mocks use `vi.fn()` for call tracking
2. **Reset between tests**: Use `beforeEach` to reset mocks
3. **Assert on behavior**: Check that mocks were called with expected arguments

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestPlayerState } from '../fixtures/player-state';
import { createMockRedisAdapter, resetMockRedis } from '../mocks/redis';
import { createMockAuthAdapter } from '../mocks/auth';

describe('Player State API', () => {
  let mockRedis: ReturnType<typeof createMockRedisAdapter>;
  let mockAuth: ReturnType<typeof createMockAuthAdapter>;

  beforeEach(() => {
    mockRedis = createMockRedisAdapter();
    mockAuth = createMockAuthAdapter('TestUser');
  });

  it('should save player state', async () => {
    const playerState = createTestPlayerState();
    
    await mockRedis.set('playerState:TestUser', JSON.stringify(playerState));
    
    expect(mockRedis.set).toHaveBeenCalledWith(
      'playerState:TestUser',
      JSON.stringify(playerState)
    );
  });
});
```

## Writing New Tests

When writing new tests:

1. Import fixtures and mocks from this directory
2. Use `beforeEach` to set up fresh mocks
3. Create test data with fixtures
4. Assert on mock calls and return values
5. Reset mocks between tests if needed

## Coverage

These utilities support testing:

- API client (HTTP requests/responses)
- Server routes (Express endpoints)
- Redis operations (data persistence)
- Authentication (username extraction)
- Business logic (gem values, trading)
