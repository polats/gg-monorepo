/**
 * @bazaar-x402/client
 * 
 * Client SDK for Bazaar x402 marketplace with wallet integration.
 * Provides easy-to-use functions for browsing listings and making purchases.
 */

// Re-export core types for convenience
export * from '@bazaar-x402/core';

// Export client-specific components
export { BazaarClient } from './bazaar-client';
export type { 
  BazaarClientConfig, 
  PaginationOptions, 
  PaginatedResult,
  PurchaseResult,
} from './bazaar-client';

export { MockWalletAdapter } from './wallet-adapter';
export type { WalletAdapter } from './wallet-adapter';

// Version
export const BAZAAR_CLIENT_VERSION = '0.1.0';
