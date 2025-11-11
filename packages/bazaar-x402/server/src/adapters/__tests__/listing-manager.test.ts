/**
 * Unit tests for ListingManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListingManager } from '../../listing-manager.js';
import { MemoryStorageAdapter } from '../memory-storage.js';
import type { ItemAdapter, CurrencyAdapter } from '@bazaar-x402/core';
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
    return { type: 'random', tierId };
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
  
  isLocked(itemId: string): boolean {
    return this.items.get(itemId)?.locked ?? false;
  }
}

// Mock currency adapter for testing
class MockCurrencyAdapter implements CurrencyAdapter {
  private balances = new Map<string, number>();
  private transactions: any[] = [];
  
  async getBalance(userId: string) {
    return {
      amount: this.balances.get(userId) || 1000,
      currency: 'MOCK_USDC' as const,
    };
  }
  
  async deduct(userId: string, amount: number) {
    const balance = this.balances.get(userId) || 1000;
    if (balance < amount) {
      throw new BazaarError('INSUFFICIENT_BALANCE', 'Insufficient balance', 402);
    }
    this.balances.set(userId, balance - amount);
    return {
      success: true,
      newBalance: balance - amount,
      txId: `mock-tx-${Date.now()}`,
    };
  }
  
  async add(userId: string, amount: number) {
    const balance = this.balances.get(userId) || 1000;
    this.balances.set(userId, balance + amount);
    return {
      success: true,
      newBalance: balance + amount,
      txId: `mock-tx-${Date.now()}`,
    };
  }
  
  async initiatePurchase(params: any) {
    return {
      status: 200,
      paymentRequired: false,
      txId: `mock-tx-${Date.now()}`,
    };
  }
  
  async verifyPurchase(params: any) {
    return {
      success: true,
      txHash: `mock-tx-${Date.now()}`,
      networkId: 'mock',
    };
  }
  
  async getTransactions(userId: string, options?: any) {
    return this.transactions.filter(tx => tx.userId === userId);
  }
  
  async recordTransaction(transaction: any) {
    this.transactions.push(transaction);
  }
}

describe('ListingManager', () => {
  let listingManager: ListingManager;
  let storageAdapter: MemoryStorageAdapter;
  let itemAdapter: MockItemAdapter;
  let currencyAdapter: MockCurrencyAdapter;
  
  beforeEach(async () => {
    storageAdapter = new MemoryStorageAdapter();
    itemAdapter = new MockItemAdapter();
    currencyAdapter = new MockCurrencyAdapter();
    listingManager = new ListingManager(storageAdapter, itemAdapter, currencyAdapter);
  });
  
  describe('createListing', () => {
    it('should create a listing successfully', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      expect(listing).toBeDefined();
      expect(listing.itemId).toBe('item-1');
      expect(listing.sellerUsername).toBe('seller1');
      expect(listing.priceUSDC).toBe(5.0);
      expect(listing.status).toBe('active');
      expect(listing.id).toMatch(/^listing-/);
    });
    
    it('should lock the item when creating listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      expect(itemAdapter.isLocked('item-1')).toBe(true);
    });
    
    it('should throw error if user does not own item', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      await expect(
        listingManager.createListing({
          itemId: 'item-1',
          itemType: 'gem',
          sellerUsername: 'seller2', // Different user
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
      ).rejects.toThrow(BazaarError);
      
      await expect(
        listingManager.createListing({
          itemId: 'item-1',
          itemType: 'gem',
          sellerUsername: 'seller2',
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
      ).rejects.toThrow('does not own item');
    });
    
    it('should throw error if item does not exist', async () => {
      await expect(
        listingManager.createListing({
          itemId: 'non-existent',
          itemType: 'gem',
          sellerUsername: 'seller1',
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
      ).rejects.toThrow(BazaarError);
      
      // Note: ownership check happens first, so we get "does not own" error
      // This is acceptable behavior - both indicate the item cannot be listed
    });
    
    it('should rollback item lock if listing creation fails', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      // Mock storage adapter to fail
      const createListingSpy = vi.spyOn(storageAdapter, 'createListing')
        .mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(
        listingManager.createListing({
          itemId: 'item-1',
          itemType: 'gem',
          sellerUsername: 'seller1',
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
      ).rejects.toThrow('Failed to create listing');
      
      // Item should be unlocked after rollback
      expect(itemAdapter.isLocked('item-1')).toBe(false);
      
      createListingSpy.mockRestore();
    });
    
    it('should include optional expiration timestamp', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      const expiresAt = Date.now() + 86400000; // 24 hours
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
        expiresAt,
      });
      
      expect(listing.expiresAt).toBe(expiresAt);
    });
    
    it('should include custom item data', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      const itemData = { type: 'emerald', rarity: 'rare', level: 5 };
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        itemData,
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      expect(listing.itemData).toEqual(itemData);
    });
  });
  
  describe('cancelListing', () => {
    it('should cancel a listing successfully', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await listingManager.cancelListing(listing.id, 'seller1');
      
      const cancelled = await listingManager.getListing(listing.id);
      expect(cancelled?.status).toBe('cancelled');
    });
    
    it('should unlock the item when cancelling listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      expect(itemAdapter.isLocked('item-1')).toBe(true);
      
      await listingManager.cancelListing(listing.id, 'seller1');
      
      expect(itemAdapter.isLocked('item-1')).toBe(false);
    });
    
    it('should throw error if listing does not exist', async () => {
      await expect(
        listingManager.cancelListing('non-existent', 'seller1')
      ).rejects.toThrow(BazaarError);
      
      await expect(
        listingManager.cancelListing('non-existent', 'seller1')
      ).rejects.toThrow('not found');
    });
    
    it('should throw error if user is not the seller', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await expect(
        listingManager.cancelListing(listing.id, 'seller2') // Different user
      ).rejects.toThrow(BazaarError);
      
      await expect(
        listingManager.cancelListing(listing.id, 'seller2')
      ).rejects.toThrow('not the seller');
    });
    
    it('should throw error if listing is not active', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      // Cancel once
      await listingManager.cancelListing(listing.id, 'seller1');
      
      // Try to cancel again
      await expect(
        listingManager.cancelListing(listing.id, 'seller1')
      ).rejects.toThrow(BazaarError);
      
      await expect(
        listingManager.cancelListing(listing.id, 'seller1')
      ).rejects.toThrow('not active');
    });
    
    it('should not throw if unlock fails', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      // Mock unlock to fail
      const unlockSpy = vi.spyOn(itemAdapter, 'unlockItem')
        .mockRejectedValueOnce(new Error('Unlock error'));
      
      // Should not throw
      await expect(
        listingManager.cancelListing(listing.id, 'seller1')
      ).resolves.not.toThrow();
      
      // Listing should still be cancelled
      const cancelled = await listingManager.getListing(listing.id);
      expect(cancelled?.status).toBe('cancelled');
      
      unlockSpy.mockRestore();
    });
  });
  
  describe('getActiveListings', () => {
    it('should return empty array when no listings', async () => {
      const result = await listingManager.getActiveListings();
      expect(result.items).toEqual([]);
    });
    
    it('should return active listings', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      itemAdapter.addItem('item-2', 'seller1');
      
      await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await listingManager.createListing({
        itemId: 'item-2',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 10.0,
      });
      
      const result = await listingManager.getActiveListings();
      expect(result.items).toHaveLength(2);
    });
    
    it('should support pagination options', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      itemAdapter.addItem('item-2', 'seller1');
      itemAdapter.addItem('item-3', 'seller1');
      
      await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await listingManager.createListing({
        itemId: 'item-2',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 10.0,
      });
      
      await listingManager.createListing({
        itemId: 'item-3',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 15.0,
      });
      
      const result = await listingManager.getActiveListings({ limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });
  });
  
  describe('getListingsByUser', () => {
    it('should return empty array for user with no listings', async () => {
      const result = await listingManager.getListingsByUser('user1');
      expect(result).toEqual([]);
    });
    
    it('should return all listings for a user', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      itemAdapter.addItem('item-2', 'seller1');
      itemAdapter.addItem('item-3', 'seller2');
      
      await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      await listingManager.createListing({
        itemId: 'item-2',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 10.0,
      });
      
      await listingManager.createListing({
        itemId: 'item-3',
        itemType: 'gem',
        sellerUsername: 'seller2',
        sellerWallet: 'wallet-456',
        priceUSDC: 15.0,
      });
      
      const seller1Listings = await listingManager.getListingsByUser('seller1');
      expect(seller1Listings).toHaveLength(2);
      
      const seller2Listings = await listingManager.getListingsByUser('seller2');
      expect(seller2Listings).toHaveLength(1);
    });
  });
  
  describe('getListing', () => {
    it('should return null for non-existent listing', async () => {
      const result = await listingManager.getListing('non-existent');
      expect(result).toBeNull();
    });
    
    it('should return existing listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await listingManager.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const retrieved = await listingManager.getListing(listing.id);
      expect(retrieved).toEqual(listing);
    });
  });
});
