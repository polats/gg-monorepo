import { Request } from 'express';
import { reddit } from '@devvit/web/server';
import { Environment } from './environment';

export interface AuthAdapter {
  getUsername(req: Request): Promise<string>;
}

class VercelAuthAdapter implements AuthAdapter {
  async getUsername(req: Request): Promise<string> {
    // For Vercel, we'll use session-based auth or header-based for now
    // This can be enhanced with proper JWT or session management
    const username = req.headers['x-username'] as string;

    if (!username) {
      throw new Error('Authentication required');
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
