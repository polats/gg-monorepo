import express, { Router, Request, Response } from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  IncrementBy5Response,
  GetColorMapResponse,
  UpdateColorMapResponse,
  ColorMap,
  SavePlayerStateRequest,
  SavePlayerStateResponse,
  LoadPlayerStateResponse,
  PlayerState,
  ActiveOffer,
  GetActiveOffersResponse,
  UpdateOfferRequest,
  UpdateOfferResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  Gem,
} from '../../shared/types/api';
import { RedisAdapter } from '../adapters/redis-adapter';
import { AuthAdapter } from '../adapters/auth-adapter';

/**
 * Context required for route handlers
 */
export interface RouteContext {
  redis: RedisAdapter;
  auth: AuthAdapter;
  postId?: string;
}

/**
 * Helper function to calculate gem value in bronze coins
 * This MUST match the client's gemValue.ts calculation exactly
 */
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

/**
 * Helper function to format timestamp as "X ago"
 */
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

/**
 * Helper function to get user-specific player state key
 */
function getUserPlayerStateKey(username: string): string {
  return `playerState:${username}`;
}

/**
 * Helper function to generate a random color
 */
function generateRandomColor(): string {
  const colors: string[] = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B195',
    '#C06C84',
    '#6C5B7B',
    '#355C7D',
    '#F67280',
    '#C06C84',
    '#2C3E50',
  ];
  return colors[Math.floor(Math.random() * colors.length)]!;
}

/**
 * Helper function to initialize a color map
 */
function initializeColorMap(size: number = 6): ColorMap {
  const colorMap: ColorMap = [];
  for (let i = 0; i < size; i++) {
    const row: string[] = [];
    for (let j = 0; j < size; j++) {
      row.push(generateRandomColor());
    }
    colorMap.push(row);
  }
  return colorMap;
}

/**
 * Helper function to get user-specific color map key
 */
function getUserColorMapKey(username: string): string {
  return `colorMap:${username}`;
}

/**
 * Create Express router with all API routes
 */
