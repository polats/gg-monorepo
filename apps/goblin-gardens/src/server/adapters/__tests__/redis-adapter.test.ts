import { describe, it, expect, beforeEach } from 'vitest';
import { createRedisAdapter } from '../redis-adapter';
import { Environment } from '../environment';

describe('Redis Adapter', () => {
  describe('Local Environment (InMemoryAdapter)', () => {
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
      const value = await adapter.get('non-existent-key');
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

    it('should add members to sorted sets', async () => {
      await adapter.zAdd('leaderboard', { member: 'user1', score: 100 });
      await adapter.zAdd('leaderboard', { member: 'user2', score: 200 });
      await adapter.zAdd('leaderboard', { member: 'user3', score: 150 });

      const count = await adapter.zCard('leaderboard');
      expect(count).toBe(3);
    });

    it('should retrieve sorted set members in ascending order', async () => {
      await adapter.zAdd('scores', { member: 'player1', score: 100 });
      await adapter.zAdd('scores', { member: 'player2', score: 200 });
      await adapter.zAdd('scores', { member: 'player3', score: 150 });

      const members = await adapter.zRange('scores', 0, 2);
      
      expect(members).toHaveLength(3);
      expect(members[0]?.member).toBe('player1');
      expect(members[0]?.score).toBe(100);
      expect(members[1]?.member).toBe('player3');
      expect(members[1]?.score).toBe(150);
      expect(members[2]?.member).toBe('player2');
      expect(members[2]?.score).toBe(200);
    });

    it('should retrieve sorted set members in descending order', async () => {
      await adapter.zAdd('scores', { member: 'player1', score: 100 });
      await adapter.zAdd('scores', { member: 'player2', score: 200 });
      await adapter.zAdd('scores', { member: 'player3', score: 150 });

      const members = await adapter.zRange('scores', 0, 2, { reverse: true });
      
      expect(members).toHaveLength(3);
      expect(members[0]?.member).toBe('player2');
      expect(members[0]?.score).toBe(200);
      expect(members[1]?.member).toBe('player3');
      expect(members[1]?.score).toBe(150);
      expect(members[2]?.member).toBe('player1');
      expect(members[2]?.score).toBe(100);
    });

    it('should support pagination with start and stop', async () => {
      await adapter.zAdd('items', { member: 'item1', score: 10 });
      await adapter.zAdd('items', { member: 'item2', score: 20 });
      await adapter.zAdd('items', { member: 'item3', score: 30 });
      await adapter.zAdd('items', { member: 'item4', score: 40 });

      const page1 = await adapter.zRange('items', 0, 1);
      expect(page1).toHaveLength(2);
      expect(page1[0]?.member).toBe('item1');
      expect(page1[1]?.member).toBe('item2');

      const page2 = await adapter.zRange('items', 2, 3);
      expect(page2).toHaveLength(2);
      expect(page2[0]?.member).toBe('item3');
      expect(page2[1]?.member).toBe('item4');
    });

    it('should count sorted set members', async () => {
      expect(await adapter.zCard('empty-set')).toBe(0);

      await adapter.zAdd('test-set', { member: 'a', score: 1 });
      expect(await adapter.zCard('test-set')).toBe(1);

      await adapter.zAdd('test-set', { member: 'b', score: 2 });
      await adapter.zAdd('test-set', { member: 'c', score: 3 });
      expect(await adapter.zCard('test-set')).toBe(3);
    });

    it('should remove members from sorted sets', async () => {
      await adapter.zAdd('users', { member: 'user1', score: 100 });
      await adapter.zAdd('users', { member: 'user2', score: 200 });
      await adapter.zAdd('users', { member: 'user3', score: 300 });

      await adapter.zRem('users', ['user2']);
      
      const count = await adapter.zCard('users');
      expect(count).toBe(2);

      const members = await adapter.zRange('users', 0, 10);
      expect(members).toHaveLength(2);
      expect(members.find(m => m.member === 'user2')).toBeUndefined();
    });

    it('should return empty array for non-existent sorted sets', async () => {
      const members = await adapter.zRange('non-existent-set', 0, 10);
      expect(members).toEqual([]);
    });
  });
});
