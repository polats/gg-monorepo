// ============================================================================
// Object Generation Utilities
// ============================================================================

import type { LevelConfig, ObjectTypeConfig } from '../types/game';
import type { PerformanceTier } from './performanceDetection';
import { scaleObjectCount } from './performanceDetection';
import { GEM_TYPE_COLORS } from './gemGeneration';

/**
 * Generate object types based on level configuration
 * Creates a list of physics objects with their geometries, materials, and counts
 */
export function generateObjectTypes(levelConfig: LevelConfig): ObjectTypeConfig[] {
  const types: ObjectTypeConfig[] = [
    {
      name: 'chunky_rocks', // Tetrahedrons - angular chunky rocks
      count: levelConfig.chunkyRocks,
      geometry: <tetrahedronGeometry args={[0.06]} />,
      collider: 'hull',
      baseSize: 0.06,
      color: '#8b7355', // Brown
      scaleRange: [0.4, 1.8], // Aggressive scaling for rock-like shapes
    },
    {
      name: 'rounded_boulders', // Dodecahedrons - rounded boulders
      count: levelConfig.roundedBoulders,
      geometry: <dodecahedronGeometry args={[0.055, 0]} />,
      collider: 'hull',
      baseSize: 0.055,
      color: '#a89080', // Light brown
      scaleRange: [0.4, 1.8],
    },
    {
      name: 'medium_rocks', // Icosahedrons - medium rocks
      count: levelConfig.mediumRocks,
      geometry: <icosahedronGeometry args={[0.05, 0]} />,
      collider: 'hull',
      baseSize: 0.05,
      color: '#6b5d52', // Dark brown
      scaleRange: [0.4, 1.8],
    },
    {
      name: 'sharp_rocks', // Octahedrons - diamond/sharp rocks
      count: levelConfig.sharpRocks,
      geometry: <octahedronGeometry args={[0.05]} />,
      collider: 'hull',
      baseSize: 0.05,
      color: '#5a4a42', // Very dark brown
      scaleRange: [0.4, 1.8],
    },
    // Gem types - each with specific color and shape
    {
      name: 'diamond_gems', // Octahedrons - clear/white diamond gems
      count: levelConfig.diamondGems,
      geometry: <octahedronGeometry args={[0.06]} />,
      collider: 'hull',
      baseSize: 0.06,
      color: GEM_TYPE_COLORS.diamond, // Clear/white
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'emerald_gems', // Octahedrons - green emerald gems
      count: levelConfig.emeraldGems,
      geometry: <octahedronGeometry args={[0.06]} />,
      collider: 'hull',
      baseSize: 0.06,
      color: GEM_TYPE_COLORS.emerald, // Green
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'emerald_tetra_gems', // Tetrahedrons - green emerald gems
      count: levelConfig.emeraldTetraGems,
      geometry: <tetrahedronGeometry args={[0.063]} />,
      collider: 'hull',
      baseSize: 0.063,
      color: GEM_TYPE_COLORS.emerald, // Green
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'emerald_dodeca_gems', // Dodecahedrons - green emerald gems
      count: levelConfig.emeraldDodecaGems,
      geometry: <dodecahedronGeometry args={[0.0525, 0]} />,
      collider: 'hull',
      baseSize: 0.0525,
      color: GEM_TYPE_COLORS.emerald, // Green
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'ruby_gems', // Dodecahedrons - red ruby gems
      count: levelConfig.rubyGems,
      geometry: <dodecahedronGeometry args={[0.0525, 0]} />,
      collider: 'hull',
      baseSize: 0.0525,
      color: GEM_TYPE_COLORS.ruby, // Red
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'ruby_tetra_gems', // Tetrahedrons - red ruby gems
      count: levelConfig.rubyTetraGems,
      geometry: <tetrahedronGeometry args={[0.063]} />,
      collider: 'hull',
      baseSize: 0.063,
      color: GEM_TYPE_COLORS.ruby, // Red
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'sapphire_gems', // Tetrahedrons - blue sapphire gems
      count: levelConfig.sapphireGems,
      geometry: <tetrahedronGeometry args={[0.063]} />,
      collider: 'hull',
      baseSize: 0.063,
      color: GEM_TYPE_COLORS.sapphire, // Blue
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'sapphire_octa_gems', // Octahedrons - blue sapphire gems
      count: levelConfig.sapphireOctaGems,
      geometry: <octahedronGeometry args={[0.06]} />,
      collider: 'hull',
      baseSize: 0.06,
      color: GEM_TYPE_COLORS.sapphire, // Blue
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'sapphire_dodeca_gems', // Dodecahedrons - blue sapphire gems
      count: levelConfig.sapphireDodecaGems,
      geometry: <dodecahedronGeometry args={[0.0525, 0]} />,
      collider: 'hull',
      baseSize: 0.0525,
      color: GEM_TYPE_COLORS.sapphire, // Blue
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'amethyst_gems', // Octahedrons - purple amethyst gems
      count: levelConfig.amethystGems,
      geometry: <octahedronGeometry args={[0.06]} />,
      collider: 'hull',
      baseSize: 0.06,
      color: GEM_TYPE_COLORS.amethyst, // Purple
      scaleRange: [0.5, 1.2],
      materialType: 'gem',
      spawnHeight: 'bottom',
    },
    {
      name: 'gold_coins', // Cylinders - flat gold coins
      count: levelConfig.goldCoins,
      geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />, // radius, radius, height, segments
      collider: 'hull',
      baseSize: 0.04,
      color: '#FFD700', // Gold
      scaleRange: [0.8, 1.2],
      materialType: 'coin',
      spawnHeight: 'normal',
    },
    {
      name: 'silver_coins', // Cylinders - flat silver coins
      count: levelConfig.silverCoins,
      geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />, // radius, radius, height, segments
      collider: 'hull',
      baseSize: 0.04,
      color: '#C0C0C0', // Silver
      scaleRange: [0.8, 1.2],
      materialType: 'coin',
      spawnHeight: 'normal',
    },
    {
      name: 'bronze_coins', // Cylinders - flat bronze coins
      count: levelConfig.bronzeCoins,
      geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />, // radius, radius, height, segments
      collider: 'hull',
      baseSize: 0.04,
      color: '#CD7F32', // Bronze
      scaleRange: [0.8, 1.2],
      materialType: 'coin',
      spawnHeight: 'normal',
    },
  ];

  // Filter out types with 0 count
  return types.filter((type) => type.count > 0);
}

