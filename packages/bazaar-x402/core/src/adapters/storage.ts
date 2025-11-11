/**
 * Storage adapter interface for persisting marketplace data
 */

import type { Listing, MysteryBoxTier, MysteryBoxPurchase, Transaction } from '../types/index.js';

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  /** Cursor for pagination (listing ID or timestamp) */
  cursor?: string;
  
  /** Maximum number of results to return (default 20, max 100) */
  limit?: number;
  
  /** Sort order */
  sortBy?: 'newest' | 'price_low' | 'price_high';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of results */
  items: T[];
  
  /** Cursor for next page (undefined if no more results) */
  nextCursor?: string;
  
  /** Total count (if available) */
  totalCount?: number;
}

/**
 * Atomic trade operation
 */
export interface TradeOperation {
  /** Type of operation */
  type: 'update_listing' | 'transfer_item' | 'update_balance' | 'record_transaction';
  
  /** Operation-specific data */
  data: any;
}

/**
 * Storage adapter interface for marketplace data persistence
 * 
 * Implementations can use Redis, MongoDB, PostgreSQL, or any other storage backend.
 */
export interface StorageAdapter {
  // ===== Listing Operations =====
  
  /**
   * Create a new listing
   * @param listing - The listing to create
   */
  createListing(listing: Listing): Promise<void>;
  
  /**
   * Get a listing by ID
   * @param listingId - The listing ID
   * @returns The listing or null if not found
   */
  getListing(listingId: string): Promise<Listing | null>;
  
  /**
   * Get active listings with pagination
   * @param options - Pagination and sorting options
   * @returns Paginated list of active listings
   */
  getActiveListings(options: PaginationOptions): Promise<PaginatedResult<Listing>>;
  
  /**
   * Update the status of a listing
   * @param listingId - The listing ID
   * @param status - The new status
   */
  updateListingStatus(listingId: string, status: Listing['status']): Promise<void>;
  
  /**
   * Get all listings by a specific user
   * @param username - The user's username
   * @returns Array of listings
   */
  getListingsByUser(username: string): Promise<Listing[]>;
  
  // ===== Mystery Box Operations =====
  
  /**
   * Get a mystery box tier by ID
   * @param tierId - The tier ID
   * @returns The tier or null if not found
   */
  getMysteryBoxTier(tierId: string): Promise<MysteryBoxTier | null>;
  
  /**
   * Get all available mystery box tiers
   * @returns Array of all tiers
   */
  getAllMysteryBoxTiers(): Promise<MysteryBoxTier[]>;
  
  /**
   * Record a mystery box purchase
   * @param purchase - The purchase record
   */
  recordMysteryBoxPurchase(purchase: MysteryBoxPurchase): Promise<void>;
  
  // ===== Transaction Operations =====
  
  /**
   * Record a completed transaction
   * @param transaction - The transaction record
   */
  recordTransaction(transaction: Transaction): Promise<void>;
  
  /**
   * Get all transactions for a specific user
   * @param username - The user's username
   * @returns Array of transactions
   */
  getTransactionsByUser(username: string): Promise<Transaction[]>;
  
  // ===== Atomic Operations =====
  
  /**
   * Execute multiple operations atomically
   * All operations must succeed or all must fail
   * @param operations - Array of operations to execute
   */
  executeAtomicTrade(operations: TradeOperation[]): Promise<void>;
}
