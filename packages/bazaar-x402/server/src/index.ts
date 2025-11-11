/**
 * @bazaar-x402/server
 * 
 * Server SDK for Bazaar x402 marketplace with x402 payment integration.
 * Provides marketplace management, payment verification, and storage adapters.
 */

// Re-export core types for convenience
export * from '@bazaar-x402/core';

// Export server-specific components
export { BazaarMarketplace, type BazaarMarketplaceConfig, type PurchaseRequestResult } from './marketplace.js';
export { ListingManager, type CreateListingParams } from './listing-manager.js';
export { MysteryBoxManager, type PurchaseMysteryBoxParams } from './mystery-box-manager.js';

// Export adapters
export * from './adapters/index.js';

// Export Express integration
export { createBazaarRoutes, type BazaarRequest } from './express.js';

// Version
export const BAZAAR_SERVER_VERSION = '0.1.0';
