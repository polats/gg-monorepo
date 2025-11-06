import express from 'express';
import cors from 'cors';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  IncrementBy5Response,
  GetColorMapResponse,
  UpdateColorMapResponse,
  ColorMap,
  GetFollowedUsersResponse,
  FollowedUser,
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
  Gem
} from '../shared/types/api';

const app = express();

// Enable CORS for local development
app.use(cors());

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Mock in-memory storage (replaces redis)
const mockStorage = new Map<string, string>();
mockStorage.set('count', '0');

// Active offers storage (username -> ActiveOffer)
const activeOffers = new Map<string, ActiveOffer>();

// Helper function to generate a random color
function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
    '#6C5B7B', '#355C7D', '#F67280', '#C06C84', '#2C3E50'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper function to initialize a color map
function initializeColorMap(size: number = 6): ColorMap {
  const colorMap: ColorMap = [];
  for (let i = 0; i < size; i++) {
    colorMap[i] = [];
    for (let j = 0; j < size; j++) {
      colorMap[i][j] = generateRandomColor();
    }
  }
  return colorMap;
}

// Initialize default color map
if (!mockStorage.has('colorMap')) {
  mockStorage.set('colorMap', JSON.stringify(initializeColorMap()));
}

// Mock followed users data
const mockFollowedUsers: FollowedUser[] = [
  { username: 'Bogsworth', lastActive: '2h ago', level: 15, itemCount: 234, offer: { gems: [{ name: 'Perfect Ruby', rarity: 'ruby', shape: 'dodecahedron', color: '#E0115F' }, { name: 'Rare Sapphire', rarity: 'sapphire', shape: 'dodecahedron', color: '#0F52BA' }, { name: 'Epic Diamond', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }], totalValue: 30000 } },
  { username: 'CrystalMiner88', lastActive: '5h ago', level: 12, itemCount: 187, offer: { gems: [{ name: 'Flawless Sapphire', rarity: 'sapphire', shape: 'dodecahedron', color: '#0F52BA' }, { name: 'Clear Diamond', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }], totalValue: 24000 } },
  { username: 'CaveExplorer', lastActive: '1d ago', level: 8, itemCount: 95, offer: { gems: [{ name: 'Pristine Emerald', rarity: 'emerald', shape: 'dodecahedron', color: '#50C878' }], totalValue: 10000 } },
  { username: 'TreasureHunter', lastActive: '2d ago', level: 20, itemCount: 412, offer: { gems: [{ name: 'Radiant Amethyst', rarity: 'amethyst', shape: 'octahedron', color: '#9966CC' }, { name: 'Shining Ruby', rarity: 'ruby', shape: 'dodecahedron', color: '#E0115F' }, { name: 'Brilliant Emerald', rarity: 'emerald', shape: 'octahedron', color: '#50C878' }, { name: 'Perfect Sapphire', rarity: 'sapphire', shape: 'tetrahedron', color: '#0F52BA' }], totalValue: 45000 } },
  { username: 'ShadowGoblin', lastActive: '3d ago', level: 6, itemCount: 52, offer: { gems: [{ name: 'Brilliant Diamond', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }, { name: 'Ruby Shard', rarity: 'ruby', shape: 'tetrahedron', color: '#E0115F' }], totalValue: 18000 } },
  { username: 'DiamondSeeker', lastActive: '4d ago', level: 14, itemCount: 203 },
  { username: 'DarkCaveDweller', lastActive: '5d ago', level: 10, itemCount: 134, offer: { gems: [{ name: 'Lustrous Topaz', rarity: 'amethyst', shape: 'octahedron', color: '#9966CC' }, { name: 'Green Emerald', rarity: 'emerald', shape: 'dodecahedron', color: '#50C878' }, { name: 'Blue Sapphire', rarity: 'sapphire', shape: 'octahedron', color: '#0F52BA' }], totalValue: 28000 } },
  { username: 'MysticGatherer', lastActive: '6d ago', level: 18, itemCount: 325 },
  { username: 'RubyCollector', lastActive: '1w ago', level: 7, itemCount: 78, offer: { gems: [{ name: 'Clear Aquamarine', rarity: 'sapphire', shape: 'tetrahedron', color: '#0F52BA' }, { name: 'Red Ruby', rarity: 'ruby', shape: 'dodecahedron', color: '#E0115F' }, { name: 'Green Emerald', rarity: 'emerald', shape: 'dodecahedron', color: '#50C878' }, { name: 'White Diamond', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }, { name: 'Purple Amethyst', rarity: 'amethyst', shape: 'octahedron', color: '#9966CC' }], totalValue: 52000 } },
  { username: 'EmeraldFinder', lastActive: '1w ago', level: 13, itemCount: 196 },
  { username: 'GemGoblin', lastActive: '2w ago', level: 9, itemCount: 115, offer: { gems: [{ name: 'Polished Citrine', rarity: 'emerald', shape: 'octahedron', color: '#50C878' }], totalValue: 8000 } },
  { username: 'CrystalHoarder', lastActive: '2w ago', level: 16, itemCount: 267, offer: { gems: [{ name: 'Smoky Obsidian', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }, { name: 'Rare Ruby', rarity: 'ruby', shape: 'dodecahedron', color: '#E0115F' }, { name: 'Epic Sapphire', rarity: 'sapphire', shape: 'dodecahedron', color: '#0F52BA' }, { name: 'Shiny Emerald', rarity: 'emerald', shape: 'dodecahedron', color: '#50C878' }, { name: 'Glowing Amethyst', rarity: 'amethyst', shape: 'octahedron', color: '#9966CC' }, { name: 'Perfect Diamond', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }], totalValue: 68000 } },
  { username: 'TunnelRaider', lastActive: '3w ago', level: 5, itemCount: 43 },
  { username: 'ShinySeeker', lastActive: '3w ago', level: 11, itemCount: 156, offer: { gems: [{ name: 'Rough Quartz', rarity: 'diamond', shape: 'octahedron', color: '#E8F5F5' }, { name: 'Small Ruby', rarity: 'ruby', shape: 'tetrahedron', color: '#E0115F' }], totalValue: 16000 } },
  { username: 'VaultKeeper', lastActive: '1mo ago', level: 19, itemCount: 389 },
];

