# Redis Migration: @vercel/kv to redis

## Overview

Migrated from `@vercel/kv` to the standard `redis` package to use `REDIS_URL` environment variable instead of Vercel-specific KV environment variables.

## Changes Made

### 1. Package Dependencies

**Removed:**
- `@vercel/kv@^3.0.0`

**Added:**
- `redis@^4.7.0`

### 2. Redis Adapter (`src/server/adapters/redis-adapter.ts`)

**Before:**
```typescript
import { kv } from '@vercel/kv';

class VercelKVAdapter implements RedisAdapter {
  async get(key: string): Promise<string | null> {
    const result = await kv.get<string>(key);
    return result ?? null;
  }
  // ... other methods using kv
}
```

**After:**
```typescript
import { createClient, RedisClientType } from 'redis';

class VercelRedisAdapter implements RedisAdapter {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required for Vercel deployment');
    }

    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnected();
    return await this.client.get(key);
  }
  // ... other methods using this.client
}
```

**Key Changes:**
- Connection management with singleton pattern
- Lazy connection on first use
- Error handling for missing `REDIS_URL`
- Updated method calls to match `redis` package API

### 3. API Handler (`api/[...path].ts`)

**Before:**
```typescript
import { kv } from '@vercel/kv';

// Direct usage
const count = await kv.get<string>('count');
await kv.set(playerStateKey, JSON.stringify(playerState));
```

**After:**
```typescript
import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }

    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

// Usage
const redis = await getRedisClient();
const countValue = await redis.get('count');
const count = countValue ? parseInt(countValue.toString()) : 0;
await redis.set(playerStateKey, JSON.stringify(playerState));
```

**Key Changes:**
- Singleton pattern for Redis client
- Connection pooling across requests
- Type handling for Buffer/string returns (`.toString()`)

## Environment Variables

### Required

Set `REDIS_URL` in Vercel environment variables:

```bash
REDIS_URL=redis://default:password@host:port
```

Or for Redis with TLS:

```bash
REDIS_URL=rediss://default:password@host:port
```

### No Longer Needed

- `KV_REST_API_URL` (Vercel KV specific)
- `KV_REST_API_TOKEN` (Vercel KV specific)

## API Compatibility

The `redis` package methods map closely to `@vercel/kv`:

| @vercel/kv | redis | Notes |
|------------|-------|-------|
| `kv.get(key)` | `client.get(key)` | Returns `string \| Buffer \| null` |
| `kv.set(key, value)` | `client.set(key, value)` | Same |
| `kv.del(key)` | `client.del(key)` | Same |
| `kv.zadd(key, { score, member })` | `client.zAdd(key, { score, value })` | Note: `value` instead of `member` |
| `kv.zrange(key, start, stop, opts)` | `client.zRangeWithScores(key, start, stop, opts)` | Different return format |
| `kv.zrem(key, ...members)` | `client.zRem(key, members)` | Array instead of spread |
| `kv.zcard(key)` | `client.zCard(key)` | Same |
| `kv.incrby(key, increment)` | `client.incrBy(key, increment)` | Same |

## Testing

### Local Development

No changes needed - local mode still uses in-memory adapter.

### Vercel Deployment

1. Set `REDIS_URL` environment variable in Vercel dashboard
2. Deploy: `npm run deploy:vercel`
3. Test endpoints:
   - `/api/health` - Health check
   - `/api/init` - Initialize session
   - `/api/player-state/save` - Save player state
   - `/api/player-state/load` - Load player state

## Benefits

1. **Standard Redis Protocol**: Works with any Redis provider (Upstash, Redis Cloud, AWS ElastiCache, etc.)
2. **Connection Pooling**: Single client reused across requests
3. **Better Type Safety**: Explicit handling of Buffer/string returns
4. **Flexibility**: Not locked into Vercel KV service
5. **Cost**: Can use cheaper Redis providers

## Migration Checklist

- [x] Install `redis` package
- [x] Remove `@vercel/kv` package
- [x] Update `VercelKVAdapter` to `VercelRedisAdapter`
- [x] Update API handler to use `redis` client
- [x] Handle Buffer/string type conversions
- [x] Test connection with `REDIS_URL`
- [ ] Set `REDIS_URL` in Vercel environment
- [ ] Deploy and verify functionality
