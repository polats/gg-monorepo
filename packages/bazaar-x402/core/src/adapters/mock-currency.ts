/**
 * Mock currency adapter for development and testing
 * 
 * Provides in-memory or Redis-based currency management without blockchain integration.
 * Useful for rapid development, testing, and demos.
 */

import type { CurrencyAdapter } from './currency.js';
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
  MockCurrencyConfig,
} from '../types/index.js';
import { InsufficientBalanceError } from '../utils/errors.js';

/**
 * Redis client interface (optional dependency)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Mock currency adapter implementation
 * 
 * Features:
 * - In-memory Map storage (default)
 * - Optional Redis persistence
 * - Instant balance updates
 * - Mock transaction IDs
 * - Transaction history tracking
 */
export class MockCurrencyAdapter implements CurrencyAdapter {
  private balances: Map<string, number>;
  private transactions: Map<string, CurrencyTransaction[]>;
  private config: MockCurrencyConfig;
  private redisClient?: RedisClient;
  
  constructor(config: MockCurrencyConfig, redisClient?: RedisClient) {
    // Set defaults for optional config properties
    this.config = {
      txIdPrefix: 'MOCK',
      ...config,
    };
    
    this.balances = new Map();
    this.transactions = new Map();
    
    if (this.config.useRedis && redisClient) {
      this.redisClient = redisClient;
    }
  }
  
  /**
   * Get user's current currency balance
   * Initializes with default balance if user is new
   */
  async getBalance(userId: string): Promise<CurrencyBalance> {
    let balance: number | undefined;
    
    // Try Redis first if enabled
    if (this.redisClient) {
      const redisValue = await this.redisClient.get(`balance:${userId}`);
      if (redisValue !== null) {
        balance = parseFloat(redisValue);
      }
    }
    
    // Fall back to in-memory
    if (balance === undefined) {
      balance = this.balances.get(userId);
    }
    
    // Initialize new user with default balance
    if (balance === undefined) {
      balance = this.config.defaultBalance;
      await this.setBalance(userId, balance);
    }
    
    return {
      amount: balance,
      currency: 'MOCK_USDC',
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * Deduct currency from user's balance
   * Validates sufficient balance before deduction
   */
  async deduct(userId: string, amount: number): Promise<DeductionResult> {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Get current balance
    const currentBalance = await this.getBalance(userId);
    
    // Check sufficient balance
    if (currentBalance.amount < amount) {
      throw new InsufficientBalanceError(currentBalance.amount, amount);
    }
    
    // Calculate new balance
    const newBalance = currentBalance.amount - amount;
    
    // Update balance
    await this.setBalance(userId, newBalance);
    
    // Generate transaction ID
    const txId = this.generateMockTxId();
    
    return {
      success: true,
      newBalance,
      txId,
      networkId: 'mock',
    };
  }
  
  /**
   * Add currency to user's balance
   * Used for testing, refunds, and seller payments
   */
  async add(userId: string, amount: number): Promise<AdditionResult> {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Get current balance
    const currentBalance = await this.getBalance(userId);
    
    // Calculate new balance
    const newBalance = currentBalance.amount + amount;
    
    // Update balance
    await this.setBalance(userId, newBalance);
    
    // Generate transaction ID
    const txId = this.generateMockTxId();
    
    return {
      success: true,
      newBalance,
      txId,
      networkId: 'mock',
    };
  }
  
  /**
   * Initiate a purchase (mock mode immediately succeeds)
   * In mock mode, we deduct balance immediately and return success
   */
  async initiatePurchase(params: PurchaseParams): Promise<PurchaseInitiation> {
    // In mock mode, immediately deduct and return success
    const deductionResult = await this.deduct(params.buyerId, params.amount);
    
    return {
      status: 200,
      paymentRequired: false,
      txId: deductionResult.txId,
    };
  }
  
  /**
   * Verify and complete a purchase (mock mode always succeeds)
   * In mock mode, payment was already deducted in initiatePurchase
   */
  async verifyPurchase(params: VerifyParams): Promise<PurchaseResult> {
    // In mock mode, verification always succeeds
    // Payment was already deducted in initiatePurchase
    return {
      success: true,
      txHash: this.generateMockTxId(),
      networkId: 'mock',
    };
  }
  
  /**
   * Get transaction history for user
   * Supports pagination and sorting
   */
  async getTransactions(
    userId: string,
    options?: TransactionPaginationOptions
  ): Promise<CurrencyTransaction[]> {
    // Get transactions from storage
    let userTransactions: CurrencyTransaction[] = [];
    
    // Try Redis first if enabled
    if (this.redisClient) {
      const redisValue = await this.redisClient.get(`transactions:${userId}`);
      if (redisValue !== null) {
        userTransactions = JSON.parse(redisValue);
      }
    }
    
    // Fall back to in-memory
    if (userTransactions.length === 0) {
      userTransactions = this.transactions.get(userId) || [];
    }
    
    // Sort by timestamp (descending by default)
    const sortOrder = options?.sortOrder || 'desc';
    const sorted = [...userTransactions].sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.timestamp - a.timestamp 
        : a.timestamp - b.timestamp;
    });
    
    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return sorted.slice(startIndex, endIndex);
  }
  
  /**
   * Record a transaction
   * Persists to both in-memory and Redis (if enabled)
   */
  async recordTransaction(transaction: CurrencyTransaction): Promise<void> {
    // Get existing transactions
    let userTransactions = this.transactions.get(transaction.userId) || [];
    
    // Try Redis first if enabled
    if (this.redisClient) {
      const redisValue = await this.redisClient.get(`transactions:${transaction.userId}`);
      if (redisValue !== null) {
        userTransactions = JSON.parse(redisValue);
      }
    }
    
    // Add new transaction
    userTransactions.push(transaction);
    
    // Update in-memory
    this.transactions.set(transaction.userId, userTransactions);
    
    // Update Redis if enabled
    if (this.redisClient) {
      await this.redisClient.set(
        `transactions:${transaction.userId}`,
        JSON.stringify(userTransactions)
      );
    }
  }
  
  /**
   * Set balance for a user
   * Updates both in-memory and Redis (if enabled)
   */
  private async setBalance(userId: string, balance: number): Promise<void> {
    // Update in-memory
    this.balances.set(userId, balance);
    
    // Update Redis if enabled
    if (this.redisClient) {
      await this.redisClient.set(`balance:${userId}`, balance.toString());
    }
  }
  
  /**
   * Generate a mock transaction ID
   * Format: {prefix}_{timestamp}_{random}
   */
  private generateMockTxId(): string {
    const prefix = this.config.txIdPrefix || 'MOCK';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
  
  /**
   * Clear all balances and transactions (for testing)
   */
  async clear(): Promise<void> {
    this.balances.clear();
    this.transactions.clear();
    
    // Note: Redis clearing would need to be done separately
    // as we don't have a list of all keys
  }
  
  /**
   * Get all balances (for testing/debugging)
   */
  getAllBalances(): Map<string, number> {
    return new Map(this.balances);
  }
  
  /**
   * Get all transactions (for testing/debugging)
   */
  getAllTransactions(): Map<string, CurrencyTransaction[]> {
    return new Map(this.transactions);
  }
}