// Mock context (replaces devvit context)
const mockContext = {
  postId: 'mock-post-123',
  subredditName: 'test',
  username: 'LocalDevUser',
};

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    try {
      const count = mockStorage.get('count') || '0';

      res.json({
        type: 'init',
        postId: mockContext.postId,
        count: parseInt(count),
        username: mockContext.username,
      });
    } catch (error) {
      console.error('API Init Error:', error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const currentCount = parseInt(mockStorage.get('count') || '0');
    const newCount = currentCount + 1;
    mockStorage.set('count', newCount.toString());

    res.json({
      count: newCount,
      postId: mockContext.postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const currentCount = parseInt(mockStorage.get('count') || '0');
    const newCount = currentCount - 1;
    mockStorage.set('count', newCount.toString());

    res.json({
      count: newCount,
      postId: mockContext.postId,
      type: 'decrement',
    });
  }
);

router.post<{ postId: string }, IncrementBy5Response | { status: string; message: string }, unknown>(
  '/api/increment-by-5',
  async (_req, res): Promise<void> => {
    const currentCount = parseInt(mockStorage.get('count') || '0');
    const newCount = currentCount + 5;
    mockStorage.set('count', newCount.toString());

    res.json({
      count: newCount,
      postId: mockContext.postId,
      type: 'incrementBy5',
    });
  }
);

router.get<{}, GetColorMapResponse | { status: string; message: string }>(
  '/api/color-map',
  async (_req, res): Promise<void> => {
    try {
      const colorMapJson = mockStorage.get('colorMap') || JSON.stringify(initializeColorMap());
      const colorMap = JSON.parse(colorMapJson) as ColorMap;

      res.json({
        type: 'getColorMap',
        postId: mockContext.postId,
        colorMap: colorMap,
        username: mockContext.username,
      });
    } catch (error) {
      console.error('API Get Color Map Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to get color map' });
    }
  }
);

router.post<{}, UpdateColorMapResponse | { status: string; message: string }, { row: number; col: number }>(
  '/api/color-map/update',
  async (req, res): Promise<void> => {
    try {
      const { row, col } = req.body;

      const colorMapJson = mockStorage.get('colorMap') || JSON.stringify(initializeColorMap());
      const colorMap = JSON.parse(colorMapJson) as ColorMap;

      // Validate row and col
      if (row < 0 || row >= colorMap.length || col < 0 || col >= colorMap[0].length) {
        res.status(400).json({ status: 'error', message: 'Invalid row or column' });
        return;
      }

      // Generate new random color
      const newColor = generateRandomColor();
      colorMap[row][col] = newColor;

      // Save updated color map
      mockStorage.set('colorMap', JSON.stringify(colorMap));

      res.json({
        type: 'updateColorMap',
        postId: mockContext.postId,
        colorMap: colorMap,
        row: row,
        col: col,
        newColor: newColor,
      });
    } catch (error) {
      console.error('API Update Color Map Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to update color map' });
    }
  }
);

