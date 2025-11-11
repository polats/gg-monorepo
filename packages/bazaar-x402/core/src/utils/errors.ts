/**
 * Error classes and error codes for Bazaar marketplace
 */

/**
 * Error codes for Bazaar operations
 */
export const ErrorCodes = {
  // Listing errors
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  LISTING_EXPIRED: 'LISTING_EXPIRED',
  LISTING_NOT_ACTIVE: 'LISTING_NOT_ACTIVE',
  LISTING_ALREADY_EXISTS: 'LISTING_ALREADY_EXISTS',
  LISTING_CREATION_FAILED: 'LISTING_CREATION_FAILED',
  
  // Item errors
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ITEM_NOT_OWNED: 'ITEM_NOT_OWNED',
  ITEM_ALREADY_LISTED: 'ITEM_ALREADY_LISTED',
  ITEM_LOCKED: 'ITEM_LOCKED',
  ITEM_LOCK_FAILED: 'ITEM_LOCK_FAILED',
  
  // Payment errors
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  INSUFFICIENT_PAYMENT: 'INSUFFICIENT_PAYMENT',
  INVALID_RECIPIENT: 'INVALID_RECIPIENT',
  INVALID_TOKEN_MINT: 'INVALID_TOKEN_MINT',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  INVALID_PAYMENT_PAYLOAD: 'INVALID_PAYMENT_PAYLOAD',
  
  // Mystery box errors
  MYSTERY_BOX_TIER_NOT_FOUND: 'MYSTERY_BOX_TIER_NOT_FOUND',
  MYSTERY_BOX_GENERATION_FAILED: 'MYSTERY_BOX_GENERATION_FAILED',
  INVALID_TIER: 'INVALID_TIER',
  INVALID_WEIGHTS: 'INVALID_WEIGHTS',
  ITEM_GENERATION_FAILED: 'ITEM_GENERATION_FAILED',
  ITEM_GRANT_FAILED: 'ITEM_GRANT_FAILED',
  
  // User errors
  INVALID_USERNAME: 'INVALID_USERNAME',
  INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
  BUYER_IS_SELLER: 'BUYER_IS_SELLER',
  MISSING_USERNAME: 'MISSING_USERNAME',
  MISSING_BUYER_INFO: 'MISSING_BUYER_INFO',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  INVALID_PRICE: 'INVALID_PRICE',
  INVALID_LISTING_PARAMS: 'INVALID_LISTING_PARAMS',
  
  // System errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_NOT_SUPPORTED: 'STORAGE_NOT_SUPPORTED',
  ADAPTER_ERROR: 'ADAPTER_ERROR',
  ATOMIC_TRANSACTION_FAILED: 'ATOMIC_TRANSACTION_FAILED',
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Base error class for Bazaar marketplace
 */
export class BazaarError extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: ErrorCode;
  
  /**
   * HTTP status code (for API responses)
   */
  public readonly statusCode: number;
  
  /**
   * Additional error details
   */
  public readonly details?: any;
  
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'BazaarError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BazaarError);
    }
  }
  
  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Error for listing-related issues
 */
export class ListingError extends BazaarError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 404, details);
    this.name = 'ListingError';
  }
}

/**
 * Error for item-related issues
 */
export class ItemError extends BazaarError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 400, details);
    this.name = 'ItemError';
  }
}

/**
 * Error for payment-related issues
 */
export class PaymentError extends BazaarError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 402, details);
    this.name = 'PaymentError';
  }
}

/**
 * Error for validation issues
 */
export class ValidationError extends BazaarError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.INVALID_LISTING_PARAMS, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Error for storage/adapter issues
 */
export class StorageError extends BazaarError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.STORAGE_ERROR, message, 500, details);
    this.name = 'StorageError';
  }
}

/**
 * Helper function to create a listing not found error
 */
export function createListingNotFoundError(listingId: string): ListingError {
  return new ListingError(
    ErrorCodes.LISTING_NOT_FOUND,
    `Listing not found: ${listingId}`,
    { listingId }
  );
}

/**
 * Helper function to create an item not owned error
 */
export function createItemNotOwnedError(itemId: string, username: string): ItemError {
  return new ItemError(
    ErrorCodes.ITEM_NOT_OWNED,
    `Item ${itemId} is not owned by ${username}`,
    { itemId, username }
  );
}

/**
 * Helper function to create a payment verification failed error
 */
export function createPaymentVerificationError(reason: string): PaymentError {
  return new PaymentError(
    ErrorCodes.PAYMENT_VERIFICATION_FAILED,
    `Payment verification failed: ${reason}`,
    { reason }
  );
}

/**
 * Helper function to create a mystery box tier not found error
 */
export function createMysteryBoxTierNotFoundError(tierId: string): BazaarError {
  return new BazaarError(
    ErrorCodes.MYSTERY_BOX_TIER_NOT_FOUND,
    `Mystery box tier not found: ${tierId}`,
    404,
    { tierId }
  );
}
