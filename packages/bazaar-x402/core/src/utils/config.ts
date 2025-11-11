/**
 * Configuration loader for Bazaar x402 currency system
 * 
 * Loads and validates configuration from environment variables
 */

import type {
  PaymentMode,
  MockCurrencyConfig,
  X402CurrencyConfig,
  CurrencyConfig,
} from '../types/currency.js';
import type { SolanaNetwork } from '../types/payment.js';

/**
 * Environment variable configuration
 */
export interface EnvironmentConfig {
  // Payment mode
  PAYMENT_MODE?: string;
  
  // Solana network
  SOLANA_NETWORK?: string;
  
  // RPC endpoints
  SOLANA_DEVNET_RPC?: string;
  SOLANA_MAINNET_RPC?: string;
  
  // USDC mint addresses
  USDC_MINT_DEVNET?: string;
  USDC_MINT_MAINNET?: string;
  
  // Mock mode settings
  MOCK_DEFAULT_BALANCE?: string;
  MOCK_USE_REDIS?: string;
  MOCK_REDIS_URL?: string;
  MOCK_TX_ID_PREFIX?: string;
  
  // Transaction polling
  TX_POLL_MAX_ATTEMPTS?: string;
  TX_POLL_INTERVAL_MS?: string;
  
  // Balance caching
  BALANCE_CACHE_DURATION?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // Payment mode
  PAYMENT_MODE: 'mock' as PaymentMode,
  
  // Solana network
  SOLANA_NETWORK: 'solana-devnet' as SolanaNetwork,
  
  // RPC endpoints
  SOLANA_DEVNET_RPC: 'https://api.devnet.solana.com',
  SOLANA_MAINNET_RPC: 'https://api.mainnet-beta.solana.com',
  
  // USDC mint addresses
  USDC_MINT_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDC_MINT_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  
  // Mock mode settings
  MOCK_DEFAULT_BALANCE: 1000,
  MOCK_USE_REDIS: false,
  MOCK_TX_ID_PREFIX: 'MOCK',
  
  // Transaction polling
  TX_POLL_MAX_ATTEMPTS: 10,
  TX_POLL_INTERVAL_MS: 2000,
  
  // Balance caching
  BALANCE_CACHE_DURATION: 30,
};

/**
 * Load configuration from environment variables
 * 
 * @param env - Environment variables (defaults to process.env)
 * @returns Complete currency configuration
 */
export function loadConfig(env: EnvironmentConfig | NodeJS.ProcessEnv = process.env): CurrencyConfig {
  // Parse payment mode
  const mode = parsePaymentMode(env.PAYMENT_MODE);
  
  // Parse Solana network
  const network = parseSolanaNetwork(env.SOLANA_NETWORK);
  
  // Load RPC endpoints
  const devnetRpcUrl = env.SOLANA_DEVNET_RPC || DEFAULT_CONFIG.SOLANA_DEVNET_RPC;
  const mainnetRpcUrl = env.SOLANA_MAINNET_RPC || DEFAULT_CONFIG.SOLANA_MAINNET_RPC;
  
  // Load USDC mint addresses
  const usdcMintDevnet = env.USDC_MINT_DEVNET || DEFAULT_CONFIG.USDC_MINT_DEVNET;
  const usdcMintMainnet = env.USDC_MINT_MAINNET || DEFAULT_CONFIG.USDC_MINT_MAINNET;
  
  // Load mock mode settings
  const mockDefaultBalance = parseNumber(
    env.MOCK_DEFAULT_BALANCE,
    DEFAULT_CONFIG.MOCK_DEFAULT_BALANCE
  );
  const mockUseRedis = parseBoolean(
    env.MOCK_USE_REDIS,
    DEFAULT_CONFIG.MOCK_USE_REDIS
  );
  const mockRedisUrl = env.MOCK_REDIS_URL;
  const mockTxIdPrefix = env.MOCK_TX_ID_PREFIX || DEFAULT_CONFIG.MOCK_TX_ID_PREFIX;
  
  // Load transaction polling parameters
  const txPollMaxAttempts = parseNumber(
    env.TX_POLL_MAX_ATTEMPTS,
    DEFAULT_CONFIG.TX_POLL_MAX_ATTEMPTS
  );
  const txPollIntervalMs = parseNumber(
    env.TX_POLL_INTERVAL_MS,
    DEFAULT_CONFIG.TX_POLL_INTERVAL_MS
  );
  
  // Load balance cache duration
  const balanceCacheDuration = parseNumber(
    env.BALANCE_CACHE_DURATION,
    DEFAULT_CONFIG.BALANCE_CACHE_DURATION
  );
  
  // Build mock currency config
  const mockConfig: MockCurrencyConfig = {
    defaultBalance: mockDefaultBalance,
    useRedis: mockUseRedis,
    redisUrl: mockRedisUrl,
    txIdPrefix: mockTxIdPrefix,
  };
  
  // Build x402 currency config
  const x402Config: X402CurrencyConfig = {
    network,
    devnetRpcUrl,
    mainnetRpcUrl,
    usdcMintDevnet,
    usdcMintMainnet,
    maxPollAttempts: txPollMaxAttempts,
    pollIntervalMs: txPollIntervalMs,
    balanceCacheDuration,
  };
  
  return {
    mode,
    mockConfig,
    x402Config,
  };
}

