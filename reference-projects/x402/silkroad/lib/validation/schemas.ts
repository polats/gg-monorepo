/**
 * Validation Schemas
 * 
 * Reusable validation functions for API endpoints
 */

import { LISTING_LIMITS, LISTING_CATEGORIES } from '@/config/constants';
import { isValidURL, isValidPrice, isValidSolanaAddress } from './sanitization';
import { validateListingContent } from './maliciousTerms';

/**
 * Validate listing creation data
 * 
 * @param data - Listing data object
 * @returns {valid: boolean, errors: string[]} - Validation result
 */
export function validateListingData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Title
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required');
  } else if (data.title.length < LISTING_LIMITS.TITLE_MIN) {
    errors.push(`Title must be at least ${LISTING_LIMITS.TITLE_MIN} characters`);
  } else if (data.title.length > LISTING_LIMITS.TITLE_MAX) {
    errors.push(`Title must not exceed ${LISTING_LIMITS.TITLE_MAX} characters`);
  }

  // Description
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required');
  } else if (data.description.length < LISTING_LIMITS.DESCRIPTION_MIN) {
    errors.push(`Description must be at least ${LISTING_LIMITS.DESCRIPTION_MIN} characters`);
  } else if (data.description.length > LISTING_LIMITS.DESCRIPTION_MAX) {
    errors.push(`Description must not exceed ${LISTING_LIMITS.DESCRIPTION_MAX} characters`);
  }

  // Check malicious terms
  if (data.title && data.description) {
    const contentCheck = validateListingContent(data.title, data.description);
    if (!contentCheck.valid) {
      errors.push(contentCheck.reason || 'Content validation failed');
    }
  }

  // Image URL
  if (!data.imageUrl || !isValidURL(data.imageUrl)) {
    errors.push('Valid image URL is required');
  }

  // Delivery URL
  if (!data.deliveryUrl || !isValidURL(data.deliveryUrl)) {
    errors.push('Valid delivery URL is required');
  }

  // Price
  if (!isValidPrice(data.price, LISTING_LIMITS.PRICE_MIN)) {
    errors.push(`Price must be at least $${LISTING_LIMITS.PRICE_MIN} USDC`);
  }

  // Category
  if (!LISTING_CATEGORIES.includes(data.category)) {
    errors.push('Invalid category');
  }

  // Optional URLs
  if (data.demoVideoUrl && !isValidURL(data.demoVideoUrl)) {
    errors.push('Demo video URL is invalid');
  }

  if (data.whitepaperUrl && !isValidURL(data.whitepaperUrl)) {
    errors.push('Whitepaper URL is invalid');
  }

  if (data.githubUrl && !isValidURL(data.githubUrl)) {
    errors.push('GitHub URL is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate wallet connect request
 * 
 * @param data - Wallet connect data
 * @returns {valid: boolean, errors: string[]} - Validation result
 */
export function validateWalletConnect(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.signature || typeof data.signature !== 'string') {
    errors.push('Signature is required');
  }

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required');
  }

  if (!data.publicKey || !isValidSolanaAddress(data.publicKey)) {
    errors.push('Valid public key is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate report submission
 * 
 * @param data - Report data
 * @returns {valid: boolean, errors: string[]} - Validation result
 */
export function validateReport(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.listingId || typeof data.listingId !== 'string') {
    errors.push('Listing ID is required');
  }

  if (data.reason && data.reason.length > LISTING_LIMITS.REASON_MAX) {
    errors.push(`Reason must not exceed ${LISTING_LIMITS.REASON_MAX} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate admin login
 * 
 * @param data - Admin login data
 * @returns {valid: boolean, errors: string[]} - Validation result
 */
export function validateAdminLogin(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.code || typeof data.code !== 'string') {
    errors.push('Admin code is required');
  }

  if (data.otp && (typeof data.otp !== 'string' || data.otp.length !== 6)) {
    errors.push('OTP must be 6 digits');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

