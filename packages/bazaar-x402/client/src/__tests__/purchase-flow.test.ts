/**
 * Integration tests for purchase flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BazaarClient, PurchaseResult } from '../bazaar-client';
import { MockWalletAdapter } from '../wallet-adapter';
import type { MysteryBoxResult } from '@bazaar-x402/core';

// Mock fetch globally
global.fetch = vi.fn();

describe('Purchase Flow', () => {
  let client: BazaarClient;
  let mockWallet: MockWalletAdapter;
  
  beforeEach(() => {
    mockWallet = new MockWalletAdapter('MockPublicKey123');
    vi.clearAllMocks();
  });
  
  describe('Mock Mode Purchase', () => {
    beforeEach(() => {
      client = new BazaarClient({
        apiBaseUrl: 'http://localhost:3000/api',
        walletAdapter: mockWallet,
        network: 'solana-devnet',
        mockMode: true,
      });
    });
    
    it('should purchase item without payment in mock mode', async () => {
      const mockResult: PurchaseResult = {
        success: true,
        item: { id: 'gem-123', type: 'gem' },
        txHash: 'mock-tx-hash',
        message: 'Purchase successful',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });
      
      const result = await client.purchaseItem('listing-1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/purchase/listing-1'
      );
      expect(result).toEqual(mockResult);
    });
    
    it('should handle purchase errors in mock mode', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'Listing not found' }),
      });
      
      await expect(client.purchaseItem('listing-1')).rejects.toThrow(
        'Failed to purchase item: Listing not found'
      );
    });
    
    it('should purchase mystery box without payment in mock mode', async () => {
      const mockResult: MysteryBoxResult = {
        success: true,
        item: { id: 'gem-456', type: 'gem', rarity: 'rare' },
        txHash: 'mock-tx-hash',
        message: 'Mystery box opened',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });
      
      const result = await client.purchaseMysteryBox('starter');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bazaar/mystery-box/starter'
      );
      expect(result).toEqual(mockResult);
    });
  });
  
  describe('Real Mode Purchase', () => {
    beforeEach(() => {
      client = new BazaarClient({
        apiBaseUrl: 'http://localhost:3000/api',
        walletAdapter: mockWallet,
        network: 'solana-devnet',
        mockMode: false,
      });
    });
    
    it('should handle x402 payment flow for item purchase', async () => {
      // Step 1: First request returns 402
      const paymentRequired = {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'solana-devnet',
            maxAmountRequired: '5000000',
            resource: 'listing-1',
            description: 'Gem purchase',
            mimeType: 'application/json',
            payTo: 'SellerWallet123',
            maxTimeoutSeconds: 300,
            asset: 'USDCMint123',
          },
        ],
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        status: 402,
        ok: false,
        json: async () => paymentRequired,
      });
      
      // Mock wallet connection and signing
      await mockWallet.connect();
      
      // Step 2: Second request with payment header returns success
      const purchaseResult: PurchaseResult = {
        success: true,
        item: { id: 'gem-123', type: 'gem' },
        txHash: 'real-tx-signature',
        message: 'Purchase successful',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => purchaseResult,
      });
      
      const result = await client.purchaseItem('listing-1');
      
      // Verify first request (no payment header)
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3000/api/bazaar/purchase/listing-1'
      );
      
      // Verify second request (with payment header)
      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[0]).toBe('http://localhost:3000/api/bazaar/purchase/listing-1');
      expect(secondCall[1].headers['X-Payment']).toBeTruthy();
      
      expect(result).toEqual(purchaseResult);
    });
    
    it('should connect wallet if not connected', async () => {
      const paymentRequired = {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'solana-devnet',
            maxAmountRequired: '5000000',
            resource: 'listing-1',
            description: 'Gem purchase',
            mimeType: 'application/json',
            payTo: 'SellerWallet123',
            maxTimeoutSeconds: 300,
            asset: 'USDCMint123',
          },
        ],
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        status: 402,
        ok: false,
        json: async () => paymentRequired,
      });
      
      const purchaseResult: PurchaseResult = {
        success: true,
        item: { id: 'gem-123', type: 'gem' },
        txHash: 'real-tx-signature',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => purchaseResult,
      });
      
      // Wallet not connected initially
      expect(mockWallet.connected).toBe(false);
      
      await client.purchaseItem('listing-1');
      
      // Wallet should be connected after purchase
      expect(mockWallet.connected).toBe(true);
    });
    
    it('should handle payment verification failure', async () => {
      const paymentRequired = {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'solana-devnet',
            maxAmountRequired: '5000000',
            resource: 'listing-1',
            description: 'Gem purchase',
            mimeType: 'application/json',
            payTo: 'SellerWallet123',
            maxTimeoutSeconds: 300,
            asset: 'USDCMint123',
          },
        ],
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        status: 402,
        ok: false,
        json: async () => paymentRequired,
      });
      
      await mockWallet.connect();
      
      // Second request fails verification
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Payment Required',
        json: async () => ({ message: 'Invalid payment signature' }),
      });
      
      await expect(client.purchaseItem('listing-1')).rejects.toThrow(
        'Payment verification failed: Invalid payment signature'
      );
    });
    
    it('should handle x402 payment flow for mystery box', async () => {
      const paymentRequired = {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'solana-devnet',
            maxAmountRequired: '1000000',
            resource: 'mystery-box-starter',
            description: 'Mystery box purchase',
            mimeType: 'application/json',
            payTo: 'TreasuryWallet123',
            maxTimeoutSeconds: 300,
            asset: 'USDCMint123',
          },
        ],
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        status: 402,
        ok: false,
        json: async () => paymentRequired,
      });
      
      await mockWallet.connect();
      
      const mysteryBoxResult: MysteryBoxResult = {
        success: true,
        item: { id: 'gem-789', type: 'gem', rarity: 'epic' },
        txHash: 'real-tx-signature',
        message: 'Mystery box opened',
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mysteryBoxResult,
      });
      
      const result = await client.purchaseMysteryBox('starter');
      
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3000/api/bazaar/mystery-box/starter'
      );
      
      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[0]).toBe('http://localhost:3000/api/bazaar/mystery-box/starter');
      expect(secondCall[1].headers['X-Payment']).toBeTruthy();
      
      expect(result).toEqual(mysteryBoxResult);
    });
  });
});
