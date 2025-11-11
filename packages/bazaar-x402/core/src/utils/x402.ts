/**
 * x402 Protocol Utilities
 * 
 * Helper functions for encoding/decoding payment headers and creating payment requirements
 */

import type {
  PaymentPayload,
  PaymentRequirements,
  PaymentRequiredResponse,
  CreatePaymentParams,
  SolanaNetwork,
} from '../types/payment.js';
import { X402_VERSION } from '../types/payment.js';
import { usdcToSmallestUnit } from './conversion.js';

// ============================================
// Payment Header Encoding/Decoding
// ============================================

/**
 * Encode payment payload to Base64 JSON for X-Payment header
 * 
 * @param payload - Payment payload to encode
 * @returns Base64-encoded JSON string
 * @throws Error if encoding fails
 */
export function encodePaymentHeader(payload: PaymentPayload): string {
  try {
    const json = JSON.stringify(payload);
    
    // Use Buffer in Node.js, btoa in browser
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(json, 'utf-8').toString('base64');
    } else if (typeof btoa !== 'undefined') {
      return btoa(json);
    } else {
      throw new Error('No Base64 encoding method available');
    }
  } catch (error) {
    throw new Error(
      `Failed to encode payment header: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decode payment payload from Base64 JSON
 * 
 * @param encoded - Base64-encoded payment payload
 * @returns Decoded payment payload or null if decoding fails
 */
export function decodePaymentHeader(encoded: string): PaymentPayload | null {
  try {
    let decoded: string;
    
    // Use Buffer in Node.js, atob in browser
    if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    } else if (typeof atob !== 'undefined') {
      decoded = atob(encoded);
    } else {
      throw new Error('No Base64 decoding method available');
    }
    
    const payload = JSON.parse(decoded) as PaymentPayload;
    
    // Validate the decoded payload
    if (!isValidPaymentPayload(payload)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Failed to decode payment header:', error);
    return null;
  }
}

/**
 * Validate payment payload structure (non-throwing version)
 * 
 * @param payload - Payload to validate
 * @returns True if payload is valid
 */
export function isValidPaymentPayload(payload: any): payload is PaymentPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  // Check required top-level fields
  if (
    typeof payload.x402Version !== 'number' ||
    typeof payload.scheme !== 'string' ||
    typeof payload.network !== 'string'
  ) {
    return false;
  }
  
  // Check payload object
  if (!payload.payload || typeof payload.payload !== 'object') {
    return false;
  }
  
  const innerPayload = payload.payload;
  
  // Check required payload fields
  if (
    typeof innerPayload.signature !== 'string' ||
    typeof innerPayload.from !== 'string' ||
    typeof innerPayload.to !== 'string' ||
    typeof innerPayload.amount !== 'string' ||
    typeof innerPayload.mint !== 'string'
  ) {
    return false;
  }
  
  // Validate non-empty strings
  if (
    !innerPayload.signature.trim() ||
    !innerPayload.from.trim() ||
    !innerPayload.to.trim() ||
    !innerPayload.amount.trim() ||
    !innerPayload.mint.trim()
  ) {
    return false;
  }
  
  return true;
}

// ============================================
// Payment Requirements Builder
// ============================================

/**
 * USDC mint addresses for different networks
 */
export const USDC_MINT_ADDRESSES = {
  'solana-devnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'solana-mainnet': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;

/**
 * Create payment requirements for a purchase
 * 
 * @param params - Parameters for creating payment requirements
 * @param network - Solana network to use (defaults to mainnet)
 * @param timeoutSeconds - Payment timeout in seconds (defaults to 30)
 * @returns Payment requirements object
 */
export function createPaymentRequirements(
  params: CreatePaymentParams,
  network: SolanaNetwork = 'solana-mainnet',
  timeoutSeconds: number = 30
): PaymentRequirements {
  const { priceUSDC, sellerWallet, resource, description } = params;
  
  // Convert USDC to smallest unit
  const maxAmountRequired = usdcToSmallestUnit(priceUSDC);
  
  // Get network-specific USDC mint address
  const asset = USDC_MINT_ADDRESSES[network];
  
  return {
    scheme: 'exact',
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType: 'application/json',
    payTo: sellerWallet,
    maxTimeoutSeconds: timeoutSeconds,
    asset,
  };
}

/**
 * Create a 402 Payment Required response
 * 
 * @param params - Parameters for creating payment requirements
 * @param network - Solana network to use (defaults to mainnet)
 * @param timeoutSeconds - Payment timeout in seconds (defaults to 30)
 * @returns Payment required response object
 */
export function createPaymentRequiredResponse(
  params: CreatePaymentParams,
  network: SolanaNetwork = 'solana-mainnet',
  timeoutSeconds: number = 30
): PaymentRequiredResponse {
  const requirements = createPaymentRequirements(params, network, timeoutSeconds);
  
  return {
    x402Version: X402_VERSION,
    accepts: [requirements],
  };
}

/**
 * Extract payment header from request headers
 * 
 * @param headers - Request headers object or Headers instance
 * @returns Payment header value or null if not found
 */
export function extractPaymentHeader(
  headers: Record<string, string | string[] | undefined> | Headers
): string | null {
  if (headers instanceof Headers) {
    return headers.get('x-payment');
  }
  
  const header = headers['x-payment'] || headers['X-Payment'];
  
  if (Array.isArray(header)) {
    return header[0] || null;
  }
  
  return header || null;
}
