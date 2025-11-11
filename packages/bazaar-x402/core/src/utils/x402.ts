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
    console.log('🔍 DECODE: Starting decode of payment header');
    console.log('🔍 DECODE: Encoded length:', encoded.length);
    
    let decoded: string;
    
    // Use Buffer in Node.js, atob in browser
    if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    } else if (typeof atob !== 'undefined') {
      decoded = atob(encoded);
    } else {
      throw new Error('No Base64 decoding method available');
    }
    
    console.log('🔍 DECODE: Base64 decoded successfully');
    console.log('🔍 DECODE: Decoded string length:', decoded.length);
    
    const payload = JSON.parse(decoded) as PaymentPayload;
    console.log('🔍 DECODE: JSON parsed successfully');
    console.log('🔍 DECODE: Payload structure:', {
      x402Version: payload.x402Version,
      scheme: payload.scheme,
      network: payload.network,
      hasPayload: !!payload.payload,
      payloadKeys: payload.payload ? Object.keys(payload.payload) : []
    });
    
    // Validate the decoded payload
    if (!isValidPaymentPayload(payload)) {
      console.error('🔍 DECODE: Payload validation failed');
      console.error('🔍 DECODE: Payload:', JSON.stringify(payload, null, 2));
      return null;
    }
    
    console.log('🔍 DECODE: Payload validation passed');
    return payload;
  } catch (error) {
    console.error('🔍 DECODE: Failed to decode payment header:', error);
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
  console.log('🔍 VALIDATE: Starting payload validation');
  
  if (!payload || typeof payload !== 'object') {
    console.error('🔍 VALIDATE: Payload is not an object');
    return false;
  }
  
  // Check required top-level fields
  if (
    typeof payload.x402Version !== 'number' ||
    typeof payload.scheme !== 'string' ||
    typeof payload.network !== 'string'
  ) {
    console.error('🔍 VALIDATE: Missing or invalid top-level fields', {
      x402Version: typeof payload.x402Version,
      scheme: typeof payload.scheme,
      network: typeof payload.network
    });
    return false;
  }
  
  // Check payload object
  if (!payload.payload || typeof payload.payload !== 'object') {
    console.error('🔍 VALIDATE: Missing or invalid payload object');
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
    console.error('🔍 VALIDATE: Missing or invalid inner payload fields', {
      signature: typeof innerPayload.signature,
      from: typeof innerPayload.from,
      to: typeof innerPayload.to,
      amount: typeof innerPayload.amount,
      mint: typeof innerPayload.mint
    });
    return false;
  }
  
  // Validate non-empty strings (except signature which can be empty if signedTransaction is provided)
  if (
    !innerPayload.from.trim() ||
    !innerPayload.to.trim() ||
    !innerPayload.amount.trim() ||
    !innerPayload.mint.trim()
  ) {
    console.error('🔍 VALIDATE: Empty required fields', {
      from: innerPayload.from,
      to: innerPayload.to,
      amount: innerPayload.amount,
      mint: innerPayload.mint
    });
    return false;
  }
  
  // Signature can be empty if signedTransaction is provided
  // At least one must be present
  console.log('🔍 VALIDATE: Checking signature/signedTransaction', {
    hasSignature: !!innerPayload.signature.trim(),
    hasSignedTransaction: !!innerPayload.signedTransaction,
    signatureLength: innerPayload.signature.length,
    signedTransactionType: typeof innerPayload.signedTransaction
  });
  
  if (!innerPayload.signature.trim() && !innerPayload.signedTransaction) {
    console.error('🔍 VALIDATE: Neither signature nor signedTransaction provided');
    return false;
  }
  
  console.log('🔍 VALIDATE: Validation passed!');
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
