import { vi } from 'vitest';
import type { Request } from 'express';
import type { AuthAdapter } from '../../src/server/adapters/auth-adapter';

/**
 * Creates a mock auth adapter that returns a configured username.
 * The getUsername method is wrapped with vi.fn() for call tracking.
 * 
 * @param username - The username to return (defaults to 'TestUser')
 * @returns A mock AuthAdapter
 * 
 * @example
 * ```typescript
 * // Create mock with default username
 * const mockAuth = createMockAuthAdapter();
 * const username = await mockAuth.getUsername(req); // 'TestUser'
 * 
 * // Create mock with custom username
 * const aliceAuth = createMockAuthAdapter('Alice');
 * const username = await aliceAuth.getUsername(req); // 'Alice'
 * 
 * // Assert on calls
 * expect(mockAuth.getUsername).toHaveBeenCalledWith(req);
 * ```
 */
export function createMockAuthAdapter(username: string = 'TestUser'): AuthAdapter {
  return {
    getUsername: vi.fn(async (_req: Request): Promise<string> => {
      return username;
    }),
  };
}

/**
 * Creates a mock auth adapter that extracts username from request headers.
 * Falls back to a default username if the header is not present.
 * 
 * @param defaultUsername - Username to return when header is missing (defaults to 'TestUser')
 * @returns A mock AuthAdapter that reads from X-Username header
 * 
 * @example
 * ```typescript
 * const mockAuth = createMockAuthAdapterWithHeader();
 * 
 * // Request with header
 * const req1 = { headers: { 'x-username': 'Alice' } };
 * const username1 = await mockAuth.getUsername(req1); // 'Alice'
 * 
 * // Request without header
 * const req2 = { headers: {} };
 * const username2 = await mockAuth.getUsername(req2); // 'TestUser'
 * ```
 */
export function createMockAuthAdapterWithHeader(defaultUsername: string = 'TestUser'): AuthAdapter {
  return {
    getUsername: vi.fn(async (req: Request): Promise<string> => {
      const headerUsername = req.headers['x-username'] as string | undefined;
      return headerUsername ?? defaultUsername;
    }),
  };
}

/**
 * Creates a mock auth adapter that can be configured to return different usernames
 * based on custom logic or test scenarios.
 * 
 * @param getUsernameFn - Custom function to determine username
 * @returns A mock AuthAdapter with custom logic
 * 
 * @example
 * ```typescript
 * // Return username based on request path
 * const mockAuth = createMockAuthAdapterWithCustomLogic((req) => {
 *   if (req.path === '/api/admin') return 'AdminUser';
 *   return 'RegularUser';
 * });
 * 
 * // Return username based on header or query param
 * const mockAuth2 = createMockAuthAdapterWithCustomLogic((req) => {
 *   return req.headers['x-username'] || req.query.user || 'Anonymous';
 * });
 * ```
 */
export function createMockAuthAdapterWithCustomLogic(
  getUsernameFn: (req: Request) => string | Promise<string>
): AuthAdapter {
  return {
    getUsername: vi.fn(async (req: Request): Promise<string> => {
      return await getUsernameFn(req);
    }),
  };
}

/**
 * Resets the mock function call history on an auth adapter.
 * Useful for cleaning up between tests.
 * 
 * @param mockAuth - The mock auth adapter to reset
 * 
 * @example
 * ```typescript
 * const mockAuth = createMockAuthAdapter();
 * 
 * // Use in test
 * await mockAuth.getUsername(req);
 * 
 * // Reset for next test
 * resetMockAuth(mockAuth);
 * expect(mockAuth.getUsername).not.toHaveBeenCalled();
 * ```
 */
export function resetMockAuth(mockAuth: AuthAdapter): void {
  vi.mocked(mockAuth.getUsername).mockClear();
}
