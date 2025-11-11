/**
 * Currency types for Bazaar marketplace
 * 
 * Supports both mock mode (development/testing) and production mode (real USDC)
 */

import type { SolanaNetwork } from './payment.js';

/**
 * Currency type identifier
 */
export type CurrencyType = 'USDC' | 'MOCK_USDC';

/**
 * Payment mode configuration
 */
export type PaymentMode = 'mock' | 'production';

/**
 * Currency balance information
 */
export interface CurrencyBalance {
  /** Balance amount in USDC (with decimals) */
  amount: number;
  
  /** Currency type */
  currency: CurrencyType;
  
  /** Timestamp of last update (optional) */
  lastUpdated?: number;
}

/**
 * Result of currency deduction operation
 */
export interface DeductionResult {
  /** Whether deduction was successful */
  success: boolean;
  
  /** New balance after deduction */
  newBalance: number;
  
  /** Transaction ID (blockchain tx hash or mock ID) */
  txId: string;
  
  /** Network ID (for production mode) */
  networkId?: string;
}

/**
 * Result of currency addition operation
 */
export interface AdditionResult {
  /** Whether addition was successful */
  success: boolean;
  
  /** New balance after addition */
  newBalance: number;
  
  /** Transaction ID (blockchain tx hash or mock ID) */
  txId: string;
  
  /** Network ID (for production mode) */
  networkId?: string;
}

/**
 * Currency transaction type
 */
export type CurrencyTransactionType = 
  | 'mystery_box_purchase'
  | 'listing_purchase'
  | 'listing_sale'
  | 'refund'
  | 'test_credit';

/**
 * Currency transaction record
 */
export interface CurrencyTransaction {
  /** Unique transaction ID */
  id: string;
  
  /** User ID associated with transaction */
  userId: string;
  
  /** Transaction type */
  type: CurrencyTransactionType;
  
  /** Transaction amount in USDC */
  amount: number;
  
  /** Transaction ID (blockchain tx hash or mock ID) */
  txId: string;
  
  /** Network ID (for production mode) */
  networkId?: string;
  
  /** Timestamp of transaction */
  timestamp: number;
  
  /** Mystery box ID (for mystery box purchases) */
  boxId?: string;
  
  /** Listing ID (for listing purchases/sales) */
  listingId?: string;
  
  /** Item ID (for listing purchases/sales) */
  itemId?: string;
  
  /** Item IDs (for mystery box purchases) */
  items?: string[];
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Pagination options for transaction queries
 */
export interface TransactionPaginationOptions {
  /** Page number (1-indexed) */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parameters for initiating a purchase
 */
export interface PurchaseParams {
  /** Buyer's user ID */
  buyerId: string;
  
  /** Seller's user ID (or system for mystery boxes) */
  sellerId: string;
  
  /** Purchase amount in USDC */
  amount: number;
  
  /** Resource being purchased */
  resource: string;
  
  /** Description of purchase */
  description: string;
  
  /** Timeout in seconds (optional) */
  timeoutSeconds?: number;
}

/**
 * Result of purchase initiation
 */
export interface PurchaseInitiation {
  /** HTTP status code (402 for payment required, 200 for immediate success) */
  status: number;
  
  /** Whether payment is required */
  paymentRequired: boolean;
  
  /** Payment requirements (if payment required) */
  requirements?: any;
  
  /** Transaction ID (if immediate success) */
  txId?: string;
}

/**
 * Parameters for verifying a purchase
 */
export interface VerifyParams {
  /** Payment header from X-Payment */
  paymentHeader: string;
  
  /** Expected payment amount */
  expectedAmount: number;
  
  /** Expected recipient wallet/user ID */
  expectedRecipient: string;
}

/**
 * Result of purchase verification
 */
export interface PurchaseResult {
  /** Whether purchase was successful */
  success: boolean;
  
  /** Transaction hash (blockchain or mock) */
  txHash: string;
  
  /** Network ID */
  networkId: string;
  
  /** Error message (if failed) */
  error?: string;
}

/**
 * Mock currency configuration
 */
export interface MockCurrencyConfig {
  /** Default starting balance for new users */
  defaultBalance: number;
  
  /** Whether to use Redis for persistence */
  useRedis: boolean;
  
  /** Redis connection URL (if useRedis is true) */
  redisUrl?: string;
  
  /** Transaction ID prefix for mock transactions */
  txIdPrefix?: string;
}

/**
 * x402 currency configuration
 */
export interface X402CurrencyConfig {
  /** Solana network to use */
  network: SolanaNetwork;
  
  /** RPC endpoint for devnet */
  devnetRpcUrl: string;
  
  /** RPC endpoint for mainnet */
  mainnetRpcUrl: string;
  
  /** USDC mint address for devnet */
  usdcMintDevnet: string;
  
  /** USDC mint address for mainnet */
  usdcMintMainnet: string;
  
  /** Maximum polling attempts for transaction confirmation */
  maxPollAttempts: number;
  
  /** Interval between polling attempts (milliseconds) */
  pollIntervalMs: number;
  
  /** Balance cache duration (seconds) */
  balanceCacheDuration?: number;
}

/**
 * Combined currency configuration
 */
export interface CurrencyConfig {
  /** Payment mode */
  mode: PaymentMode;
  
  /** Mock currency configuration */
  mockConfig?: MockCurrencyConfig;
  
  /** x402 currency configuration */
  x402Config?: X402CurrencyConfig;
}
