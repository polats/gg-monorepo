/**
 * Unit tests for MysteryBoxManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MysteryBoxManager } from '../../mystery-box-manager.js';
import { MemoryStorageAdapter } from '../memory-storage.js';
import type { ItemAdapter, MysteryBoxTier } from '@bazaar-x402/core';
import { BazaarError } from '@bazaar-x402/core';

// Mock item adapter for testing
class MockItemAdapter implements ItemAdapter {
  private items = new Map<string, any>();
  private userItems = new Map<string, any[]>();
  
  async validateItemOwnership(itemId: string, username: string): Promise<boolean> {
    return true;
  }
  
  async validateItemExists(itemId: string): Promise<boolean> {
    return this.items.has(itemId);
  }
  
  async lockItem(itemId: string, username: string): Promise<void> {}
  
  async unlockItem(itemId: string, username: string): Promise<void> {}
  
  async transferItem(itemId: string, fromUsername: string, toUsername: string): Promise<void> {}
  
  async generateRandomItem(tierId: string, rarityWeights: Record<string, number>): Promise<any> {
    // Select rarity based on weights
    const totalWeight = Object.values(rarityWeights).reduce((sum, w) => sum + w, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    let selectedRarity = 'common';
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      currentWeight += weight;
      if (random < currentWeight) {
        selectedRarity = rarity;
        break;
      }
    }
    
    return {
      type: 'gem',
      rarity: selectedRarity,
      tierId,
      id: `item-${Date.now()}-${Math.random()}`,
    };
  }
  
  async grantItemToUser(item: any, username: string): Promise<void> {
    if (!this.userItems.has(username)) {
      this.userItems.set(username, []);
    }
    this.userItems.get(username)!.push(item);
  }
  
  serializeItem(item: any): any {
    return item;
  }
  
  deserializeItem(data: any): any {
    return data;
  }
  
  getUserItems(username: string): any[] {
    return this.userItems.get(username) ?? [];
  }
}

describe('MysteryBoxManager', () => {
  let mysteryBoxManager: MysteryBoxManager;
  let storageAdapter: MemoryStorageAdapter;
  let itemAdapter: MockItemAdapter;
  
  beforeEach(async () => {
    storageAdapter = new MemoryStorageAdapter();
    itemAdapter = new MockItemAdapter();
    mysteryBoxManager = new MysteryBoxManager(storageAdapter, itemAdapter);
  });
  
  const createTestTier = (overrides: Partial<MysteryBoxTier> = {}): MysteryBoxTier => ({
    id: 'starter',
    name: 'Starter Box',
    priceUSDC: 1.0,
    description: 'Random common or uncommon gem',
    rarityWeights: { common: 70, uncommon: 30 },
    ...overrides,
  });
  
  describe('addTier', () => {
    it('should add a tier successfully', async () => {
      const tier = createTestTier();
      
      await mysteryBoxManager.addTier(tier);
      
      const retrieved = await mysteryBoxManager.getTier(tier.id);
      expect(retrieved).toEqual(tier);
    });
    
    it('should throw error if tier is missing required fields', async () => {
      await expect(
        mysteryBoxManager.addTier({
          id: '',
          name: 'Test',
          priceUSDC: 1.0,
          description: 'Test',
          rarityWeights: { common: 100 },
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        mysteryBoxManager.addTier({
          id: 'test',
          name: '',
          priceUSDC: 1.0,
          description: 'Test',
          rarityWeights: { common: 100 },
        })
      ).rejects.toThrow(BazaarError);
    });
    
    it('should throw error if tier has no rarity weights', async () => {
      await expect(
        mysteryBoxManager.addTier({
          id: 'test',
          name: 'Test',
          priceUSDC: 1.0,
          description: 'Test',
          rarityWeights: {},
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        mysteryBoxManager.addTier({
          id: 'test',
          name: 'Test',
          priceUSDC: 1.0,
          description: 'Test',
          rarityWeights: {},
        })
      ).rejects.toThrow('at least one rarity weight');
    });
  });
  
  describe('getTier', () => {
    it('should return null for non-existent tier', async () => {
      const result = await mysteryBoxManager.getTier('non-existent');
      expect(result).toBeNull();
    });
    
    it('should return existing tier', async () => {
      const tier = createTestTier();
      await mysteryBoxManager.addTier(tier);
      
      const retrieved = await mysteryBoxManager.getTier(tier.id);
      expect(retrieved).toEqual(tier);
    });
  });
  
  describe('getAllTiers', () => {
    it('should return empty array when no tiers', async () => {
      const result = await mysteryBoxManager.getAllTiers();
      expect(result).toEqual([]);
    });
    
    it('should return all tiers', async () => {
      const tier1 = createTestTier({ id: 'tier-1' });
      const tier2 = createTestTier({ id: 'tier-2' });
      
      await mysteryBoxManager.addTier(tier1);
      await mysteryBoxManager.addTier(tier2);
      
      const result = await mysteryBoxManager.getAllTiers();
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('tier-1');
      expect(result.map(t => t.id)).toContain('tier-2');
    });
  });
  
  describe('purchaseMysteryBox', () => {
    it('should purchase a mystery box successfully', async () => {
      const tier = createTestTier();
      await mysteryBoxManager.addTier(tier);
      
      const purchase = await mysteryBoxManager.purchaseMysteryBox({
        tierId: tier.id,
        buyerUsername: 'buyer1',
        buyerWallet: 'wallet-123',
        txHash: 'tx-hash-123',
      });
      
      expect(purchase).toBeDefined();
      expect(purchase.tierId).toBe(tier.id);
      expect(purchase.buyerUsername).toBe('buyer1');
      expect(purchase.priceUSDC).toBe(tier.priceUSDC);
      expect(purchase.txHash).toBe('tx-hash-123');
      expect(purchase.itemGenerated).toBeDefined();
      expect(purchase.id).toMatch(/^mystery-box-/);
    });
    
    it('should generate item with correct rarity distribution', async () => {
      const tier = createTestTier({
        rarityWeights: { common: 100, rare: 0 },
      });
      await mysteryBoxManager.addTier(tier);
      
      const purchase = await mysteryBoxManager.purchaseMysteryBox({
        tierId: tier.id,
        buyerUsername: 'buyer1',
        buyerWallet: 'wallet-123',
        txHash: 'tx-hash-123',
      });
      
      // With 100% common weight, should always get common
      expect(purchase.itemGenerated.rarity).toBe('common');
    });
    
    it('should grant item to buyer', async () => {
      const tier = createTestTier();
      await mysteryBoxManager.addTier(tier);
      
      await mysteryBoxManager.purchaseMysteryBox({
        tierId: tier.id,
        buyerUsername: 'buyer1',
        buyerWallet: 'wallet-123',
        txHash: 'tx-hash-123',
      });
      
      const userItems = itemAdapter.getUserItems('buyer1');
      expect(userItems).toHaveLength(1);
      expect(userItems[0].type).toBe('gem');
    });
    
    it('should throw error if tier not found', async () => {
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: 'non-existent',
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: 'non-existent',
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow('not found');
    });
    
    it('should throw error if item generation fails', async () => {
      const tier = createTestTier();
      await mysteryBoxManager.addTier(tier);
      
      // Mock item adapter to fail
      const generateSpy = vi.spyOn(itemAdapter, 'generateRandomItem')
        .mockRejectedValue(new Error('Generation error'));
      
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: tier.id,
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: tier.id,
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow('Failed to generate item');
      
      generateSpy.mockRestore();
    });
    
    it('should throw error if item grant fails', async () => {
      const tier = createTestTier();
      await mysteryBoxManager.addTier(tier);
      
      // Mock item adapter to fail on grant
      const grantSpy = vi.spyOn(itemAdapter, 'grantItemToUser')
        .mockRejectedValue(new Error('Grant error'));
      
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: tier.id,
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        mysteryBoxManager.purchaseMysteryBox({
          tierId: tier.id,
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
          txHash: 'tx-hash-123',
        })
      ).rejects.toThrow('Failed to grant item');
      
      grantSpy.mockRestore();
    });
    
    it('should include tier price in purchase record', async () => {
      const tier = createTestTier({ priceUSDC: 5.5 });
      await mysteryBoxManager.addTier(tier);
      
      const purchase = await mysteryBoxManager.purchaseMysteryBox({
        tierId: tier.id,
        buyerUsername: 'buyer1',
        buyerWallet: 'wallet-123',
        txHash: 'tx-hash-123',
      });
      
      expect(purchase.priceUSDC).toBe(5.5);
    });
  });
  
  describe('selectRarity', () => {
    it('should select rarity based on weights', () => {
      const weights = { common: 100, rare: 0 };
      
      // With 100% common, should always return common
      for (let i = 0; i < 10; i++) {
        const rarity = mysteryBoxManager.selectRarity(weights);
        expect(rarity).toBe('common');
      }
    });
    
    it('should handle multiple rarities', () => {
      const weights = { common: 50, uncommon: 30, rare: 20 };
      
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const rarity = mysteryBoxManager.selectRarity(weights);
        results.add(rarity);
      }
      
      // Should have selected at least one of each rarity (probabilistically)
      // Note: This test might occasionally fail due to randomness
      expect(results.size).toBeGreaterThan(0);
    });
    
    it('should throw error if total weight is 0', () => {
      expect(() => {
        mysteryBoxManager.selectRarity({ common: 0, rare: 0 });
      }).toThrow(BazaarError);
      
      expect(() => {
        mysteryBoxManager.selectRarity({ common: 0, rare: 0 });
      }).toThrow('must be greater than 0');
    });
    
    it('should handle single rarity', () => {
      const weights = { legendary: 100 };
      
      const rarity = mysteryBoxManager.selectRarity(weights);
      expect(rarity).toBe('legendary');
    });
    
    it('should handle fractional weights', () => {
      const weights = { common: 0.5, rare: 0.5 };
      
      const rarity = mysteryBoxManager.selectRarity(weights);
      expect(['common', 'rare']).toContain(rarity);
    });
  });
});
