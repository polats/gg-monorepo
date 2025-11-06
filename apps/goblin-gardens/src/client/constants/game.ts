// ============================================================================
// Game Constants
// ============================================================================

import type { LevelConfig, FaucetConfig, TouchConfig } from '../types/game';

// ============================================================================
// Level Configurations
// ============================================================================

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    level: 1,
    goldCoins: 15,
    silverCoins: 25,
    bronzeCoins: 30,
    diamondGems: 12,
    emeraldGems: 12,
    emeraldTetraGems: 0,
    emeraldDodecaGems: 0,
    rubyGems: 10,
    rubyTetraGems: 0,
    sapphireGems: 10,
    sapphireOctaGems: 0,
    sapphireDodecaGems: 0,
    amethystGems: 8,
    chunkyRocks: 0,
    roundedBoulders: 250,
    mediumRocks: 200,
    sharpRocks: 100,
  },
  // Future levels can be added here
  2: {
    level: 2,
    goldCoins: 25,
    silverCoins: 35,
    bronzeCoins: 40,
    diamondGems: 20,
    emeraldGems: 18,
    emeraldTetraGems: 0,
    emeraldDodecaGems: 0,
    rubyGems: 15,
    rubyTetraGems: 0,
    sapphireGems: 12,
    sapphireOctaGems: 0,
    sapphireDodecaGems: 0,
    amethystGems: 10,
    chunkyRocks: 0,
    roundedBoulders: 300,
    mediumRocks: 250,
    sharpRocks: 150,
  },
};

// ============================================================================
// Location-Specific Configurations
// ============================================================================

export const LOCATION_CONFIGS: Record<string, LevelConfig> = {
  // Rockfall - Starting location, basic coins with green gems in both shapes
  'rockfall': {
    level: 1,
    goldCoins: 0,      // No gold (intentional for starting location)
    silverCoins: 20,
    bronzeCoins: 25,
    diamondGems: 0,    // No diamonds (intentional for starting location)
    emeraldGems: 10,
    emeraldTetraGems: 10,
    emeraldDodecaGems: 0,
    rubyGems: 0,
    rubyTetraGems: 0,
    sapphireGems: 10,
    sapphireOctaGems: 0,
    sapphireDodecaGems: 0,
    amethystGems: 0,
    chunkyRocks: 0,
    roundedBoulders: 250,
    mediumRocks: 200,
    sharpRocks: 100,
  },

  // Bright Warrens - Silver-rich with dodecahedron emerald, octahedron sapphire, tetrahedron ruby
  'bright-warrens': {
    level: 1,
    goldCoins: 0,      // No gold
    silverCoins: 60,   // Silver-rich (main feature)
    bronzeCoins: 0,    // No bronze
    diamondGems: 0,    // No diamonds
    emeraldGems: 0,    // No octahedron emeralds
    emeraldTetraGems: 0, // No tetrahedron emeralds
    emeraldDodecaGems: 40, // Dodecahedron emeralds (main gem)
    rubyGems: 0,       // No dodecahedron rubies
    rubyTetraGems: 25, // Tetrahedron rubies
    sapphireGems: 0,   // No tetrahedron sapphires
    sapphireOctaGems: 35, // Octahedron sapphires
    sapphireDodecaGems: 0, // No dodecahedron sapphires
    amethystGems: 0,   // No amethysts
    chunkyRocks: 0,
    roundedBoulders: 200,
    mediumRocks: 180,
    sharpRocks: 120,
  },

  // Crystal Caves - Gold-rich with dodecahedron sapphire, dodecahedron ruby, octahedron diamond
  'crystal-caves': {
    level: 1,
    goldCoins: 60,     // Gold-rich (main coin)
    silverCoins: 0,    // No silver
    bronzeCoins: 0,    // No bronze
    diamondGems: 50,   // Octahedron diamonds (main gem)
    emeraldGems: 0,    // No emeralds
    emeraldTetraGems: 0, // No tetrahedron emeralds
    emeraldDodecaGems: 0, // No dodecahedron emeralds
    rubyGems: 40,      // Dodecahedron rubies
    rubyTetraGems: 0,  // No tetrahedron rubies
    sapphireGems: 0,   // No tetrahedron sapphires
    sapphireOctaGems: 0, // No octahedron sapphires
    sapphireDodecaGems: 45, // Dodecahedron sapphires
    amethystGems: 0,   // No amethysts
    chunkyRocks: 0,
    roundedBoulders: 80, // Reduced rocks to make gems more visible
    mediumRocks: 80,
    sharpRocks: 80,
  },

  // Fire Fields - Placeholder (for future implementation) - Ruby-rich
  'fire-fields': {
    level: 1,
    goldCoins: 25,
    silverCoins: 30,
    bronzeCoins: 30,
    diamondGems: 5,
    emeraldGems: 5,
    emeraldTetraGems: 0,
    emeraldDodecaGems: 0,
    rubyGems: 30,       // Rubies are common in fire fields
    rubyTetraGems: 0,
    sapphireGems: 5,
    sapphireOctaGems: 0,
    sapphireDodecaGems: 0,
    amethystGems: 10,
    chunkyRocks: 0,
    roundedBoulders: 200,
    mediumRocks: 200,
    sharpRocks: 200,
  },
};

