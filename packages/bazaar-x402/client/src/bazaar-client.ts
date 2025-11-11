/**
 * BazaarClient - Main client SDK for interacting with Bazaar marketplace
 */

import type {
  Listing,
  CreateListingParams,
  SolanaNetwork,
  MysteryBoxResult,
  MysteryBoxTier,
} from '@bazaar-x402/core';
import type { WalletAdapter } from './wallet-adapter';

/**
 * Result of a purchase operation
 */
export interface PurchaseResult {
  /** Whether the purchase was successful */
  success: boolean;
  
  /** The item that was purchased */
  item: any;
  
  /** Transaction hash/signature */
  txHash: string;
  
  /** Optional message */
  message?: string;
}

/**
 * Configuration for BazaarClient
 */
export interface BazaarClientConfig {
  /** Base URL of the API server */
  apiBaseUrl: string;
  
  /** Wallet adapter for signing transactions */
  walletAdapter: WalletAdapter;
  
  /** Solana network to use */
  network: SolanaNetwork;
  
  /** Enable mock mode (skips x402 payment flow) */
  mockMode?: boolean;
}

/**
 * Pagination options for listing queries
 */
export interface PaginationOptions {
  /** Cursor for pagination (listing ID or timestamp) */
  cursor?: string;
  
  /** Number of items per page (default 20, max 100) */
  limit?: number;
  
  /** Sort order */
  sortBy?: 'newest' | 'price_low' | 'price_high';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of items */
  items: T[];
  
  /** Cursor for next page (if available) */
  nextCursor?: string;
  
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Main client class for Bazaar marketplace
 */
export class BazaarClient {
  private config: BazaarClientConfig;
  
  constructor(config: BazaarClientConfig) {
    this.config = config;
    console.log('[BazaarClient] Initialized', {
      apiBaseUrl: config.apiBaseUrl,
      network: config.network,
      mockMode: config.mockMode ?? false,
    });
  }
  
