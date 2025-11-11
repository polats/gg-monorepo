/**
 * Integration tests for Express routes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { BazaarMarketplace } from '../marketplace.js';
import { MemoryStorageAdapter } from '../adapters/memory-storage.js';
import { MockPaymentAdapter } from '../adapters/mock-payment.js';
import { createBazaarRoutes } from '../express.js';
import type { ItemAdapter } from '@bazaar-x402/core';

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

describe('Express Routes', () => {
  let app: Express;
  let marketplace: BazaarMarketplace;
  let storageAdapter: MemoryStorageAdapter;
  let itemAdapter: MockItemAdapter;
  
  beforeEach(async () => {
    storageAdapter = new MemoryStorageAdapter();
    itemAdapter = new MockItemAdapter();
    
    marketplace = new BazaarMarketplace({
      storageAdapter,
      itemAdapter,
      paymentAdapter: new MockPaymentAdapter(),
      mockMode: true,
    });
    
    app = express();
    app.use('/api/bazaar', createBazaarRoutes(marketplace));
  });
  
  describe('GET /api/bazaar/listings', () => {
    it('should return empty array when no listings', async () => {
      const response = await request(app)
        .get('/api/bazaar/listings')
        .expect(200);
      
      expect(response.body.items).toEqual([]);
    });
    
    it('should return active listings', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const response = await request(app)
        .get('/api/bazaar/listings')
        .expect(200);
      
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].itemId).toBe('item-1');
    });
    
    it('should support pagination', async () => {
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
      
      const response = await request(app)
        .get('/api/bazaar/listings?limit=1')
        .expect(200);
      
      expect(response.body.items).toHaveLength(1);
      expect(response.body.nextCursor).toBeDefined();
    });
  });
  
  describe('POST /api/bazaar/listings', () => {
    it('should create a listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const response = await request(app)
        .post('/api/bazaar/listings')
        .send({
          itemId: 'item-1',
          itemType: 'gem',
          sellerUsername: 'seller1',
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
        .expect(201);
      
      expect(response.body.itemId).toBe('item-1');
      expect(response.body.status).toBe('active');
    });
    
    it('should return error if item not owned', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const response = await request(app)
        .post('/api/bazaar/listings')
        .send({
          itemId: 'item-1',
          itemType: 'gem',
          sellerUsername: 'seller2', // Different user
          sellerWallet: 'wallet-123',
          priceUSDC: 5.0,
        })
        .expect(403);
      
      expect(response.body.error).toBe('ITEM_NOT_OWNED');
    });
  });
  
  describe('DELETE /api/bazaar/listings/:id', () => {
    it('should cancel a listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const response = await request(app)
        .delete(`/api/bazaar/listings/${listing.id}`)
        .send({ username: 'seller1' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should return error if username missing', async () => {
      const response = await request(app)
        .delete('/api/bazaar/listings/listing-123')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('MISSING_USERNAME');
    });
  });
  
  describe('GET /api/bazaar/listings/user/:username', () => {
    it('should return user listings', async () => {
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
      
      const response = await request(app)
        .get('/api/bazaar/listings/user/seller1')
        .expect(200);
      
      expect(response.body).toHaveLength(2);
    });
  });
  
  describe('GET /api/bazaar/listings/:id', () => {
    it('should return a specific listing', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const response = await request(app)
        .get(`/api/bazaar/listings/${listing.id}`)
        .expect(200);
      
      expect(response.body.id).toBe(listing.id);
    });
    
    it('should return 404 if listing not found', async () => {
      const response = await request(app)
        .get('/api/bazaar/listings/non-existent')
        .expect(404);
      
      expect(response.body.error).toBe('LISTING_NOT_FOUND');
    });
  });
  
  describe('GET /api/bazaar/purchase/:listingId', () => {
    it('should complete purchase in mock mode', async () => {
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await marketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const response = await request(app)
        .get(`/api/bazaar/purchase/${listing.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('mock mode');
    });
    
    it('should return 402 in real mode', async () => {
      // Create marketplace in real mode
      const realMarketplace = new BazaarMarketplace({
        storageAdapter,
        itemAdapter,
        paymentAdapter: new MockPaymentAdapter(),
        mockMode: false,
      });
      
      const realApp = express();
      realApp.use('/api/bazaar', createBazaarRoutes(realMarketplace));
      
      itemAdapter.addItem('item-1', 'seller1');
      
      const listing = await realMarketplace.createListing({
        itemId: 'item-1',
        itemType: 'gem',
        sellerUsername: 'seller1',
        sellerWallet: 'wallet-123',
        priceUSDC: 5.0,
      });
      
      const response = await request(realApp)
        .get(`/api/bazaar/purchase/${listing.id}`)
        .expect(402);
      
      expect(response.body.maxAmountRequired).toBe('5000000');
    });
  });
  
  describe('GET /api/bazaar/mystery-box/tiers', () => {
    it('should return all tiers', async () => {
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
      
      const response = await request(app)
        .get('/api/bazaar/mystery-box/tiers')
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('starter');
    });
  });
  
  describe('GET /api/bazaar/mystery-box/:tierId', () => {
    beforeEach(async () => {
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
    });
    
    it('should complete purchase in mock mode', async () => {
      const response = await request(app)
        .get('/api/bazaar/mystery-box/starter')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.item).toBeDefined();
    });
    
    it('should return 402 in real mode', async () => {
      const realMarketplace = new BazaarMarketplace({
        storageAdapter,
        itemAdapter,
        paymentAdapter: new MockPaymentAdapter(),
        mockMode: false,
      });
      
      const realApp = express();
      realApp.use('/api/bazaar', createBazaarRoutes(realMarketplace));
      
      const response = await request(realApp)
        .get('/api/bazaar/mystery-box/starter')
        .expect(402);
      
      expect(response.body.maxAmountRequired).toBe('1000000');
    });
  });
  
  describe('POST /api/bazaar/mystery-box/:tierId', () => {
    beforeEach(async () => {
      await storageAdapter.addMysteryBoxTier({
        id: 'starter',
        name: 'Starter Box',
        priceUSDC: 1.0,
        description: 'Random common gem',
        rarityWeights: { common: 100 },
      });
    });
    
    it('should complete mystery box purchase', async () => {
      const response = await request(app)
        .post('/api/bazaar/mystery-box/starter')
        .send({
          buyerUsername: 'buyer1',
          buyerWallet: 'wallet-123',
        })
        .set('X-Payment', 'payment-header')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.item).toBeDefined();
    });
    
    it('should return error if buyer info missing', async () => {
      const response = await request(app)
        .post('/api/bazaar/mystery-box/starter')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('MISSING_BUYER_INFO');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle BazaarError correctly', async () => {
      const response = await request(app)
        .get('/api/bazaar/listings/non-existent')
        .expect(404);
      
      expect(response.body.error).toBe('LISTING_NOT_FOUND');
      expect(response.body.message).toBeDefined();
    });
  });
});
