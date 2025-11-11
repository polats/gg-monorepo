/**
 * In-memory storage adapter for testing and development
 * 
 * This adapter stores all data in memory using Map and Set data structures.
 * Data is lost when the process restarts. Use this for testing and local development.
 */

import type {
  StorageAdapter,
  PaginationOptions,
  PaginatedResult,
  TradeOperation,
  Listing,
  MysteryBoxTier,
  MysteryBoxPurchase,
  Transaction,
} from '@bazaar-x402/core';

/**
 * In-memory storage adapter using Map/Set
 * 
 * @example
 * ```typescript
 * const storageAdapter = new MemoryStorageAdapter();
 * const marketplace = new BazaarMarketplace({
 *   storageAdapter,
 *   itemAdapter,
 *   paymentAdapter,
 * });
 * ```
 */
export class MemoryStorageAdapter implements StorageAdapter {
  // Listings storage
  private listings = new Map<string, Listing>();
  private activeListingsIndex = new Set<string>();
  private userListingsIndex = new Map<string, Set<string>>();
  
  // Mystery box storage
  private mysteryBoxTiers = new Map<string, MysteryBoxTier>();
  private mysteryBoxPurchases = new Map<string, MysteryBoxPurchase>();
  
  // Transaction storage
  private transactions = new Map<string, Transaction>();
  private userTransactionsIndex = new Map<string, string[]>();
  
  // ===== Listing Operations =====
  
  async createListing(listing: Listing): Promise<void> {
    this.listings.set(listing.id, listing);
    
    if (listing.status === 'active') {
      this.activeListingsIndex.add(listing.id);
    }
    
    // Add to user index
    if (!this.userListingsIndex.has(listing.sellerUsername)) {
      this.userListingsIndex.set(listing.sellerUsername, new Set());
    }
    this.userListingsIndex.get(listing.sellerUsername)!.add(listing.id);
  }
  
  async getListing(listingId: string): Promise<Listing | null> {
    return this.listings.get(listingId) ?? null;
  }
  
  async getActiveListings(options: PaginationOptions): Promise<PaginatedResult<Listing>> {
    const limit = Math.min(options.limit ?? 20, 100);
    const sortBy = options.sortBy ?? 'newest';
    
    // Get all active listings
    const activeListings = Array.from(this.activeListingsIndex)
      .map(id => this.listings.get(id))
      .filter((listing): listing is Listing => listing !== undefined);
    
    // Sort listings
    const sortedListings = this.sortListings(activeListings, sortBy);
    
    // Apply cursor-based pagination
    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = sortedListings.findIndex(l => l.id === options.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // Get page of results
    const items = sortedListings.slice(startIndex, startIndex + limit);
    
    // Determine next cursor
    const nextCursor = items.length === limit && startIndex + limit < sortedListings.length
      ? items[items.length - 1].id
      : undefined;
    
    return {
      items,
      nextCursor,
      totalCount: sortedListings.length,
    };
  }
  
  async updateListingStatus(listingId: string, status: Listing['status']): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }
    
    // Update status
    listing.status = status;
    
    // Update active index
    if (status === 'active') {
      this.activeListingsIndex.add(listingId);
    } else {
      this.activeListingsIndex.delete(listingId);
    }
  }
  
  async getListingsByUser(username: string): Promise<Listing[]> {
    const listingIds = this.userListingsIndex.get(username);
    if (!listingIds) {
      return [];
    }
    
    return Array.from(listingIds)
      .map(id => this.listings.get(id))
      .filter((listing): listing is Listing => listing !== undefined);
  }
  
  // ===== Mystery Box Operations =====
  
  async getMysteryBoxTier(tierId: string): Promise<MysteryBoxTier | null> {
    return this.mysteryBoxTiers.get(tierId) ?? null;
  }
  
  async getAllMysteryBoxTiers(): Promise<MysteryBoxTier[]> {
    return Array.from(this.mysteryBoxTiers.values());
  }
  
  async recordMysteryBoxPurchase(purchase: MysteryBoxPurchase): Promise<void> {
    this.mysteryBoxPurchases.set(purchase.id, purchase);
  }
  
  // ===== Transaction Operations =====
  
  async recordTransaction(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.id, transaction);
    
    // Add to user index (buyer)
    if (!this.userTransactionsIndex.has(transaction.buyerUsername)) {
      this.userTransactionsIndex.set(transaction.buyerUsername, []);
    }
    this.userTransactionsIndex.get(transaction.buyerUsername)!.push(transaction.id);
    
    // Add to user index (seller) - only if seller exists
    if (transaction.sellerUsername) {
      if (!this.userTransactionsIndex.has(transaction.sellerUsername)) {
        this.userTransactionsIndex.set(transaction.sellerUsername, []);
      }
      this.userTransactionsIndex.get(transaction.sellerUsername)!.push(transaction.id);
    }
  }
  
  async getTransactionsByUser(username: string): Promise<Transaction[]> {
    const transactionIds = this.userTransactionsIndex.get(username);
    if (!transactionIds) {
      return [];
    }
    
    return transactionIds
      .map(id => this.transactions.get(id))
      .filter((tx): tx is Transaction => tx !== undefined);
  }
  
  // ===== Atomic Operations =====
  
  async executeAtomicTrade(operations: TradeOperation[]): Promise<void> {
    // In-memory implementation: execute all operations
    // If any fails, throw error (no rollback needed since we haven't committed)
    
    for (const operation of operations) {
      switch (operation.type) {
        case 'update_listing':
          await this.updateListingStatus(operation.data.listingId, operation.data.status);
          break;
          
        case 'record_transaction':
          await this.recordTransaction(operation.data);
          break;
          
        // Other operation types would be handled by the marketplace class
        // using the item adapter (transfer_item) or external systems (update_balance)
        
        default:
          console.warn(`[MEMORY STORAGE] Unknown operation type: ${operation.type}`);
      }
    }
  }
  
  // ===== Helper Methods =====
  
  /**
   * Sort listings based on sort option
   */
  private sortListings(listings: Listing[], sortBy: PaginationOptions['sortBy']): Listing[] {
    const sorted = [...listings];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
        
      case 'price_low':
        sorted.sort((a, b) => a.priceUSDC - b.priceUSDC);
        break;
        
      case 'price_high':
        sorted.sort((a, b) => b.priceUSDC - a.priceUSDC);
        break;
    }
    
    return sorted;
  }
  
  /**
   * Add a mystery box tier (for testing/setup)
   */
  async addMysteryBoxTier(tier: MysteryBoxTier): Promise<void> {
    this.mysteryBoxTiers.set(tier.id, tier);
  }
  
  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    this.listings.clear();
    this.activeListingsIndex.clear();
    this.userListingsIndex.clear();
    this.mysteryBoxTiers.clear();
    this.mysteryBoxPurchases.clear();
    this.transactions.clear();
    this.userTransactionsIndex.clear();
  }
}