  /**
   * Get active listings from the marketplace
   */
  async getActiveListings(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Listing>> {
    const params = new URLSearchParams();
    
    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    
    const url = `${this.config.apiBaseUrl}/bazaar/listings?${params.toString()}`;
    
    console.log('[BazaarClient] Fetching active listings:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('[BazaarClient] Fetched listings:', result);
    
    return result;
  }
  
  /**
   * Create a new listing
   */
  async createListing(params: CreateListingParams): Promise<Listing> {
    const url = `${this.config.apiBaseUrl}/bazaar/listings`;
    
    console.log('[BazaarClient] Creating listing:', params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to create listing: ${error.message || response.statusText}`);
    }
    
    const listing = await response.json();
    
    console.log('[BazaarClient] Created listing:', listing);
    
    return listing;
  }
  
  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string): Promise<void> {
    const url = `${this.config.apiBaseUrl}/bazaar/listings/${listingId}`;
    
    console.log('[BazaarClient] Cancelling listing:', listingId);
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to cancel listing: ${error.message || response.statusText}`);
    }
    
    console.log('[BazaarClient] Cancelled listing:', listingId);
  }
  
  /**
   * Get listings created by the current user
   */
  async getMyListings(): Promise<Listing[]> {
    const url = `${this.config.apiBaseUrl}/bazaar/listings/my`;
    
    console.log('[BazaarClient] Fetching my listings');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch my listings: ${response.statusText}`);
    }
    
    const listings = await response.json();
    
    console.log('[BazaarClient] Fetched my listings:', listings);
    
    return listings;
  }
  
  /**
   * Check if mock mode is enabled
   */
  get isMockMode(): boolean {
    return this.config.mockMode ?? false;
  }
  
  /**
   * Get the configured network
   */
  get network(): SolanaNetwork {
    return this.config.network;
  }
  
  /**
   * Get the wallet adapter
   */
  get wallet(): WalletAdapter {
    return this.config.walletAdapter;
  }
  
  /**
   * Purchase an item from a listing
   * In mock mode: simple GET request without payment
   * In real mode: handles x402 payment flow
   */
  async purchaseItem(listingId: string): Promise<PurchaseResult> {
    console.log('[BazaarClient] Purchasing item:', listingId, {
      mockMode: this.isMockMode,
    });
    
    if (this.isMockMode) {
      // Mock mode: simple GET request, server returns 200 immediately
      return this.purchaseItemMock(listingId);
    } else {
      // Real mode: handle x402 payment flow
      return this.purchaseItemReal(listingId);
    }
  }
  
  /**
   * Mock purchase flow - no payment required
   */
  private async purchaseItemMock(listingId: string): Promise<PurchaseResult> {
    const url = `${this.config.apiBaseUrl}/bazaar/purchase/${listingId}`;
    
    console.log('[BazaarClient] Mock purchase - GET:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to purchase item: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('[BazaarClient] Mock purchase complete:', result);
    
    return result;
  }
  
  /**
   * Real purchase flow - handles x402 payment
   */
  private async purchaseItemReal(listingId: string): Promise<PurchaseResult> {
    const url = `${this.config.apiBaseUrl}/bazaar/purchase/${listingId}`;
    
    console.log('[BazaarClient] Real purchase - requesting payment requirements');
    
    // Step 1: Request purchase (will get 402)
    let response = await fetch(url);
    
    if (response.status !== 402) {
      // If not 402, something went wrong or purchase already completed
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
    }
    
    // Step 2: Parse payment requirements
    const paymentRequired = await response.json();
    const requirements = paymentRequired.accepts[0];
    
    console.log('[BazaarClient] Payment required:', requirements);
    
    // Step 3: Connect wallet if not connected
    if (!this.config.walletAdapter.connected) {
      await this.config.walletAdapter.connect();
    }
    
    // Step 4: Create and sign transaction (simplified for now)
    // In real implementation, would create USDC transfer transaction
    const signature = await this.config.walletAdapter.signAndSendTransaction({
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
    });
    
    console.log('[BazaarClient] Transaction signed:', signature);
    
    // Step 5: Create payment payload
    const paymentPayload = {
      x402Version: 1,
      scheme: 'exact' as const,
      network: this.config.network,
      payload: {
        signature,
        from: this.config.walletAdapter.publicKey!,
        to: requirements.payTo,
        amount: requirements.maxAmountRequired,
        mint: requirements.asset,
      },
    };
    
    // Step 6: Encode and retry with payment header
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    
    console.log('[BazaarClient] Retrying with payment header');
    
    response = await fetch(url, {
      headers: {
        'X-Payment': paymentHeader,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Payment verification failed: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('[BazaarClient] Purchase complete:', result);
    
    return result;
  }
  
  /**
   * Purchase a mystery box
   * In mock mode: simple GET request without payment
   * In real mode: handles x402 payment flow
   */
  async purchaseMysteryBox(tierId: string): Promise<MysteryBoxResult> {
    console.log('[BazaarClient] Purchasing mystery box:', tierId, {
      mockMode: this.isMockMode,
    });
    
    if (this.isMockMode) {
      // Mock mode: simple GET request, server returns 200 immediately
      return this.purchaseMysteryBoxMock(tierId);
    } else {
      // Real mode: handle x402 payment flow
      return this.purchaseMysteryBoxReal(tierId);
    }
  }
  
  /**
   * Mock mystery box purchase - no payment required
   */
  private async purchaseMysteryBoxMock(tierId: string): Promise<MysteryBoxResult> {
    const url = `${this.config.apiBaseUrl}/bazaar/mystery-box/${tierId}`;
    
    console.log('[BazaarClient] Mock mystery box purchase - GET:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to purchase mystery box: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('[BazaarClient] Mock mystery box purchase complete:', result);
    
    return result;
  }
  
  /**
   * Get available mystery box tiers
   */
  async getMysteryBoxTiers(): Promise<MysteryBoxTier[]> {
    const url = `${this.config.apiBaseUrl}/bazaar/mystery-box/tiers`;
    
    console.log('[BazaarClient] Fetching mystery box tiers');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Failed to load mystery box tiers. Please try again.' 
      }));
      throw new Error(error.message || 'Failed to fetch mystery box tiers');
    }
    
    const tiers = await response.json();
    
    console.log('[BazaarClient] Fetched mystery box tiers:', tiers);
    
    return tiers;
  }
  
  /**
   * Real mystery box purchase - handles x402 payment
   */
  private async purchaseMysteryBoxReal(tierId: string): Promise<MysteryBoxResult> {
    const url = `${this.config.apiBaseUrl}/bazaar/mystery-box/${tierId}`;
    
    console.log('[BazaarClient] Real mystery box purchase - requesting payment requirements');
    
    // Step 1: Request purchase (will get 402)
    let response = await fetch(url);
    
    if (response.status !== 402) {
      // If not 402, something went wrong or purchase already completed
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
    }
    
    // Step 2: Parse payment requirements
    const paymentRequired = await response.json();
    const requirements = paymentRequired.accepts[0];
    
    console.log('[BazaarClient] Payment required:', requirements);
    
    // Step 3: Connect wallet if not connected
    if (!this.config.walletAdapter.connected) {
      await this.config.walletAdapter.connect();
    }
    
    // Step 4: Create and sign transaction
    const signature = await this.config.walletAdapter.signAndSendTransaction({
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
    });
    
    console.log('[BazaarClient] Transaction signed:', signature);
    
    // Step 5: Create payment payload
    const paymentPayload = {
      x402Version: 1,
      scheme: 'exact' as const,
      network: this.config.network,
      payload: {
        signature,
        from: this.config.walletAdapter.publicKey!,
        to: requirements.payTo,
        amount: requirements.maxAmountRequired,
        mint: requirements.asset,
      },
    };
    
    // Step 6: Encode and retry with payment header
    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    
    console.log('[BazaarClient] Retrying with payment header');
    
    response = await fetch(url, {
      headers: {
        'X-Payment': paymentHeader,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Payment verification failed: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('[BazaarClient] Mystery box purchase complete:', result);
    
    return result;
  }
}
