/**
 * Currency adapter interface for handling currency operations
 * 
 * This interface abstracts currency operations to support both:
 * - Mock mode: In-memory or Redis-based currency for development/testing
 * - Production mode: Real Solana USDC transactions via x402 protocol
 */

import type {
  CurrencyBalance,
  DeductionResult,
  AdditionResult,
  PurchaseParams,
  PurchaseInitiation,
  VerifyParams,
  PurchaseResult,
  CurrencyTransaction,
  TransactionPaginationOptions,
} from '../types/index.js';

/**
 * Currency adapter interface
 * 
 * Implementations:
 * - MockCurrencyAdapter: Uses in-memory or Redis storage
 * - X402CurrencyAdapter: Uses x402 payment protocol with Solana USDC
 */
export interface CurrencyAdapter {
  /**
   * Get user's current currency balance
   * 
   * @param userId - User identifier (username or wallet address)
   * @returns Currency balance information
   */
  getBalance(userId: string): Promise<CurrencyBalance>;
  
  /**
   * Deduct currency from user's balance
   * 
   * In mock mode: Validates balance and deducts from storage
   * In production mode: Not used (payment happens on-chain)
   * 
   * @param userId - User identifier
   * @param amount - Amount to deduct in USDC
   * @returns Deduction result with new balance and transaction ID
   * @throws InsufficientBalanceError if balance is insufficient
   */
  deduct(userId: string, amount: number): Promise<DeductionResult>;
  
  /**
   * Add currency to user's balance
   * 
   * In mock mode: Adds to storage (for testing or seller payments)
   * In production mode: Not used (balance is on-chain)
   * 
   * @param userId - User identifier
   * @param amount - Amount to add in USDC
   * @returns Addition result with new balance and transaction ID
   */
  add(userId: string, amount: number): Promise<AdditionResult>;
  
  /**
   * Initiate a purchase
   * 
   * In mock mode: Immediately deducts balance and returns success
   * In production mode: Returns 402 Payment Required with payment requirements
   * 
   * @param params - Purchase parameters
   * @returns Purchase initiation result (may require payment)
   */
  initiatePurchase(params: PurchaseParams): Promise<PurchaseInitiation>;
  
  /**
   * Verify and complete a purchase
   * 
   * In mock mode: Returns success immediately (already deducted)
   * In production mode: Verifies payment on Solana blockchain
   * 
   * @param params - Verification parameters
   * @returns Purchase result with transaction hash
   * @throws PaymentVerificationError if verification fails
   */
  verifyPurchase(params: VerifyParams): Promise<PurchaseResult>;
  
  /**
   * Get transaction history for user
   * 
   * @param userId - User identifier
   * @param options - Pagination and sorting options
   * @returns Array of transactions
   */
  getTransactions(
    userId: string,
    options?: TransactionPaginationOptions
  ): Promise<CurrencyTransaction[]>;
  
  /**
   * Record a transaction
   * 
   * Used to persist transaction records for both mock and production modes
   * 
   * @param transaction - Transaction to record
   */
  recordTransaction(transaction: CurrencyTransaction): Promise<void>;
}
