import { vi } from 'vitest';
import type { Request, Response } from 'express';

/**
 * Creates a mock Express request object with default values that can be overridden.
 * 
 * @param overrides - Partial request properties to override defaults
 * @returns A mock Request object suitable for testing
 * 
 * @example
 * ```typescript
 * // Create basic request
 * const req = createMockRequest();
 * 
 * // Create request with headers
 * const reqWithAuth = createMockRequest({
 *   headers: { 'x-username': 'Alice' }
 * });
 * 
 * // Create POST request with body
 * const postReq = createMockRequest({
 *   method: 'POST',
 *   body: { playerState: {...} }
 * });
 * 
 * // Create request with query params
 * const queryReq = createMockRequest({
 *   query: { cursor: '10', limit: '20' }
 * });
 * ```
 */
export function createMockRequest(overrides?: Partial<Request>): Partial<Request> {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    method: 'GET',
    path: '/',
    url: '/',
    ...overrides,
  };
}

/**
 * Creates a mock Express response object with chainable methods.
 * All methods return the response object for chaining.
 * Methods are wrapped with vi.fn() for call tracking.
 * 
 * @returns A mock Response object suitable for testing
 * 
 * @example
 * ```typescript
 * const res = createMockResponse();
 * 
 * // Use in route handler
 * res.status(200).json({ success: true });
 * 
 * // Assert on calls
 * expect(res.status).toHaveBeenCalledWith(200);
 * expect(res.json).toHaveBeenCalledWith({ success: true });
 * 
 * // Check response data
 * const jsonCall = vi.mocked(res.json).mock.calls[0];
 * expect(jsonCall[0]).toEqual({ success: true });
 * ```
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Creates a mock Express request with common authentication headers.
 * 
 * @param username - Username to include in X-Username header
 * @param additionalOverrides - Additional request properties to override
 * @returns A mock Request with authentication headers
 * 
 * @example
 * ```typescript
 * const req = createAuthenticatedRequest('Alice');
 * // req.headers['x-username'] === 'Alice'
 * 
 * const postReq = createAuthenticatedRequest('Bob', {
 *   method: 'POST',
 *   body: { data: 'value' }
 * });
 * ```
 */
export function createAuthenticatedRequest(
  username: string,
  additionalOverrides?: Partial<Request>
): Partial<Request> {
  return createMockRequest({
    headers: {
      'x-username': username,
      'content-type': 'application/json',
    },
    ...additionalOverrides,
  });
}

/**
 * Creates a mock Express request for a POST endpoint with JSON body.
 * 
 * @param body - Request body object
 * @param additionalOverrides - Additional request properties to override
 * @returns A mock POST Request with JSON body
 * 
 * @example
 * ```typescript
 * const req = createPostRequest({ playerState: {...} });
 * // req.method === 'POST'
 * // req.body === { playerState: {...} }
 * 
 * const authReq = createPostRequest(
 *   { data: 'value' },
 *   { headers: { 'x-username': 'Alice' } }
 * );
 * ```
 */
export function createPostRequest(
  body: any,
  additionalOverrides?: Partial<Request>
): Partial<Request> {
  return createMockRequest({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
    ...additionalOverrides,
  });
}

/**
 * Creates a mock Express request for a GET endpoint with query parameters.
 * 
 * @param query - Query parameters object
 * @param additionalOverrides - Additional request properties to override
 * @returns A mock GET Request with query params
 * 
 * @example
 * ```typescript
 * const req = createGetRequest({ cursor: '10', limit: '20' });
 * // req.method === 'GET'
 * // req.query === { cursor: '10', limit: '20' }
 * ```
 */
export function createGetRequest(
  query: Record<string, string>,
  additionalOverrides?: Partial<Request>
): Partial<Request> {
  return createMockRequest({
    method: 'GET',
    query,
    ...additionalOverrides,
  });
}

/**
 * Extracts the JSON data that was sent via res.json() in tests.
 * 
 * @param res - The mock response object
 * @returns The JSON data sent, or undefined if not called
 * 
 * @example
 * ```typescript
 * const res = createMockResponse();
 * res.json({ success: true, data: 'value' });
 * 
 * const jsonData = getResponseJson(res);
 * expect(jsonData).toEqual({ success: true, data: 'value' });
 * ```
 */
export function getResponseJson(res: Partial<Response>): any {
  const jsonMock = vi.mocked(res.json);
  if (jsonMock && jsonMock.mock.calls.length > 0) {
    return jsonMock.mock.calls[0][0];
  }
  return undefined;
}

/**
 * Extracts the status code that was set via res.status() in tests.
 * 
 * @param res - The mock response object
 * @returns The status code, or undefined if not called
 * 
 * @example
 * ```typescript
 * const res = createMockResponse();
 * res.status(404).json({ error: 'Not found' });
 * 
 * const statusCode = getResponseStatus(res);
 * expect(statusCode).toBe(404);
 * ```
 */
export function getResponseStatus(res: Partial<Response>): number | undefined {
  const statusMock = vi.mocked(res.status);
  if (statusMock && statusMock.mock.calls.length > 0) {
    return statusMock.mock.calls[0][0];
  }
  return undefined;
}

/**
 * Resets all mock function call histories on a response object.
 * Useful for cleaning up between tests.
 * 
 * @param res - The mock response object to reset
 * 
 * @example
 * ```typescript
 * const res = createMockResponse();
 * 
 * // Use in test
 * res.status(200).json({ data: 'value' });
 * 
 * // Reset for next test
 * resetMockResponse(res);
 * expect(res.status).not.toHaveBeenCalled();
 * expect(res.json).not.toHaveBeenCalled();
 * ```
 */
export function resetMockResponse(res: Partial<Response>): void {
  if (res.status) vi.mocked(res.status).mockClear();
  if (res.json) vi.mocked(res.json).mockClear();
  if (res.send) vi.mocked(res.send).mockClear();
  if (res.sendStatus) vi.mocked(res.sendStatus).mockClear();
  if (res.set) vi.mocked(res.set).mockClear();
  if (res.setHeader) vi.mocked(res.setHeader).mockClear();
  if (res.end) vi.mocked(res.end).mockClear();
}
