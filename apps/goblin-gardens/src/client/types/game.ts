// ============================================================================
// Game Type Definitions
// ============================================================================

import type { ReactElement } from 'react';

// Level configuration - defines what objects appear at each level
export interface LevelConfig {
  level: number;
  goldCoins: number;
  silverCoins: number;
  bronzeCoins: number;
  // Gem types - each gem type can appear in different shapes
  diamondGems: number; // Clear/white gems (octahedron)
  emeraldGems: number; // Green gems (octahedron)
  emeraldTetraGems: number; // Green gems (tetrahedron)
  emeraldDodecaGems: number; // Green gems (dodecahedron)
  rubyGems: number; // Red gems (dodecahedron)
  rubyTetraGems: number; // Red gems (tetrahedron)
  sapphireGems: number; // Blue gems (tetrahedron)
  sapphireOctaGems: number; // Blue gems (octahedron)
  sapphireDodecaGems: number; // Blue gems (dodecahedron)
  amethystGems: number; // Purple gems (octahedron)
  // Rock counts (background objects)
  chunkyRocks: number;
  roundedBoulders: number;
  mediumRocks: number;
  sharpRocks: number;
}

// Object type configuration for physics objects
export interface ObjectTypeConfig {
  name: string;
  count: number;
  geometry: ReactElement;
  collider: 'cuboid' | 'ball' | 'hull';
  baseSize: number; // For reference only
  color: string; // Color for this type
  scaleRange?: [number, number]; // Min and max scale multiplier (default [0.5, 1.5])
  materialType?: 'rock' | 'gem' | 'coin'; // Type of material to use (default 'rock')
  spawnHeight?: 'normal' | 'bottom' | 'far-bottom' | 'grow-zone'; // Where to spawn objects (default 'normal')
  faucetId?: string; // Optional: ID of the faucet to use for this object type
  instanceScales?: number[]; // Optional: Specific scale for each instance (overrides scaleRange)
  instanceSpawnZones?: ('normal' | 'bottom' | 'far-bottom' | 'grow-zone')[]; // Optional: Per-instance spawn zone (overrides spawnHeight)
}

// ============================================================================
// Faucet Configuration Types
// ============================================================================

export interface FaucetConfig {
  enabled: boolean;
  position: [number, number, number]; // Center position where objects spawn
  spawnRadius: number; // Random spread around position
  spawnRate: number; // Objects per second
  initialVelocity?: [number, number, number]; // Optional initial velocity (x, y, z)
}

// ============================================================================
// Touch/Interaction Configuration Types
// ============================================================================

export type TouchMode = 'push' | 'pickup' | 'select';

export interface PushConfig {
  radius: number; // Radius of effect
  strength: number; // How strong the push is
  maxForce: number; // Cap the maximum force
}

export interface PickupConfig {
  damping: number; // How much to dampen picked object
}

export interface SelectConfig {
  highlightColor: string; // Color to highlight selected objects
  emissiveIntensity: number; // How bright the highlight is
}

export interface TouchConfig {
  mode: TouchMode;
  push: PushConfig;
  pickup: PickupConfig;
  select: SelectConfig;
}

// ============================================================================
// Player State Types
// ============================================================================

// Gem rarity levels - affects growth rate and visual appearance
export type GemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Gem types available in the game
export type GemType = 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst';

// Gem shapes - determines the mesh geometry used
export type GemShape = 'tetrahedron' | 'octahedron' | 'dodecahedron';

// Individual gem with unique properties
export interface Gem {
  id: string; // Unique identifier
  type: GemType; // Type of gem
  rarity: GemRarity; // Rarity tier
  shape: GemShape; // Physical shape/geometry
  color: string; // Hex color code
  growthRate: number; // Multiplier for growth speed
  level: number; // Current growth level (starts at 1)
  experience: number; // Progress toward next level
  dateAcquired: number; // Timestamp when obtained
  size: number; // Visual size multiplier (starts at 1.0)
  isGrowing: boolean; // Whether gem is in the grow zone
  isOffering: boolean; // Whether gem is in the offer zone
  currentGrowth: number; // Growth progress (0-100), when >= 100 increases size by 1mm
}

// Rarity configuration
export interface RarityConfig {
  color: string; // Display color for this rarity
  growthRate: number; // Growth speed multiplier
  probability: number; // Spawn weight (higher = more common)
}

export interface PlayerState {
  coins: {
    gold: number;
    silver: number;
    bronze: number;
  };
  gems: Gem[]; // Array of unique gem objects (includes both inventory and growing)
}
