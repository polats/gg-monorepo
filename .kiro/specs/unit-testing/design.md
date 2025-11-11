# Design Document

## Overview

This design document outlines the architecture and implementation strategy for comprehensive unit testing in Goblin Gardens. The testing infrastructure will use Vitest as the test runner, with separate configurations for client and server code. Tests will run automatically via GitHub Actions on every commit, ensuring continuous validation of authentication, API endpoints, data persistence, and core business logic.

## Architecture

### Testing Framework Stack

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Actions CI/CD                   │
│  - Triggers on push/PR                                   │
│  - Runs client + server tests                            │
│  - Generates coverage reports                            │
│  - Fails on threshold violations                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Vitest Test Runner                    │
│  - TypeScript support                                    │
│  - Fast parallel execution                               │
│  - Coverage with c8/istanbul                             │
│  - Watch mode for development                            │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Client Tests      │         │   Server Tests      │
│                     │         │                     │
│ - API Client        │         │ - Routes            │
│ - Utilities         │         │ - Adapters          │
│ - Type Guards       │         │ - Business Logic    │
└─────────────────────┘         └─────────────────────┘
```

### Directory Structure

```
apps/goblin-gardens/
├── src/
│   ├── client/
│   │   ├── utils/
│   │   │   ├── __tests__/
│   │   │   │   ├── api-client.test.ts
│   │   │   │   └── gemValue.test.ts
│   │   │   ├── api-client.ts
│   │   │   └── gemValue.ts
│   │   └── vitest.config.ts
│   ├── server/
│   │   ├── core/
│   │   │   ├── __tests__/
│   │   │   │   └── routes.test.ts
│   │   │   └── routes.ts
│   │   ├── adapters/
│   │   │   ├── __tests__/
│   │   │   │   ├── redis-adapter.test.ts
│   │   │   │   ├── auth-adapter.test.ts
│   │   │   │   └── environment.test.ts
│   │   │   ├── redis-adapter.ts
│   │   │   ├── auth-adapter.ts
│   │   │   └── environment.ts
│   │   └── vitest.config.ts
│   └── shared/
│       └── types/
│           └── __tests__/
│               └── api.test.ts
├── __tests__/
│   ├── fixtures/
│   │   ├── gems.ts
│   │   ├── player-state.ts
│   │   └── offers.ts
│   └── mocks/
│       ├── redis.ts
│       ├── auth.ts
│       └── express.ts
├── vitest.workspace.ts
└── .github/
    └── workflows/
        └── test.yml
```

## Components and Interfaces

### 1. Vitest Configuration

#### Workspace Configuration (`vitest.workspace.ts`)

Defines multiple test projects for client and server code:

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './src/client/vitest.config.ts',
    test: {
      name: 'client',
      include: ['src/client/**/*.test.ts'],
      environment: 'jsdom',
    },
  },
  {
    extends: './src/server/vitest.config.ts',
    test: {
      name: 'server',
      include: ['src/server/**/*.test.ts'],
      environment: 'node',
    },
  },
]);
```

#### Client Configuration (`src/client/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/client/utils/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**', '**/types/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

#### Server Configuration (`src/server/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/server/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        '**/index.ts',
        '**/local.ts',
        '**/vercel.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 2. Test Fixtures and Mocks

#### Gem Fixtures (`__tests__/fixtures/gems.ts`)

Factory functions for creating test gems:

```typescript
import type { Gem, GemType, GemShape, GemRarity } from '../../src/shared/types/api';

export function createTestGem(overrides?: Partial<Gem>): Gem {
  return {
    id: 'test-gem-' + Math.random().toString(36).substring(7),
    type: 'emerald' as GemType,
    rarity: 'common' as GemRarity,
    shape: 'tetrahedron' as GemShape,
    color: '#50C878',
    growthRate: 1.0,
    level: 1,
    experience: 0,
    dateAcquired: Date.now(),
    size: 0.063,
    isGrowing: false,
    isOffering: false,
    ...overrides,
  };
}

export function createTestGems(count: number, overrides?: Partial<Gem>): Gem[] {
  return Array.from({ length: count }, () => createTestGem(overrides));
}
```

#### Player State Fixtures (`__tests__/fixtures/player-state.ts`)

```typescript
import type { PlayerState } from '../../src/shared/types/api';
import { createTestGems } from './gems';

export function createTestPlayerState(overrides?: Partial<PlayerState>): PlayerState {
  return {
    coins: {
      gold: 0,
      silver: 10,
      bronze: 50,
    },
    gems: createTestGems(5),
    ...overrides,
  };
}
```

#### Redis Mock (`__tests__/mocks/redis.ts`)

