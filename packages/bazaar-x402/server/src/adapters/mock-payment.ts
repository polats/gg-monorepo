/**
 * Mock payment adapter for development and testing
 * 
 * This adapter bypasses real payment verification and always returns success.
 * Use this during development to test marketplace functionality without
 * requiring Solana wallet integration or real USDC transactions.
 */

import type {
  PaymentAdapter,
  PaymentRequirements,
  CreatePaymentParams,
  VerifyPaymentParams,
  VerificationResult,
} from '@bazaar-x402/core';

/**
 * Mock payment adapter that simulates successful payments
 * 
 * @example
 * ```typescript
 * const paymentAdapter = new MockPaymentAdapter();
 * const marketplace = new BazaarMarketplace({
 *   storageAdapter,
 *   itemAdapter,
 *   paymentAdapter, // Use mock adapter
 * });
 * ```
 */
export class MockPaymentAdapter implements PaymentAdapter {
  /**
   * Verify payment (mock mode - always succeeds)
   * 
   * In mock mode, this method:
   * - Logs the verification attempt for debugging
   * - Generates a mock transaction hash
   * - Always returns success without blockchain verification
   * 
   * @param params - Payment verification parameters
   * @returns Verification result with mock transaction hash
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    console.log('[MOCK PAYMENT] Payment verification bypassed:', {
      expectedAmount: params.expectedAmount,
      expectedRecipient: params.expectedRecipient,
      paymentHeader: params.paymentHeader ? 'provided' : 'not provided',
    });
    
    // Generate mock transaction hash with timestamp
    const mockTxHash = `mock-tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log('[MOCK PAYMENT] Generated mock transaction hash:', mockTxHash);
    
    return {
      success: true,
      txHash: mockTxHash,
      networkId: 'solana-devnet',
    };
  }
  
  /**
   * Create payment requirements (mock mode)
   * 
   * Returns mock payment requirements that can be used for testing
   * the 402 payment flow without real Solana integration.
   * 
   * @param params - Parameters for creating payment requirements
   * @returns Mock payment requirements
   */
  createPaymentRequirements(params: CreatePaymentParams): PaymentRequirements {
    console.log('[MOCK PAYMENT] Creating mock payment requirements:', {
      priceUSDC: params.priceUSDC,
      sellerWallet: params.sellerWallet,
      resource: params.resource,
    });
    
    // Convert USDC to smallest unit (6 decimals)
    const amountInSmallestUnit = Math.floor(params.priceUSDC * 1_000_000);
    
    return {
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: amountInSmallestUnit.toString(),
      resource: params.resource,
      description: params.description,
      mimeType: 'application/json',
      payTo: params.sellerWallet,
      maxTimeoutSeconds: 300,
      asset: 'MOCK_USDC_MINT_ADDRESS',
    };
  }
}
