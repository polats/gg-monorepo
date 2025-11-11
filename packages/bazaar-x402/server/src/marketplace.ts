/**
 * Main Bazaar marketplace class
 * 
 * Integrates listing management, mystery boxes, and payment processing.
 */

import type {
  StorageAdapter,
  ItemAdapter,
  PaymentAdapter,
  CurrencyAdapter,
  Listing,
  Transaction,
} from '@bazaar-x402/core';
import { BazaarError } from '@bazaar-x402/core';
import {
  ListingManager,
  type CreateListingParams,
  type PurchaseListingParams,
  type PurchaseListingResult,
} from './listing-manager.js';
import { MysteryBoxManager, type PurchaseMysteryBoxParams } from './mystery-box-manager.js';

/**
 * Configuration for BazaarMarketplace
 */
export interface BazaarMarketplaceConfig {
  /** Storage adapter for persistence */
  storageAdapter: StorageAdapter;
  
  /** Item adapter for game integration */
  itemAdapter: ItemAdapter;
  
  /** Payment adapter (mock or real) - deprecated, use currencyAdapter */
  paymentAdapter?: PaymentAdapter;
  
  /** Currency adapter for currency operations */
  currencyAdapter?: CurrencyAdapter;
  
  /** Enable mock mode (bypasses payment verification) */
  mockMode?: boolean;
}

/**
 * Result of a purchase request
 */
export interface PurchaseRequestResult {
  /** Whether payment is required (402) or completed (200) */
  requiresPayment: boolean;
  
  /** Payment requirements (if requiresPayment is true) */
  paymentRequirements?: any;
  
  /** Purchase result (if requiresPayment is false) */
  purchaseResult?: {
    success: boolean;
    message: string;
    item: any;
    txHash?: string;
  };
}

/**
 * Main Bazaar marketplace class
 * 
 * @example
 * ```typescript
 * const marketplace = new BazaarMarketplace({
 *   storageAdapter: new MemoryStorageAdapter(),
 *   itemAdapter: new MyGameItemAdapter(),
 *   paymentAdapter: new MockPaymentAdapter(),
 *   mockMode: true,
 * });
 * 
 * // Create listing
 * const listing = await marketplace.createListing({
 *   itemId: 'gem-123',
 *   itemType: 'gem',
 *   sellerUsername: 'player1',
 *   sellerWallet: 'wallet-address',
 *   priceUSDC: 5.0,
 * });
 * 
 * // Purchase listing (mock mode)
 * const result = await marketplace.handlePurchaseRequest('listing-123');
 * ```
 */
export class BazaarMarketplace {
  private listingManager: ListingManager;
  private mysteryBoxManager: MysteryBoxManager;
  private mockMode: boolean;
  
  constructor(private config: BazaarMarketplaceConfig) {
    // Use currencyAdapter if provided, otherwise fall back to paymentAdapter for backwards compatibility
    if (!config.currencyAdapter && !config.paymentAdapter) {
      throw new BazaarError(
        'MISSING_ADAPTER',
        'Either currencyAdapter or paymentAdapter must be provided',
        500
      );
    }
    
    this.listingManager = new ListingManager(
      config.storageAdapter,
      config.itemAdapter,
      config.currencyAdapter!
    );
    this.mysteryBoxManager = new MysteryBoxManager(
      config.storageAdapter,
      config.itemAdapter
    );
    this.mockMode = config.mockMode ?? false;
  }
  
  // ===== Listing Operations =====
  
