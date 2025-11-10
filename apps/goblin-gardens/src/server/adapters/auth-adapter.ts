import { Request } from 'express';
import { reddit } from '@devvit/web/server';
import { Environment } from './environment';

export interface AuthAdapter {
  getUsername(req: Request): Promise<string>;
}

class VercelAuthAdapter implements AuthAdapter {
  async getUsername(req: Request): Promise<string> {
    // For Vercel, we use session-based usernames from the client
    // The client generates unique usernames per browser tab using sessionStorage
    const username = req.headers['x-username'] as string;

    if (!username) {
      // Fallback to anonymous if no username provided
      // This shouldn't happen in normal operation since the client always sets it
      console.warn('[Auth] No username provided in request, using anonymous');
      return 'anonymous';
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
