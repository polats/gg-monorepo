/**
 * Currency adapter factory
 * 
 * Creates appropriate currency adapter based on configuration
 */

import type { CurrencyAdapter } from '../adapters/currency.js';
import type { CurrencyConfig } from '../types/currency.js';
import { MockCurrencyAdapter } from '../adapters/mock-currency.js';
import { X402CurrencyAdapter } from '../adapters/x402-currency.js';

/**
 * Redis client interface (optional dependency)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Options for creating currency adapter
 */
export interface CreateCurrencyAdapterOptions {
  /** Currency configuration */
  config: CurrencyConfig;
  
  /** Optional Redis client for mock mode persistence */
  redisClient?: RedisClient;
  
  /** Whether to log initialization info */
  verbose?: boolean;
}

/**
 * Create currency adapter based on configuration
 * 
 * Returns MockCurrencyAdapter for mock mode
 * Returns X402CurrencyAdapter for production mode
 * 
 * @param options - Creation options
 * @returns Currency adapter instance
 */
export function createCurrencyAdapter(options: CreateCurrencyAdapterOptions): CurrencyAdapter {
  const { config, redisClient, verbose = true } = options;
  
  if (config.mode === 'mock') {
    if (!config.mockConfig) {
      throw new Error('Mock mode requires mockConfig');
    }
    
    if (verbose) {
      console.log('🎭 Initializing Mock Currency Adapter');
      console.log(`   Default Balance: ${config.mockConfig.defaultBalance} USDC`);
      console.log(`   Use Redis: ${config.mockConfig.useRedis}`);
      if (config.mockConfig.useRedis && config.mockConfig.redisUrl) {
        console.log(`   Redis URL: ${config.mockConfig.redisUrl}`);
      }
    }
    
    return new MockCurrencyAdapter(config.mockConfig, redisClient);
  }
  
  if (config.mode === 'production') {
    if (!config.x402Config) {
      throw new Error('Production mode requires x402Config');
    }
    
    if (verbose) {
      console.log('💰 Initializing x402 Currency Adapter');
      console.log(`   Network: ${config.x402Config.network}`);
      console.log(
        `   RPC URL: ${
          config.x402Config.network === 'solana-mainnet'
            ? config.x402Config.mainnetRpcUrl
            : config.x402Config.devnetRpcUrl
        }`
      );
      console.log(
        `   USDC Mint: ${
          config.x402Config.network === 'solana-mainnet'
            ? config.x402Config.usdcMintMainnet
            : config.x402Config.usdcMintDevnet
        }`
      );
      console.log(
        `   Transaction Polling: ${config.x402Config.maxPollAttempts} attempts @ ${config.x402Config.pollIntervalMs}ms`
      );
    }
    
    return new X402CurrencyAdapter(config.x402Config);
  }
  
  throw new Error(`Unsupported payment mode: ${config.mode}`);
}

/**
 * Create currency adapter from environment variables
 * 
 * Convenience function that loads config and creates adapter
 * 
 * @param env - Environment variables (defaults to process.env)
 * @param redisClient - Optional Redis client
 * @param verbose - Whether to log initialization info
 * @returns Currency adapter instance
 */
export function createCurrencyAdapterFromEnv(
  env: Record<string, string | undefined> = process.env,
  redisClient?: RedisClient,
  verbose = true
): CurrencyAdapter {
  // Import config loader (avoid circular dependency)
  const { loadAndValidateConfig } = require('./config.js');
  
  const config = loadAndValidateConfig(env);
  
  return createCurrencyAdapter({
    config,
    redisClient,
    verbose,
  });
}
