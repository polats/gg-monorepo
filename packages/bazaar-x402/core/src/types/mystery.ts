/**
 * Mystery box types for randomized item purchases
 */

/**
 * Configuration for a mystery box tier
 */
export interface MysteryBoxTier {
  /** Unique identifier for the tier */
  id: string;
  
  /** Display name of the tier */
  name: string;
  
  /** Price in USDC (with decimals) */
  priceUSDC: number;
  
  /** Description of what this tier contains */
  description: string;
  
  /** Weighted rarity distribution (e.g., { common: 50, rare: 30, epic: 20 }) */
  rarityWeights: Record<string, number>;
}

/**
 * Record of a mystery box purchase
 */
export interface MysteryBoxPurchase {
  /** Unique identifier for the purchase */
  id: string;
  
  /** ID of the tier that was purchased */
  tierId: string;
  
  /** Buyer's wallet address */
  buyerWallet: string;
  
  /** Buyer's username */
  buyerUsername: string;
  
  /** Price paid in USDC */
  priceUSDC: number;
  
  /** The item that was generated */
  itemGenerated: any;
  
  /** Transaction hash/signature */
  txHash: string;
  
  /** Timestamp of purchase (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Result of a mystery box purchase
 */
export interface MysteryBoxResult {
  /** Whether the purchase was successful */
  success: boolean;
  
  /** The item that was generated */
  item: any;
  
  /** Transaction hash/signature */
  txHash: string;
  
  /** Optional message */
  message?: string;
}