  /**
   * Create a new listing
   */
  async createListing(params: CreateListingParams): Promise<Listing> {
    return await this.listingManager.createListing(params);
  }
  
  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string, username: string): Promise<void> {
    return await this.listingManager.cancelListing(listingId, username);
  }
  
  /**
   * Get active listings
   */
  async getActiveListings(options: any = {}): Promise<any> {
    return await this.listingManager.getActiveListings(options);
  }
  
  /**
   * Get listings by user
   */
  async getListingsByUser(username: string): Promise<Listing[]> {
    return await this.listingManager.getListingsByUser(username);
  }
  
  /**
   * Get a specific listing
   */
  async getListing(listingId: string): Promise<Listing | null> {
    return await this.listingManager.getListing(listingId);
  }
  
  /**
   * Purchase a listing
   * 
   * Handles both mock and x402 payment modes:
   * - Mock mode: Deducts from buyer, adds to seller, transfers item
   * - x402 mode (no payment header): Returns 402 Payment Required
   * - x402 mode (with payment header): Verifies payment and transfers item
   * 
   * @param params - Purchase parameters
   * @returns Purchase result
   */
  async purchaseListing(params: PurchaseListingParams): Promise<PurchaseListingResult> {
    return await this.listingManager.purchaseListing(params);
  }
  
  // ===== Purchase Operations (Legacy) =====
  
  /**
   * Handle purchase request
   * 
   * In mock mode: Returns 200 with completed purchase
   * In real mode: Returns 402 with payment requirements
   * 
   * @param listingId - The listing ID
   * @param buyerUsername - The buyer's username (for mock mode)
   * @param buyerWallet - The buyer's wallet (for mock mode)
   * @returns Purchase request result
   */
  async handlePurchaseRequest(
    listingId: string,
    buyerUsername?: string,
    buyerWallet?: string
  ): Promise<PurchaseRequestResult> {
    // Get listing
    const listing = await this.listingManager.getListing(listingId);
    
    if (!listing) {
      throw new BazaarError(
        'LISTING_NOT_FOUND',
        `Listing ${listingId} not found`,
        404
      );
    }
    
    if (listing.status !== 'active') {
      throw new BazaarError(
        'LISTING_NOT_ACTIVE',
        `Listing ${listingId} is not active`,
        400
      );
    }
    
    // Mock mode: Complete purchase immediately
    if (this.mockMode) {
      const result = await this.verifyAndCompletePurchase(
        listingId,
        '',
        buyerUsername,
        buyerWallet
      );
      return {
        requiresPayment: false,
        purchaseResult: result,
      };
    }
    
    // Real mode: Return payment requirements
    if (!this.config.paymentAdapter) {
      throw new BazaarError(
        'MISSING_ADAPTER',
        'Payment adapter is required for real mode',
        500
      );
    }
    
    const paymentRequirements = this.config.paymentAdapter.createPaymentRequirements({
      priceUSDC: listing.priceUSDC,
      sellerWallet: listing.sellerWallet,
      resource: `/api/bazaar/purchase/${listingId}`,
      description: `Purchase ${listing.itemType} listing`,
    });
    
    return {
      requiresPayment: true,
      paymentRequirements,
    };
  }
  
  /**
   * Verify payment and complete purchase
   * 
   * @param listingId - The listing ID
   * @param paymentHeader - The X-Payment header (empty in mock mode)
   * @param buyerUsername - The buyer's username (for mock mode)
   * @param buyerWallet - The buyer's wallet (for mock mode)
   * @returns Purchase result
   */
  async verifyAndCompletePurchase(
    listingId: string,
    paymentHeader: string,
    buyerUsername?: string,
    buyerWallet?: string
  ): Promise<{ success: boolean; message: string; item: any; txHash?: string }> {
    // Get listing
    const listing = await this.listingManager.getListing(listingId);
    
    if (!listing) {
      throw new BazaarError(
        'LISTING_NOT_FOUND',
        `Listing ${listingId} not found`,
        404
      );
    }
    
    if (listing.status !== 'active') {
      throw new BazaarError(
        'LISTING_NOT_ACTIVE',
        `Listing ${listingId} is not active`,
        400
      );
    }
    
    // Verify payment
    if (!this.config.paymentAdapter) {
      throw new BazaarError(
        'MISSING_ADAPTER',
        'Payment adapter is required for payment verification',
        500
      );
    }
    
    const verificationResult = await this.config.paymentAdapter.verifyPayment({
      paymentHeader,
      expectedAmount: listing.priceUSDC,
      expectedRecipient: listing.sellerWallet,
    });
    
    if (!verificationResult.success) {
      throw new BazaarError(
        'PAYMENT_VERIFICATION_FAILED',
        'Payment verification failed',
        402
      );
    }
    
    // Execute atomic trade
    await this.config.storageAdapter.executeAtomicTrade([
      {
        type: 'update_listing',
        data: { listingId, status: 'sold' },
      },
      {
        type: 'record_transaction',
        data: {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: 'listing_purchase',
          buyerUsername: 'buyer', // Would come from request context
          buyerWallet: 'buyer-wallet', // Would come from payment verification
          sellerUsername: listing.sellerUsername,
          sellerWallet: listing.sellerWallet,
          listingId: listingId,
          priceUSDC: listing.priceUSDC,
          items: [{
            id: listing.itemId,
            type: listing.itemType,
            data: listing.itemData,
          }],
          txHash: verificationResult.txHash,
          timestamp: Date.now(),
        } as Transaction,
      },
    ]);
    
    // Transfer item to buyer
    const buyer = buyerUsername || 'buyer';
    await this.config.itemAdapter.transferItem(
      listing.itemId,
      listing.sellerUsername,
      buyer
    );
    
    return {
      success: true,
      message: this.mockMode ? 'Purchase completed (mock mode)' : 'Purchase completed',
      item: listing.itemData,
      txHash: verificationResult.txHash,
    };
  }
  
  // ===== Mystery Box Operations =====
  
  /**
   * Handle mystery box purchase request
   * 
   * In mock mode: Returns 200 with completed purchase
   * In real mode: Returns 402 with payment requirements
   * 
   * @param tierId - The tier ID
   * @returns Purchase request result
   */
  async handleMysteryBoxRequest(tierId: string): Promise<PurchaseRequestResult> {
    // Get tier
    const tier = await this.mysteryBoxManager.getTier(tierId);
    
    if (!tier) {
      throw new BazaarError(
        'MYSTERY_BOX_TIER_NOT_FOUND',
        `Mystery box tier ${tierId} not found`,
        404
      );
    }
    
    // Mock mode: Complete purchase immediately
    if (this.mockMode) {
      const result = await this.verifyAndCompleteMysteryBox(tierId, '', {
        buyerUsername: 'mock-buyer',
        buyerWallet: 'mock-wallet',
      });
      return {
        requiresPayment: false,
        purchaseResult: {
          success: true,
          message: 'Mystery box purchased (mock mode)',
          item: result.itemGenerated,
          txHash: result.txHash,
        },
      };
    }
    
    // Real mode: Return payment requirements
    if (!this.config.paymentAdapter) {
      throw new BazaarError(
        'MISSING_ADAPTER',
        'Payment adapter is required for real mode',
        500
      );
    }
    
    const paymentRequirements = this.config.paymentAdapter.createPaymentRequirements({
      priceUSDC: tier.priceUSDC,
      sellerWallet: 'platform-wallet', // Platform receives mystery box payments
      resource: `/api/bazaar/mystery-box/${tierId}`,
      description: `Purchase ${tier.name} mystery box`,
    });
    
    return {
      requiresPayment: true,
      paymentRequirements,
    };
  }
  
  /**
   * Verify payment and complete mystery box purchase
   * 
   * @param tierId - The tier ID
   * @param paymentHeader - The X-Payment header (empty in mock mode)
   * @param buyerInfo - Buyer information
   * @returns Purchase record
   */
  async verifyAndCompleteMysteryBox(
    tierId: string,
    paymentHeader: string,
    buyerInfo: { buyerUsername: string; buyerWallet: string }
  ): Promise<any> {
    // Get tier
    const tier = await this.mysteryBoxManager.getTier(tierId);
    
    if (!tier) {
      throw new BazaarError(
        'MYSTERY_BOX_TIER_NOT_FOUND',
        `Mystery box tier ${tierId} not found`,
        404
      );
    }
    
    // Verify payment
    if (!this.config.paymentAdapter) {
      throw new BazaarError(
        'MISSING_ADAPTER',
        'Payment adapter is required for payment verification',
        500
      );
    }
    
    const verificationResult = await this.config.paymentAdapter.verifyPayment({
      paymentHeader,
      expectedAmount: tier.priceUSDC,
      expectedRecipient: 'platform-wallet',
    });
    
    if (!verificationResult.success) {
      throw new BazaarError(
        'PAYMENT_VERIFICATION_FAILED',
        'Payment verification failed',
        402
      );
    }
    
    // Purchase mystery box
    const purchase = await this.mysteryBoxManager.purchaseMysteryBox({
      tierId,
      buyerUsername: buyerInfo.buyerUsername,
      buyerWallet: buyerInfo.buyerWallet,
      txHash: verificationResult.txHash,
    });
    
    return purchase;
  }
  
  /**
   * Get all mystery box tiers
   */
  async getMysteryBoxTiers(): Promise<any[]> {
    return await this.mysteryBoxManager.getAllTiers();
  }
}