```typescript
import type { RedisAdapter } from '../../src/server/adapters/redis-adapter';

export function createMockRedisAdapter(): RedisAdapter {
  const storage = new Map<string, string>();
  const sortedSets = new Map<string, Map<string, number>>();

  return {
    get: vi.fn(async (key: string) => storage.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
    incrBy: vi.fn(async (key: string, increment: number) => {
      const current = parseInt(storage.get(key) ?? '0');
      const newValue = current + increment;
      storage.set(key, newValue.toString());
      return newValue;
    }),
    zAdd: vi.fn(async (key: string, members: Array<{ member: string; score: number }>) => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      members.forEach(({ member, score }) => set.set(member, score));
    }),
    zRange: vi.fn(async (key: string, start: number, stop: number, options?: any) => {
      const set = sortedSets.get(key);
      if (!set) return [];
      
      const entries = Array.from(set.entries())
        .sort((a, b) => options?.reverse ? b[1] - a[1] : a[1] - b[1])
        .slice(start, stop + 1);
      
      return entries.map(([member, score]) => ({ member, score }));
    }),
    zCard: vi.fn(async (key: string) => {
      return sortedSets.get(key)?.size ?? 0;
    }),
    zRem: vi.fn(async (key: string, members: string[]) => {
      const set = sortedSets.get(key);
      if (!set) return;
      members.forEach(member => set.delete(member));
    }),
  };
}
```

#### Auth Mock (`__tests__/mocks/auth.ts`)

```typescript
import type { AuthAdapter } from '../../src/server/adapters/auth-adapter';
import type { Request } from 'express';

export function createMockAuthAdapter(username: string = 'TestUser'): AuthAdapter {
  return {
    getUsername: vi.fn(async (req: Request) => {
      return req.headers['x-username'] as string ?? username;
    }),
  };
}
```

#### Express Mocks (`__tests__/mocks/express.ts`)

```typescript
import type { Request, Response } from 'express';

export function createMockRequest(overrides?: Partial<Request>): Partial<Request> {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    ...overrides,
  };
}

export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}
```

### 3. API Client Tests

#### Test Structure (`src/client/utils/__tests__/api-client.test.ts`)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../api-client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('init', () => {
    it('should fetch init data successfully', async () => {
      const mockResponse = {
        type: 'init',
        postId: 'test-post',
        count: 0,
        username: 'TestUser',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.init();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/init'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.init()).rejects.toThrow('Network error');
    });

    it('should throw error on HTTP error status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiClient.init()).rejects.toThrow();
    });
  });

  describe('savePlayerState', () => {
    it('should send player state with correct headers', async () => {
      const playerState = {
        coins: { gold: 0, silver: 10, bronze: 50 },
        gems: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'savePlayerState', success: true }),
      });

      await apiClient.savePlayerState(playerState);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/player-state/save'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Username': expect.any(String),
          }),
          body: JSON.stringify({ playerState }),
        })
      );
    });
  });
});
```

### 4. Server Route Tests

#### Test Structure (`src/server/core/__tests__/routes.test.ts`)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRoutes } from '../routes';
import { createMockRedisAdapter } from '../../../__tests__/mocks/redis';
import { createMockAuthAdapter } from '../../../__tests__/mocks/auth';

describe('API Routes', () => {
  let app: express.Application;
  let mockRedis: ReturnType<typeof createMockRedisAdapter>;
  let mockAuth: ReturnType<typeof createMockAuthAdapter>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockRedis = createMockRedisAdapter();
    mockAuth = createMockAuthAdapter('TestUser');
    
    const router = createRoutes({
      redis: mockRedis,
      auth: mockAuth,
      postId: 'test-post-123',
    });
    
    app.use(router);
  });

  describe('GET /api/init', () => {
    it('should return init data with postId and username', async () => {
      mockRedis.get.mockResolvedValueOnce('42');

      const response = await request(app)
        .get('/api/init')
        .expect(200);

      expect(response.body).toEqual({
        type: 'init',
        postId: 'test-post-123',
        count: 42,
        username: 'TestUser',
      });
    });

    it('should return 400 when postId is missing', async () => {
      const appWithoutPostId = express();
      appWithoutPostId.use(express.json());
      
      const router = createRoutes({
        redis: mockRedis,
        auth: mockAuth,
        postId: undefined,
      });
      
      appWithoutPostId.use(router);

      const response = await request(appWithoutPostId)
        .get('/api/init')
        .expect(400);

      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('postId'),
      });
    });
  });

  describe('POST /api/player-state/save', () => {
    it('should save player state successfully', async () => {
      const playerState = {
        coins: { gold: 0, silver: 10, bronze: 50 },
        gems: [],
      };

      const response = await request(app)
        .post('/api/player-state/save')
        .send({ playerState })
        .expect(200);

      expect(response.body).toMatchObject({
        type: 'savePlayerState',
        success: true,
      });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'playerState:TestUser',
        JSON.stringify(playerState)
      );
    });

    it('should return 400 when playerState is missing', async () => {
      const response = await request(app)
        .post('/api/player-state/save')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('playerState'),
      });
    });
  });

  describe('GET /api/player-state/load', () => {
    it('should load existing player state', async () => {
      const playerState = {
        coins: { gold: 1, silver: 20, bronze: 30 },
        gems: [],
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(playerState));

      const response = await request(app)
        .get('/api/player-state/load')
        .expect(200);

      expect(response.body).toMatchObject({
        type: 'loadPlayerState',
        playerState,
      });
    });

    it('should return null for new user', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/player-state/load')
        .expect(200);

      expect(response.body).toMatchObject({
        type: 'loadPlayerState',
        playerState: null,
      });
    });
  });

  describe('POST /api/trade/execute', () => {
    it('should prevent trading with self', async () => {
      const response = await request(app)
        .post('/api/trade/execute')
        .send({ sellerUsername: 'TestUser' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('yourself'),
      });
    });

    it('should return 404 for non-existent offer', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/trade/execute')
        .send({ sellerUsername: 'OtherUser' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('no longer available'),
      });
    });
  });
});
```

