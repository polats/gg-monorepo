# Design Document: Vercel Backend Deployment

## Overview

This design enables the Goblin Gardens backend to run on Vercel's serverless platform using Vercel KV for Redis storage, while maintaining full compatibility with existing local development and Reddit Devvit deployments. The solution uses an adapter pattern to abstract environment-specific differences without duplicating business logic.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React Three Fiber App - Detects environment & API base)   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Environment Router                        │
│         (Detects: Vercel | Local | Reddit)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬────────────────┐
        │                 │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
│   Vercel     │  │    Local    │  │   Reddit   │
│   Adapter    │  │   Adapter   │  │   Adapter  │
└───────┬──────┘  └──────┬──────┘  └─────┬──────┘
        │                │                │
        │                │                │
┌───────▼────────────────▼────────────────▼──────┐
│           Express App (Business Logic)         │
│  - Player State APIs                           │
│  - Trading APIs                                │
│  - Marketplace APIs                            │
└───────┬────────────────────────────────────────┘
        │
        │
┌───────▼────────────────────────────────────────┐
│              Storage Adapter                   │
│  (Abstracts Redis operations)                  │
└───────┬────────────────────────────────────────┘
        │
┌───────┴────────┬────────────────┬──────────────┐
│                │                │              │
▼                ▼                ▼              │
Vercel KV     In-Memory      Devvit Redis       │
(@vercel/kv)    Map          (@devvit/web)      │
```

### Directory Structure

```
apps/goblin-gardens/
├── src/
│   ├── server/
│   │   ├── adapters/
│   │   │   ├── environment.ts      # Environment detection
│   │   │   ├── redis-adapter.ts    # Redis abstraction
│   │   │   ├── auth-adapter.ts     # Authentication abstraction
│   │   │   └── index.ts            # Export all adapters
│   │   ├── core/
│   │   │   ├── post.ts             # Reddit post creation (existing)
│   │   │   └── routes.ts           # Express routes (extracted)
│   │   ├── index.ts                # Main server (Devvit/Reddit)
│   │   ├── local.ts                # Local dev server (existing)
│   │   └── vercel.ts               # Vercel serverless entry
│   ├── client/
│   │   └── utils/
│   │       └── api-client.ts       # API client with env detection
│   └── shared/
│       └── types/
│           └── api.ts              # Shared types (existing)
├── api/
│   └── [...path].ts                # Vercel catch-all route
├── vercel.json                     # Vercel configuration
└── package.json                    # Updated with @vercel/kv
```

## Components and Interfaces

### 1. Environment Adapter (`src/server/adapters/environment.ts`)

**Purpose**: Detect and configure the runtime environment

```typescript
export enum Environment {
  VERCEL = 'vercel',
  LOCAL = 'local',
  REDDIT = 'reddit'
}

export interface EnvironmentConfig {
  environment: Environment;
  isProduction: boolean;
  apiBaseUrl: string;
}

export function detectEnvironment(): Environment {
  // Check for Vercel environment
  if (process.env.VERCEL) {
    return Environment.VERCEL;
  }
  
  // Check for Devvit context
  if (process.env.DEVVIT_RUNTIME) {
    return Environment.REDDIT;
  }
  
  // Default to local
  return Environment.LOCAL;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment();
  
  return {
    environment,
    isProduction: process.env.NODE_ENV === 'production',
    apiBaseUrl: getApiBaseUrl(environment),
  };
}

function getApiBaseUrl(env: Environment): string {
  switch (env) {
    case Environment.VERCEL:
      return process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : '';
    case Environment.LOCAL:
      return 'http://localhost:3000';
    case Environment.REDDIT:
      return ''; // Relative paths in Devvit
  }
}
```

### 2. Redis Adapter (`src/server/adapters/redis-adapter.ts`)

**Purpose**: Abstract Redis operations across different Redis implementations

```typescript
import { kv } from '@vercel/kv';
import { redis as devvitRedis } from '@devvit/web/server';
import { Environment } from './environment';

export interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  zAdd(key: string, member: { member: string; score: number }): Promise<void>;
  zRem(key: string, members: string[]): Promise<void>;
  zRange(key: string, start: number, stop: number, options?: { by?: 'rank'; reverse?: boolean }): Promise<Array<{ member: string; score: number }>>;
  zCard(key: string): Promise<number>;
  incrBy(key: string, increment: number): Promise<number>;
}

class VercelKVAdapter implements RedisAdapter {
  async get(key: string): Promise<string | null> {
    return await kv.get<string>(key);
  }