export function createRoutes(context: RouteContext): Router {
  const router = express.Router();
  const { redis, auth, postId } = context;

  // ============================================================================
  // Basic Counter APIs (for testing/demo)
  // ============================================================================

  router.get<{}, InitResponse | { status: string; message: string }>(
    '/api/init',
    async (req: Request, res: Response): Promise<void> => {
      if (!postId) {
        console.error('API Init Error: postId not found in context');
        res.status(400).json({
          status: 'error',
          message: 'postId is required but missing from context',
        });
        return;
      }

      try {
        const count = await redis.get('count');
        const username = await auth.getUsername(req);

        const response: InitResponse = {
          type: 'init',
          postId: postId,
          count: count ? parseInt(count) : 0,
          username: username,
        };

        res.json(response);
      } catch (error) {
        console.error(`API Init Error for post ${postId}:`, error);
        let errorMessage = 'Unknown error during initialization';
        if (error instanceof Error) {
          errorMessage = `Initialization failed: ${error.message}`;
        }
        res.status(400).json({ status: 'error', message: errorMessage });
      }
    }
  );

  router.post<{}, IncrementResponse | { status: string; message: string }, unknown>(
    '/api/increment',
    async (_req: Request, res: Response): Promise<void> => {
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      res.json({
        count: await redis.incrBy('count', 1),
        postId,
        type: 'increment',
      });
    }
  );

  router.post<{}, DecrementResponse | { status: string; message: string }, unknown>(
    '/api/decrement',
    async (_req: Request, res: Response): Promise<void> => {
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      res.json({
        count: await redis.incrBy('count', -1),
        postId,
        type: 'decrement',
      });
    }
  );

  router.post<{}, IncrementBy5Response | { status: string; message: string }, unknown>(
    '/api/increment-by-5',
    async (_req: Request, res: Response): Promise<void> => {
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      res.json({
        count: await redis.incrBy('count', 5),
        postId,
        type: 'incrementBy5',
      });
    }
  );

  // ============================================================================
  // Color Map APIs (for testing/demo)
  // ============================================================================

  router.get<{}, GetColorMapResponse | { status: string; message: string }>(
    '/api/color-map',
    async (req: Request, res: Response): Promise<void> => {
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      try {
        const username = await auth.getUsername(req);
        const colorMapKey = getUserColorMapKey(username);

        // Get color map from Redis, or initialize if it doesn't exist
        let colorMapJson = await redis.get(colorMapKey);
        let colorMap: ColorMap;

        if (!colorMapJson) {
          colorMap = initializeColorMap();
          await redis.set(colorMapKey, JSON.stringify(colorMap));
        } else {
          colorMap = JSON.parse(colorMapJson) as ColorMap;
        }

        res.json({
          type: 'getColorMap',
          postId: postId,
          colorMap: colorMap,
          username: username,
        });
      } catch (error) {
        console.error('API Get Color Map Error:', error);
        res.status(400).json({ status: 'error', message: 'Failed to get color map' });
      }
    }
  );

  router.post<
    {},
    UpdateColorMapResponse | { status: string; message: string },
    { row: number; col: number }
  >('/api/color-map/update', async (req: Request, res: Response): Promise<void> => {
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { row, col } = req.body;
      const username = await auth.getUsername(req);
      const colorMapKey = getUserColorMapKey(username);

      // Get current color map
      let colorMapJson = await redis.get(colorMapKey);
      let colorMap: ColorMap;

      if (!colorMapJson) {
        colorMap = initializeColorMap();
      } else {
        colorMap = JSON.parse(colorMapJson) as ColorMap;
      }

      // Validate row and col
      if (row < 0 || row >= colorMap.length || col < 0 || col >= (colorMap[0]?.length ?? 0)) {
        res.status(400).json({ status: 'error', message: 'Invalid row or column' });
        return;
      }

      // Generate new random color
      const newColor = generateRandomColor();
      const rowArray = colorMap[row];
      if (rowArray) {
        rowArray[col] = newColor;
      }

      // Save updated color map
      await redis.set(colorMapKey, JSON.stringify(colorMap));

      res.json({
        type: 'updateColorMap',
        postId: postId,
        colorMap: colorMap,
        row: row,
        col: col,
        newColor: newColor,
      });
    } catch (error) {
      console.error('API Update Color Map Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to update color map' });
    }
  });

  // ============================================================================
  // Player State Persistence APIs
  // ============================================================================

  router.post<
    {},
    SavePlayerStateResponse | { status: string; message: string },
    SavePlayerStateRequest
  >('/api/player-state/save', async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerState } = req.body;

      if (!playerState) {
        res.status(400).json({ status: 'error', message: 'playerState is required' });
        return;
      }

      const username = await auth.getUsername(req);
      const playerStateKey = getUserPlayerStateKey(username);

      // Save player state to Redis
      await redis.set(playerStateKey, JSON.stringify(playerState));

      console.log(`[SAVE] Player state saved for ${username}:`, {
        coins: playerState.coins,
        gemCount: playerState.gems.length,
        growingGems: playerState.gems.filter((g: Gem) => g.isGrowing).length,
        offeringGems: playerState.gems.filter((g: Gem) => g.isOffering).length,
      });

      res.json({
        type: 'savePlayerState',
        success: true,
        message: 'Player state saved successfully',
      });
    } catch (error) {
      console.error('API Save Player State Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to save player state' });
    }
  });

  router.get<{}, LoadPlayerStateResponse | { status: string; message: string }>(
    '/api/player-state/load',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const username = await auth.getUsername(req);
        const playerStateKey = getUserPlayerStateKey(username);

        const playerStateJson = await redis.get(playerStateKey);

        if (!playerStateJson) {
          console.log(`[LOAD] No saved player state found for ${username}, returning null`);
          res.json({
            type: 'loadPlayerState',
            playerState: null,
          });
          return;
        }

        const playerState = JSON.parse(playerStateJson) as PlayerState;

        console.log(`[LOAD] Player state loaded for ${username}:`, {
          coins: playerState.coins,
          gemCount: playerState.gems.length,
          growingGems: playerState.gems.filter((g: Gem) => g.isGrowing).length,
          offeringGems: playerState.gems.filter((g: Gem) => g.isOffering).length,
        });

        res.json({
          type: 'loadPlayerState',
          playerState: playerState,
        });
      } catch (error) {
        console.error('API Load Player State Error:', error);
        res.status(400).json({ status: 'error', message: 'Failed to load player state' });
      }
    }
  );

  // ============================================================================
  // Active Offers & Trading APIs
  // ============================================================================

  router.get<{}, GetActiveOffersResponse | { status: string; message: string }>(
    '/api/offers',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const cursor = parseInt((req.query.cursor as string) || '0');
        const limit = parseInt((req.query.limit as string) || '10');

        // Use Redis Sorted Set to get active offers sorted by timestamp (most recent first)
        // The sorted set key stores username as member, timestamp as score
        const activeOffersIndex = 'activeOffersIndex';

        // Get total count for pagination
        const totalCount = await redis.zCard(activeOffersIndex);

        // Get usernames from sorted set (reverse order = newest first)
        const usernames = await redis.zRange(activeOffersIndex, cursor, cursor + limit - 1, {
          by: 'rank',
          reverse: true,
        });

        // Fetch offers for these usernames
        const offerPromises = usernames.map(({ member }) => redis.get(`activeOffer:${member}`));
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

        console.log(
          `[OFFERS] Returning ${offers.length} active offers (cursor: ${cursor}, total: ${totalCount})`
        );

        res.json({
          type: 'getActiveOffers',
          offers,
          hasMore,
          nextCursor,
        });
      } catch (error) {
        console.error('API Get Offers Error:', error);
        res.status(400).json({ status: 'error', message: 'Failed to get active offers' });
      }
    }
  );

  router.post<{}, UpdateOfferResponse | { status: string; message: string }, UpdateOfferRequest>(
    '/api/offers/update',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { gems } = req.body;
        const username = await auth.getUsername(req);

        if (!gems || !Array.isArray(gems) || gems.length === 0) {
          res
            .status(400)
            .json({ status: 'error', message: 'gems array is required and cannot be empty' });
          return;
        }

        // Validate all gems have isOffering = true
        const invalidGems = gems.filter((g) => !g.isOffering);
        if (invalidGems.length > 0) {
          res.status(400).json({ status: 'error', message: 'All gems must have isOffering = true' });
          return;
        }

        // Calculate total value (2x multiplier)
        const baseValue = gems.reduce((sum, gem) => sum + calculateGemValue(gem), 0);
        const totalValue = baseValue * 2;

        // Get player info from their saved state
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
          username: username,
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

        // Add to sorted set index (username as member, timestamp as score)
        await redis.zAdd(activeOffersIndex, { member: username, score: offer.timestamp });

        console.log(`[OFFER UPDATE] ${username} created offer:`, {
          gemCount: gems.length,
          totalValue,
          level,
        });

        res.json({
          type: 'updateOffer',
          success: true,
          offer,
          message: 'Offer updated successfully',
        });
      } catch (error) {
        console.error('API Update Offer Error:', error);
        res.status(400).json({ status: 'error', message: 'Failed to update offer' });
      }
    }
  );

  router.delete<{}, UpdateOfferResponse | { status: string; message: string }>(
    '/api/offers/remove',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const username = await auth.getUsername(req);

        const offerKey = `activeOffer:${username}`;
        const activeOffersIndex = 'activeOffersIndex';

        const hadOffer = await redis.get(offerKey);
        await redis.del(offerKey);

        // Remove from sorted set index
        await redis.zRem(activeOffersIndex, [username]);

        console.log(`[OFFER REMOVE] ${username} removed offer (existed: ${!!hadOffer})`);

        res.json({
          type: 'updateOffer',
          success: true,
          message: hadOffer ? 'Offer removed successfully' : 'No active offer to remove',
        });
      } catch (error) {
        console.error('API Remove Offer Error:', error);
        res.status(400).json({ status: 'error', message: 'Failed to remove offer' });
      }
    }
  );

  router.post<{}, ExecuteTradeResponse | { status: string; message: string }, ExecuteTradeRequest>(
    '/api/trade/execute',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { sellerUsername } = req.body;
        const buyerUsername = await auth.getUsername(req);

        // Validation: Can't trade with yourself
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

        if (!buyerStateJson) {
          res.status(400).json({
            type: 'executeTrade',
            success: false,
            message: 'Buyer state not found',
          });
          return;
        }

        if (!sellerStateJson) {
          res.status(400).json({
            type: 'executeTrade',
            success: false,
            message: 'Seller state not found',
          });
          return;
        }

        const buyerState = JSON.parse(buyerStateJson) as PlayerState;
        const sellerState = JSON.parse(sellerStateJson) as PlayerState;

        // Validation: Seller still has the gems
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

        // Validation: Buyer has enough coins
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

        // Execute trade using Redis transaction for atomicity
        // Note: Redis in Devvit may not support WATCH/MULTI, so we'll do best effort

        // 1. Remove gems from seller
        const offerGemIds = new Set(offer.gems.map((g) => g.id));
        const updatedSellerGems = sellerState.gems.filter((g) => !offerGemIds.has(g.id));

        // 2. Add coins to seller
        let sellerBronzeTotal =
          sellerState.coins.bronze +
          sellerState.coins.silver * 100 +
          sellerState.coins.gold * 10000;
        sellerBronzeTotal += offer.totalValue;

        const newSellerCoins = {
          gold: Math.floor(sellerBronzeTotal / 10000),
          silver: Math.floor((sellerBronzeTotal % 10000) / 100),
          bronze: sellerBronzeTotal % 100,
        };

        // 3. Remove coins from buyer
        let newBuyerBronzeTotal = buyerBronzeTotal - offer.totalValue;
        const newBuyerCoins = {
          gold: Math.floor(newBuyerBronzeTotal / 10000),
          silver: Math.floor((newBuyerBronzeTotal % 10000) / 100),
          bronze: newBuyerBronzeTotal % 100,
        };

        // 4. Add gems to buyer (mark as not offering)
        const acquiredGems = offer.gems.map((gem) => ({
          ...gem,
          isOffering: false,
          isGrowing: false,
        }));
        const updatedBuyerGems = [...buyerState.gems, ...acquiredGems];

        // 5. Save updated states
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

        // 6. Remove seller's offer
        const activeOffersIndex = 'activeOffersIndex';
        await redis.del(offerKey);
        await redis.zRem(activeOffersIndex, [sellerUsername]);

        console.log(
          `[TRADE] ${buyerUsername} bought ${acquiredGems.length} gems from ${sellerUsername} for ${offer.totalValue} bronze`
        );

        res.json({
          type: 'executeTrade',
          success: true,
          message: 'Trade completed successfully',
          transaction: {
            gems: acquiredGems,
            coinsSpent: offer.totalValue,
          },
        });
      } catch (error) {
        console.error('API Execute Trade Error:', error);
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Trade execution failed',
        });
      }
    }
  );

  return router;
}
