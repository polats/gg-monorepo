/**
 * Tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCodes,
  BazaarError,
  ListingError,
  ItemError,
  PaymentError,
  ValidationError,
  StorageError,
  createListingNotFoundError,
  createItemNotOwnedError,
  createPaymentVerificationError,
  createMysteryBoxTierNotFoundError,
} from '../errors';

describe('error utilities', () => {
  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ErrorCodes.LISTING_NOT_FOUND).toBe('LISTING_NOT_FOUND');
      expect(ErrorCodes.ITEM_NOT_OWNED).toBe('ITEM_NOT_OWNED');
      expect(ErrorCodes.PAYMENT_VERIFICATION_FAILED).toBe('PAYMENT_VERIFICATION_FAILED');
      expect(ErrorCodes.MYSTERY_BOX_TIER_NOT_FOUND).toBe('MYSTERY_BOX_TIER_NOT_FOUND');
    });
  });

  describe('BazaarError', () => {
    it('should create error with code and message', () => {
      const error = new BazaarError(
        ErrorCodes.LISTING_NOT_FOUND,
        'Listing not found'
      );
      
      expect(error.code).toBe(ErrorCodes.LISTING_NOT_FOUND);
      expect(error.message).toBe('Listing not found');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BazaarError');
    });

    it('should accept custom status code', () => {
      const error = new BazaarError(
        ErrorCodes.LISTING_NOT_FOUND,
        'Listing not found',
        404
      );
      
      expect(error.statusCode).toBe(404);
    });

    it('should accept details', () => {
      const error = new BazaarError(
        ErrorCodes.LISTING_NOT_FOUND,
        'Listing not found',
        404,
        { listingId: 'listing-123' }
      );
      
      expect(error.details).toEqual({ listingId: 'listing-123' });
    });

    it('should convert to JSON', () => {
      const error = new BazaarError(
        ErrorCodes.LISTING_NOT_FOUND,
        'Listing not found',
        404,
        { listingId: 'listing-123' }
      );
      
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          code: ErrorCodes.LISTING_NOT_FOUND,
          message: 'Listing not found',
          details: { listingId: 'listing-123' },
        },
      });
    });
  });

  describe('ListingError', () => {
    it('should create listing error with 404 status', () => {
      const error = new ListingError(
        ErrorCodes.LISTING_NOT_FOUND,
        'Listing not found'
      );
      
      expect(error.name).toBe('ListingError');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ItemError', () => {
    it('should create item error with 400 status', () => {
      const error = new ItemError(
        ErrorCodes.ITEM_NOT_OWNED,
        'Item not owned'
      );
      
      expect(error.name).toBe('ItemError');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('PaymentError', () => {
    it('should create payment error with 402 status', () => {
      const error = new PaymentError(
        ErrorCodes.PAYMENT_VERIFICATION_FAILED,
        'Payment verification failed'
      );
      
      expect(error.name).toBe('PaymentError');
      expect(error.statusCode).toBe(402);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.INVALID_LISTING_PARAMS);
    });
  });

  describe('StorageError', () => {
    it('should create storage error with 500 status', () => {
      const error = new StorageError('Database connection failed');
      
      expect(error.name).toBe('StorageError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCodes.STORAGE_ERROR);
    });
  });

  describe('helper functions', () => {
    it('should create listing not found error', () => {
      const error = createListingNotFoundError('listing-123');
      
      expect(error.code).toBe(ErrorCodes.LISTING_NOT_FOUND);
      expect(error.message).toContain('listing-123');
      expect(error.details).toEqual({ listingId: 'listing-123' });
    });

    it('should create item not owned error', () => {
      const error = createItemNotOwnedError('item-123', 'user1');
      
      expect(error.code).toBe(ErrorCodes.ITEM_NOT_OWNED);
      expect(error.message).toContain('item-123');
      expect(error.message).toContain('user1');
      expect(error.details).toEqual({ itemId: 'item-123', username: 'user1' });
    });

    it('should create payment verification error', () => {
      const error = createPaymentVerificationError('Invalid signature');
      
      expect(error.code).toBe(ErrorCodes.PAYMENT_VERIFICATION_FAILED);
      expect(error.message).toContain('Invalid signature');
      expect(error.details).toEqual({ reason: 'Invalid signature' });
    });

    it('should create mystery box tier not found error', () => {
      const error = createMysteryBoxTierNotFoundError('tier-123');
      
      expect(error.code).toBe(ErrorCodes.MYSTERY_BOX_TIER_NOT_FOUND);
      expect(error.message).toContain('tier-123');
      expect(error.details).toEqual({ tierId: 'tier-123' });
    });
  });
});