  async set(key: string, value: string): Promise<void> {
    await kv.set(key, value);
  }

  async del(key: string): Promise<void> {
    await kv.del(key);
  }

  async zAdd(key: string, member: { member: string; score: number }): Promise<void> {
    await kv.zadd(key, { score: member.score, member: member.member });
  }

  async zRem(key: string, members: string[]): Promise<void> {
    await kv.zrem(key, ...members);
  }

  async zRange(key: string, start: number, stop: number, options?: { by?: 'rank'; reverse?: boolean }): Promise<Array<{ member: string; score: number }>> {
    const results = options?.reverse 
      ? await kv.zrange(key, start, stop, { rev: true, withScores: true })
      : await kv.zrange(key, start, stop, { withScores: true });
    
    // Convert to expected format
    const formatted: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      formatted.push({
        member: results[i] as string,
        score: results[i + 1] as number
      });
    }
    return formatted;
  }

  async zCard(key: string): Promise<number> {
    return await kv.zcard(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return await kv.incrby(key, increment);
  }
}

class DevvitRedisAdapter implements RedisAdapter {
  async get(key: string): Promise<string | null> {
    return await devvitRedis.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await devvitRedis.set(key, value);
  }

  async del(key: string): Promise<void> {
    await devvitRedis.del(key);
  }

  async zAdd(key: string, member: { member: string; score: number }): Promise<void> {
    await devvitRedis.zAdd(key, member);
  }

  async zRem(key: string, members: string[]): Promise<void> {
    await devvitRedis.zRem(key, members);
  }

  async zRange(key: string, start: number, stop: number, options?: { by?: 'rank'; reverse?: boolean }): Promise<Array<{ member: string; score: number }>> {
    return await devvitRedis.zRange(key, start, stop, options);
  }

  async zCard(key: string): Promise<number> {
    return await devvitRedis.zCard(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return await devvitRedis.incrBy(key, increment);
  }
}

class InMemoryAdapter implements RedisAdapter {
  private storage = new Map<string, string>();
  private sortedSets = new Map<string, Map<string, number>>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.storage.delete(key);
    this.sortedSets.delete(key);
  }

  async zAdd(key: string, member: { member: string; score: number }): Promise<void> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    this.sortedSets.get(key)!.set(member.member, member.score);
  }

  async zRem(key: string, members: string[]): Promise<void> {
    const set = this.sortedSets.get(key);
    if (set) {
      members.forEach(m => set.delete(m));
    }
  }

  async zRange(key: string, start: number, stop: number, options?: { by?: 'rank'; reverse?: boolean }): Promise<Array<{ member: string; score: number }>> {
    const set = this.sortedSets.get(key);
    if (!set) return [];

    const entries = Array.from(set.entries())
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => options?.reverse ? b.score - a.score : a.score - b.score);

    return entries.slice(start, stop + 1);
  }

  async zCard(key: string): Promise<number> {
    return this.sortedSets.get(key)?.size ?? 0;
  }

  async incrBy(key: string, increment: number): Promise<number> {
    const current = parseInt(this.storage.get(key) ?? '0');
    const newValue = current + increment;
    this.storage.set(key, newValue.toString());
    return newValue;
  }
}

export function createRedisAdapter(environment: Environment): RedisAdapter {
  switch (environment) {
    case Environment.VERCEL:
      return new VercelKVAdapter();
    case Environment.REDDIT:
      return new DevvitRedisAdapter();
    case Environment.LOCAL:
      return new InMemoryAdapter();
  }
}
```

### 3. Authentication Adapter (`src/server/adapters/auth-adapter.ts`)

**Purpose**: Abstract username/authentication across environments

```typescript
import { Request } from 'express';
import { reddit } from '@devvit/web/server';
import { Environment } from './environment';

export interface AuthAdapter {
  getUsername(req: Request): Promise<string>;
}

class VercelAuthAdapter implements AuthAdapter {
  async getUsername(req: Request): Promise<string> {
    // For Vercel, we'll use session-based auth or header-based for now
    // This can be enhanced with proper JWT or session management
    const username = req.headers['x-username'] as string;
    
    if (!username) {
      throw new Error('Authentication required');
    }
    
    return username;
  }
}

class DevvitAuthAdapter implements AuthAdapter {
  async getUsername(_req: Request): Promise<string> {
    const username = await reddit.getCurrentUsername();
    return username ?? 'anonymous';
  }
}

class LocalAuthAdapter implements AuthAdapter {
  async getUsername(req: Request): Promise<string> {
    // Local dev: accept username from header or use default
    return (req.headers['x-username'] as string) || 'LocalDevUser';
  }
}

