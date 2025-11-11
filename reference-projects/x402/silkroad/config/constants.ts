/**
 * Application Constants
 * 
 * Central configuration file for app-wide constants.
 * For sensitive values, see .env.local
 */

// Environment Configuration
export const CONFIG = {
  // RPC Endpoints
  MAINNET_RPC: process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
  DEVNET_RPC: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com',
  
  // Token Addresses
  SRX402_MINT: process.env.NEXT_PUBLIC_SRX402_MINT_ADDRESS || '49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump',
  USDC_MINT_DEVNET: process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDC_MINT_MAINNET: process.env.NEXT_PUBLIC_USDC_MINT_MAINNET || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  APP_SECRET: process.env.APP_SECRET || 'dev-encryption-secret-change-in-production',
  
  // Admin
  ADMIN_CODE: process.env.ADMIN_CODE || 'admin123',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@silkroadx402.com',
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',
  
  // reCAPTCHA
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY || '',
  
  // x402
  X402_FACILITATOR_URL_DEVNET: process.env.X402_FACILITATOR_URL_DEVNET || '',
  X402_FACILITATOR_URL_MAINNET: process.env.X402_FACILITATOR_URL_MAINNET || '',
  
  // General
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Development Mock Mode (bypasses database for testing)
  // Only enable if explicitly set to 'true'
  MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  MOCK_TOKEN_GATING_PASSED: process.env.NEXT_PUBLIC_MOCK_TOKEN_GATING === 'true',
  
  // Admin Panel (disable for public demos)
  // Only disable if explicitly set to 'true'
  DISABLE_ADMIN: process.env.NEXT_PUBLIC_DISABLE_ADMIN === 'true',
};

// Token Addresses (for backward compatibility)
export const SRX402_MINT_ADDRESS = CONFIG.SRX402_MINT;

// Token Gating
export const MIN_SRX402_BALANCE = 50000; // Minimum tokens required for access

// Listing Configuration
export const LISTING_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 50,
  DESCRIPTION_MAX: 2000,
  PRICE_MIN: 0.10, // USDC
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  REASON_MAX: 100, // Report reason length
};

// Rate Limits (per wallet)
export const RATE_LIMITS = {
  LISTINGS_PER_DAY: 5,
  REPORTS_PER_DAY: 5,
  PURCHASES_PER_HOUR: 3,
  IMAGE_UPLOADS_PER_HOUR: 10,
  ADMIN_LOGIN_FAILS_PER_HOUR: 3,
};

// Categories
export const LISTING_CATEGORIES = [
  'Trading Bot',
  'API Tool',
  'Script',
  'Custom',
] as const;

export type ListingCategory = typeof LISTING_CATEGORIES[number];

// Risk Levels
export const RISK_LEVELS = {
  STANDARD: 'standard',
  HIGH_RISK: 'high-risk',
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

// Listing States
export const LISTING_STATES = {
  IN_REVIEW: 'in_review',
  ON_MARKET: 'on_market',
  PULLED: 'pulled',
} as const;

export type ListingState = typeof LISTING_STATES[keyof typeof LISTING_STATES];

// Transaction Status
export const TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

// Log Types
export const LOG_TYPES = {
  ERROR: 'error',
  ADMIN_FAIL: 'admin_fail',
  TXN_FAILURE: 'txn_failure',
  FRAUD_ALERT: 'fraud_alert',
  TECHNICAL_ISSUES: 'technical_issues',
} as const;

export type LogType = typeof LOG_TYPES[keyof typeof LOG_TYPES];

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  EXPIRY: 3600, // 1 hour in seconds
  ADMIN_EXPIRY: 28800, // 8 hours in seconds
  COOKIE_NAME: 'srx402_token',
  ADMIN_COOKIE_NAME: 'srx402_admin_token',
};

// Purchase Verification
export const PURCHASE_CONFIG = {
  POLL_INTERVAL_MS: 500,
  MAX_POLL_ATTEMPTS: 20, // 10 seconds total
  FRAUD_THRESHOLD: 3, // Auto-pull after 3 failures
};

// Pagination
export const PAGINATION = {
  LISTINGS_PER_PAGE: 20,
  LOGS_PER_PAGE: 50,
};

// Image Configuration
export const IMAGE_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  QUALITY: 80,
  FORMAT: 'jpg' as const,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Timestamps
export const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // ±5 minutes for SIWS

// TTL
export const LOG_TTL_DAYS = 7;

// Admin Configuration
export const ADMIN_CONFIG = {
  OTP_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  TOS_DISMISSAL_LIMIT: 3,
};

// Validation
export const VALIDATION = {
  MALICIOUS_TERMS_THRESHOLD: 0.8, // Fuse.js Levenshtein threshold
};

