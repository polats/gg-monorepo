import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';
import type {
  InitResponse,
  SavePlayerStateResponse,
  LoadPlayerStateResponse,
  GetActiveOffersResponse,
  UpdateOfferResponse,
  ExecuteTradeResponse,
  PlayerState,
  Gem,
  ActiveOffer,
} from '../src/shared/types/api';

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

// Auth helper for Vercel
function getUsername(req: VercelRequest): string {
  const username = req.headers['x-username'] as string;
  return username || 'anonymous';
}

// Helper function to calculate gem value (must match client calculation)
function calculateGemValue(gem: Gem): number {
  const GEM_TYPE_VALUES: Record<string, number> = {
    emerald: 10,
    sapphire: 25,
    amethyst: 50,
    ruby: 100,
    diamond: 200,
  };

  const SHAPE_MULTIPLIERS: Record<string, number> = {
    tetrahedron: 1.0,
    octahedron: 1.5,
    dodecahedron: 2.0,
  };

  const RARITY_MULTIPLIERS: Record<string, number> = {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.0,
    epic: 3.0,
    legendary: 5.0,
  };

  const baseValue = GEM_TYPE_VALUES[gem.type] || 10;
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape] || 1.0;
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity] || 1.0;
  const levelBonus = 1 + gem.level * 0.1;

  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / 100;

  const totalValue = baseValue * shapeMultiplier * rarityMultiplier * levelBonus * sizeMultiplier;

  return Math.floor(totalValue);
}

