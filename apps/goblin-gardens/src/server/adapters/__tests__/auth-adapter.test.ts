import { describe, it, expect } from 'vitest';
import { createAuthAdapter } from '../auth-adapter';
import { Environment } from '../environment';
import { createMockRequest } from '../../../../__tests__/mocks/express';

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

    it('should handle different username formats', async () => {
      const req = createMockRequest({
        headers: { 'x-username': 'Player_ABC123' },
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('Player_ABC123');
    });
  });

  describe('Vercel Environment', () => {
    const adapter = createAuthAdapter(Environment.VERCEL);

    it('should extract username from X-Username header', async () => {
      const req = createMockRequest({
        headers: { 'x-username': 'Player_ABC123' },
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('Player_ABC123');
    });

    it('should return anonymous when header is missing', async () => {
      const req = createMockRequest({
        headers: {},
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('anonymous');
    });

    it('should handle session-based usernames', async () => {
      const req = createMockRequest({
        headers: { 'x-username': 'Player_XYZ789' },
      });

      const username = await adapter.getUsername(req as any);
      expect(username).toBe('Player_XYZ789');
    });
  });
});
