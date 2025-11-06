// ============================================================================
// Gem Generation Utilities
// ============================================================================
// Helper functions for creating and managing unique gems

import type { Gem, GemType, GemRarity, GemShape, RarityConfig } from '../types/game';

// ============================================================================
// Rarity Configuration
// ============================================================================

export const GEM_RARITIES: Record<GemRarity, RarityConfig> = {
  common: {
    color: '#FFFFFF', // White
    growthRate: 1.0,
    probability: 50, // 50% chance
  },
  uncommon: {
    color: '#1EFF00', // Green
    growthRate: 1.5,
    probability: 30, // 30% chance
  },
  rare: {
    color: '#0070DD', // Blue
    growthRate: 2.0,
    probability: 15, // 15% chance
  },
  epic: {
    color: '#A335EE', // Purple
    growthRate: 3.0,
    probability: 4, // 4% chance
  },
  legendary: {
    color: '#FF8000', // Orange
    growthRate: 5.0,
    probability: 1, // 1% chance
  },
};

// ============================================================================
// Gem Type Configuration
// ============================================================================

export const GEM_TYPE_COLORS: Record<GemType, string> = {
  diamond: '#E8F5F5', // Clear/white
  emerald: '#50C878', // Green
  ruby: '#E0115F', // Red
  sapphire: '#0F52BA', // Blue
  amethyst: '#9966CC', // Purple
};

export const GEM_TYPE_NAMES: Record<GemType, string> = {
  diamond: 'Diamond',
  emerald: 'Emerald',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  amethyst: 'Amethyst',
};

// Base sizes for each gem shape (matches objectGeneration.tsx)
export const GEM_SHAPE_BASE_SIZES: Record<GemShape, number> = {
  octahedron: 0.06,
  tetrahedron: 0.063,
  dodecahedron: 0.0525,
};

// ============================================================================
// Gem Generation Functions
// ============================================================================

/**
 * Generate a random rarity based on weighted probabilities
 */
export function generateRandomRarity(): GemRarity {
  const rarities = Object.keys(GEM_RARITIES) as GemRarity[];
  const totalWeight = rarities.reduce((sum, rarity) => sum + GEM_RARITIES[rarity].probability, 0);

  let random = Math.random() * totalWeight;

  for (const rarity of rarities) {
    random -= GEM_RARITIES[rarity].probability;
    if (random <= 0) {
      return rarity;
    }
  }

  // Fallback to common
  return 'common';
}

/**
 * Generate a random gem shape
 */
export function generateRandomShape(): GemShape {
  const shapes: GemShape[] = ['tetrahedron', 'octahedron', 'dodecahedron'];
  return shapes[Math.floor(Math.random() * shapes.length)] as GemShape;
}

/**
 * Generate a unique gem ID
 */
export function generateGemId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random
  return `gem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new gem with the specified type and optional rarity/shape
 */
export function createGem(type: GemType, rarity?: GemRarity, shape?: GemShape): Gem {
  const gemRarity = rarity || generateRandomRarity();
  const gemShape = shape || generateRandomShape();
  const rarityConfig = GEM_RARITIES[gemRarity];

  // Get base size for this shape and add some random variation
  const baseSize = GEM_SHAPE_BASE_SIZES[gemShape];
  const sizeVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
  const actualSize = baseSize * sizeVariation;

  return {
    id: generateGemId(),
    type,
    rarity: gemRarity,
    shape: gemShape,
    color: GEM_TYPE_COLORS[type],
    growthRate: rarityConfig.growthRate,
    level: 1,
    experience: 0,
    dateAcquired: Date.now(),
    size: actualSize, // Actual size in world units
    isGrowing: false, // Gems start in inventory
    isOffering: false, // Gems start not being offered
    currentGrowth: 0, // Growth progress starts at 0
  };
}

/**
 * Get display name for a gem (includes rarity)
 */
export function getGemDisplayName(gem: Gem): string {
  const rarityPrefix = `${gem.rarity.charAt(0).toUpperCase() + gem.rarity.slice(1)} `;
  return `${rarityPrefix}${GEM_TYPE_NAMES[gem.type]}`;
}

/**
 * Get rarity color for display
 */
export function getRarityColor(rarity: GemRarity): string {
  return GEM_RARITIES[rarity].color;
}