// Helper function to format timestamp
function formatLastActive(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}min ago`;
  return 'just now';
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
    const username = getUsername(req);
    const redis = await getRedisClient();

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
      const countValue = await redis.get('count');
      const count = countValue ? parseInt(countValue.toString()) : 0;

      const response: InitResponse = {
        type: 'init',
        postId: 'vercel-deployment',
        count,
        username,
      };

      res.status(200).json(response);
      return;
    }

    // Player state - save
    if (path.includes('/player-state/save') && req.method === 'POST') {
      const { playerState } = req.body as any;

      if (!playerState) {
        res.status(400).json({ status: 'error', message: 'playerState is required' });
        return;
      }

      const playerStateKey = `playerState:${username}`;
      await redis.set(playerStateKey, JSON.stringify(playerState));

      console.log(`[SAVE] Player state saved for ${username}`);

      const response: SavePlayerStateResponse = {
        type: 'savePlayerState',
        success: true,
        message: 'Player state saved successfully',
      };

      res.status(200).json(response);
      return;
    }

    // Player state - load
    if (path.includes('/player-state/load') && req.method === 'GET') {
      const playerStateKey = `playerState:${username}`;
      const playerStateValue = await redis.get(playerStateKey);

      if (!playerStateValue) {
        const response: LoadPlayerStateResponse = {
          type: 'loadPlayerState',
          playerState: null,
        };
        res.status(200).json(response);
        return;
      }

      const playerStateJson = playerStateValue.toString();
      const playerState = JSON.parse(playerStateJson) as PlayerState;

      const response: LoadPlayerStateResponse = {
        type: 'loadPlayerState',
        playerState,
      };

      res.status(200).json(response);
      return;
    }

    // Get active offers
    if (path.includes('/api/offers') && req.method === 'GET' && !path.includes('/update') && !path.includes('/remove')) {
      const cursor = parseInt((req.query?.cursor as string) || '0');
      const limit = parseInt((req.query?.limit as string) || '10');

      const activeOffersIndex = 'activeOffersIndex';

      // Get total count
      const totalCount = await redis.zCard(activeOffersIndex);

      // Get usernames from sorted set (newest first)
      const members = await redis.zRange(activeOffersIndex, cursor, cursor + limit - 1, {
        REV: true,
      });

      // Fetch offers for these usernames
      const offerPromises = members.map((member) => redis.get(`activeOffer:${member}`));
      const offerJsons = await Promise.all(offerPromises);

      const activeOffers: ActiveOffer[] = offerJsons
        .filter((json) => json !== null && json !== undefined)
        .map((json) => JSON.parse(json!) as ActiveOffer);

      // Transform to response format
      const offers = activeOffers.map((offer) => ({
        username: offer.username,
        lastActive: formatLastActive(offer.timestamp),
        level: offer.level,
        itemCount: offer.itemCount,
        offer: {
          gems: offer.gems.map((gem) => ({
            name: `${gem.rarity} ${gem.type}`,
            rarity: gem.rarity,
            shape: gem.shape,
            color: gem.color,
          })),
          totalValue: offer.totalValue,
        },
      }));

      const hasMore = cursor + limit < totalCount;
      const nextCursor = hasMore ? cursor + limit : null;

      const response: GetActiveOffersResponse = {
        type: 'getActiveOffers',
        offers,
        hasMore,
        nextCursor,
      };

      res.status(200).json(response);
      return;
    }

    // Update offer
    if (path.includes('/offers/update') && req.method === 'POST') {
      const { gems } = req.body as any;

      if (!gems || !Array.isArray(gems) || gems.length === 0) {
        res.status(400).json({ status: 'error', message: 'gems array is required' });
        return;
      }

      // Calculate total value (2x multiplier)
      const baseValue = gems.reduce((sum: number, gem: Gem) => sum + calculateGemValue(gem), 0);
      const totalValue = baseValue * 2;

      // Get player info
      const playerStateKey = `playerState:${username}`;
      const playerStateJson = await redis.get(playerStateKey);
      let level = 1;
      let itemCount = 0;

      if (playerStateJson) {
        const playerState = JSON.parse(playerStateJson) as PlayerState;
        itemCount = playerState.gems.length;
        level = Math.floor(itemCount / 10) + 1;
      }

      // Create active offer
      const offer: ActiveOffer = {
        username,
        gems,
        totalValue,
        timestamp: Date.now(),
        level,
        itemCount,
      };

      // Save to Redis
      const offerKey = `activeOffer:${username}`;
      const activeOffersIndex = 'activeOffersIndex';

      await redis.set(offerKey, JSON.stringify(offer));
      await redis.zAdd(activeOffersIndex, { score: offer.timestamp, value: username });

      console.log(`[OFFER UPDATE] ${username} created offer`);

      const response: UpdateOfferResponse = {
        type: 'updateOffer',
        success: true,
        offer,
        message: 'Offer updated successfully',
      };

      res.status(200).json(response);
      return;
    }

    // Remove offer
    if (path.includes('/offers/remove') && req.method === 'DELETE') {
      const offerKey = `activeOffer:${username}`;
      const activeOffersIndex = 'activeOffersIndex';

      const hadOffer = await redis.get(offerKey);
      await redis.del(offerKey);
      await redis.zRem(activeOffersIndex, username);

      console.log(`[OFFER REMOVE] ${username} removed offer`);

      const response: UpdateOfferResponse = {
        type: 'updateOffer',
        success: true,
        message: hadOffer ? 'Offer removed successfully' : 'No active offer to remove',
      };

      res.status(200).json(response);
      return;
    }

    // Execute trade
    if (path.includes('/trade/execute') && req.method === 'POST') {
      const { sellerUsername } = req.body as any;
      const buyerUsername = username;

      // Validation
      if (buyerUsername === sellerUsername) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Cannot trade with yourself',
        });
        return;
      }

      // Get active offer
      const offerKey = `activeOffer:${sellerUsername}`;
      const offerJson = await redis.get(offerKey);

      if (!offerJson) {
        res.status(404).json({
          type: 'executeTrade',
          success: false,
          message: 'Offer no longer available',
        });
        return;
      }

      const offer = JSON.parse(offerJson) as ActiveOffer;

      // Load buyer and seller states
      const buyerStateKey = `playerState:${buyerUsername}`;
      const sellerStateKey = `playerState:${sellerUsername}`;

      const buyerStateJson = await redis.get(buyerStateKey);
      const sellerStateJson = await redis.get(sellerStateKey);

      if (!buyerStateJson || !sellerStateJson) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Player state not found',
        });
        return;
      }

      const buyerState = JSON.parse(buyerStateJson) as PlayerState;
      const sellerState = JSON.parse(sellerStateJson) as PlayerState;

      // Validate seller still has gems
      const sellerGemIds = new Set(sellerState.gems.map((g) => g.id));
      const missingGems = offer.gems.filter((g) => !sellerGemIds.has(g.id));
      if (missingGems.length > 0) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Seller no longer has all offered gems',
        });
        return;
      }

      // Validate buyer has enough coins
      const buyerBronzeTotal =
        buyerState.coins.bronze + buyerState.coins.silver * 100 + buyerState.coins.gold * 10000;

      if (buyerBronzeTotal < offer.totalValue) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Insufficient coins',
        });
        return;
      }

      // Execute trade
      const offerGemIds = new Set(offer.gems.map((g) => g.id));
      const updatedSellerGems = sellerState.gems.filter((g) => !offerGemIds.has(g.id));

      let sellerBronzeTotal =
        sellerState.coins.bronze + sellerState.coins.silver * 100 + sellerState.coins.gold * 10000;
      sellerBronzeTotal += offer.totalValue;

      const newSellerCoins = {
        gold: Math.floor(sellerBronzeTotal / 10000),
        silver: Math.floor((sellerBronzeTotal % 10000) / 100),
        bronze: sellerBronzeTotal % 100,
      };

      let newBuyerBronzeTotal = buyerBronzeTotal - offer.totalValue;
      const newBuyerCoins = {
        gold: Math.floor(newBuyerBronzeTotal / 10000),
        silver: Math.floor((newBuyerBronzeTotal % 10000) / 100),
        bronze: newBuyerBronzeTotal % 100,
      };

      const acquiredGems = offer.gems.map((gem) => ({
        ...gem,
        isOffering: false,
        isGrowing: false,
      }));
      const updatedBuyerGems = [...buyerState.gems, ...acquiredGems];

      const updatedSellerState: PlayerState = {
        ...sellerState,
        coins: newSellerCoins,
        gems: updatedSellerGems,
      };

      const updatedBuyerState: PlayerState = {
        ...buyerState,
        coins: newBuyerCoins,
        gems: updatedBuyerGems,
      };

      await redis.set(sellerStateKey, JSON.stringify(updatedSellerState));
      await redis.set(buyerStateKey, JSON.stringify(updatedBuyerState));

      // Remove seller's offer
      const activeOffersIndex = 'activeOffersIndex';
      await redis.del(offerKey);
      await redis.zRem(activeOffersIndex, sellerUsername);

      console.log(`[TRADE] ${buyerUsername} bought from ${sellerUsername}`);

      const response: ExecuteTradeResponse = {
        type: 'executeTrade',
        success: true,
        message: 'Trade completed successfully',
        transaction: {
          gems: acquiredGems,
          coinsSpent: offer.totalValue,
        },
      };

      res.status(200).json(response);
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
