/**
 * Mystery box manager for randomized item purchases
 * 
 * Handles mystery box tier configuration, random item generation,
 * and purchase recording.
 */

import type {
  StorageAdapter,
  ItemAdapter,
  MysteryBoxTier,
  MysteryBoxPurchase,
} from '@bazaar-x402/core';
import { BazaarError } from '@bazaar-x402/core';

/**
 * Parameters for purchasing a mystery box
 */
export interface PurchaseMysteryBoxParams {
  /** Tier ID */
  tierId: string;
  
  /** Buyer's username */
  buyerUsername: string;
  
  /** Buyer's wallet address */
  buyerWallet: string;
  
  /** Transaction hash */
  txHash: string;
}

/**
 * Mystery box manager class
 * 
 * @example
 * ```typescript
 * const mysteryBoxManager = new MysteryBoxManager(storageAdapter, itemAdapter);
 * 
 * // Add tiers
 * await mysteryBoxManager.addTier({
 *   id: 'starter',
 *   name: 'Starter Box',
 *   priceUSDC: 1.0,
 *   description: 'Random common or uncommon gem',
 *   rarityWeights: { common: 70, uncommon: 30 },
 * });
 * 
 * // Purchase mystery box
 * const result = await mysteryBoxManager.purchaseMysteryBox({
 *   tierId: 'starter',
 *   buyerUsername: 'player1',
 *   buyerWallet: 'wallet-address',
 *   txHash: 'tx-hash-123',
 * });
 * ```
 */
export class MysteryBoxManager {
  constructor(
    private storageAdapter: StorageAdapter,
    private itemAdapter: ItemAdapter
  ) {}
  
  /**
   * Add a mystery box tier
   * 
   * @param tier - The tier configuration
   */
  async addTier(tier: MysteryBoxTier): Promise<void> {
    // Validate tier
    if (!tier.id || !tier.name || !tier.priceUSDC) {
      throw new BazaarError(
        'INVALID_TIER',
        'Tier must have id, name, and priceUSDC',
        400
      );
    }
    
    if (!tier.rarityWeights || Object.keys(tier.rarityWeights).length === 0) {
      throw new BazaarError(
        'INVALID_TIER',
        'Tier must have at least one rarity weight',
        400
      );
    }
    
    // Store tier (using the addMysteryBoxTier method if available)
    if ('addMysteryBoxTier' in this.storageAdapter) {
      await (this.storageAdapter as any).addMysteryBoxTier(tier);
    } else {
      throw new BazaarError(
        'STORAGE_NOT_SUPPORTED',
        'Storage adapter does not support adding mystery box tiers',
        500
      );
    }
  }
  
  /**
   * Get a mystery box tier by ID
   * 
   * @param tierId - The tier ID
   * @returns The tier or null if not found
   */
  async getTier(tierId: string): Promise<MysteryBoxTier | null> {
    return await this.storageAdapter.getMysteryBoxTier(tierId);
  }
  
  /**
   * Get all available mystery box tiers
   * 
   * @returns Array of all tiers
   */
  async getAllTiers(): Promise<MysteryBoxTier[]> {
    return await this.storageAdapter.getAllMysteryBoxTiers();
  }
  
  /**
   * Purchase a mystery box
   * 
   * This method:
   * 1. Validates that the tier exists
   * 2. Generates a random item based on rarity weights
   * 3. Grants the item to the buyer
   * 4. Records the purchase
   * 
   * @param params - Purchase parameters
   * @returns The purchase record with generated item
   * @throws {BazaarError} If tier not found or item generation fails
   */
  async purchaseMysteryBox(params: PurchaseMysteryBoxParams): Promise<MysteryBoxPurchase> {
    // Get tier
    const tier = await this.storageAdapter.getMysteryBoxTier(params.tierId);
    
    if (!tier) {
      throw new BazaarError(
        'MYSTERY_BOX_TIER_NOT_FOUND',
        `Mystery box tier ${params.tierId} not found`,
        404
      );
    }
    
    // Generate random item
    let generatedItem: any;
    try {
      generatedItem = await this.itemAdapter.generateRandomItem(
        params.tierId,
        tier.rarityWeights
      );
    } catch (error) {
      throw new BazaarError(
        'ITEM_GENERATION_FAILED',
        `Failed to generate item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
    
    // Grant item to buyer
    try {
      await this.itemAdapter.grantItemToUser(generatedItem, params.buyerUsername);
    } catch (error) {
      throw new BazaarError(
        'ITEM_GRANT_FAILED',
        `Failed to grant item to user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
    
    // Create purchase record
    const purchase: MysteryBoxPurchase = {
      id: this.generatePurchaseId(),
      tierId: params.tierId,
      buyerWallet: params.buyerWallet,
      buyerUsername: params.buyerUsername,
      priceUSDC: tier.priceUSDC,
      itemGenerated: this.itemAdapter.serializeItem(generatedItem),
      txHash: params.txHash,
      timestamp: Date.now(),
    };
    
    // Record purchase
    await this.storageAdapter.recordMysteryBoxPurchase(purchase);
    
    return purchase;
  }
  
  /**
   * Generate a random item based on weighted rarities
   * 
   * This is a helper method that can be used independently of purchasing.
   * 
   * @param rarityWeights - Rarity weights (e.g., { common: 70, rare: 30 })
   * @returns The selected rarity
   */
  selectRarity(rarityWeights: Record<string, number>): string {
    // Calculate total weight
    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      throw new BazaarError(
        'INVALID_WEIGHTS',
        'Total rarity weight must be greater than 0',
        400
      );
    }
    
    // Generate random number
    const random = Math.random() * totalWeight;
    
    // Select rarity based on weight
    let currentWeight = 0;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      currentWeight += weight;
      if (random < currentWeight) {
        return rarity;
      }
    }
    
    // Fallback to first rarity (should never happen)
    return Object.keys(rarityWeights)[0];
  }
  
  // ===== Private Helper Methods =====
  
  /**
   * Generate a unique purchase ID
   */
  private generatePurchaseId(): string {
    return `mystery-box-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
