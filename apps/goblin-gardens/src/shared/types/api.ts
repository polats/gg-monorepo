export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type IncrementBy5Response = {
  type: 'incrementBy5';
  postId: string;
  count: number;
};

export type ColorMap = string[][];

export type GetColorMapResponse = {
  type: 'getColorMap';
  postId: string;
  colorMap: ColorMap;
  username: string;
};

export type UpdateColorMapResponse = {
  type: 'updateColorMap';
  postId: string;
  colorMap: ColorMap;
  row: number;
  col: number;
  newColor: string;
};

export type FollowedUser = {
  username: string;
  lastActive: string;
  level: number;
  itemCount: number;
  offer?: {
    gems: Array<{
      name: string;
      rarity: string;
      shape: 'tetrahedron' | 'octahedron' | 'dodecahedron';
      color: string;
    }>;
    totalValue: number; // Total value in bronze (2x multiplier)
  };
};

export type GetFollowedUsersResponse = {
  type: 'getFollowedUsers';
  users: FollowedUser[];
  hasMore: boolean;
  nextCursor: number | null;
};

// ============================================================================
// Player State Types
// ============================================================================

export type GemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type GemType = 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst';
export type GemShape = 'tetrahedron' | 'octahedron' | 'dodecahedron';

export type Gem = {
  id: string;
  type: GemType;
  rarity: GemRarity;
  shape: GemShape;
  color: string;
  growthRate: number;
  level: number;
  experience: number;
  dateAcquired: number;
  size: number;
  isGrowing: boolean;
  isOffering: boolean;
};

export type PlayerState = {
  coins: {
    gold: number;
    silver: number;
    bronze: number;
  };
  gems: Gem[];
};

export type SavePlayerStateRequest = {
  playerState: PlayerState;
};

export type SavePlayerStateResponse = {
  type: 'savePlayerState';
  success: boolean;
  message?: string;
};

export type LoadPlayerStateResponse = {
  type: 'loadPlayerState';
  playerState: PlayerState | null;
};

// ============================================================================
// Active Offers & Trading Types
// ============================================================================

// Active offer structure stored in database
export type ActiveOffer = {
  username: string;
  gems: Gem[]; // Full gem objects being offered
  totalValue: number; // 2x multiplier already applied
  timestamp: number;
  level: number; // Player level for display
  itemCount: number; // Total items for display
};

// Get active offers response (replaces GetFollowedUsersResponse for trading)
export type GetActiveOffersResponse = {
  type: 'getActiveOffers';
  offers: Array<{
    username: string;
    lastActive: string;
    level: number;
    itemCount: number;
    offer: {
      gems: Array<{
        name: string;
        rarity: string;
        shape: GemShape;
        color: string;
      }>;
      totalValue: number;
    };
  }>;
  hasMore: boolean;
  nextCursor: number | null;
};

// Update/create player's active offer
export type UpdateOfferRequest = {
  gems: Gem[]; // Offering gems with full details
};

export type UpdateOfferResponse = {
  type: 'updateOffer';
  success: boolean;
  offer?: ActiveOffer;
  message?: string;
};

// Execute trade transaction
export type ExecuteTradeRequest = {
  sellerUsername: string;
};

export type ExecuteTradeResponse = {
  type: 'executeTrade';
  success: boolean;
  message?: string;
  transaction?: {
    gems: Gem[]; // Gems acquired
    coinsSpent: number; // Bronze coins paid
  };
};
