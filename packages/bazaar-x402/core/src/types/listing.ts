/**
 * Listing types for Bazaar marketplace
 */

/**
 * Status of a marketplace listing
 */
export type ListingStatus = 'active' | 'sold' | 'cancelled';

/**
 * A marketplace listing for a virtual item
 */
export interface Listing {
  /** Unique identifier for the listing */
  id: string;
  
  /** ID of the item being sold */
  itemId: string;
  
  /** Type of item (e.g., 'gem', 'nft', 'skin') */
  itemType: string;
  
  /** Game-specific item data */
  itemData: any;
  
  /** Seller's wallet address */
  sellerWallet: string;
  
  /** Seller's username */
  sellerUsername: string;
  
  /** Price in USDC (with decimals, e.g., 5.0 = 5 USDC) */
  priceUSDC: number;
  
  /** Current status of the listing */
  status: ListingStatus;
  
  /** Timestamp when listing was created (milliseconds since epoch) */
  createdAt: number;
  
  /** Optional expiration timestamp (milliseconds since epoch) */
  expiresAt?: number;
}

/**
 * Parameters for creating a new listing
 */
export interface CreateListingParams {
  /** ID of the item being sold */
  itemId: string;
  
  /** Type of item (e.g., 'gem', 'nft', 'skin') */
  itemType: string;
  
  /** Game-specific item data */
  itemData: any;
  
  /** Seller's username */
  sellerUsername: string;
  
  /** Seller's wallet address */
  sellerWallet: string;
  
  /** Price in USDC (with decimals) */
  priceUSDC: number;
  
  /** Optional expiration time in seconds from now */
  expiresInSeconds?: number;
}
