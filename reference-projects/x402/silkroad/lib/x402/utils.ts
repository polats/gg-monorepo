/**
 * x402 Utility Functions
 * 
 * Helper functions for creating payment requests and responses
 */

import type {
  PaymentRequiredResponse,
  PaymentRequirements,
  PaymentPayload,
  PaymentResponse,
} from '@/types/x402';
import { X402_VERSION, X_PAYMENT_HEADER, X_PAYMENT_RESPONSE_HEADER } from '@/types/x402';
import { CONFIG } from '@/config/constants';

/**
 * Create a 402 Payment Required response
 */
export function createPaymentRequired(
  listingId: string,
  title: string,
  price: number,
  sellerWallet: string,
  description?: string
): PaymentRequiredResponse {
  // Always use mainnet for USDC transactions (real money)
  const network = 'solana-mainnet';
  const usdcMint = CONFIG.USDC_MINT_MAINNET;

  // Convert price to USDC smallest unit (6 decimals)
  const amountInLamports = Math.floor(price * 1_000_000).toString();

  const requirements: PaymentRequirements = {
    scheme: 'exact',
    network,
    maxAmountRequired: amountInLamports,
    resource: `/api/listings/${listingId}`,
    description: description || title,
    mimeType: 'application/json',
    payTo: sellerWallet,
    maxTimeoutSeconds: 30,
    asset: usdcMint,
    extra: {
      listingId,
      title,
    },
  };

  return {
    x402Version: X402_VERSION,
    accepts: [requirements],
  };
}

/**
 * Encode payment payload to Base64 JSON (for X-PAYMENT header)
 */
export function encodePaymentPayload(payload: PaymentPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf-8').toString('base64');
}

/**
 * Decode payment payload from Base64 JSON
 */
export function decodePaymentPayload(encoded: string): PaymentPayload | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as PaymentPayload;
  } catch (error) {
    console.error('Failed to decode payment payload:', error);
    return null;
  }
}

/**
 * Encode payment response to Base64 JSON (for X-PAYMENT-RESPONSE header)
 */
export function encodePaymentResponse(response: PaymentResponse): string {
  const json = JSON.stringify(response);
  return Buffer.from(json, 'utf-8').toString('base64');
}

/**
 * Extract payment header from request
 */
export function extractPaymentHeader(headers: Headers): string | null {
  return headers.get(X_PAYMENT_HEADER);
}

/**
 * Create payment response headers
 */
export function createPaymentResponseHeaders(
  response: PaymentResponse
): Record<string, string> {
  return {
    [X_PAYMENT_RESPONSE_HEADER]: encodePaymentResponse(response),
  };
}

/**
 * Validate payment payload structure
 */
export function validatePaymentPayload(payload: any): payload is PaymentPayload {
  return (
    payload &&
    typeof payload.x402Version === 'number' &&
    typeof payload.scheme === 'string' &&
    typeof payload.network === 'string' &&
    payload.payload &&
    typeof payload.payload === 'object'
  );
}