### 5. Adapter Tests

#### Redis Adapter Tests (`src/server/adapters/__tests__/redis-adapter.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createRedisAdapter } from '../redis-adapter';
import { Environment } from '../environment';

describe('Redis Adapter', () => {
  describe('Local Environment', () => {
    let adapter: ReturnType<typeof createRedisAdapter>;

    beforeEach(() => {
      adapter = createRedisAdapter(Environment.LOCAL);
    });

    it('should store and retrieve values', async () => {
      await adapter.set('test-key', 'test-value');
      const value = await adapter.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const value = await adapter.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete keys', async () => {
      await adapter.set('test-key', 'test-value');
      await adapter.del('test-key');
      const value = await adapter.get('test-key');
      expect(value).toBeNull();
    });

    it('should increment counters', async () => {
      const value1 = await adapter.incrBy('counter', 1);
      expect(value1).toBe(1);
      
      const value2 = await adapter.incrBy('counter', 5);
      expect(value2).toBe(6);
    });

    it('should handle sorted sets', async () => {
      await adapter.zAdd('leaderboard', [
        { member: 'user1', score: 100 },
        { member: 'user2', score: 200 },
        { member: 'user3', score: 150 },
      ]);

      const count = await adapter.zCard('leaderboard');
      expect(count).toBe(3);

      const topUsers = await adapter.zRange('leaderboard', 0, 1, { reverse: true });
      expect(topUsers[0]?.member).toBe('user2');
      expect(topUsers[0]?.score).toBe(200);
    });
  });
});
```

#### Auth Adapter Tests (`src/server/adapters/__tests__/auth-adapter.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { createAuthAdapter } from '../auth-adapter';
import { Environment } from '../environment';
import { createMockRequest } from '../../../__tests__/mocks/express';