/**
 * Parse payment mode from string
 */
function parsePaymentMode(value: string | undefined): PaymentMode {
  if (!value) {
    return DEFAULT_CONFIG.PAYMENT_MODE;
  }
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'mock' || normalized === 'production') {
    return normalized as PaymentMode;
  }
  
  console.warn(
    `Invalid PAYMENT_MODE: "${value}". Using default: "${DEFAULT_CONFIG.PAYMENT_MODE}"`
  );
  return DEFAULT_CONFIG.PAYMENT_MODE;
}

/**
 * Parse Solana network from string
 */
function parseSolanaNetwork(value: string | undefined): SolanaNetwork {
  if (!value) {
    return DEFAULT_CONFIG.SOLANA_NETWORK;
  }
  
  const normalized = value.toLowerCase().trim();
  
  // Handle various formats
  if (normalized === 'devnet' || normalized === 'solana-devnet') {
    return 'solana-devnet';
  }
  
  if (normalized === 'mainnet' || normalized === 'solana-mainnet' || normalized === 'mainnet-beta') {
    return 'solana-mainnet';
  }
  
  console.warn(
    `Invalid SOLANA_NETWORK: "${value}". Using default: "${DEFAULT_CONFIG.SOLANA_NETWORK}"`
  );
  return DEFAULT_CONFIG.SOLANA_NETWORK;
}

/**
 * Parse number from string
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  
  const parsed = Number(value);
  
  if (isNaN(parsed)) {
    console.warn(
      `Invalid number: "${value}". Using default: ${defaultValue}`
    );
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Parse boolean from string
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  
  console.warn(
    `Invalid boolean: "${value}". Using default: ${defaultValue}`
  );
  return defaultValue;
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate configuration
 * 
 * Throws ConfigValidationError if configuration is invalid
 * 
 * @param config - Configuration to validate
 */
