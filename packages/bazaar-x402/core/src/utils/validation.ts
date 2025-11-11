/**
 * Validation helpers for listings and payments
 */

import type { Listing, CreateListingParams, PaymentPayload } from '../types/index.js';
import { isValidUsdcAmount } from './conversion.js';

/**
 * Validate listing parameters before creation
 * 
 * @param params - Listing creation parameters
 * @throws Error if validation fails
 */
export function validateListingParams(params: CreateListingParams): void {
  // Validate item ID
  if (!params.itemId || typeof params.itemId !== 'string' || params.itemId.trim() === '') {
    throw new Error('Item ID is required and must be a non-empty string');
  }
  
  // Validate item type
  if (!params.itemType || typeof params.itemType !== 'string' || params.itemType.trim() === '') {
    throw new Error('Item type is required and must be a non-empty string');
  }
  
  // Validate seller username
  if (!params.sellerUsername || typeof params.sellerUsername !== 'string' || params.sellerUsername.trim() === '') {
    throw new Error('Seller username is required and must be a non-empty string');
  }
  
  // Validate seller wallet
  if (!params.sellerWallet || typeof params.sellerWallet !== 'string' || params.sellerWallet.trim() === '') {
    throw new Error('Seller wallet is required and must be a non-empty string');
  }
  
  // Validate price
  if (!isValidUsdcAmount(params.priceUSDC)) {
    throw new Error('Price must be a valid USDC amount (0.01 - 1,000,000)');
  }
  
  // Validate expiration if provided
  if (params.expiresInSeconds !== undefined) {
    if (!Number.isInteger(params.expiresInSeconds) || params.expiresInSeconds <= 0) {
      throw new Error('Expiration time must be a positive integer');
    }
  }
}

/**
 * Validate that a listing is active and not expired
 * 
 * @param listing - The listing to validate
 * @throws Error if listing is not active or is expired
 */
export function validateListingActive(listing: Listing): void {
  if (listing.status !== 'active') {
    throw new Error(`Listing is ${listing.status}, not active`);
  }
  
  if (listing.expiresAt && Date.now() > listing.expiresAt) {
    throw new Error('Listing has expired');
  }
}

/**
 * Validate payment payload structure
 * 
 * @param payload - The payment payload to validate
 * @throws Error if validation fails
 */
export function validatePaymentPayload(payload: PaymentPayload): void {
  // Validate x402 version
  if (payload.x402Version !== 1) {
    throw new Error(`Unsupported x402 version: ${payload.x402Version}`);
  }
  
  // Validate scheme
  if (payload.scheme !== 'exact') {
    throw new Error(`Unsupported payment scheme: ${payload.scheme}`);
  }
  
  // Validate network
  if (payload.network !== 'solana-devnet' && payload.network !== 'solana-mainnet') {
    throw new Error(`Invalid network: ${payload.network}`);
  }
  
  // Validate payload structure
  if (!payload.payload) {
    throw new Error('Payment payload is missing');
  }
  
  const { signature, from, to, amount, mint } = payload.payload;
  
  if (!signature || typeof signature !== 'string') {
    throw new Error('Transaction signature is required');
  }
  
  if (!from || typeof from !== 'string') {
    throw new Error('Sender address is required');
  }
  
  if (!to || typeof to !== 'string') {
    throw new Error('Recipient address is required');
  }
  
  if (!amount || typeof amount !== 'string') {
    throw new Error('Amount is required');
  }
  
  if (!mint || typeof mint !== 'string') {
    throw new Error('Token mint is required');
  }
}

/**
 * Validate that payment amount matches expected amount
 * 
 * @param actualAmount - Actual amount in smallest unit (string)
 * @param expectedAmount - Expected amount in smallest unit (string)
 * @throws Error if amounts don't match
 */
export function validatePaymentAmount(actualAmount: string, expectedAmount: string): void {
  if (actualAmount !== expectedAmount) {
    throw new Error(
      `Payment amount mismatch: expected ${expectedAmount}, got ${actualAmount}`
    );
  }
}

/**
 * Validate that payment recipient matches expected recipient
 * 
 * @param actualRecipient - Actual recipient address
 * @param expectedRecipient - Expected recipient address
 * @throws Error if recipients don't match
 */
export function validatePaymentRecipient(actualRecipient: string, expectedRecipient: string): void {
  if (actualRecipient !== expectedRecipient) {
    throw new Error(
      `Payment recipient mismatch: expected ${expectedRecipient}, got ${actualRecipient}`
    );
  }
}

/**
 * Validate that token mint matches expected USDC mint
 * 
 * @param actualMint - Actual token mint address
 * @param expectedMint - Expected USDC mint address
 * @throws Error if mints don't match
 */
export function validateTokenMint(actualMint: string, expectedMint: string): void {
  if (actualMint !== expectedMint) {
    throw new Error(
      `Token mint mismatch: expected ${expectedMint}, got ${actualMint}`
    );
  }
}

/**
 * Validate username format
 * 
 * @param username - Username to validate
 * @throws Error if username is invalid
 */
export function validateUsername(username: string): void {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new Error('Username is required and must be a non-empty string');
  }
  
  // Basic username validation (alphanumeric, underscore, hyphen)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    throw new Error('Username must contain only alphanumeric characters, underscores, and hyphens');
  }
  
  if (username.length < 3 || username.length > 50) {
    throw new Error('Username must be between 3 and 50 characters');
  }
}

/**
 * Validate wallet address format (basic check)
 * 
 * @param address - Wallet address to validate
 * @throws Error if address is invalid
 */
export function validateWalletAddress(address: string): void {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    throw new Error('Wallet address is required and must be a non-empty string');
  }
  
  // Basic Solana address validation (base58, 32-44 characters)
  if (address.length < 32 || address.length > 44) {
    throw new Error('Invalid wallet address length');
  }
}
