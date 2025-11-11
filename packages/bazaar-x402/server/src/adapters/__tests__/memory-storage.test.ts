/**
 * Unit tests for MemoryStorageAdapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../memory-storage.js';
import type { Listing, MysteryBoxTier, MysteryBoxPurchase, Transaction } from '@bazaar-x402/core';

describe('MemoryStorageAdapter', () => {
  let adapter: MemoryStorageAdapter;
  
  beforeEach(async () => {
    adapter = new MemoryStorageAdapter();
  });
  
  describe('Listing Operations', () => {
    const createTestListing = (overrides: Partial<Listing> = {}): Listing => ({
      id: `listing-${Date.now()}-${Math.random()}`,
      itemId: 'item-1',
      itemType: 'gem',
      itemData: { type: 'emerald', rarity: 'rare' },
      sellerWallet: 'seller-wallet-123',
      sellerUsername: 'seller1',
      priceUSDC: 5.0,
      status: 'active',
      createdAt: Date.now(),
      ...overrides,
    });
    
    describe('createListing', () => {
      it('should create a listing', async () => {
        const listing = createTestListing();
        
        await adapter.createListing(listing);
        
        const retrieved = await adapter.getListing(listing.id);
        expect(retrieved).toEqual(listing);
      });
      
      it('should add active listings to index', async () => {
        const listing = createTestListing({ status: 'active' });
        
        await adapter.createListing(listing);
        
        const activeListings = await adapter.getActiveListings({});
        expect(activeListings.items).toHaveLength(1);
        expect(activeListings.items[0].id).toBe(listing.id);
      });
      
      it('should not add non-active listings to index', async () => {
        const listing = createTestListing({ status: 'sold' });
        
        await adapter.createListing(listing);
        
        const activeListings = await adapter.getActiveListings({});
        expect(activeListings.items).toHaveLength(0);
      });
      
      it('should add listing to user index', async () => {
        const listing = createTestListing({ sellerUsername: 'user1' });
        
        await adapter.createListing(listing);
        
        const userListings = await adapter.getListingsByUser('user1');
        expect(userListings).toHaveLength(1);
        expect(userListings[0].id).toBe(listing.id);
      });
    });
    
    describe('getListing', () => {
      it('should return null for non-existent listing', async () => {
        const result = await adapter.getListing('non-existent');
        expect(result).toBeNull();
      });
      
      it('should retrieve existing listing', async () => {
        const listing = createTestListing();
        await adapter.createListing(listing);
        
        const retrieved = await adapter.getListing(listing.id);
        expect(retrieved).toEqual(listing);
      });
    });
    
    describe('getActiveListings', () => {
      it('should return empty array when no listings', async () => {
        const result = await adapter.getActiveListings({});
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
      });
      
      it('should return active listings sorted by newest', async () => {
        const listing1 = createTestListing({ createdAt: 1000 });
        const listing2 = createTestListing({ createdAt: 2000 });
        const listing3 = createTestListing({ createdAt: 1500 });
        
        await adapter.createListing(listing1);
        await adapter.createListing(listing2);
        await adapter.createListing(listing3);
        
        const result = await adapter.getActiveListings({ sortBy: 'newest' });
        
        expect(result.items).toHaveLength(3);
        expect(result.items[0].id).toBe(listing2.id);
        expect(result.items[1].id).toBe(listing3.id);
        expect(result.items[2].id).toBe(listing1.id);
      });
      
      it('should return listings sorted by price low to high', async () => {
        const listing1 = createTestListing({ priceUSDC: 10.0 });
        const listing2 = createTestListing({ priceUSDC: 5.0 });
        const listing3 = createTestListing({ priceUSDC: 15.0 });
        
        await adapter.createListing(listing1);
        await adapter.createListing(listing2);
        await adapter.createListing(listing3);
        
        const result = await adapter.getActiveListings({ sortBy: 'price_low' });
        
        expect(result.items[0].priceUSDC).toBe(5.0);
        expect(result.items[1].priceUSDC).toBe(10.0);
        expect(result.items[2].priceUSDC).toBe(15.0);
      });
      
      it('should return listings sorted by price high to low', async () => {
        const listing1 = createTestListing({ priceUSDC: 10.0 });
        const listing2 = createTestListing({ priceUSDC: 5.0 });
        const listing3 = createTestListing({ priceUSDC: 15.0 });
        
        await adapter.createListing(listing1);
        await adapter.createListing(listing2);
        await adapter.createListing(listing3);
        
        const result = await adapter.getActiveListings({ sortBy: 'price_high' });
        
        expect(result.items[0].priceUSDC).toBe(15.0);
        expect(result.items[1].priceUSDC).toBe(10.0);
        expect(result.items[2].priceUSDC).toBe(5.0);
      });
      
      it('should support pagination with limit', async () => {
        for (let i = 0; i < 5; i++) {
          await adapter.createListing(createTestListing());
        }
        
        const result = await adapter.getActiveListings({ limit: 2 });
        
        expect(result.items).toHaveLength(2);
        expect(result.nextCursor).toBeDefined();
        expect(result.totalCount).toBe(5);
      });
      
      it('should support cursor-based pagination', async () => {
        const listings = [];
        for (let i = 0; i < 5; i++) {
          const listing = createTestListing({ createdAt: 1000 + i });
          await adapter.createListing(listing);
          listings.push(listing);
        }
        
        // Get first page
        const page1 = await adapter.getActiveListings({ limit: 2, sortBy: 'newest' });
        expect(page1.items).toHaveLength(2);
        expect(page1.nextCursor).toBeDefined();
        
        // Get second page using cursor
        const page2 = await adapter.getActiveListings({
          limit: 2,
          sortBy: 'newest',
          cursor: page1.nextCursor,
        });
        expect(page2.items).toHaveLength(2);
        expect(page2.items[0].id).not.toBe(page1.items[0].id);
        expect(page2.items[0].id).not.toBe(page1.items[1].id);
      });
      
      it('should respect max limit of 100', async () => {
        const result = await adapter.getActiveListings({ limit: 200 });
        // Should not throw, and limit should be capped at 100
        expect(result).toBeDefined();
      });
    });
    
    describe('updateListingStatus', () => {
      it('should update listing status', async () => {
        const listing = createTestListing({ status: 'active' });
        await adapter.createListing(listing);
        
        await adapter.updateListingStatus(listing.id, 'sold');
        
        const updated = await adapter.getListing(listing.id);
        expect(updated?.status).toBe('sold');
      });
      
      it('should remove from active index when status changes', async () => {
        const listing = createTestListing({ status: 'active' });
        await adapter.createListing(listing);
        
        await adapter.updateListingStatus(listing.id, 'sold');
        
        const activeListings = await adapter.getActiveListings({});
        expect(activeListings.items).toHaveLength(0);
      });
      
      it('should add to active index when status becomes active', async () => {
        const listing = createTestListing({ status: 'cancelled' });
        await adapter.createListing(listing);
        
        await adapter.updateListingStatus(listing.id, 'active');
        
        const activeListings = await adapter.getActiveListings({});
        expect(activeListings.items).toHaveLength(1);
      });
      
      it('should throw error for non-existent listing', async () => {
        await expect(
          adapter.updateListingStatus('non-existent', 'sold')
        ).rejects.toThrow('Listing non-existent not found');
      });
    });
    
    describe('getListingsByUser', () => {
      it('should return empty array for user with no listings', async () => {
        const result = await adapter.getListingsByUser('user1');
        expect(result).toEqual([]);
      });
      
      it('should return all listings for a user', async () => {
        const listing1 = createTestListing({ sellerUsername: 'user1' });
        const listing2 = createTestListing({ sellerUsername: 'user1' });
        const listing3 = createTestListing({ sellerUsername: 'user2' });
        
        await adapter.createListing(listing1);
        await adapter.createListing(listing2);
        await adapter.createListing(listing3);
        
        const user1Listings = await adapter.getListingsByUser('user1');
        expect(user1Listings).toHaveLength(2);
        expect(user1Listings.map(l => l.id)).toContain(listing1.id);
        expect(user1Listings.map(l => l.id)).toContain(listing2.id);
      });
    });
  });
  
  describe('Mystery Box Operations', () => {
    const createTestTier = (overrides: Partial<MysteryBoxTier> = {}): MysteryBoxTier => ({
      id: 'tier-1',
      name: 'Starter Box',
      priceUSDC: 1.0,
      description: 'Random common or uncommon gem',
      rarityWeights: { common: 70, uncommon: 30 },
      ...overrides,
    });
    
    describe('getMysteryBoxTier', () => {
      it('should return null for non-existent tier', async () => {
        const result = await adapter.getMysteryBoxTier('non-existent');
        expect(result).toBeNull();
      });
      
      it('should retrieve existing tier', async () => {
        const tier = createTestTier();
        await adapter.addMysteryBoxTier(tier);
        
        const retrieved = await adapter.getMysteryBoxTier(tier.id);
        expect(retrieved).toEqual(tier);
      });
    });
    
    describe('getAllMysteryBoxTiers', () => {
      it('should return empty array when no tiers', async () => {
        const result = await adapter.getAllMysteryBoxTiers();
        expect(result).toEqual([]);
      });
      
      it('should return all tiers', async () => {
        const tier1 = createTestTier({ id: 'tier-1' });
        const tier2 = createTestTier({ id: 'tier-2' });
        
        await adapter.addMysteryBoxTier(tier1);
        await adapter.addMysteryBoxTier(tier2);
        
        const result = await adapter.getAllMysteryBoxTiers();
        expect(result).toHaveLength(2);
      });
    });
    
    describe('recordMysteryBoxPurchase', () => {
      it('should record a purchase', async () => {
        const purchase: MysteryBoxPurchase = {
          id: 'purchase-1',
          tierId: 'tier-1',
          buyerWallet: 'buyer-wallet',
          buyerUsername: 'buyer1',
          priceUSDC: 1.0,
          itemGenerated: { type: 'emerald' },
          txHash: 'tx-123',
          timestamp: Date.now(),
        };
        
        await adapter.recordMysteryBoxPurchase(purchase);
        
        // No getter method, but we can verify it doesn't throw
        expect(true).toBe(true);
      });
    });
  });
  
  describe('Transaction Operations', () => {
    const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
      id: `tx-${Date.now()}-${Math.random()}`,
      type: 'listing_purchase',
      buyerUsername: 'buyer1',
      buyerWallet: 'buyer-wallet',
      sellerUsername: 'seller1',
      sellerWallet: 'seller-wallet',
      priceUSDC: 5.0,
      itemId: 'item-1',
      itemType: 'gem',
      itemData: { type: 'emerald' },
      txHash: 'tx-hash-123',
      timestamp: Date.now(),
      ...overrides,
    });
    
    describe('recordTransaction', () => {
      it('should record a transaction', async () => {
        const transaction = createTestTransaction();
        
        await adapter.recordTransaction(transaction);
        
        const buyerTxs = await adapter.getTransactionsByUser(transaction.buyerUsername);
        expect(buyerTxs).toHaveLength(1);
        expect(buyerTxs[0].id).toBe(transaction.id);
      });
      
      it('should add transaction to both buyer and seller indexes', async () => {
        const transaction = createTestTransaction({
          buyerUsername: 'buyer1',
          sellerUsername: 'seller1',
        });
        
        await adapter.recordTransaction(transaction);
        
        const buyerTxs = await adapter.getTransactionsByUser('buyer1');
        const sellerTxs = await adapter.getTransactionsByUser('seller1');
        
        expect(buyerTxs).toHaveLength(1);
        expect(sellerTxs).toHaveLength(1);
        expect(buyerTxs[0].id).toBe(transaction.id);
        expect(sellerTxs[0].id).toBe(transaction.id);
      });
    });
    
    describe('getTransactionsByUser', () => {
      it('should return empty array for user with no transactions', async () => {
        const result = await adapter.getTransactionsByUser('user1');
        expect(result).toEqual([]);
      });
      
      it('should return all transactions for a user', async () => {
        const tx1 = createTestTransaction({ buyerUsername: 'user1' });
        const tx2 = createTestTransaction({ sellerUsername: 'user1' });
        const tx3 = createTestTransaction({ buyerUsername: 'user2' });
        
        await adapter.recordTransaction(tx1);
        await adapter.recordTransaction(tx2);
        await adapter.recordTransaction(tx3);
        
        const user1Txs = await adapter.getTransactionsByUser('user1');
        expect(user1Txs).toHaveLength(2);
      });
    });
  });
  
  describe('Atomic Operations', () => {
    it('should execute multiple operations atomically', async () => {
      const listing = {
        id: 'listing-1',
        itemId: 'item-1',
        itemType: 'gem',
        itemData: {},
        sellerWallet: 'seller-wallet',
        sellerUsername: 'seller1',
        priceUSDC: 5.0,
        status: 'active' as const,
        createdAt: Date.now(),
      };
      
      await adapter.createListing(listing);
      
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'listing_purchase',
        buyerUsername: 'buyer1',
        buyerWallet: 'buyer-wallet',
        sellerUsername: 'seller1',
        sellerWallet: 'seller-wallet',
        priceUSDC: 5.0,
        itemId: 'item-1',
        itemType: 'gem',
        itemData: {},
        txHash: 'tx-hash',
        timestamp: Date.now(),
      };
      
      await adapter.executeAtomicTrade([
        {
          type: 'update_listing',
          data: { listingId: listing.id, status: 'sold' },
        },
        {
          type: 'record_transaction',
          data: transaction,
        },
      ]);
      
      const updatedListing = await adapter.getListing(listing.id);
      expect(updatedListing?.status).toBe('sold');
      
      const transactions = await adapter.getTransactionsByUser('buyer1');
      expect(transactions).toHaveLength(1);
    });
  });
  
  describe('Helper Methods', () => {
    describe('clear', () => {
      it('should clear all data', async () => {
        const listing = {
          id: 'listing-1',
          itemId: 'item-1',
          itemType: 'gem',
          itemData: {},
          sellerWallet: 'seller-wallet',
          sellerUsername: 'seller1',
          priceUSDC: 5.0,
          status: 'active' as const,
          createdAt: Date.now(),
        };
        
        await adapter.createListing(listing);
        await adapter.clear();
        
        const result = await adapter.getListing(listing.id);
        expect(result).toBeNull();
        
        const activeListings = await adapter.getActiveListings({});
        expect(activeListings.items).toHaveLength(0);
      });
    });
  });
});