export function validateConfig(config: CurrencyConfig): void {
  const errors: string[] = [];
  
  // Validate payment mode
  if (config.mode !== 'mock' && config.mode !== 'production') {
    errors.push(`Invalid payment mode: "${config.mode}". Must be "mock" or "production"`);
  }
  
  // Validate mock config if in mock mode
  if (config.mode === 'mock') {
    if (!config.mockConfig) {
      errors.push('Mock mode requires mockConfig');
    } else {
      if (config.mockConfig.defaultBalance < 0) {
        errors.push(`Invalid mock default balance: ${config.mockConfig.defaultBalance}. Must be >= 0`);
      }
      
      if (config.mockConfig.useRedis && !config.mockConfig.redisUrl) {
        errors.push('Mock mode with Redis requires redisUrl');
      }
      
      if (config.mockConfig.redisUrl && !isValidUrl(config.mockConfig.redisUrl)) {
        errors.push(`Invalid Redis URL: ${config.mockConfig.redisUrl}`);
      }
    }
  }
  
  // Validate x402 config if in production mode
  if (config.mode === 'production') {
    if (!config.x402Config) {
      errors.push('Production mode requires x402Config');
    } else {
      // Validate network
      if (
        config.x402Config.network !== 'solana-devnet' &&
        config.x402Config.network !== 'solana-mainnet'
      ) {
        errors.push(
          `Invalid Solana network: "${config.x402Config.network}". Must be "solana-devnet" or "solana-mainnet"`
        );
      }
      
      // Validate RPC URLs
      if (!isValidUrl(config.x402Config.devnetRpcUrl)) {
        errors.push(`Invalid devnet RPC URL: ${config.x402Config.devnetRpcUrl}`);
      }
      
      if (!isValidUrl(config.x402Config.mainnetRpcUrl)) {
        errors.push(`Invalid mainnet RPC URL: ${config.x402Config.mainnetRpcUrl}`);
      }
      
      // Validate USDC mint addresses (must be valid Solana public keys)
      if (!isValidSolanaPublicKey(config.x402Config.usdcMintDevnet)) {
        errors.push(`Invalid devnet USDC mint address: ${config.x402Config.usdcMintDevnet}`);
      }
      
      if (!isValidSolanaPublicKey(config.x402Config.usdcMintMainnet)) {
        errors.push(`Invalid mainnet USDC mint address: ${config.x402Config.usdcMintMainnet}`);
      }
      
      // Validate polling parameters
      if (config.x402Config.maxPollAttempts < 1) {
        errors.push(
          `Invalid max poll attempts: ${config.x402Config.maxPollAttempts}. Must be >= 1`
        );
      }
      
      if (config.x402Config.pollIntervalMs < 100) {
        errors.push(
          `Invalid poll interval: ${config.x402Config.pollIntervalMs}ms. Must be >= 100ms`
        );
      }
      
      // Validate balance cache duration
      if (config.x402Config.balanceCacheDuration !== undefined) {
        if (config.x402Config.balanceCacheDuration < 0) {
          errors.push(
            `Invalid balance cache duration: ${config.x402Config.balanceCacheDuration}s. Must be >= 0`
          );
        }
      }
    }
  }
  
  // Throw error if any validation errors
  if (errors.length > 0) {
    throw new ConfigValidationError(
      `Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Solana public key format
 * 
 * Basic validation: base58 string, 32-44 characters
 */
function isValidSolanaPublicKey(key: string): boolean {
  // Solana public keys are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(key);
}

/**
 * Load and validate configuration
 * 
 * Convenience function that loads and validates in one step
 * 
 * @param env - Environment variables (defaults to process.env)
 * @returns Validated currency configuration
 * @throws ConfigValidationError if configuration is invalid
 */
export function loadAndValidateConfig(env: EnvironmentConfig | NodeJS.ProcessEnv = process.env): CurrencyConfig {
  const config = loadConfig(env);
  validateConfig(config);
  return config;
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(config: CurrencyConfig): string {
  const lines = [
    '=== Bazaar x402 Configuration ===',
    `Payment Mode: ${config.mode}`,
  ];
  
  if (config.mode === 'mock' && config.mockConfig) {
    lines.push(
      `Mock Default Balance: ${config.mockConfig.defaultBalance} USDC`,
      `Mock Use Redis: ${config.mockConfig.useRedis}`,
      config.mockConfig.useRedis && config.mockConfig.redisUrl
        ? `Mock Redis URL: ${config.mockConfig.redisUrl}`
        : ''
    );
  }
  
  if (config.mode === 'production' && config.x402Config) {
    lines.push(
      `Solana Network: ${config.x402Config.network}`,
      `RPC URL: ${
        config.x402Config.network === 'solana-mainnet'
          ? config.x402Config.mainnetRpcUrl
          : config.x402Config.devnetRpcUrl
      }`,
      `USDC Mint: ${
        config.x402Config.network === 'solana-mainnet'
          ? config.x402Config.usdcMintMainnet
          : config.x402Config.usdcMintDevnet
      }`,
      `Transaction Polling: ${config.x402Config.maxPollAttempts} attempts @ ${config.x402Config.pollIntervalMs}ms`,
      `Balance Cache: ${config.x402Config.balanceCacheDuration}s`
    );
  }
  
  lines.push('================================');
  
  return lines.filter(Boolean).join('\n');
}
