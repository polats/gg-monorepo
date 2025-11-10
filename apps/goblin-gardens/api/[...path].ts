import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Simple auth helper for Vercel
function getUsername(req: VercelRequest): string {
  const username = req.headers['x-username'] as string;
  return username || 'anonymous';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Username');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const path = req.url || '';
    
    // Health check
    if (path.includes('/health')) {
      res.status(200).json({
        status: 'ok',
        environment: 'vercel',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Init endpoint
    if (path.includes('/init')) {
      const username = getUsername(req);
      const count = await kv.get<string>('count');
      
      res.status(200).json({
        type: 'init',
        postId: 'vercel-deployment',
        count: count ? parseInt(count) : 0,
        username,
      });
      return;
    }

    // Player state - save
    if (path.includes('/player-state/save') && req.method === 'POST') {
      const { playerState } = req.body as any;
      const username = getUsername(req);
      
      if (!playerState) {
        res.status(400).json({ status: 'error', message: 'playerState is required' });
        return;
      }

      const playerStateKey = `playerState:${username}`;
      await kv.set(playerStateKey, JSON.stringify(playerState));

      res.status(200).json({
        type: 'savePlayerState',
        success: true,
        message: 'Player state saved successfully',
      });
      return;
    }

    // Player state - load
    if (path.includes('/player-state/load') && req.method === 'GET') {
      const username = getUsername(req);
      const playerStateKey = `playerState:${username}`;
      const playerStateJson = await kv.get<string>(playerStateKey);

      if (!playerStateJson) {
        res.status(200).json({
          type: 'loadPlayerState',
          playerState: null,
        });
        return;
      }

      const playerState = JSON.parse(playerStateJson);
      res.status(200).json({
        type: 'loadPlayerState',
        playerState,
      });
      return;
    }

    // Default 404
    res.status(404).json({
      status: 'error',
      message: 'Not found',
      path,
    });
  } catch (error) {
    console.error('[API Error]:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
