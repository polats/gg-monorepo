// ============================================================================
// Color Utilities
// ============================================================================
// Centralized color functions for consistent styling across the application

import type { GemType } from '../types/game';

/**
 * Get the color for a coin type
 */
export function getCoinColor(coinType: string): string {
  switch (coinType) {
    case 'gold':
      return '#FFD700';
    case 'silver':
      return '#C0C0C0';
    case 'bronze':
      return '#CD7F32';
    default:
      return '#CD7F32';
  }
}

/**
 * Get the color for a crystal/gem type
 */
export function getCrystalColor(crystal: string): string {
  switch (crystal) {
    case 'ruby':
      return '#E0115F'; // Deep red
    case 'sapphire':
      return '#0F52BA'; // Deep blue
    case 'emerald':
      return '#50C878'; // Emerald green
    case 'amethyst':
      return '#9966CC'; // Purple
    case 'diamond':
      return '#E8F5F5'; // Clear/white
    case 'topaz':
      return '#FFD700'; // Golden yellow
    case 'aquamarine':
      return '#7FFFD4'; // Cyan/turquoise
    case 'citrine':
      return '#E4D00A'; // Yellow
    case 'obsidian':
      return '#3C3C3C'; // Dark gray/black
    case 'quartz':
      return '#F0F0F0'; // Light gray/clear
    default:
      return '#ffffff';
  }
}

/**
 * Get the gem icon styles based on shape
 */
export function getGemIconStyle(
  shape: 'tetrahedron' | 'octahedron' | 'dodecahedron'
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    flexShrink: 0,
  };

  switch (shape) {
    case 'octahedron':
      // Diamond shape (rotated square) - default
      return {
        ...baseStyle,
        borderRadius: '2px',
        transform: 'rotate(45deg)',
      };
    case 'dodecahedron':
      // Pentagon-like shape using clip-path
      return {
        ...baseStyle,
        borderRadius: '20%',
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        transform: 'scale(1.1)', // Slightly larger to compensate for clip
      };
    case 'tetrahedron':
      // Smaller, sharper triangle
      return {
        ...baseStyle,
        borderRadius: '1px',
        clipPath: 'polygon(50% 10%, 10% 90%, 90% 90%)',
        transform: 'scale(1.15)',
      };
    default:
      return baseStyle;
  }
}
