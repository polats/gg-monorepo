import { vi } from 'vitest';
import type { RedisAdapter } from '../../src/server/adapters/redis-adapter';

/**
 * Creates a mock Redis adapter with in-memory storage for testing.
 * All methods are wrapped with vi.fn() for call tracking and assertions.
 * 
 * @returns A mock RedisAdapter with full functionality
 * 
 * @example
 * ```typescript
 * const mockRedis = createMockRedisAdapter();
 * 
 * // Use in tests
 * await mockRedis.set('key', 'value');
 * const value = await mockRedis.get('key');
 * 
 * // Assert on calls
 * expect(mockRedis.set).toHaveBeenCalledWith('key', 'value');
 * expect(mockRedis.get).toHaveBeenCalledWith('key');
 * ```
 */
export function createMockRedisAdapter(): RedisAdapter {
  const storage = new Map<string, string>();
  const sortedSets = new Map<string, Map<string, number>>();

  return {
    get: vi.fn(async (key: string): Promise<string | null> => {
      return storage.get(key) ?? null;
    }),

    set: vi.fn(async (key: string, value: string): Promise<void> => {
      storage.set(key, value);
    }),

    del: vi.fn(async (key: string): Promise<void> => {
      storage.delete(key);
      sortedSets.delete(key);
    }),

    incrBy: vi.fn(async (key: string, increment: number): Promise<number> => {
      const current = parseInt(storage.get(key) ?? '0', 10);
      const newValue = current + increment;
      storage.set(key, newValue.toString());
      return newValue;
    }),

    zAdd: vi.fn(async (key: string, member: { member: string; score: number }): Promise<void> => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      set.set(member.member, member.score);
    }),

    zRem: vi.fn(async (key: string, members: string[]): Promise<void> => {
      const set = sortedSets.get(key);
      if (set) {
        members.forEach((member) => set.delete(member));
      }
    }),

    zRange: vi.fn(
      async (
        key: string,
        start: number,
        stop: number,
        options?: { by?: 'rank'; reverse?: boolean }
      ): Promise<Array<{ member: string; score: number }>> => {
        const set = sortedSets.get(key);
        if (!set) return [];

        const entries = Array.from(set.entries())
          .map(([member, score]) => ({ member, score }))
          .sort((a, b) => (options?.reverse ? b.score - a.score : a.score - b.score));

        // Redis zRange is inclusive on both ends
        return entries.slice(start, stop + 1);
      }
    ),

    zCard: vi.fn(async (key: string): Promise<number> => {
      return sortedSets.get(key)?.size ?? 0;
    }),
  };
}

/**
 * Creates a mock Redis adapter with pre-populated data for testing.
 * 
 * @param initialData - Initial key-value pairs to populate
 * @param initialSortedSets - Initial sorted sets to populate
 * @returns A mock RedisAdapter with pre-populated data
 * 
 * @example
 * ```typescript
 * const mockRedis = createMockRedisAdapterWithData(
 *   { 'counter': '42', 'playerState:Alice': '{"coins":{...}}' },
 *   { 'leaderboard': [{ member: 'Alice', score: 100 }] }
 * );
 * 
 * const count = await mockRedis.get('counter'); // '42'
 * const topPlayer = await mockRedis.zRange('leaderboard', 0, 0, { reverse: true });
 * ```
 */
export function createMockRedisAdapterWithData(
  initialData?: Record<string, string>,
  initialSortedSets?: Record<string, Array<{ member: string; score: number }>>
): RedisAdapter {
  const storage = new Map<string, string>(Object.entries(initialData ?? {}));
  const sortedSets = new Map<string, Map<string, number>>();

  // Populate sorted sets
  if (initialSortedSets) {
    Object.entries(initialSortedSets).forEach(([key, members]) => {
      const set = new Map<string, number>();
      members.forEach(({ member, score }) => set.set(member, score));
      sortedSets.set(key, set);
    });
  }

  return {
    get: vi.fn(async (key: string): Promise<string | null> => {
      return storage.get(key) ?? null;
    }),

    set: vi.fn(async (key: string, value: string): Promise<void> => {
      storage.set(key, value);
    }),

    del: vi.fn(async (key: string): Promise<void> => {
      storage.delete(key);
      sortedSets.delete(key);
    }),

    incrBy: vi.fn(async (key: string, increment: number): Promise<number> => {
      const current = parseInt(storage.get(key) ?? '0', 10);
      const newValue = current + increment;
      storage.set(key, newValue.toString());
      return newValue;
    }),

    zAdd: vi.fn(async (key: string, member: { member: string; score: number }): Promise<void> => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      set.set(member.member, member.score);
    }),

    zRem: vi.fn(async (key: string, members: string[]): Promise<void> => {
      const set = sortedSets.get(key);
      if (set) {
        members.forEach((member) => set.delete(member));
      }
    }),

    zRange: vi.fn(
      async (
        key: string,
        start: number,
        stop: number,
        options?: { by?: 'rank'; reverse?: boolean }
      ): Promise<Array<{ member: string; score: number }>> => {
        const set = sortedSets.get(key);
        if (!set) return [];

        const entries = Array.from(set.entries())
          .map(([member, score]) => ({ member, score }))
          .sort((a, b) => (options?.reverse ? b.score - a.score : a.score - b.score));

        return entries.slice(start, stop + 1);
      }
    ),

    zCard: vi.fn(async (key: string): Promise<number> => {
      return sortedSets.get(key)?.size ?? 0;
    }),
  };
}

/**
 * Resets all mock function call histories on a Redis adapter.
 * Useful for cleaning up between tests.
 * 
 * @param mockRedis - The mock Redis adapter to reset
 * 
 * @example
 * ```typescript
 * const mockRedis = createMockRedisAdapter();
 * 
 * // Use in tests
 * await mockRedis.get('key');
 * 
 * // Reset for next test
 * resetMockRedis(mockRedis);
 * expect(mockRedis.get).not.toHaveBeenCalled();
 * ```
 */
export function resetMockRedis(mockRedis: RedisAdapter): void {
  vi.mocked(mockRedis.get).mockClear();
  vi.mocked(mockRedis.set).mockClear();
  vi.mocked(mockRedis.del).mockClear();
  vi.mocked(mockRedis.incrBy).mockClear();
  vi.mocked(mockRedis.zAdd).mockClear();
  vi.mocked(mockRedis.zRem).mockClear();
  vi.mocked(mockRedis.zRange).mockClear();
  vi.mocked(mockRedis.zCard).mockClear();
}
