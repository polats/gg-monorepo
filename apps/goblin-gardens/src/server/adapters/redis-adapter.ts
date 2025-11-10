import { createClient, RedisClientType } from 'redis';
import { redis as devvitRedis } from '@devvit/web/server';
import { Environment } from './environment';

export interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  zAdd(key: string, member: { member: string; score: number }): Promise<void>;
  zRem(key: string, members: string[]): Promise<void>;
  zRange(
    key: string,
    start: number,
    stop: number,
    options?: { by?: 'rank'; reverse?: boolean }
  ): Promise<Array<{ member: string; score: number }>>;
  zCard(key: string): Promise<number>;
  incrBy(key: string, increment: number): Promise<number>;
}

class VercelRedisAdapter implements RedisAdapter {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required for Vercel deployment');
    }

    this.client = createClient({
      url: redisUrl,
    });

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

  async set(key: string, value: string): Promise<void> {
    await this.ensureConnected();
    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }

  async zAdd(key: string, member: { member: string; score: number }): Promise<void> {
    await this.ensureConnected();
    await this.client.zAdd(key, { score: member.score, value: member.member });
  }

  async zRem(key: string, members: string[]): Promise<void> {
    await this.ensureConnected();
    await this.client.zRem(key, members);
  }

  async zRange(
    key: string,
    start: number,
    stop: number,
    options?: { by?: 'rank'; reverse?: boolean }
  ): Promise<Array<{ member: string; score: number }>> {
    await this.ensureConnected();
    
    const results = options?.reverse
      ? await this.client.zRangeWithScores(key, start, stop, { REV: true })
      : await this.client.zRangeWithScores(key, start, stop);

    return results.map((item) => ({
      member: item.value,
      score: item.score,
    }));
  }

  async zCard(key: string): Promise<number> {
    await this.ensureConnected();
    return await this.client.zCard(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    await this.ensureConnected();
    return await this.client.incrBy(key, increment);
  }
}

class DevvitRedisAdapter implements RedisAdapter {
  async get(key: string): Promise<string | null> {
    const result = await devvitRedis.get(key);
    return result ?? null;
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

  async zRange(
    key: string,
    start: number,
    stop: number,
    options?: { by?: 'rank'; reverse?: boolean }
  ): Promise<Array<{ member: string; score: number }>> {
    // Convert options to match Devvit's expected format
    if (options) {
      const devvitOptions: { by: 'rank'; reverse?: boolean } = {
        by: 'rank',
      };
      if (options.reverse !== undefined) {
        devvitOptions.reverse = options.reverse;
      }
      return await devvitRedis.zRange(key, start, stop, devvitOptions);
    }
    return await devvitRedis.zRange(key, start, stop);
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
      members.forEach((m) => set.delete(m));
    }
  }

  async zRange(
    key: string,
    start: number,
    stop: number,
    options?: { by?: 'rank'; reverse?: boolean }
  ): Promise<Array<{ member: string; score: number }>> {
    const set = this.sortedSets.get(key);
    if (!set) return [];

    const entries = Array.from(set.entries())
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => (options?.reverse ? b.score - a.score : a.score - b.score));

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
      return new VercelRedisAdapter();
    case Environment.REDDIT:
      return new DevvitRedisAdapter();
    case Environment.LOCAL:
      return new InMemoryAdapter();
  }
}
