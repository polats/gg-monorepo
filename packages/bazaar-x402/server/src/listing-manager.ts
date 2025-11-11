/**
 * Listing manager for marketplace operations
 * 
 * Handles creation, cancellation, and querying of item listings.
 */

import type {
  StorageAdapter,
  ItemAdapter,
  Listing,
  PaginationOptions,
  PaginatedResult,
} from '@bazaar-x402/core';
import { BazaarError } from '@bazaar-x402/core';

/**
 * Parameters for creating a listing
 */
export interface CreateListingParams {
  /** Unique identifier for the item */
  itemId: string;
  
  /** Type of item (e.g., 'gem', 'nft', 'skin') */
  itemType: string;
  
  /** Game-specific item data */
  itemData?: any;
  
  /** Seller's username */
  sellerUsername: string;
  
  /** Seller's wallet address */
  sellerWallet: string;
  
  /** Price in USDC */
  priceUSDC: number;
  
  /** Optional expiration timestamp */
  expiresAt?: number;
}

/**
 * Listing manager class
 * 
 * @example
 * ```typescript
 * const listingManager = new ListingManager(storageAdapter, itemAdapter);
 * 
 * const listing = await listingManager.createListing({
 *   itemId: 'gem-123',
 *   itemType: 'gem',
 *   sellerUsername: 'player1',
 *   sellerWallet: 'wallet-address',
 *   priceUSDC: 5.0,
 * });
 * ```
 */
export class ListingManager {
  constructor(
    private storageAdapter: StorageAdapter,
    private itemAdapter: ItemAdapter
  ) {}
  
  /**
   * Create a new listing
   * 
   * This method:
   * 1. Validates that the seller owns the item
   * 2. Locks the item in the game inventory
   * 3. Creates the listing in storage
   * 
   * @param params - Listing creation parameters
   * @returns The created listing
   * @throws {BazaarError} If validation fails or item cannot be locked
   */
  async createListing(params: CreateListingParams): Promise<Listing> {
    // Validate item ownership
    const ownsItem = await this.itemAdapter.validateItemOwnership(
      params.itemId,
      params.sellerUsername
    );
    
    if (!ownsItem) {
      throw new BazaarError(
        'ITEM_NOT_OWNED',
        `User ${params.sellerUsername} does not own item ${params.itemId}`,
        403
      );
    }
    
    // Validate item exists
    const itemExists = await this.itemAdapter.validateItemExists(params.itemId);
    if (!itemExists) {
      throw new BazaarError(
        'ITEM_NOT_FOUND',
        `Item ${params.itemId} does not exist`,
        404
      );
    }
    
    // Lock the item
    try {
      await this.itemAdapter.lockItem(params.itemId, params.sellerUsername);
    } catch (error) {
      throw new BazaarError(
        'ITEM_LOCK_FAILED',
        `Failed to lock item ${params.itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
    
    // Create listing
    const listing: Listing = {
      id: this.generateListingId(),
      itemId: params.itemId,
      itemType: params.itemType,
      itemData: params.itemData ?? await this.itemAdapter.serializeItem(
        await this.getItemData(params.itemId)
      ),
      sellerWallet: params.sellerWallet,
      sellerUsername: params.sellerUsername,
      priceUSDC: params.priceUSDC,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: params.expiresAt,
    };
    
    try {
      await this.storageAdapter.createListing(listing);
    } catch (error) {
      // Rollback: unlock the item
      await this.itemAdapter.unlockItem(params.itemId, params.sellerUsername);
      
      throw new BazaarError(
        'LISTING_CREATION_FAILED',
        `Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
    
    return listing;
  }
  
  /**
   * Cancel a listing
   * 
   * This method:
   * 1. Validates that the listing exists and is active
   * 2. Validates that the user is the seller
   * 3. Updates the listing status to 'cancelled'
   * 4. Unlocks the item in the game inventory
   * 
   * @param listingId - The listing ID
   * @param username - The username requesting cancellation
   * @throws {BazaarError} If validation fails or item cannot be unlocked
   */
  async cancelListing(listingId: string, username: string): Promise<void> {
    // Get listing
    const listing = await this.storageAdapter.getListing(listingId);
    
    if (!listing) {
      throw new BazaarError(
        'LISTING_NOT_FOUND',
        `Listing ${listingId} not found`,
        404
      );
    }
    
    // Validate seller
    if (listing.sellerUsername !== username) {
      throw new BazaarError(
        'UNAUTHORIZED',
        `User ${username} is not the seller of listing ${listingId}`,
        403
      );
    }
    
    // Validate status
    if (listing.status !== 'active') {
      throw new BazaarError(
        'LISTING_NOT_ACTIVE',
        `Listing ${listingId} is not active (status: ${listing.status})`,
        400
      );
    }
    
    // Update listing status
    await this.storageAdapter.updateListingStatus(listingId, 'cancelled');
    
    // Unlock item
    try {
      await this.itemAdapter.unlockItem(listing.itemId, username);
    } catch (error) {
      // Log error but don't throw - listing is already cancelled
      console.error(`Failed to unlock item ${listing.itemId}:`, error);
    }
  }
  
  /**
   * Get active listings with pagination
   * 
   * @param options - Pagination and sorting options
   * @returns Paginated list of active listings
   */
  async getActiveListings(options: PaginationOptions = {}): Promise<PaginatedResult<Listing>> {
    return await this.storageAdapter.getActiveListings(options);
  }
  
  /**
   * Get all listings by a specific user
   * 
   * @param username - The user's username
   * @returns Array of listings
   */
  async getListingsByUser(username: string): Promise<Listing[]> {
    return await this.storageAdapter.getListingsByUser(username);
  }
  
  /**
   * Get a specific listing by ID
   * 
   * @param listingId - The listing ID
   * @returns The listing or null if not found
   */
  async getListing(listingId: string): Promise<Listing | null> {
    return await this.storageAdapter.getListing(listingId);
  }
  
  // ===== Private Helper Methods =====
  
  /**
   * Generate a unique listing ID
   */
  private generateListingId(): string {
    return `listing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Get item data (placeholder - actual implementation depends on item adapter)
   */
  private async getItemData(itemId: string): Promise<any> {
    // This would typically fetch the item from the game's storage
    // For now, return a placeholder
    return { itemId };
  }
}
