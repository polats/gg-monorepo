/**
 * Integration tests for BazaarMarketplace
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BazaarMarketplace } from '../marketplace.js';
import { MemoryStorageAdapter } from '../adapters/memory-storage.js';
import { MockPaymentAdapter } from '../adapters/mock-payment.js';
import type { ItemAdapter } from '@bazaar-x402/core';
import { BazaarError } from '@bazaar-x402/core';

// Mock item adapter for testing
class MockItemAdapter implements ItemAdapter {
  private items = new Map<string, { owner: string; locked: boolean }>();
  
  addItem(itemId: string, owner: string) {
    this.items.set(itemId, { owner, locked: false });
  }
  
  async validateItemOwnership(itemId: string, username: string): Promise<boolean> {
    const item = this.items.get(itemId);
    return item?.owner === username;
  }
  
  async validateItemExists(itemId: string): Promise<boolean> {
    return this.items.has(itemId);
  }
  
  async lockItem(itemId: string, username: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) throw new Error('Item not found');
    if (item.owner !== username) throw new Error('Not owner');
    if (item.locked) throw new Error('Already locked');
    item.locked = true;
  }
  
  async unlockItem(itemId: string, username: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) throw new Error('Item not found');
    if (item.owner !== username) throw new Error('Not owner');
    item.locked = false;
  }
  
  async transferItem(itemId: string, fromUsername: string, toUsername: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) throw new Error('Item not found');
    if (item.owner !== fromUsername) throw new Error('Not owner');
    item.owner = toUsername;
    item.locked = false;
  }
  
  async generateRandomItem(tierId: string, rarityWeights: Record<string, number>): Promise<any> {
    return { type: 'gem', rarity: 'common', tierId };
  }
  
  async grantItemToUser(item: any, username: string): Promise<void> {
    const itemId = `item-${Date.now()}`;
    this.items.set(itemId, { owner: username, locked: false });
  }
  
  serializeItem(item: any): any {
    return item;
  }
  
  deserializeItem(data: any): any {
    return data;
  }
}

describe('BazaarMarketplace', () => {
  let marketplace: BazaarMarketplace;
  let storageAdapter: MemoryStorageAdapter;
  let itemAdapter: MockItemAdapter;
  let paymentAdapter: MockPaymentAdapter;
  
  beforeEach(async () => {
    storageAdapter = new MemoryStorageAdapter();
    itemAdapter = new MockItemAdapter();
    paymentAdapter = new MockPaymentAdapter();
    
    marketplace = new BazaarMarketplace({
      storageAdapter,
      itemAdapter,
      paymentAdapter,
      mockMode: true,
    });
  });
  
  describe('Listing Operations', () => {
    it('should create a listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      expect(listing).toBeDefined();
      expect(listing.itemId).toBe('item-1');
      expect(listing.status).toBe('active');
    });
    
    it('should cancel a listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await marketplace.cancelListing(listing.id, 'seller1');
      
      const cancelled = await marketplace.getListing(listing.id);
      expect(cancelled?.status).toBe('cancelled');
    });
    
    it('should get active listings', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      itemAdapter.addItem('item-2', 'seller1');
      
      await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await marketplace.createListing({
        itemId: 'item-2',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 10.0,
      });
      
      const result = await marketplace.getActiveListings();
      expect(result.items).toHaveLength(2);
    });
    
    it('should get listings by user', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      itemAdapter.addItem('item-2', 'seller2');
      
      await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await marketplace.createListing({
        itemId: 'item-2',
        itemType: 'gem',
        sellerUsername: 'seller2',
        sellerWallet: 'wallet-456',
        priceUSDC: 10.0,
      });
      
      const seller1Listings = await marketplace.getListingsByUser('seller1');
      expect(seller1Listings).toHaveLength(1);
      expect(seller1Listings[0].sellerUsername).toBe('seller1');
    });
  });
  
  describe('Purchase Operations - Mock Mode', () => {
    it('should complete purchase immediately in mock mode', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const result = await marketplace.handlePurchaseRequest(listing.id);
      
      expect(result.requiresPayment).toBe(false);
      expect(result.purchaseResult).toBeDefined();
      expect(result.purchaseResult?.success).toBe(true);
      expect(result.purchaseResult?.message).toContain('mock mode');
    });
    
    it('should return mock transaction hash', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const result = await marketplace.handlePurchaseRequest(listing.id);
      
      expect(result.purchaseResult?.txHash).toMatch(/^mock-tx-/);
    });
    
    it('should mark listing as sold after purchase', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await marketplace.handlePurchaseRequest(listing.id);
      
      const soldListing = await marketplace.getListing(listing.id);
      expect(soldListing?.status).toBe('sold');
    });
    
    it('should throw error if listing not found', async () => {
      await expect(
        marketplace.handlePurchaseRequest('non-existent')
      ).rejects.toThrow(BazaarError);
      
      await expect(
        marketplace.handlePurchaseRequest('non-existent')
      ).rejects.toThrow('not found');
    });
    
    it('should throw error if listing not active', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await marketplace.cancelListing(listing.id, 'seller1');
      
      await expect(
        marketplace.handlePurchaseRequest(listing.id)
      ).rejects.toThrow(BazaarError);
      
      await expect(
        marketplace.handlePurchaseRequest(listing.id)
      ).rejects.toThrow('not active');
    });
  });
  
  describe('Purchase Operations - Real Mode', () => {
    beforeEach(() => {
      marketplace = new BazaarMarketplace({
        storageAdapter,
        itemAdapter,
        paymentAdapter,
        mockMode: false, // Real mode
      });
    });
    
    it('should return payment requirements in real mode', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const result = await marketplace.handlePurchaseRequest(listing.id);
      
      expect(result.requiresPayment).toBe(true);
      expect(result.paymentRequirements).toBeDefined();
      expect(result.paymentRequirements.maxAmountRequired).toBe('5000000'); // 5.0 USDC
    });
    
    it('should complete purchase after payment verification', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const result = await marketplace.verifyAndCompletePurchase(
        listing.id,
        'payment-header'
      );
      
      expect(result.success).toBe(true);
      expect(result.txHash).toMatch(/^mock-tx-/);
    });
  });
  
  describe('Mystery Box Operations - Mock Mode', () => {
    beforeEach(async () => {
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
    });
    
    it('should complete mystery box purchase in mock mode', async () => {
      const result = await marketplace.handleMysteryBoxRequest('starter');
      
      expect(result.requiresPayment).toBe(false);
      expect(result.purchaseResult).toBeDefined();
      expect(result.purchaseResult?.success).toBe(true);
      expect(result.purchaseResult?.item).toBeDefined();
    });
    
    it('should generate random item', async () => {
      const result = await marketplace.handleMysteryBoxRequest('starter');
      
      expect(result.purchaseResult?.item.type).toBe('gem');
      expect(result.purchaseResult?.item.rarity).toBe('common');
    });
    
    it('should throw error if tier not found', async () => {
      await expect(
        marketplace.handleMysteryBoxRequest('non-existent')
      ).rejects.toThrow(BazaarError);
      
      await expect(
        marketplace.handleMysteryBoxRequest('non-existent')
      ).rejects.toThrow('not found');
    });
  });
  
  describe('Mystery Box Operations - Real Mode', () => {
    beforeEach(async () => {
      marketplace = new BazaarMarketplace({
        storageAdapter,
        itemAdapter,
        paymentAdapter,
        mockMode: false,
      });
      
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
    });
    
    it('should return payment requirements in real mode', async () => {
      const result = await marketplace.handleMysteryBoxRequest('starter');
      
      expect(result.requiresPayment).toBe(true);
      expect(result.paymentRequirements).toBeDefined();
      expect(result.paymentRequirements.maxAmountRequired).toBe('1000000'); // 1.0 USDC
    });
    
    it('should complete mystery box purchase after payment', async () => {
      const result = await marketplace.verifyAndCompleteMysteryBox(
        'starter',
        'payment-header',
        { buyerUsername: 'buyer1', buyerWallet: 'wallet-123' }
      );
      
      expect(result).toBeDefined();
      expect(result.tierId).toBe('starter');
      expect(result.itemGenerated).toBeDefined();
    });
  });
  
  describe('Get Mystery Box Tiers', () => {
    it('should return all tiers', async () => {
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
      
      await storageAdapter.addMysteryBoxTier({
        id: 'premium',
        name: 'Premium Box',
        priceUSDC: 5.0,
        description: 'Random rare gem',
        rarityWeights: { rare: 100 },
      });
      
      const tiers = await marketplace.getMysteryBoxTiers();
      expect(tiers).toHaveLength(2);
    });
  });
});
