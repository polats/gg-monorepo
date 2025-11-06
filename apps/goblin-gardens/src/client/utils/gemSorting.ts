// ============================================================================
// Gem Sorting Utilities
// ============================================================================
// Centralized gem sorting logic to eliminate duplication

import type { Gem, GemType, GemRarity } from '../types/game';

/**
 * Standard order for gem types (lowest to highest value)
 */
export const GEM_TYPE_ORDER: GemType[] = ['emerald', 'sapphire', 'ruby', 'diamond', 'amethyst'];

/**
 * Standard order for gem rarities (lowest to highest)
 */
export const GEM_RARITY_ORDER: GemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * Sort gems by type and rarity
 * First sorts by gem type (emerald → sapphire → ruby → diamond → amethyst)
 * Then sorts by rarity (common → uncommon → rare → epic → legendary)
 *
 * @param gems - Array of gems to sort
 * @returns New array with sorted gems (does not mutate original)
 */
export function sortGemsByTypeAndRarity(gems: Gem[]): Gem[] {
  return [...gems].sort((a, b) => {
    // Sort by gem type first
    const typeCompare = GEM_TYPE_ORDER.indexOf(a.type) - GEM_TYPE_ORDER.indexOf(b.type);
    if (typeCompare !== 0) return typeCompare;

    // Then sort by rarity
    return GEM_RARITY_ORDER.indexOf(a.rarity) - GEM_RARITY_ORDER.indexOf(b.rarity);
  });
}

/**
 * Filter and sort gems by type and rarity
 * Convenience function that combines filtering and sorting in one call
 *
 * @param gems - Array of gems to filter and sort
 * @param filterFn - Filter function to apply before sorting
 * @returns New array with filtered and sorted gems
 */
export function filterAndSortGems(gems: Gem[], filterFn: (gem: Gem) => boolean): Gem[] {
  return sortGemsByTypeAndRarity(gems.filter(filterFn));
}