describe('Auth Adapter', () => {
  describe('Local Environment', () => {
    const adapter = createAuthAdapter(Environment.LOCAL);

    it('should extract username from X-Username header', async () => {
      const req = createMockRequest({
        headers: { 'x-username': 'TestUser123' },
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('TestUser123');
    });

    it('should return default username when header is missing', async () => {
      const req = createMockRequest({
        headers: {},
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('LocalDevUser');
    });

    it('should sanitize username to prevent injection', async () => {
      const req = createMockRequest({
        headers: { 'x-username': 'User<script>alert(1)</script>' },
      });

      const username = await adapter.getUsername(req as any);
      expect(username).not.toContain('<script>');
    });
  });
});
```

#### Environment Detection Tests (`src/server/adapters/__tests__/environment.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectEnvironment, Environment } from '../environment';

describe('Environment Detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should detect local environment by default', () => {
    delete process.env.VERCEL;
    delete process.env.DEVVIT_EXECUTION_ID;

    const env = detectEnvironment();
    expect(env).toBe(Environment.LOCAL);
  });

  it('should detect Vercel environment', () => {
    process.env.VERCEL = '1';

    const env = detectEnvironment();
    expect(env).toBe(Environment.VERCEL);
  });

  it('should detect Devvit environment', () => {
    process.env.DEVVIT_EXECUTION_ID = 'test-execution-id';

    const env = detectEnvironment();
    expect(env).toBe(Environment.DEVVIT);
  });

  it('should prioritize Devvit over Vercel when both are set', () => {
    process.env.VERCEL = '1';
    process.env.DEVVIT_EXECUTION_ID = 'test-execution-id';

    const env = detectEnvironment();
    expect(env).toBe(Environment.DEVVIT);
  });
});
```

## Data Models

### Test Fixtures Schema

```typescript
// Gem fixture with all required properties
interface TestGem {
  id: string;
  type: GemType;
  rarity: GemRarity;
  shape: GemShape;
  color: string;
  growthRate: number;
  level: number;
  experience: number;
  dateAcquired: number;
  size: number;
  isGrowing: boolean;
  isOffering: boolean;
}

// Player state fixture
interface TestPlayerState {
  coins: {
    gold: number;
    silver: number;
    bronze: number;
  };
  gems: TestGem[];
}

// Active offer fixture
interface TestActiveOffer {
  username: string;
  gems: TestGem[];
  totalValue: number;
  timestamp: number;
  level: number;
  itemCount: number;
}
```

## Error Handling

### Test Error Scenarios

1. **Network Errors**
   - Simulate fetch failures
   - Verify error messages are descriptive
   - Ensure no partial state updates

2. **HTTP Errors**
   - Test 400 (Bad Request) responses
   - Test 401 (Unauthorized) responses
   - Test 404 (Not Found) responses
   - Test 500 (Internal Server Error) responses

3. **Validation Errors**
   - Missing required fields
   - Invalid data types
   - Out-of-range values
   - Malformed JSON

4. **Redis Errors**
   - Connection failures
   - Timeout errors
   - Data corruption

5. **Race Conditions**
   - Concurrent modifications
   - Stale data reads
   - Transaction conflicts

## Testing Strategy

### Unit Test Coverage Goals

- **Client Utils**: 80% line coverage
- **Server Routes**: 85% line coverage
- **Server Adapters**: 85% line coverage
- **Shared Types**: Type validation only

### Test Organization

1. **Arrange-Act-Assert Pattern**
   - Setup test data and mocks
   - Execute the code under test
   - Verify expected outcomes

2. **Test Isolation**
   - Each test is independent
   - No shared state between tests
   - Clean up after each test

3. **Descriptive Test Names**
   - Use "should" statements
   - Describe the scenario and expected outcome
   - Example: "should return 400 when playerState is missing"

4. **Mock External Dependencies**
   - Redis operations
   - Authentication
   - HTTP requests
   - Time-dependent functions

### GitHub Actions Workflow

```yaml
name: Test

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['main', 'develop']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: apps/goblin-gardens
      
      - name: Run client tests
        run: npm run test:client
        working-directory: apps/goblin-gardens
      
      - name: Run server tests
        run: npm run test:server
        working-directory: apps/goblin-gardens
      
      - name: Generate coverage report
        run: npm run test:coverage
        working-directory: apps/goblin-gardens
      
      - name: Upload coverage to artifacts
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: apps/goblin-gardens/coverage/
      
      - name: Check coverage thresholds
        run: npm run test:coverage -- --reporter=json --reporter=text
        working-directory: apps/goblin-gardens
```

## Performance Considerations

### Test Execution Speed

- Use Vitest's parallel execution
- Mock expensive operations (Redis, HTTP)
- Avoid unnecessary setup/teardown
- Use test.concurrent for independent tests

### CI/CD Optimization

- Cache node_modules
- Run tests in parallel jobs if needed
- Skip tests for documentation-only changes
- Use matrix strategy for multiple Node versions

## Security Considerations

### Test Data Security

- Never use real credentials in tests
- Use mock data for sensitive information
- Sanitize test outputs in CI logs
- Avoid committing test artifacts with secrets

### Input Validation Testing

- Test SQL injection prevention
- Test XSS prevention
- Test authentication bypass attempts
- Test authorization checks

## Monitoring and Reporting

### Coverage Reports

- Generate HTML reports for local viewing
- Generate LCOV for CI integration
- Track coverage trends over time
- Fail builds on coverage regression

### Test Results

- Display summary in GitHub Actions
- Show failed test details
- Link to coverage reports
- Notify on test failures

## Migration Strategy

### Phase 1: Infrastructure Setup
- Install Vitest and dependencies
- Create configuration files
- Set up GitHub Actions workflow

### Phase 2: Core Tests
- API client tests
- Redis adapter tests
- Auth adapter tests
- Environment detection tests

### Phase 3: Route Tests
- Init endpoint tests
- Player state endpoints tests
- Offer endpoints tests
- Trade endpoint tests

### Phase 4: Coverage and Refinement
- Achieve coverage thresholds
- Add edge case tests
- Optimize test performance
- Document testing patterns
