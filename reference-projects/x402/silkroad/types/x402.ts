/**
 * x402 Protocol Types
 * 
 * Adapted from https://github.com/coinbase/x402
 * Modified for Solana USDC payments
 */

// ============================================
// Payment Required Response (402 Response)
// ============================================
export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
}

export interface PaymentRequirements {
  scheme: 'exact';  // Only exact scheme for MVP
  network: 'solana-devnet' | 'solana-mainnet';
  maxAmountRequired: string;  // Amount in USDC (smallest unit - lamports/decimals)
  resource: string;  // URL of resource being purchased
  description: string;  // Description of listing
  mimeType: string;  // Response type
  payTo: string;  // Seller's Solana wallet address
  maxTimeoutSeconds: number;  // Max time to complete payment
  asset: string;  // USDC mint address
  extra?: Record<string, any>;
}

// ============================================
// Payment Payload (X-PAYMENT Header)
// ============================================
export interface PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: 'solana-devnet' | 'solana-mainnet';
  payload: SolanaExactPayload;
}

export interface SolanaExactPayload {
  signature: string;  // Solana transaction signature
  from: string;  // Buyer wallet
  to: string;  // Seller wallet
  amount: string;  // Amount in USDC
  mint: string;  // USDC mint address
}

// ============================================
// Facilitator Types
// ============================================
export interface VerifyRequest {
  x402Version: number;
  paymentHeader: string;  // Base64 encoded PaymentPayload
  paymentRequirements: PaymentRequirements;
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason: string | null;
}

export interface SettleRequest {
  x402Version: number;
  paymentHeader: string;  // Base64 encoded PaymentPayload
  paymentRequirements: PaymentRequirements;
}

export interface SettleResponse {
  success: boolean;
  error: string | null;
  txHash: string | null;
  networkId: string | null;
}

// ============================================
// Payment Response (X-PAYMENT-RESPONSE Header)
// ============================================
export interface PaymentResponse {
  success: boolean;
  txHash: string;
  networkId: string;
  deliveryUrl?: string;  // Only for successful purchases
}

// ============================================
// Constants
// ============================================
export const X402_VERSION = 1;
export const X_PAYMENT_HEADER = 'x-payment';
export const X_PAYMENT_RESPONSE_HEADER = 'x-payment-response';

