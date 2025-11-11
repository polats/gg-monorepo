/**
 * Unit tests for MockPaymentAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockPaymentAdapter } from '../mock-payment.js';
import type { VerifyPaymentParams, CreatePaymentParams } from '@bazaar-x402/core';

describe('MockPaymentAdapter', () => {
  let adapter: MockPaymentAdapter;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    adapter = new MockPaymentAdapter();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
  });
  
  describe('verifyPayment', () => {
    it('should always return success', async () => {
      const params: VerifyPaymentParams = {
        paymentHeader: 'mock-payment-header',
        expectedAmount: 5.0,
        expectedRecipient: 'seller-wallet-123',
      };
      
      const result = await adapter.verifyPayment(params);
      
      expect(result.success).toBe(true);
      expect(result.networkId).toBe('solana-devnet');
    });
    
    it('should generate unique transaction hashes', async () => {
      const params: VerifyPaymentParams = {
        paymentHeader: 'mock-payment-header',
        expectedAmount: 5.0,
        expectedRecipient: 'seller-wallet-123',
      };
      
      const result1 = await adapter.verifyPayment(params);
      const result2 = await adapter.verifyPayment(params);
      
      expect(result1.txHash).not.toBe(result2.txHash);
      expect(result1.txHash).toMatch(/^mock-tx-\d+-[a-z0-9]+$/);
      expect(result2.txHash).toMatch(/^mock-tx-\d+-[a-z0-9]+$/);
    });
    
    it('should log verification details', async () => {
      const params: VerifyPaymentParams = {
        paymentHeader: 'mock-payment-header',
        expectedAmount: 10.5,
        expectedRecipient: 'seller-wallet-456',
      };
      
      await adapter.verifyPayment(params);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[MOCK PAYMENT] Payment verification bypassed:',
        expect.objectContaining({
          expectedAmount: 10.5,
          expectedRecipient: 'seller-wallet-456',
          paymentHeader: 'provided',
        })
      );
    });
    
    it('should handle missing payment header', async () => {
      const params: VerifyPaymentParams = {
        paymentHeader: '',
        expectedAmount: 5.0,
        expectedRecipient: 'seller-wallet-123',
      };
      
      const result = await adapter.verifyPayment(params);
      
      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[MOCK PAYMENT] Payment verification bypassed:',
        expect.objectContaining({
          paymentHeader: 'not provided',
        })
      );
    });
  });
  
  describe('createPaymentRequirements', () => {
    it('should create mock payment requirements', () => {
      const params: CreatePaymentParams = {
        priceUSDC: 5.0,
        sellerWallet: 'seller-wallet-123',
        resource: '/api/bazaar/purchase/listing-123',
        description: 'Purchase gem listing',
      };
      
      const requirements = adapter.createPaymentRequirements(params);
      
      expect(requirements).toEqual({
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: '5000000', // 5.0 USDC = 5,000,000 smallest units
        resource: '/api/bazaar/purchase/listing-123',
        description: 'Purchase gem listing',
        mimeType: 'application/json',
        payTo: 'seller-wallet-123',
        maxTimeoutSeconds: 300,
        asset: 'MOCK_USDC_MINT_ADDRESS',
      });
    });
    
    it('should convert USDC to smallest unit correctly', () => {
      const testCases = [
        { priceUSDC: 1.0, expected: '1000000' },
        { priceUSDC: 0.5, expected: '500000' },
        { priceUSDC: 10.25, expected: '10250000' },
        { priceUSDC: 0.000001, expected: '1' },
      ];
      
      testCases.forEach(({ priceUSDC, expected }) => {
        const params: CreatePaymentParams = {
          priceUSDC,
          sellerWallet: 'seller-wallet',
          resource: '/api/test',
          description: 'Test',
        };
        
        const requirements = adapter.createPaymentRequirements(params);
        expect(requirements.maxAmountRequired).toBe(expected);
      });
    });
    
    it('should log payment requirements creation', () => {
      const params: CreatePaymentParams = {
        priceUSDC: 7.5,
        sellerWallet: 'seller-wallet-789',
        resource: '/api/bazaar/mystery-box/premium',
        description: 'Purchase premium mystery box',
      };
      
      adapter.createPaymentRequirements(params);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[MOCK PAYMENT] Creating mock payment requirements:',
        expect.objectContaining({
          priceUSDC: 7.5,
          sellerWallet: 'seller-wallet-789',
          resource: '/api/bazaar/mystery-box/premium',
        })
      );
    });
    
    it('should use mock USDC mint address', () => {
      const params: CreatePaymentParams = {
        priceUSDC: 5.0,
        sellerWallet: 'seller-wallet',
        resource: '/api/test',
        description: 'Test',
      };
      
      const requirements = adapter.createPaymentRequirements(params);
      
      expect(requirements.asset).toBe('MOCK_USDC_MINT_ADDRESS');
    });
    
    it('should set appropriate timeout', () => {
      const params: CreatePaymentParams = {
        priceUSDC: 5.0,
        sellerWallet: 'seller-wallet',
        resource: '/api/test',
        description: 'Test',
      };
      
      const requirements = adapter.createPaymentRequirements(params);
      
      expect(requirements.maxTimeoutSeconds).toBe(300);
    });
  });
});
