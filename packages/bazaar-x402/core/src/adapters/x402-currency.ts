/**
 * X402 Currency Adapter for production mode
 * 
 * Provides real Solana USDC payment integration using x402 protocol.
 * Verifies payments on-chain and queries actual blockchain balances.
 */

import { Connection, PublicKey } from '@solana/web3.js';
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
  X402CurrencyConfig,
} from '../types/index.js';
import { X402Facilitator } from '../utils/x402-facilitator.js';
import { createPaymentRequiredResponse } from '../utils/x402.js';

/**
 * Balance cache entry
 */
interface BalanceCacheEntry {
  balance: number;
  timestamp: number;
}

/**
 * X402 Currency Adapter implementation
 * 
 * Features:
 * - On-chain USDC balance queries
 * - x402 payment protocol integration
 * - Payment verification via X402Facilitator
 * - Balance caching to reduce RPC calls
 * - Transaction history tracking
 */
export class X402CurrencyAdapter implements CurrencyAdapter {
  private connection: Connection;
  private config: X402CurrencyConfig;
  private facilitator: X402Facilitator;
  private balanceCache: Map<string, BalanceCacheEntry>;
  private transactions: Map<string, CurrencyTransaction[]>;
  
  constructor(config: X402CurrencyConfig) {
    this.config = config;
    
    // Initialize Solana connection with network-specific RPC
    const rpcUrl = config.network === 'solana-mainnet'
      ? config.mainnetRpcUrl
      : config.devnetRpcUrl;
    
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Initialize X402Facilitator for payment verification
    this.facilitator = new X402Facilitator({
      network: config.network,
      devnetRpcUrl: config.devnetRpcUrl,
      mainnetRpcUrl: config.mainnetRpcUrl,
      usdcMintDevnet: config.usdcMintDevnet,
      usdcMintMainnet: config.usdcMintMainnet,
      maxPollAttempts: config.maxPollAttempts,
      pollIntervalMs: config.pollIntervalMs,
    });
    
    // Initialize caches
    this.balanceCache = new Map();
    this.transactions = new Map();
  }
  
  /**
   * Get user's current on-chain USDC balance
   * Caches balance for configured duration to reduce RPC calls
   */
  async getBalance(userId: string): Promise<CurrencyBalance> {
    // Check cache first
    const cacheDuration = (this.config.balanceCacheDuration || 30) * 1000; // Convert to ms
    const cached = this.balanceCache.get(userId);
    
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return {
        amount: cached.balance,
        currency: 'USDC',
        lastUpdated: cached.timestamp,
      };
    }
    
    try {
      // Query on-chain USDC balance
      const publicKey = new PublicKey(userId);
      const usdcMint = new PublicKey(this.getUsdcMint());
      
      // Get token accounts for this wallet and USDC mint
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: usdcMint }
      );
      
      // Sum up balance from all token accounts (usually just one)
      let balance = 0;
      for (const account of tokenAccounts.value) {
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        if (amount !== null) {
          balance += amount;
        }
      }
      
      // Update cache
      const timestamp = Date.now();
      this.balanceCache.set(userId, { balance, timestamp });
      
      return {
        amount: balance,
        currency: 'USDC',
        lastUpdated: timestamp,
      };
    } catch (error) {
      console.error('Failed to query on-chain balance:', error);
      
      // Return cached balance if available, otherwise 0
      if (cached) {
        return {
          amount: cached.balance,
          currency: 'USDC',
          lastUpdated: cached.timestamp,
        };
      }
      
      return {
        amount: 0,
        currency: 'USDC',
        lastUpdated: Date.now(),
      };
    }
  }
  
  /**
   * Deduct currency from user's balance
   * Not used in production mode - payments happen on-chain
   */
  async deduct(userId: string, amount: number): Promise<DeductionResult> {
    throw new Error(
      'deduct() is not supported in production mode. Use initiatePurchase() and verifyPurchase() instead.'
    );
  }
  
  /**
   * Add currency to user's balance
   * Not used in production mode - balance is on-chain
   */
  async add(userId: string, amount: number): Promise<AdditionResult> {
    throw new Error(
      'add() is not supported in production mode. Balance is managed on-chain.'
    );
  }
  
  /**
   * Initiate a purchase (returns 402 Payment Required)
   * Client must sign transaction and retry with X-Payment header
   */
  async initiatePurchase(params: PurchaseParams): Promise<PurchaseInitiation> {
    // Create payment requirements
    const paymentResponse = createPaymentRequiredResponse(
      {
        priceUSDC: params.amount,
        sellerWallet: params.sellerId,
        resource: params.resource,
        description: params.description,
      },
      this.config.network,
      params.timeoutSeconds || 30
    );
    
    return {
      status: 402,
      paymentRequired: true,
      requirements: paymentResponse,
    };
  }
  
  /**
   * Verify and complete a purchase
   * Verifies payment on Solana blockchain via X402Facilitator
   */
  async verifyPurchase(params: VerifyParams): Promise<PurchaseResult> {
    // Verify payment with facilitator
    const verification = await this.facilitator.verifyPayment({
      paymentHeader: params.paymentHeader,
      expectedAmount: params.expectedAmount,
      expectedRecipient: params.expectedRecipient,
      network: this.config.network,
    });
    
    if (!verification.success) {
      return {
        success: false,
        txHash: verification.txHash,
        networkId: verification.networkId,
        error: verification.error,
      };
    }
    
    // Invalidate balance cache for buyer (balance changed on-chain)
    // Note: We don't have buyer ID here, but cache will expire naturally
    
    return {
      success: true,
      txHash: verification.txHash,
      networkId: verification.networkId,
    };
  }
  
  /**
   * Get transaction history for user
   * Returns stored transaction records
   */
  async getTransactions(
    userId: string,
    options?: TransactionPaginationOptions
  ): Promise<CurrencyTransaction[]> {
    // Get transactions from storage
    const userTransactions = this.transactions.get(userId) || [];
    
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
   * Stores transaction with blockchain tx hash and network ID
   */
  async recordTransaction(transaction: CurrencyTransaction): Promise<void> {
    // Get existing transactions
    const userTransactions = this.transactions.get(transaction.userId) || [];
    
    // Add new transaction
    userTransactions.push(transaction);
    
    // Update storage
    this.transactions.set(transaction.userId, userTransactions);
    
    // Invalidate balance cache for this user
    this.balanceCache.delete(transaction.userId);
  }
  
  /**
   * Get USDC mint address for current network
   */
  private getUsdcMint(): string {
    return this.config.network === 'solana-mainnet'
      ? this.config.usdcMintMainnet
      : this.config.usdcMintDevnet;
  }
  
  /**
   * Get current network
   */
  getNetwork(): string {
    return this.config.network;
  }
  
  /**
   * Get Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }
  
  /**
   * Get X402Facilitator instance
   */
  getFacilitator(): X402Facilitator {
    return this.facilitator;
  }
  
  /**
   * Clear balance cache (for testing)
   */
  clearBalanceCache(): void {
    this.balanceCache.clear();
  }
  
  /**
   * Get all transactions (for testing/debugging)
   */
  getAllTransactions(): Map<string, CurrencyTransaction[]> {
    return new Map(this.transactions);
  }
}
