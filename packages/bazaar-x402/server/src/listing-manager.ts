/**
 * Listing manager for marketplace operations
 * 
 * Handles creation, cancellation, and querying of item listings.
 */

import type {
  StorageAdapter,
  ItemAdapter,
  CurrencyAdapter,
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
 * Parameters for purchasing a listing
 */
export interface PurchaseListingParams {
  /** Listing ID to purchase */
  listingId: string;
  
  /** Buyer's username */
  buyerUsername: string;
  
  /** Buyer's wallet address */
  buyerWallet: string;
  
  /** Optional payment header (for x402 mode) */
  paymentHeader?: string;
}

/**
 * Result of listing purchase
 */
export interface PurchaseListingResult {
  /** Whether purchase was successful */
  success: boolean;
  
  /** HTTP status code (402 if payment required, 200 if success) */
  status: number;
  
  /** Payment requirements (if status is 402) */
  paymentRequired?: any;
  
  /** Transaction hash (if successful) */
  txHash?: string;
  
  /** Network ID (if successful) */
  networkId?: string;
  
  /** Purchased listing details (if successful) */
  listing?: Listing;
  
  /** Error message (if failed) */
  error?: string;
}

/**
 * Listing manager class
 * 
 * @example
 * ```typescript
 * const listingManager = new ListingManager(
 *   storageAdapter,
 *   itemAdapter,
 *   currencyAdapter
 * );
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
    private itemAdapter: ItemAdapter,
    private currencyAdapter: CurrencyAdapter
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
  
  /**
   * Purchase a listing
   * 
   * This method handles both mock and x402 payment modes:
   * 
   * Mock mode:
   * 1. Checks buyer balance
   * 2. Deducts currency from buyer
   * 3. Adds currency to seller
   * 4. Transfers item ownership
   * 5. Marks listing as sold
   * 6. Creates transaction records
   * 
   * x402 mode (without payment header):
   * 1. Returns 402 Payment Required with payment requirements
   * 
   * x402 mode (with payment header):
   * 1. Verifies payment on-chain
   * 2. Transfers item ownership
   * 3. Marks listing as sold
   * 4. Creates transaction records
   * 
   * @param params - Purchase parameters
   * @returns Purchase result
   * @throws {BazaarError} If validation fails or purchase cannot be completed
   */
  async purchaseListing(params: PurchaseListingParams): Promise<PurchaseListingResult> {
    // Get listing
    const listing = await this.storageAdapter.getListing(params.listingId);
    
    if (!listing) {
      throw new BazaarError(
        'LISTING_NOT_FOUND',
        `Listing ${params.listingId} not found`,
        404
      );
    }
    
    // Validate listing is active
    if (listing.status !== 'active') {
      throw new BazaarError(
        'LISTING_NOT_ACTIVE',
        `Listing ${params.listingId} is not active (status: ${listing.status})`,
        400
      );
    }
    
    // Validate buyer is not seller
    if (listing.sellerUsername === params.buyerUsername) {
      throw new BazaarError(
        'CANNOT_BUY_OWN_LISTING',
        'Cannot purchase your own listing',
        400
      );
    }
    
    // Handle payment based on mode
    let txHash: string;
    let networkId: string;
    
    if (!params.paymentHeader) {
      // No payment header: initiate purchase
      const initiation = await this.currencyAdapter.initiatePurchase({
        buyerId: params.buyerUsername,
        sellerId: listing.sellerUsername,
        amount: listing.priceUSDC,
        resource: `/api/listings/${params.listingId}`,
        description: `Purchase ${listing.itemType} from ${listing.sellerUsername}`,
      });
      
      // If payment is required (x402 mode), return 402
      if (initiation.paymentRequired) {
        return {
          success: false,
          status: 402,
          paymentRequired: initiation.requirements,
        };
      }
      
      // Mock mode: payment already processed
      // Deduct from buyer and add to seller
      try {
        const deduction = await this.currencyAdapter.deduct(
          params.buyerUsername,
          listing.priceUSDC
        );
        txHash = deduction.txId;
        networkId = 'mock';
        
        // Add currency to seller
        await this.currencyAdapter.add(
          listing.sellerUsername,
          listing.priceUSDC
        );
      } catch (error) {
        throw new BazaarError(
          'CURRENCY_TRANSFER_FAILED',
          `Failed to transfer currency: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    } else {
      // x402 mode with payment header: verify payment
      try {
        const verification = await this.currencyAdapter.verifyPurchase({
          paymentHeader: params.paymentHeader,
          expectedAmount: listing.priceUSDC,
          expectedRecipient: listing.sellerWallet,
        });
        
        if (!verification.success) {
          throw new BazaarError(
            'PAYMENT_VERIFICATION_FAILED',
            verification.error || 'Payment verification failed',
            400
          );
        }
        
        txHash = verification.txHash;
        networkId = verification.networkId;
      } catch (error) {
        throw new BazaarError(
          'PAYMENT_VERIFICATION_ERROR',
          `Payment verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    }
    
    // Transfer item ownership
    try {
      await this.itemAdapter.transferItem(
        listing.itemId,
        listing.sellerUsername,
        params.buyerUsername
      );
    } catch (error) {
      throw new BazaarError(
        'ITEM_TRANSFER_FAILED',
        `Failed to transfer item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
    
    // Mark listing as sold
    await this.storageAdapter.updateListingStatus(params.listingId, 'sold');
    
    // Create transaction record for buyer
    await this.currencyAdapter.recordTransaction({
      id: `${txHash}-buyer`,
      userId: params.buyerUsername,
      type: 'listing_purchase',
      amount: listing.priceUSDC,
      txId: txHash,
      networkId,
      timestamp: Date.now(),
      listingId: params.listingId,
      itemId: listing.itemId,
    });
    
    // Create transaction record for seller
    await this.currencyAdapter.recordTransaction({
      id: `${txHash}-seller`,
      userId: listing.sellerUsername,
      type: 'listing_sale',
      amount: listing.priceUSDC,
      txId: txHash,
      networkId,
      timestamp: Date.now(),
      listingId: params.listingId,
      itemId: listing.itemId,
    });
    
    return {
      success: true,
      status: 200,
      txHash,
      networkId,
      listing,
    };
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