export function createAuthAdapter(environment: Environment): AuthAdapter {
  switch (environment) {
    case Environment.VERCEL:
      return new VercelAuthAdapter();
    case Environment.REDDIT:
      return new DevvitAuthAdapter();
    case Environment.LOCAL:
      return new LocalAuthAdapter();
  }
}
```

### 4. Extracted Routes (`src/server/core/routes.ts`)

**Purpose**: Centralize all Express routes to be reused across environments

```typescript
import express, { Router } from 'express';
import { RedisAdapter } from '../adapters/redis-adapter';
import { AuthAdapter } from '../adapters/auth-adapter';
import {
  InitResponse,
  SavePlayerStateRequest,
  SavePlayerStateResponse,
  LoadPlayerStateResponse,
  GetActiveOffersResponse,
  UpdateOfferRequest,
  UpdateOfferResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  PlayerState,
  ActiveOffer,
  Gem
} from '../../shared/types/api';

export interface RouteContext {
  redis: RedisAdapter;
  auth: AuthAdapter;
  postId?: string;
}

export function createRoutes(context: RouteContext): Router {
  const router = express.Router();

  // Helper functions (calculateGemValue, formatLastActive, etc.)
  // ... (same as current implementation)

  // GET /api/init
  router.get('/api/init', async (req, res) => {
    try {
      const username = await context.auth.getUsername(req);
      const count = await context.redis.get('count');

      res.json({
        type: 'init',
        postId: context.postId ?? 'vercel-deployment',
        count: count ? parseInt(count) : 0,
        username,
      });
    } catch (error) {
      console.error('API Init Error:', error);
      res.status(400).json({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // POST /api/player-state/save
  router.post('/api/player-state/save', async (req, res) => {
    try {
      const { playerState } = req.body as SavePlayerStateRequest;
      const username = await context.auth.getUsername(req);

      if (!playerState) {
        res.status(400).json({ status: 'error', message: 'playerState is required' });
        return;
      }

      const playerStateKey = `playerState:${username}`;
      await context.redis.set(playerStateKey, JSON.stringify(playerState));

      console.log(`[SAVE] Player state saved for ${username}`);

      res.json({
        type: 'savePlayerState',
        success: true,
        message: 'Player state saved successfully',
      });
    } catch (error) {
      console.error('API Save Player State Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to save player state' });
    }
  });

  // ... (all other routes following the same pattern)

  return router;
}
```

### 5. Vercel Entry Point (`src/server/vercel.ts`)

**Purpose**: Serverless function entry point for Vercel

```typescript
import express from 'express';
import cors from 'cors';
import { detectEnvironment, Environment } from './adapters/environment';
import { createRedisAdapter } from './adapters/redis-adapter';
import { createAuthAdapter } from './adapters/auth-adapter';
import { createRoutes } from './core/routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Initialize adapters
const environment = detectEnvironment();

if (environment !== Environment.VERCEL) {
  console.warn('Warning: vercel.ts should only run on Vercel');
}

const redis = createRedisAdapter(environment);
const auth = createAuthAdapter(environment);

// Create routes with context
const routes = createRoutes({ redis, auth });
app.use(routes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment });
});

// Export for Vercel
export default app;
```

### 6. Vercel Catch-All Route (`api/[...path].ts`)

**Purpose**: Route all API requests to the Express app

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server/vercel';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Express-compatible format
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
```

### 7. Client API Client (`src/client/utils/api-client.ts`)

**Purpose**: Detect environment and use correct API base URL

```typescript
export function getApiBaseUrl(): string {
  // Check if running on Vercel (production or preview)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Vercel deployment
    if (hostname.includes('vercel.app') || hostname.includes('yourdomain.com')) {
      return ''; // Use relative paths (same domain)
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Reddit Devvit (webview)
    if (hostname.includes('reddit.com') || hostname.includes('devvit')) {
      return ''; // Use relative paths
    }
  }
  
  // Default to relative paths
  return '';
}

export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Data Models

### Environment Configuration

```typescript
interface EnvironmentConfig {
  environment: 'vercel' | 'local' | 'reddit';
  isProduction: boolean;
  apiBaseUrl: string;
}
```

### Redis Adapter Interface

```typescript
interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  zAdd(key: string, member: { member: string; score: number }): Promise<void>;
  zRem(key: string, members: string[]): Promise<void>;
  zRange(key: string, start: number, stop: number, options?: any): Promise<Array<{ member: string; score: number }>>;
  zCard(key: string): Promise<number>;
  incrBy(key: string, increment: number): Promise<number>;
}
```

## Error Handling

### Redis Connection Errors

- **Vercel**: If Vercel KV is not configured, return 503 Service Unavailable with message "Database not configured"
- **Local**: In-memory storage never fails, but log warnings if operations seem unusual
- **Reddit**: Devvit Redis errors are logged and return 500 Internal Server Error

### Authentication Errors

- **Vercel**: Missing X-Username header returns 401 Unauthorized
- **Local**: Defaults to 'LocalDevUser' if header missing
- **Reddit**: If reddit.getCurrentUsername() fails, defaults to 'anonymous'

### Environment Detection Errors

- If environment cannot be detected, default to LOCAL and log warning
- If wrong entry point is used (e.g., vercel.ts on Reddit), log warning but continue

## Testing Strategy

### Unit Tests

1. **Adapter Tests**
   - Test each Redis adapter implementation independently
   - Mock Vercel KV, Devvit Redis, and verify in-memory storage
   - Test auth adapters with various request formats

2. **Route Tests**
   - Test routes with mocked adapters
   - Verify business logic is environment-agnostic
   - Test error handling for each endpoint

### Integration Tests

1. **Local Environment**
   - Run existing local.ts tests
   - Verify in-memory storage works correctly
   - Test multi-user scenarios with X-Username header

2. **Vercel Environment**
   - Deploy to Vercel preview environment
   - Test with real Vercel KV
   - Verify serverless function cold starts
   - Test API calls from deployed client

3. **Reddit Environment**
   - Run existing Devvit playtest
   - Verify no regressions in Reddit deployment
   - Test with real Reddit authentication

### End-to-End Tests

1. **Cross-Environment Compatibility**
   - Create player state in one environment
   - Verify it can be loaded in another (if using same Redis)
   - Test trading between users in same environment

2. **Performance Tests**
   - Measure Vercel cold start times
   - Test concurrent requests to serverless functions
   - Verify Redis connection pooling works correctly

## Deployment Process

### Vercel Setup

1. **Install Vercel KV**
   - Go to Vercel project dashboard
   - Navigate to Storage tab
   - Click "Create Database" → "KV"
   - Vercel automatically sets KV_REST_API_URL and KV_REST_API_TOKEN

2. **Configure Environment Variables**
   - `NODE_ENV=production`
   - `VERCEL=1` (automatically set by Vercel)
   - KV variables (automatically set by Vercel KV)

3. **Deploy**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   cd apps/goblin-gardens
   vercel --prod
   ```