// ============================================================================
// Color Palettes
// ============================================================================

// High-Visibility Gem Colors - Bright, saturated colors for common collectible gems
// These are easy to spot and have a video game aesthetic
export const HIGH_VISIBILITY_GEM_COLORS = [
  '#00FFFF', // Electric Cyan
  '#FF10F0', // Hot Pink/Magenta
  '#CCFF00', // Electric Lime
  '#FF6600', // Vivid Orange
  '#BF00FF', // Electric Purple
  '#0080FF', // Neon Blue
  '#FF0055', // Vibrant Red
  '#FFFF00', // Bright Yellow
];

// Realistic Gemstone Colors - Reserved for valuable/rare items
// These have authentic gem appearances and are more prestigious
export const RARE_GEMSTONE_COLORS = [
  '#E0115F', // Ruby red
  '#0F52BA', // Sapphire blue
  '#50C878', // Emerald green
  '#9966CC', // Amethyst purple
  '#FFD700', // Topaz yellow
  '#7FFFD4', // Aquamarine cyan
  '#E4D00A', // Citrine yellow
  '#E8F5F5', // Diamond clear
  '#DC143C', // Deep Ruby
  '#1E90FF', // Brilliant Sapphire
  '#00FF7F', // Spring Emerald
  '#8B008B', // Dark Amethyst
];

// Rock color palette - earthy tones
export const ROCK_COLORS = [
  '#8b7355', // Brown
  '#a89080', // Light brown
  '#6b5d52', // Dark brown
  '#5a4a42', // Very dark brown
  '#9c8674', // Tan
  '#7d6b5d', // Medium brown
  '#4a3f35', // Almost black brown
  '#b5a490', // Light tan
];

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_FAUCET_CONFIG: FaucetConfig = {
  enabled: true,
  position: [0, 1.5, 0],
  spawnRadius: 0.4,
  spawnRate: 100, // 60 objects/sec = 1 per frame at 60fps
  initialVelocity: [0, 0, 0],
};

// Garden faucet positions - easy to tweak
// NOTE: Match these with spawn positions in PileDemo.tsx (COIN_SPAWN_X/Z, GEM_SPAWN_X/Z, GROWING_GEM_SPAWN_X/Z)
// so items spawn directly below their faucets
const COIN_FAUCET_X = 0.9;
const COIN_FAUCET_Y = 1.5;
const COIN_FAUCET_Z = -0.85;

const GEM_FAUCET_X = 0.3;
const GEM_FAUCET_Y = 1.5;
const GEM_FAUCET_Z = -0.3;

const GROWING_GEM_FAUCET_X = -0.4;
const GROWING_GEM_FAUCET_Y = 1.5;
const GROWING_GEM_FAUCET_Z = 0.4;

// Garden-specific faucet configurations
export const GARDEN_FAUCET_CONFIGS: Record<string, FaucetConfig> = {
  'coin-faucet': {
    enabled: true, // Enabled - coins spawn from faucet
    position: [COIN_FAUCET_X, COIN_FAUCET_Y, COIN_FAUCET_Z],
    spawnRadius: 0.3,
    spawnRate: 60, // Slower spawn rate for coins
    initialVelocity: [0, -2, 0], // Gentle downward velocity
  },
  'gem-faucet': {
    enabled: true, // Enabled - gems spawn from faucet
    position: [GEM_FAUCET_X, GEM_FAUCET_Y, GEM_FAUCET_Z],
    spawnRadius: 0.3,
    spawnRate: 40, // Even slower for gems (more valuable)
    initialVelocity: [0, -2, 0], // Gentle downward velocity
  },
  'growing-gem-faucet': {
    enabled: true, // Enabled - growing gems spawn from faucet into grow zone
    position: [GROWING_GEM_FAUCET_X, GROWING_GEM_FAUCET_Y, GROWING_GEM_FAUCET_Z],
    spawnRadius: 0.25,
    spawnRate: 30, // Slowest - only growing gems
    initialVelocity: [0, -2, 0], // Gentle downward velocity
  },
};

export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  mode: 'pickup',
  push: {
    radius: 0.1,
    strength: 0.001,
    maxForce: 0.5,
  },
  pickup: {
    damping: 10,
  },
  select: {
    highlightColor: '#ffff00',
    emissiveIntensity: 0.5,
  },
};
