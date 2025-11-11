/**
 * Transaction record types
 */

/**
 * Type of transaction
 */
export type TransactionType = 'listing_purchase' | 'mystery_box_purchase';

/**
 * Record of a completed transaction
 */
export interface Transaction {
  /** Unique identifier for the transaction */
  id: string;
  
  /** Type of transaction */
  type: TransactionType;
  
  /** Buyer's username */
  buyerUsername: string;
  
  /** Buyer's wallet address */
  buyerWallet: string;
  
  /** Seller's username (for listing purchases) */
  sellerUsername?: string;
  
  /** Seller's wallet address (for listing purchases) */
  sellerWallet?: string;
  
  /** Listing ID (for listing purchases) */
  listingId?: string;
  
  /** Mystery box tier ID (for mystery box purchases) */
  mysteryBoxTierId?: string;
  
  /** Price paid in USDC */
  priceUSDC: number;
  
  /** Item(s) transferred */
  items: any[];
  
  /** Transaction hash/signature on blockchain */
  txHash: string;
  
  /** Timestamp of transaction (milliseconds since epoch) */
  timestamp: number;
}