/**
 * Apply performance-based scaling to boulder/rock counts
 * Keeps coins and gems at full count since they're collectibles
 */
export function applyPerformanceScaling(
  levelConfig: LevelConfig,
  performanceTier: PerformanceTier
): LevelConfig {
  return {
    ...levelConfig,
    // Scale rock/boulder counts based on performance
    chunkyRocks: scaleObjectCount(levelConfig.chunkyRocks, performanceTier),
    roundedBoulders: scaleObjectCount(levelConfig.roundedBoulders, performanceTier),
    mediumRocks: scaleObjectCount(levelConfig.mediumRocks, performanceTier),
    sharpRocks: scaleObjectCount(levelConfig.sharpRocks, performanceTier),
    // Keep coins and gems at full count (they're the collectibles)
    goldCoins: levelConfig.goldCoins,
    silverCoins: levelConfig.silverCoins,
    bronzeCoins: levelConfig.bronzeCoins,
    diamondGems: levelConfig.diamondGems,
    emeraldGems: levelConfig.emeraldGems,
    emeraldTetraGems: levelConfig.emeraldTetraGems,
    emeraldDodecaGems: levelConfig.emeraldDodecaGems,
    rubyGems: levelConfig.rubyGems,
    rubyTetraGems: levelConfig.rubyTetraGems,
    sapphireGems: levelConfig.sapphireGems,
    sapphireOctaGems: levelConfig.sapphireOctaGems,
    sapphireDodecaGems: levelConfig.sapphireDodecaGems,
    amethystGems: levelConfig.amethystGems,
  };
}
