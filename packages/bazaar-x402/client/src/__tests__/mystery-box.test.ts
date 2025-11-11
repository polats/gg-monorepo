/**
 * Tests for mystery box client methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BazaarClient } from '../bazaar-client';
import { MockWalletAdapter } from '../wallet-adapter';
import type { MysteryBoxTier } from '@bazaar-x402/core';

// Mock fetch globally
global.fetch = vi.fn();

describe('Mystery Box Client Methods', () => {
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
    
    vi.clearAllMocks();
  });
  
  describe('getMysteryBoxTiers', () => {
    it('should fetch available mystery box tiers', async () => {
      const mockTiers: MysteryBoxTier[] = [
        {
          id: 'starter',
          name: 'Starter Box',
          priceUSDC: 1.0,
          description: 'Random common or uncommon gem',
          rarityWeights: {
            common: 70,
            uncommon: 30,
          },
        },
        {
          id: 'premium',
          name: 'Premium Box',
          priceUSDC: 5.0,
          description: 'Random rare or epic gem',
          rarityWeights: {
            rare: 60,
            epic: 35,
            legendary: 5,
          },
        },
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTiers,
      });
      
      const result = await client.getMysteryBoxTiers();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/mystery-box/tiers'
      );
      expect(result).toEqual(mockTiers);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('starter');
      expect(result[1].id).toBe('premium');
    });
    
    it('should throw user-friendly error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Database connection failed' }),
      });
      
      await expect(client.getMysteryBoxTiers()).rejects.toThrow(
        'Database connection failed'
      );
    });
    
    it('should throw default error message when response has no message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });
      
      await expect(client.getMysteryBoxTiers()).rejects.toThrow(
        'Failed to load mystery box tiers. Please try again.'
      );
    });
    
    it('should handle empty tiers array', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      
      const result = await client.getMysteryBoxTiers();
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
  
  describe('Mystery Box Integration', () => {
    it('should fetch tiers and then purchase a box', async () => {
      // Step 1: Fetch tiers
      const mockTiers: MysteryBoxTier[] = [
        {
          id: 'starter',
          name: 'Starter Box',
          priceUSDC: 1.0,
          description: 'Random common or uncommon gem',
          rarityWeights: {
            common: 70,
            uncommon: 30,
          },
        },
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTiers,
      });
      
      const tiers = await client.getMysteryBoxTiers();
      expect(tiers).toHaveLength(1);
      
      // Step 2: Purchase the first tier
      const mockResult = {
        success: true,
        item: { id: 'gem-123', type: 'gem', rarity: 'common' },
        txHash: 'mock-tx-hash',
        message: 'Mystery box opened successfully!',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });
      
      const result = await client.purchaseMysteryBox(tiers[0].id);
      
      expect(result.success).toBe(true);
      expect(result.item.rarity).toBe('common');
    });
    
    it('should provide clear error messages for invalid tier', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ 
          message: 'Mystery box tier "invalid-tier" not found. Please select a valid tier.' 
        }),
      });
      
      await expect(client.purchaseMysteryBox('invalid-tier')).rejects.toThrow(
        'Mystery box tier "invalid-tier" not found. Please select a valid tier.'
      );
    });
    
    it('should provide clear error messages for insufficient funds', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Payment Required',
        json: async () => ({ 
          message: 'Insufficient USDC balance. You need 5.00 USDC to purchase this mystery box.' 
        }),
      });
      
      await expect(client.purchaseMysteryBox('premium')).rejects.toThrow(
        'Insufficient USDC balance. You need 5.00 USDC to purchase this mystery box.'
      );
    });
  });
});
