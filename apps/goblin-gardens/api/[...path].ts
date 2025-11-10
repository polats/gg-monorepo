import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }

    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

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
      const redis = await getRedisClient();
      const countValue = await redis.get('count');
      const count = countValue ? parseInt(countValue.toString()) : 0;
      
      res.status(200).json({
        type: 'init',
        postId: 'vercel-deployment',
        count,
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

      const redis = await getRedisClient();
      const playerStateKey = `playerState:${username}`;
      await redis.set(playerStateKey, JSON.stringify(playerState));

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
      const redis = await getRedisClient();
      const playerStateKey = `playerState:${username}`;
      const playerStateValue = await redis.get(playerStateKey);

      if (!playerStateValue) {
        res.status(200).json({
          type: 'loadPlayerState',
          playerState: null,
        });
        return;
      }

      const playerStateJson = playerStateValue.toString();
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
