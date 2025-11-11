import type { ActiveOffer } from '../../src/shared/types/api';
import { createTestGems } from './gems';

/**
 * Creates a test active offer with default values that can be overridden.
 * 
 * @param overrides - Partial offer properties to override defaults
 * @returns A complete ActiveOffer object suitable for testing
 * 
 * @example
 * ```typescript
 * // Create a basic test offer
 * const offer = createTestOffer();
 * 
 * // Create an offer from a specific user
 * const userOffer = createTestOffer({
 *   username: 'TestSeller',
 *   totalValue: 10000
 * });
 * 
 * // Create an offer with custom gems
 * const customGems = createTestGems(3, { type: 'diamond', rarity: 'legendary' });
 * const premiumOffer = createTestOffer({
 *   gems: customGems,
 *   totalValue: 50000
 * });
 * ```
 */
export function createTestOffer(overrides?: Partial<ActiveOffer>): ActiveOffer {
  const gems = overrides?.gems ?? createTestGems(3, { isOffering: true });
  
  return {
    username: overrides?.username ?? `TestUser${Math.random().toString(36).substring(2, 6)}`,
    gems,
    totalValue: overrides?.totalValue ?? 5000, // 2x multiplier already applied
    timestamp: overrides?.timestamp ?? Date.now(),
    level: overrides?.level ?? 5,
    itemCount: overrides?.itemCount ?? gems.length,
  };
}

/**
 * Creates multiple test offers with varied properties.
 * 
 * @param count - Number of offers to create
 * @param baseOverrides - Base overrides to apply to all offers
 * @returns Array of ActiveOffer objects
 * 
 * @example
 * ```typescript
 * // Create 5 offers with default values
 * const offers = createTestOffers(5);
 * 
 * // Create 3 high-value offers
 * const premiumOffers = createTestOffers(3, {
 *   totalValue: 20000,
 *   level: 10
 * });
 * ```
 */
export function createTestOffers(
  count: number,
  baseOverrides?: Partial<ActiveOffer>
): ActiveOffer[] {
  return Array.from({ length: count }, (_, index) => {
    return createTestOffer({
      ...baseOverrides,
      username: baseOverrides?.username ?? `TestUser${index + 1}`,
      timestamp: baseOverrides?.timestamp ?? Date.now() - index * 1000, // Stagger timestamps
    });
  });
}

/**
 * Creates an offer with a specific username and gem configuration.
 * 
 * @param username - The seller's username
 * @param gemCount - Number of gems in the offer
 * @param totalValue - Total value in bronze (with 2x multiplier)
 * @returns An ActiveOffer object
 * 
 * @example
 * ```typescript
 * const offer = createOfferForUser('Alice', 5, 10000);
 * // Creates an offer from Alice with 5 gems worth 10,000 bronze
 * ```
 */
export function createOfferForUser(
  username: string,
  gemCount: number,
  totalValue: number
): ActiveOffer {
  const gems = createTestGems(gemCount, { isOffering: true });
  
  return {
    username,
    gems,
    totalValue,
    timestamp: Date.now(),
    level: Math.floor(gemCount / 2) + 1, // Simple level calculation
    itemCount: gemCount,
  };
}

/**
 * Creates a marketplace-ready offer collection for testing pagination.
 * 
 * @param totalOffers - Total number of offers to create
 * @returns Array of ActiveOffer objects with staggered timestamps
 * 
 * @example
 * ```typescript
 * const marketplace = createMarketplaceOffers(25);
 * // Creates 25 offers suitable for testing pagination (10 per page)
 * ```
 */
export function createMarketplaceOffers(totalOffers: number): ActiveOffer[] {
  return Array.from({ length: totalOffers }, (_, index) => {
    const gemCount = Math.floor(Math.random() * 5) + 1; // 1-5 gems
    const baseValue = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 bronze
    
    return createTestOffer({
      username: `Seller${index + 1}`,
      gems: createTestGems(gemCount, { isOffering: true }),
      totalValue: baseValue * 2, // 2x multiplier
      timestamp: Date.now() - index * 60000, // 1 minute apart
      level: Math.floor(Math.random() * 20) + 1, // Level 1-20
      itemCount: gemCount,
    });
  });
}
