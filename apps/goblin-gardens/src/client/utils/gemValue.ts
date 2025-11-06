// ============================================================================
// Gem Value Calculation System
// ============================================================================

import type { Gem, GemType, GemShape, GemRarity } from '../types/game';

// ============================================================================
// Value Constants
// ============================================================================

// Gem type base values (lowest to highest)
export const GEM_TYPE_VALUES: Record<GemType, number> = {
  emerald: 10,    // Lowest tier
  sapphire: 25,   // Low-mid tier
  amethyst: 50,   // Mid tier
  ruby: 100,      // High tier
  diamond: 200,   // Highest tier
};

// Shape multipliers (lowest to highest)
export const SHAPE_MULTIPLIERS: Record<GemShape, number> = {
  tetrahedron: 1.0,   // Basic shape (4 faces)
  octahedron: 1.5,    // Medium complexity (8 faces)
  dodecahedron: 2.0,  // Highest complexity (12 faces)
};

// Rarity multipliers (lowest to highest)
export const RARITY_MULTIPLIERS: Record<GemRarity, number> = {
  common: 1.0,      // Base multiplier
  uncommon: 1.5,    // 50% increase
  rare: 2.0,        // 2x value
  epic: 3.0,        // 3x value
  legendary: 5.0,   // 5x value
};

// Level multiplier (each level adds value)
export const LEVEL_MULTIPLIER = 0.1; // +10% per level

// Size is measured in millimeters (mm)
// gem.size is stored as a decimal (e.g., 0.063, 0.06, 0.0525)
// Actual size in mm = gem.size × 1000
// Size multiplier normalizes to 100mm = 1.0×
// Gems typically range from 50-75mm, so this ensures proper value scaling
export const SIZE_BASE_MM = 100; // 100mm = 1.0× multiplier

// ============================================================================
// Coin Conversion Constants
// ============================================================================

export const BRONZE_PER_SILVER = 100;
export const SILVER_PER_GOLD = 100;
export const BRONZE_PER_GOLD = BRONZE_PER_SILVER * SILVER_PER_GOLD; // 10,000

// ============================================================================
// Value Calculation
// ============================================================================

/**
 * Calculate the total value of a gem based on all its properties
 *
 * Formula:
 * value (in bronze) = baseValue × shapeMultiplier × rarityMultiplier × (1 + level × levelMult) × (sizeInMm / 1000)
 *
 * @param gem - The gem to calculate value for
 * @returns The total value in bronze coins
 */
export function calculateGemValue(gem: Gem): number {
  const baseValue = GEM_TYPE_VALUES[gem.type];
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape];
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity];
  const levelBonus = 1 + (gem.level * LEVEL_MULTIPLIER);

  // Size is measured in millimeters
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / SIZE_BASE_MM; // Normalize: 100mm = 1.0×

  const totalValue = baseValue * shapeMultiplier * rarityMultiplier * levelBonus * sizeMultiplier;

  return Math.floor(totalValue); // Round down to whole bronze coins
}

/**
 * Calculate the total value of multiple gems
 *
 * @param gems - Array of gems to calculate total value for
 * @returns The sum of all gem values
 */
export function calculateTotalGemValue(gems: Gem[]): number {
  return gems.reduce((total, gem) => total + calculateGemValue(gem), 0);
}

/**
 * Format a gem value as a readable string with separators
 *
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatGemValue(value: number): string {
  return value.toLocaleString();
}

// ============================================================================
// Coin Conversion Functions
// ============================================================================

/**
 * Convert a bronze value to coin denominations (gold, silver, bronze)
 *
 * @param bronzeValue - Total value in bronze coins
 * @returns Object with gold, silver, and bronze counts
 */
export function convertToCoins(bronzeValue: number): { gold: number; silver: number; bronze: number } {
  const totalBronze = Math.floor(bronzeValue);

  const gold = Math.floor(totalBronze / BRONZE_PER_GOLD);
  const remainingAfterGold = totalBronze % BRONZE_PER_GOLD;

  const silver = Math.floor(remainingAfterGold / BRONZE_PER_SILVER);
  const bronze = remainingAfterGold % BRONZE_PER_SILVER;

  return { gold, silver, bronze };
}

/**
 * Format coin denominations as a readable string
 *
 * @param coins - Object with gold, silver, bronze counts
 * @returns Formatted string (e.g., "5g 40s 25b")
 */
export function formatCoins(coins: { gold: number; silver: number; bronze: number }): string {
  const parts: string[] = [];

  if (coins.gold > 0) {
    parts.push(`${coins.gold.toLocaleString()}g`);
  }
  if (coins.silver > 0) {
    parts.push(`${coins.silver}s`);
  }
  if (coins.bronze > 0 || parts.length === 0) {
    parts.push(`${coins.bronze}b`);
  }

  return parts.join(' ');
}

/**
 * Convert a bronze value directly to formatted coin string
 *
 * @param bronzeValue - Total value in bronze coins
 * @returns Formatted string (e.g., "5g 40s 25b")
 */
export function formatValueAsCoins(bronzeValue: number): string {
  const coins = convertToCoins(bronzeValue);
  return formatCoins(coins);
}

/**
 * Get a breakdown of how a gem's value is calculated
 * Useful for debugging or showing detailed value info to players
 *
 * @param gem - The gem to analyze
 * @returns Object with value breakdown
 */
export function getGemValueBreakdown(gem: Gem) {
  const baseValue = GEM_TYPE_VALUES[gem.type];
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape];
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity];
  const levelBonus = 1 + (gem.level * LEVEL_MULTIPLIER);
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / SIZE_BASE_MM;
  const totalValue = calculateGemValue(gem);

  return {
    baseValue,
    shapeMultiplier,
    rarityMultiplier,
    levelBonus,
    sizeInMm,
    sizeMultiplier,
    totalValue,
    formula: `${baseValue} × ${shapeMultiplier} × ${rarityMultiplier} × ${levelBonus.toFixed(1)} × (${sizeInMm}mm / ${SIZE_BASE_MM}) = ${totalValue} bronze`,
  };
}

/**
 * Get the tier name for a gem type (for display purposes)
 */
export function getGemTypeTier(type: GemType): string {
  const tiers: Record<GemType, string> = {
    emerald: 'Common',
    sapphire: 'Uncommon',
    amethyst: 'Rare',
    ruby: 'Epic',
    diamond: 'Legendary',
  };
  return tiers[type];
}

/**
 * Get the tier name for a gem shape (for display purposes)
 */
export function getShapeTier(shape: GemShape): string {
  const tiers: Record<GemShape, string> = {
    tetrahedron: 'Basic',
    octahedron: 'Advanced',
    dodecahedron: 'Master',
  };
  return tiers[shape];
}
