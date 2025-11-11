import Redis from 'ioredis';

/**
 * Storage interface that abstracts storage operations
 * Supports both in-memory (Map-based) and Redis backends
 */
interface StorageClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * In-memory storage implementation using Map
 * Includes TTL expiration simulation using setTimeout
 */
class InMemoryStorage implements StorageClient {
  private store: Map<string, string> = new Map();
  private expirations: Map<string, NodeJS.Timeout> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, value);
    
    if (ttlSeconds) {
      await this.expire(key, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.clearExpiration(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    // Clear existing expiration timer if any
    this.clearExpiration(key);

    // Set new expiration timer
    const timeout = setTimeout(() => {
      this.store.delete(key);
      this.expirations.delete(key);
    }, ttlSeconds * 1000);

    this.expirations.set(key, timeout);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for in-memory storage
    // Converts Redis-style patterns to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  private clearExpiration(key: string): void {
    const existingTimeout = this.expirations.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.expirations.delete(key);
    }
  }
}

/**
 * Redis storage implementation
 * Wraps ioredis client with our storage interface
 */
class RedisStorage implements StorageClient {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle connection errors
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Create and export storage client instance
 * Auto-detects whether to use in-memory or Redis based on REDIS_URL environment variable
 */
function createStorageClient(): StorageClient {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log('Using Redis storage backend');
    return new RedisStorage(redisUrl);
  } else {
    console.log('Using in-memory storage backend (no REDIS_URL configured)');
    return new InMemoryStorage();
  }
}

// Export singleton storage client instance
export const storage = createStorageClient();

// Export type for use in other modules
export type { StorageClient };
