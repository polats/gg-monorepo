/**
 * Tests for x402 protocol utilities
 */

import { describe, it, expect } from 'vitest';
import {
  encodePaymentHeader,
  decodePaymentHeader,
  isValidPaymentPayload,
  createPaymentRequirements,
  createPaymentRequiredResponse,
  extractPaymentHeader,
  USDC_MINT_ADDRESSES,
} from '../x402';
import { X402_VERSION } from '../../types/payment';
import type { PaymentPayload } from '../../types/payment';

describe('x402 Protocol Utilities', () => {
  describe('encodePaymentHeader', () => {
    it('should encode payment payload to Base64', () => {
      const payload: PaymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          signature: 'test-signature',
          from: 'buyer-wallet',
          to: 'seller-wallet',
          amount: '1000000',
          mint: 'usdc-mint',
        },
      };

      const encoded = encodePaymentHeader(payload);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      
      // Should be valid Base64
      expect(() => Buffer.from(encoded, 'base64')).not.toThrow();
    });

    it('should produce decodable output', () => {
      const payload: PaymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-mainnet',
        payload: {
          signature: 'sig123',
          from: 'from123',
          to: 'to123',
          amount: '5000000',
          mint: 'mint123',
        },
      };

      const encoded = encodePaymentHeader(payload);
      const decoded = decodePaymentHeader(encoded);
      
      expect(decoded).toEqual(payload);
    });
  });

  describe('decodePaymentHeader', () => {
    it('should decode valid Base64 payment payload', () => {
      const payload: PaymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          signature: 'test-sig',
          from: 'buyer',
          to: 'seller',
          amount: '2000000',
          mint: 'usdc',
        },
      };

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const decoded = decodePaymentHeader(encoded);
      
      expect(decoded).toEqual(payload);
    });

    it('should return null for invalid Base64', () => {
      const result = decodePaymentHeader('not-valid-base64!!!');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const encoded = Buffer.from('not valid json').toString('base64');
      const result = decodePaymentHeader(encoded);
      expect(result).toBeNull();
    });

    it('should return null for invalid payload structure', () => {
      const invalidPayload = { invalid: 'structure' };
      const encoded = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const result = decodePaymentHeader(encoded);
      expect(result).toBeNull();
    });
  });

  describe('isValidPaymentPayload', () => {
    it('should validate correct payment payload', () => {
      const payload: PaymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          signature: 'sig',
          from: 'from',
          to: 'to',
          amount: '1000000',
          mint: 'mint',
        },
      };

      expect(isValidPaymentPayload(payload)).toBe(true);
    });

    it('should reject payload with missing x402Version', () => {
      const payload = {
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          signature: 'sig',
          from: 'from',
          to: 'to',
          amount: '1000000',
          mint: 'mint',
        },
      };

      expect(isValidPaymentPayload(payload)).toBe(false);
    });

    it('should reject payload with missing inner payload', () => {
      const payload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
      };

      expect(isValidPaymentPayload(payload)).toBe(false);
    });

    it('should reject payload with empty strings', () => {
      const payload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          signature: '',
          from: 'from',
          to: 'to',
          amount: '1000000',
          mint: 'mint',
        },
      };

      expect(isValidPaymentPayload(payload)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidPaymentPayload(null)).toBe(false);
      expect(isValidPaymentPayload(undefined)).toBe(false);
    });
  });

  describe('createPaymentRequirements', () => {
    it('should create payment requirements with correct structure', () => {
      const params = {
        priceUSDC: 10.5,
        sellerWallet: 'seller-wallet-address',
        resource: '/api/listings/123',
        description: 'Test Item',
      };

      const requirements = createPaymentRequirements(params, 'solana-devnet', 30);

      expect(requirements).toMatchObject({
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: '10500000', // 10.5 USDC = 10,500,000 smallest units
        resource: '/api/listings/123',
        description: 'Test Item',
        mimeType: 'application/json',
        payTo: 'seller-wallet-address',
        maxTimeoutSeconds: 30,
        asset: USDC_MINT_ADDRESSES['solana-devnet'],
      });
    });

    it('should use mainnet by default', () => {
      const params = {
        priceUSDC: 5.0,
        sellerWallet: 'seller',
        resource: '/resource',
        description: 'Item',
      };

      const requirements = createPaymentRequirements(params);

      expect(requirements.network).toBe('solana-mainnet');
      expect(requirements.asset).toBe(USDC_MINT_ADDRESSES['solana-mainnet']);
    });

    it('should convert USDC to smallest unit correctly', () => {
      const params = {
        priceUSDC: 1.0,
        sellerWallet: 'seller',
        resource: '/resource',
        description: 'Item',
      };

      const requirements = createPaymentRequirements(params);
      expect(requirements.maxAmountRequired).toBe('1000000');
    });

    it('should handle fractional USDC amounts', () => {
      const params = {
        priceUSDC: 0.5,
        sellerWallet: 'seller',
        resource: '/resource',
        description: 'Item',
      };

      const requirements = createPaymentRequirements(params);
      expect(requirements.maxAmountRequired).toBe('500000');
    });
  });

  describe('createPaymentRequiredResponse', () => {
    it('should create 402 response with correct structure', () => {
      const params = {
        priceUSDC: 15.0,
        sellerWallet: 'seller-wallet',
        resource: '/api/items/456',
        description: 'Premium Item',
      };

      const response = createPaymentRequiredResponse(params, 'solana-mainnet', 60);

      expect(response.x402Version).toBe(X402_VERSION);
      expect(response.accepts).toHaveLength(1);
      expect(response.accepts[0]).toMatchObject({
        scheme: 'exact',
        network: 'solana-mainnet',
        maxAmountRequired: '15000000',
        resource: '/api/items/456',
        description: 'Premium Item',
        payTo: 'seller-wallet',
        maxTimeoutSeconds: 60,
      });
    });
  });

  describe('extractPaymentHeader', () => {
    it('should extract header from Headers object', () => {
      const headers = new Headers();
      headers.set('x-payment', 'test-payment-header');

      const result = extractPaymentHeader(headers);
      expect(result).toBe('test-payment-header');
    });

    it('should extract header from plain object (lowercase)', () => {
      const headers = {
        'x-payment': 'test-payment-header',
      };

      const result = extractPaymentHeader(headers);
      expect(result).toBe('test-payment-header');
    });

    it('should extract header from plain object (uppercase)', () => {
      const headers = {
        'X-Payment': 'test-payment-header',
      };

      const result = extractPaymentHeader(headers);
      expect(result).toBe('test-payment-header');
    });

    it('should handle array values', () => {
      const headers = {
        'x-payment': ['first-value', 'second-value'],
      };

      const result = extractPaymentHeader(headers);
      expect(result).toBe('first-value');
    });

    it('should return null if header not found', () => {
      const headers = {
        'other-header': 'value',
      };

      const result = extractPaymentHeader(headers);
      expect(result).toBeNull();
    });

    it('should return null for empty Headers object', () => {
      const headers = new Headers();
      const result = extractPaymentHeader(headers);
      expect(result).toBeNull();
    });
  });

  describe('USDC_MINT_ADDRESSES', () => {
    it('should have devnet address', () => {
      expect(USDC_MINT_ADDRESSES['solana-devnet']).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    });

    it('should have mainnet address', () => {
      expect(USDC_MINT_ADDRESSES['solana-mainnet']).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    });
  });
});
