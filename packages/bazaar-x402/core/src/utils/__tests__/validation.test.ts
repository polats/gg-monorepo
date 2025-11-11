/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import type { CreateListingParams, Listing, PaymentPayload } from '../../types/index';
import {
  validateListingParams,
  validateListingActive,
  validatePaymentPayload,
  validatePaymentAmount,
  validatePaymentRecipient,
  validateTokenMint,
  validateUsername,
  validateWalletAddress,
} from '../validation';

describe('validation utilities', () => {
  describe('validateListingParams', () => {
    const validParams: CreateListingParams = {
      itemId: 'item-123',
      itemType: 'gem',
      itemData: { color: 'blue' },
      sellerUsername: 'seller1',
      sellerWallet: 'wallet123',
      priceUSDC: 5.0,
    };

    it('should accept valid params', () => {
      expect(() => validateListingParams(validParams)).not.toThrow();
    });

    it('should reject empty item ID', () => {
      expect(() => validateListingParams({ ...validParams, itemId: '' }))
        .toThrow('Item ID is required');
    });

    it('should reject empty item type', () => {
      expect(() => validateListingParams({ ...validParams, itemType: '' }))
        .toThrow('Item type is required');
    });

    it('should reject empty seller username', () => {
      expect(() => validateListingParams({ ...validParams, sellerUsername: '' }))
        .toThrow('Seller username is required');
    });

    it('should reject empty seller wallet', () => {
      expect(() => validateListingParams({ ...validParams, sellerWallet: '' }))
        .toThrow('Seller wallet is required');
    });

    it('should reject invalid price', () => {
      expect(() => validateListingParams({ ...validParams, priceUSDC: 0 }))
        .toThrow('Price must be a valid USDC amount');
      expect(() => validateListingParams({ ...validParams, priceUSDC: -1 }))
        .toThrow('Price must be a valid USDC amount');
    });

    it('should reject invalid expiration', () => {
      expect(() => validateListingParams({ ...validParams, expiresInSeconds: 0 }))
        .toThrow('Expiration time must be a positive integer');
      expect(() => validateListingParams({ ...validParams, expiresInSeconds: -1 }))
        .toThrow('Expiration time must be a positive integer');
    });

    it('should accept valid expiration', () => {
      expect(() => validateListingParams({ ...validParams, expiresInSeconds: 3600 }))
        .not.toThrow();
    });
  });

  describe('validateListingActive', () => {
    const activeListing: Listing = {
      id: 'listing-1',
      itemId: 'item-1',
      itemType: 'gem',
      itemData: {},
      sellerWallet: 'wallet1',
      sellerUsername: 'seller1',
      priceUSDC: 5.0,
      status: 'active',
      createdAt: Date.now(),
    };

    it('should accept active listing without expiration', () => {
      expect(() => validateListingActive(activeListing)).not.toThrow();
    });

    it('should accept active listing with future expiration', () => {
      const listing = {
        ...activeListing,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
      expect(() => validateListingActive(listing)).not.toThrow();
    });

    it('should reject sold listing', () => {
      const listing = { ...activeListing, status: 'sold' as const };
      expect(() => validateListingActive(listing))
        .toThrow('Listing is sold, not active');
    });

    it('should reject cancelled listing', () => {
      const listing = { ...activeListing, status: 'cancelled' as const };
      expect(() => validateListingActive(listing))
        .toThrow('Listing is cancelled, not active');
    });

    it('should reject expired listing', () => {
      const listing = {
        ...activeListing,
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      expect(() => validateListingActive(listing))
        .toThrow('Listing has expired');
    });
  });

  describe('validatePaymentPayload', () => {
    const validPayload: PaymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: 'solana-devnet',
      payload: {
        signature: 'sig123',
        from: 'buyer-wallet',
        to: 'seller-wallet',
        amount: '5000000',
        mint: 'usdc-mint',
      },
    };

    it('should accept valid payload', () => {
      expect(() => validatePaymentPayload(validPayload)).not.toThrow();
    });

    it('should reject invalid x402 version', () => {
      const payload = { ...validPayload, x402Version: 2 };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Unsupported x402 version');
    });

    it('should reject invalid scheme', () => {
      const payload = { ...validPayload, scheme: 'invalid' as any };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Unsupported payment scheme');
    });

    it('should reject invalid network', () => {
      const payload = { ...validPayload, network: 'invalid' as any };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Invalid network');
    });

    it('should reject missing signature', () => {
      const payload = {
        ...validPayload,
        payload: { ...validPayload.payload, signature: '' },
      };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Transaction signature is required');
    });

    it('should reject missing from address', () => {
      const payload = {
        ...validPayload,
        payload: { ...validPayload.payload, from: '' },
      };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Sender address is required');
    });

    it('should reject missing to address', () => {
      const payload = {
        ...validPayload,
        payload: { ...validPayload.payload, to: '' },
      };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Recipient address is required');
    });

    it('should reject missing amount', () => {
      const payload = {
        ...validPayload,
        payload: { ...validPayload.payload, amount: '' },
      };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Amount is required');
    });

    it('should reject missing mint', () => {
      const payload = {
        ...validPayload,
        payload: { ...validPayload.payload, mint: '' },
      };
      expect(() => validatePaymentPayload(payload))
        .toThrow('Token mint is required');
    });
  });

  describe('validatePaymentAmount', () => {
    it('should accept matching amounts', () => {
      expect(() => validatePaymentAmount('5000000', '5000000')).not.toThrow();
    });

    it('should reject mismatched amounts', () => {
      expect(() => validatePaymentAmount('5000000', '4000000'))
        .toThrow('Payment amount mismatch');
    });
  });

  describe('validatePaymentRecipient', () => {
    it('should accept matching recipients', () => {
      expect(() => validatePaymentRecipient('wallet1', 'wallet1')).not.toThrow();
    });

    it('should reject mismatched recipients', () => {
      expect(() => validatePaymentRecipient('wallet1', 'wallet2'))
        .toThrow('Payment recipient mismatch');
    });
  });

  describe('validateTokenMint', () => {
    it('should accept matching mints', () => {
      expect(() => validateTokenMint('mint1', 'mint1')).not.toThrow();
    });

    it('should reject mismatched mints', () => {
      expect(() => validateTokenMint('mint1', 'mint2'))
        .toThrow('Token mint mismatch');
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(() => validateUsername('user123')).not.toThrow();
      expect(() => validateUsername('test_user')).not.toThrow();
      expect(() => validateUsername('test-user')).not.toThrow();
    });

    it('should reject empty username', () => {
      expect(() => validateUsername('')).toThrow('Username is required');
    });

    it('should reject username with invalid characters', () => {
      expect(() => validateUsername('user@123')).toThrow('must contain only alphanumeric');
      expect(() => validateUsername('user 123')).toThrow('must contain only alphanumeric');
    });

    it('should reject username too short', () => {
      expect(() => validateUsername('ab')).toThrow('must be between 3 and 50 characters');
    });

    it('should reject username too long', () => {
      const longUsername = 'a'.repeat(51);
      expect(() => validateUsername(longUsername)).toThrow('must be between 3 and 50 characters');
    });
  });

  describe('validateWalletAddress', () => {
    it('should accept valid wallet addresses', () => {
      const validAddress = 'a'.repeat(44); // 44 characters
      expect(() => validateWalletAddress(validAddress)).not.toThrow();
    });

    it('should reject empty address', () => {
      expect(() => validateWalletAddress('')).toThrow('Wallet address is required');
    });

    it('should reject address too short', () => {
      const shortAddress = 'a'.repeat(31);
      expect(() => validateWalletAddress(shortAddress)).toThrow('Invalid wallet address length');
    });

    it('should reject address too long', () => {
      const longAddress = 'a'.repeat(45);
      expect(() => validateWalletAddress(longAddress)).toThrow('Invalid wallet address length');
    });
  });
});
