/**
 * Payment adapter interface for handling payment verification
 */

import type {
  PaymentRequirements,
  CreatePaymentParams,
  VerifyPaymentParams,
  VerificationResult,
} from '../types/index.js';

/**
 * Payment adapter interface for mock and real payment handling
 * 
 * This interface allows switching between mock mode (for development)
 * and real mode (for production) without changing application code.
 */
export interface PaymentAdapter {
  /**
   * Verify a payment from the X-Payment header
   * 
   * In mock mode: Always returns success without verification
   * In real mode: Verifies transaction on Solana blockchain
   * 
   * @param params - Payment verification parameters
   * @returns Verification result with transaction hash
   */
  verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult>;
  
  /**
   * Create payment requirements for a 402 response
   * 
   * In mock mode: Returns mock payment requirements
   * In real mode: Returns real Solana payment requirements
   * 
   * @param params - Parameters for creating payment requirements
   * @returns Payment requirements object
   */
  createPaymentRequirements(params: CreatePaymentParams): PaymentRequirements;
}