router.get<{}, GetFollowedUsersResponse | { status: string; message: string }>(
  '/api/followed-users',
  async (req, res): Promise<void> => {
    try {
      const cursor = parseInt(req.query.cursor as string || '0');
      const limit = parseInt(req.query.limit as string || '5');

      // Get paginated slice of users
      const startIndex = cursor;
      const endIndex = startIndex + limit;
      const users = mockFollowedUsers.slice(startIndex, endIndex);
      const hasMore = endIndex < mockFollowedUsers.length;
      const nextCursor = hasMore ? endIndex : null;

      res.json({
        type: 'getFollowedUsers',
        users,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      console.error('API Get Followed Users Error:', error);
      res.status(400).json({ status: 'error', message: 'Failed to get followed users' });
    }
  }
);

// ============================================================================
// Player State Persistence APIs
// ============================================================================

router.post<{}, SavePlayerStateResponse | { status: string; message: string }, SavePlayerStateRequest>(
  '/api/player-state/save',
  async (req, res): Promise<void> => {
    try {
      const { playerState } = req.body;
      const username = req.headers['x-username'] as string || mockContext.username;

      if (!playerState) {
        res.status(400).json({ status: 'error', message: 'playerState is required' });
        return;
      }

      // Save player state to mock storage
      const playerStateKey = `playerState:${username}`;
      mockStorage.set(playerStateKey, JSON.stringify(playerState));

      console.log(`[SAVE] Player state saved for ${username}:`, {
        coins: playerState.coins,
        gemCount: playerState.gems.length,
        growingGems: playerState.gems.filter(g => g.isGrowing).length,
        offeringGems: playerState.gems.filter(g => g.isOffering).length,
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
  }
);

router.get<{}, LoadPlayerStateResponse | { status: string; message: string }>(
  '/api/player-state/load',
  async (req, res): Promise<void> => {
    try {
      const username = req.headers['x-username'] as string || mockContext.username;
      const playerStateKey = `playerState:${username}`;
      const playerStateJson = mockStorage.get(playerStateKey);

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
        growingGems: playerState.gems.filter(g => g.isGrowing).length,
        offeringGems: playerState.gems.filter(g => g.isOffering).length,
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

// Helper function to calculate gem value in bronze coins
// This MUST match the client's gemValue.ts calculation exactly
function calculateGemValue(gem: Gem): number {
  // Gem type base values (from client/utils/gemValue.ts)
  const GEM_TYPE_VALUES: Record<string, number> = {
    emerald: 10,    // Lowest tier
    sapphire: 25,   // Low-mid tier
    amethyst: 50,   // Mid tier
    ruby: 100,      // High tier
    diamond: 200,   // Highest tier
  };

  // Shape multipliers
  const SHAPE_MULTIPLIERS: Record<string, number> = {
    tetrahedron: 1.0,   // Basic shape (4 faces)
    octahedron: 1.5,    // Medium complexity (8 faces)
    dodecahedron: 2.0,  // Highest complexity (12 faces)
  };

  // Rarity multipliers
  const RARITY_MULTIPLIERS: Record<string, number> = {
    common: 1.0,      // Base multiplier
    uncommon: 1.5,    // 50% increase
    rare: 2.0,        // 2x value
    epic: 3.0,        // 3x value
    legendary: 5.0,   // 5x value
  };

  const baseValue = GEM_TYPE_VALUES[gem.type] || 10;
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape] || 1.0;
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity] || 1.0;
  const levelBonus = 1 + (gem.level * 0.1); // +10% per level

  // Size is in world units (e.g., 0.06), convert to mm and normalize
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / 100; // 100mm = 1.0× multiplier

  const totalValue = baseValue * shapeMultiplier * rarityMultiplier * levelBonus * sizeMultiplier;

  return Math.floor(totalValue); // Round down to whole bronze coins
}

// Helper function to format timestamp as "X ago"
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

// GET /api/offers - Get all active offers (replaces /api/followed-users)
router.get<{}, GetActiveOffersResponse | { status: string; message: string }>(
  '/api/offers',
  async (req, res): Promise<void> => {
    try {
      const cursor = parseInt(req.query.cursor as string || '0');
      const limit = parseInt(req.query.limit as string || '10');

      // Convert activeOffers Map to array
      const allOffers = Array.from(activeOffers.values())
        .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

      // Paginate
      const startIndex = cursor;
      const endIndex = startIndex + limit;
      const paginatedOffers = allOffers.slice(startIndex, endIndex);
      const hasMore = endIndex < allOffers.length;
      const nextCursor = hasMore ? endIndex : null;

      // Transform to response format
      const offers = paginatedOffers.map(offer => ({
        username: offer.username,
        lastActive: formatLastActive(offer.timestamp),
        level: offer.level,
        itemCount: offer.itemCount,
        offer: {
          gems: offer.gems.map(gem => ({
            name: `${gem.rarity} ${gem.type}`,
            rarity: gem.rarity,
            shape: gem.shape,
            color: gem.color,
          })),
          totalValue: offer.totalValue,
        },
      }));

      console.log(`[OFFERS] Returning ${offers.length} active offers (cursor: ${cursor})`);

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

// POST /api/offers/update - Create or update player's offer
router.post<{}, UpdateOfferResponse | { status: string; message: string }, UpdateOfferRequest>(
  '/api/offers/update',
  async (req, res): Promise<void> => {
    try {
      const { gems } = req.body;
      const username = req.headers['x-username'] as string || mockContext.username;

      if (!gems || !Array.isArray(gems) || gems.length === 0) {
        res.status(400).json({ status: 'error', message: 'gems array is required and cannot be empty' });
        return;
      }

      // Validate all gems have isOffering = true
      const invalidGems = gems.filter(g => !g.isOffering);
      if (invalidGems.length > 0) {
        res.status(400).json({ status: 'error', message: 'All gems must have isOffering = true' });
        return;
      }

      // Calculate total value (2x multiplier)
      const baseValue = gems.reduce((sum, gem) => sum + calculateGemValue(gem), 0);
      const totalValue = baseValue * 2;

      // Get player info from their saved state
      const playerStateKey = `playerState:${username}`;
      const playerStateJson = mockStorage.get(playerStateKey);
      let level = 1;
      let itemCount = 0;

      if (playerStateJson) {
        const playerState = JSON.parse(playerStateJson) as PlayerState;
        itemCount = playerState.gems.length;
        // For now, level is based on total gems (can be enhanced later)
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

      // Save to activeOffers
      activeOffers.set(username, offer);

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

// DELETE /api/offers/remove - Remove player's offer
router.delete<{}, UpdateOfferResponse | { status: string; message: string }>(
  '/api/offers/remove',
  async (req, res): Promise<void> => {
    try {
      const username = req.headers['x-username'] as string || mockContext.username;

      const hadOffer = activeOffers.has(username);
      activeOffers.delete(username);

      console.log(`[OFFER REMOVE] ${username} removed offer (existed: ${hadOffer})`);

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

// POST /api/trade/execute - Execute trade transaction
router.post<{}, ExecuteTradeResponse | { status: string; message: string }, ExecuteTradeRequest>(
  '/api/trade/execute',
  async (req, res): Promise<void> => {
    try {
      const { sellerUsername } = req.body;
      const buyerUsername = req.headers['x-username'] as string || mockContext.username;

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
      const offer = activeOffers.get(sellerUsername);
      if (!offer) {
        res.status(404).json({
          type: 'executeTrade',
          success: false,
          message: 'Offer no longer available',
        });
        return;
      }

      // Load buyer and seller states
      const buyerStateKey = `playerState:${buyerUsername}`;
      const sellerStateKey = `playerState:${sellerUsername}`;

      const buyerStateJson = mockStorage.get(buyerStateKey);
      const sellerStateJson = mockStorage.get(sellerStateKey);

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
      const sellerGemIds = new Set(sellerState.gems.map(g => g.id));
      const missingGems = offer.gems.filter(g => !sellerGemIds.has(g.id));
      if (missingGems.length > 0) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Seller no longer has all offered gems',
        });
        return;
      }

      // Validation: Buyer has enough coins
      const buyerBronzeTotal = buyerState.coins.bronze +
                               buyerState.coins.silver * 100 +
                               buyerState.coins.gold * 10000;

      if (buyerBronzeTotal < offer.totalValue) {
        res.status(400).json({
          type: 'executeTrade',
          success: false,
          message: 'Insufficient coins',
        });
        return;
      }

      // Execute trade (atomic in Map operations)

      // 1. Remove gems from seller and mark as not offering
      const offerGemIds = new Set(offer.gems.map(g => g.id));
      const updatedSellerGems = sellerState.gems.filter(g => !offerGemIds.has(g.id));

      // 2. Add coins to seller
      let sellerBronzeTotal = sellerState.coins.bronze +
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
      const acquiredGems = offer.gems.map(gem => ({
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

      mockStorage.set(sellerStateKey, JSON.stringify(updatedSellerState));
      mockStorage.set(buyerStateKey, JSON.stringify(updatedBuyerState));

      // 6. Remove seller's offer
      activeOffers.delete(sellerUsername);

      console.log(`[TRADE] ${buyerUsername} bought ${acquiredGems.length} gems from ${sellerUsername} for ${offer.totalValue} bronze`);

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

app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Local dev server running at http://localhost:${PORT}`);
  console.log(`   API endpoints available at http://localhost:${PORT}/api/*\n`);
});
