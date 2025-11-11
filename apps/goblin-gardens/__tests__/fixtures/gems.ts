import type { Gem, GemType, GemShape, GemRarity } from '../../src/shared/types/api';

/**
 * Creates a test gem with default values that can be overridden.
 * 
 * @param overrides - Partial gem properties to override defaults
 * @returns A complete Gem object suitable for testing
 * 
 * @example
 * ```typescript
 * // Create a basic test gem
 * const gem = createTestGem();
 * 
 * // Create a legendary diamond
 * const legendaryDiamond = createTestGem({
 *   type: 'diamond',
 *   rarity: 'legendary',
 *   level: 10
 * });
 * ```
 */
export function createTestGem(overrides?: Partial<Gem>): Gem {
  const id = overrides?.id ?? `test-gem-${Math.random().toString(36).substring(2, 9)}`;
  const type = overrides?.type ?? 'emerald';
  const rarity = overrides?.rarity ?? 'common';
  const shape = overrides?.shape ?? 'tetrahedron';
  
  // Default colors based on gem type
  const colorMap: Record<GemType, string> = {
    emerald: '#50C878',
    sapphire: '#0F52BA',
    amethyst: '#9966CC',
    ruby: '#E0115F',
    diamond: '#B9F2FF',
  };

  return {
    id,
    type,
    rarity,
    shape,
    color: overrides?.color ?? colorMap[type],
    growthRate: overrides?.growthRate ?? 1.0,
    level: overrides?.level ?? 1,
    experience: overrides?.experience ?? 0,
    dateAcquired: overrides?.dateAcquired ?? Date.now(),
    size: overrides?.size ?? 0.063, // 63mm default
    isGrowing: overrides?.isGrowing ?? false,
    isOffering: overrides?.isOffering ?? false,
  };
}

/**
 * Creates multiple test gems with the same overrides applied to each.
 * 
 * @param count - Number of gems to create
 * @param overrides - Partial gem properties to override defaults for all gems
 * @returns Array of Gem objects
 * 
 * @example
 * ```typescript
 * // Create 5 common emeralds
 * const gems = createTestGems(5);
 * 
 * // Create 3 rare rubies
 * const rareRubies = createTestGems(3, {
 *   type: 'ruby',
 *   rarity: 'rare'
 * });
 * ```
 */
export function createTestGems(count: number, overrides?: Partial<Gem>): Gem[] {
  return Array.from({ length: count }, () => createTestGem(overrides));
}

/**
 * Creates a collection of gems with varied types, shapes, and rarities for testing.
 * 
 * @returns Array of diverse Gem objects
 * 
 * @example
 * ```typescript
 * const diverseGems = createDiverseGemCollection();
 * // Returns gems of different types, shapes, and rarities
 * ```
 */
export function createDiverseGemCollection(): Gem[] {
  const types: GemType[] = ['emerald', 'sapphire', 'amethyst', 'ruby', 'diamond'];
  const shapes: GemShape[] = ['tetrahedron', 'octahedron', 'dodecahedron'];
  const rarities: GemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  return [
    createTestGem({ type: types[0], shape: shapes[0], rarity: rarities[0] }),
    createTestGem({ type: types[1], shape: shapes[1], rarity: rarities[1] }),
    createTestGem({ type: types[2], shape: shapes[2], rarity: rarities[2] }),
    createTestGem({ type: types[3], shape: shapes[0], rarity: rarities[3] }),
    createTestGem({ type: types[4], shape: shapes[1], rarity: rarities[4] }),
  ];
}
