/**
 * Tests for BazaarClient
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BazaarClient } from '../bazaar-client';
import { MockWalletAdapter } from '../wallet-adapter';
import type { Listing, CreateListingParams } from '@bazaar-x402/core';

// Mock fetch globally
global.fetch = vi.fn();

describe('BazaarClient', () => {
  let client: BazaarClient;
  let mockWallet: MockWalletAdapter;
  
  beforeEach(() => {
    mockWallet = new MockWalletAdapter('MockPublicKey123');
    client = new BazaarClient({
      apiBaseUrl: 'http://localhost:3000/api',
      walletAdapter: mockWallet,
      network: 'solana-devnet',
      mockMode: true,
    });
    
    // Reset fetch mock
    vi.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize with config', () => {
      expect(client.network).toBe('solana-devnet');
      expect(client.isMockMode).toBe(true);
      expect(client.wallet).toBe(mockWallet);
    });
    
    it('should default mockMode to false', () => {
      const prodClient = new BazaarClient({
        apiBaseUrl: 'http://localhost:3000/api',
        walletAdapter: mockWallet,
        network: 'solana-mainnet',
      });
      
      expect(prodClient.isMockMode).toBe(false);
    });
  });
  
  describe('getActiveListings', () => {
    it('should fetch listings without options', async () => {
      const mockListings = {
        items: [
          { id: '1', itemId: 'gem-1', priceUSDC: 5.0 },
          { id: '2', itemId: 'gem-2', priceUSDC: 10.0 },
        ],
        hasMore: false,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });
      
      const result = await client.getActiveListings();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/listings?'
      );
      expect(result).toEqual(mockListings);
    });
    
    it('should fetch listings with pagination options', async () => {
      const mockListings = {
        items: [{ id: '3', itemId: 'gem-3', priceUSDC: 15.0 }],
        nextCursor: 'cursor-123',
        hasMore: true,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });
      
      const result = await client.getActiveListings({
        cursor: 'cursor-abc',
        limit: 10,
        sortBy: 'price_low',
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/listings?cursor=cursor-abc&limit=10&sortBy=price_low'
      );
      expect(result).toEqual(mockListings);
    });
    
    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });
      
      await expect(client.getActiveListings()).rejects.toThrow(
        'Failed to fetch listings: Internal Server Error'
      );
    });
  });
  
  describe('createListing', () => {
    it('should create a listing', async () => {
      const params: CreateListingParams = {
        itemId: 'gem-123',
        itemType: 'gem',
        itemData: { color: 'blue' },
        sellerUsername: 'player1',
        sellerWallet: 'wallet123',
        priceUSDC: 5.0,
      };
      
      const mockListing: Listing = {
        id: 'listing-1',
        ...params,
        status: 'active',
        createdAt: Date.now(),
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListing,
      });
      
      const result = await client.createListing(params);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/listings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
      expect(result).toEqual(mockListing);
    });
    
    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Item not owned' }),
      });
      
      await expect(
        client.createListing({
          itemId: 'gem-123',
          itemType: 'gem',
          itemData: {},
          sellerUsername: 'player1',
          sellerWallet: 'wallet123',
          priceUSDC: 5.0,
        })
      ).rejects.toThrow('Failed to create listing: Item not owned');
    });
  });
  
  describe('cancelListing', () => {
    it('should cancel a listing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });
      
      await client.cancelListing('listing-1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/listings/listing-1',
        {
          method: 'DELETE',
        }
      );
    });
    
    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'Listing not found' }),
      });
      
      await expect(client.cancelListing('listing-1')).rejects.toThrow(
        'Failed to cancel listing: Listing not found'
      );
    });
  });
  
  describe('getMyListings', () => {
    it('should fetch user listings', async () => {
      const mockListings: Listing[] = [
        {
          id: 'listing-1',
          itemId: 'gem-1',
          itemType: 'gem',
          itemData: {},
          sellerUsername: 'player1',
          sellerWallet: 'wallet123',
          priceUSDC: 5.0,
          status: 'active',
          createdAt: Date.now(),
        },
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockListings,
      });
      
      const result = await client.getMyListings();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/listings/my'
      );
      expect(result).toEqual(mockListings);
    });
    
    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });
      
      await expect(client.getMyListings()).rejects.toThrow(
        'Failed to fetch my listings: Unauthorized'
      );
    });
  });
});