### Build Configuration

**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/client/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/client"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/client/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

## Migration Path

### Phase 1: Create Adapters (No Breaking Changes)
- Create adapter files
- Extract routes to core/routes.ts
- Update existing index.ts and local.ts to use adapters
- Test that local and Reddit still work

### Phase 2: Add Vercel Support
- Create vercel.ts entry point
- Create api/[...path].ts catch-all
- Add vercel.json configuration
- Deploy to Vercel preview

### Phase 3: Update Client
- Add api-client.ts with environment detection
- Update all fetch calls to use apiCall helper
- Test on all three environments

### Phase 4: Production Deployment
- Set up Vercel KV in production
- Deploy to production Vercel
- Monitor logs and performance
- Update documentation

## Performance Considerations

### Vercel Serverless Optimization

1. **Cold Start Reduction**
   - Keep dependencies minimal
   - Use lazy loading for heavy imports
   - Cache Redis connections where possible

2. **Redis Connection Pooling**
   - Vercel KV SDK handles connection pooling automatically
   - Reuse connections across function invocations
   - Set appropriate timeouts

3. **Response Time**
   - Target < 500ms for most API calls
   - Use Redis pipelining for batch operations
   - Implement caching for frequently accessed data

### Scalability

- Vercel automatically scales serverless functions
- Vercel KV scales with usage
- No manual scaling configuration needed
- Monitor usage and upgrade KV plan if needed

## Security Considerations

### Authentication on Vercel

- Current design uses X-Username header (not secure for production)
- **Recommended enhancement**: Implement JWT-based authentication
- **Alternative**: Use Vercel's built-in authentication
- **For MVP**: Document that Vercel deployment is for demo purposes

### Environment Variables

- Never commit .env files
- Use Vercel dashboard to set production secrets
- Rotate KV tokens periodically
- Use different KV databases for preview vs production

### CORS Configuration

- Restrict CORS to known domains in production
- Allow localhost for development
- Verify origin headers on sensitive endpoints
