import { storage } from './storage';
import { NextRequest } from 'next/server';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
  id: string;
  createdAt: number;
  lastAccessedAt: number;
  data: Record<string, unknown>;
}

/**
 * Get session from request cookies
 */
export async function getSession(request: NextRequest): Promise<SessionData | null> {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return null;
    }

    const sessionJson = await storage.get(`session:${sessionId}`);

    if (!sessionJson) {
      return null;
    }

    return JSON.parse(sessionJson);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Validate and refresh session
 * Returns session data if valid, null if invalid/expired
 */
export async function validateAndRefreshSession(
  request: NextRequest
): Promise<SessionData | null> {
  try {
    const session = await getSession(request);

    if (!session) {
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = Date.now();

    // Refresh session TTL
    await storage.set(
      `session:${session.id}`,
      JSON.stringify(session),
      SESSION_TTL
    );

    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Update session data
 */
export async function updateSessionData(
  sessionId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const sessionJson = await storage.get(`session:${sessionId}`);

    if (!sessionJson) {
      return false;
    }

    const session: SessionData = JSON.parse(sessionJson);
    session.data = { ...session.data, ...data };
    session.lastAccessedAt = Date.now();

    await storage.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      SESSION_TTL
    );

    return true;
  } catch (error) {
    console.error('Error updating session data:', error);
    return false;
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await storage.del(`session:${sessionId}`);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Cleanup expired sessions (for in-memory storage)
 * Redis handles this automatically with TTL
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const sessionKeys = await storage.keys('session:*');
    const now = Date.now();
    const maxAge = SESSION_TTL * 1000; // Convert to milliseconds

    for (const key of sessionKeys) {
      const sessionJson = await storage.get(key);
      if (!sessionJson) continue;

      const session: SessionData = JSON.parse(sessionJson);
      const age = now - session.lastAccessedAt;

      if (age > maxAge) {
        await storage.del(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}
