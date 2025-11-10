// ============================================================================
// Spawn Position Utilities
// ============================================================================
// Centralized spawn position constants and drag zone detection
// ⚠️ IMPORTANT: Keep these synchronized with FallingObjects.tsx

// ============================================================================
// Garden Spawn Positions
// ============================================================================
// These control where items initially spawn in the garden
// Match these with faucet positions (see constants/game.ts) for items to spawn below faucets
//
// Current setup:
// - Coin faucet: [0.9, 1.5, -0.85]  -> Coin spawn: [0.9, y, -0.85]
// - Gem faucet:  [0.3, 1.5, -0.3]   -> Gem spawn:  [0.3, y, -0.3]
// - Growing gem faucet: [-0.4, 1.5, 0.4] -> Growing gem spawn: [-0.4, y, 0.4]

// Coin spawn zone
export const COIN_SPAWN_X = 0.9;
export const COIN_SPAWN_Z = -0.85;
export const COIN_SPAWN_RADIUS = 0.35;

// Gem spawn zone (inventory gems)
export const GEM_SPAWN_X = 0.3;
export const GEM_SPAWN_Z = -0.3;
export const GEM_SPAWN_RADIUS = 0.35;

// Growing gem spawn zone (in grow area)
export const GROWING_GEM_SPAWN_X = -0.4;
export const GROWING_GEM_SPAWN_Z = 0.4;
export const GROWING_GEM_SPAWN_RADIUS = 0.25;

// ============================================================================
// Drag Zone Configuration
// ============================================================================
// Drag zone is at position [-0.615, -0.01, 0.625], rotated 5.5 radians around Y
// Size: 1.5 (width) x 0.75 (depth)

const DRAG_ZONE_X = -0.615;
const DRAG_ZONE_Y = -0.01;
const DRAG_ZONE_Z = 0.625;
const DRAG_ZONE_WIDTH = 1.5;
const DRAG_ZONE_HEIGHT = 0.1;
const DRAG_ZONE_DEPTH = 0.75;
const DRAG_ZONE_ROTATION = 5.5;

/**
 * Check if a 3D position is inside the drag zone
 * The drag zone is rotated, so we need to transform the point into local space first
 *
 * @param x - X coordinate in world space
 * @param y - Y coordinate in world space
 * @param z - Z coordinate in world space
 * @returns true if the position is inside the drag zone
 */
export function isInDragZone(x: number, y: number, z: number): boolean {
  // Transform point from world space to drag zone's local space
  // First translate to drag zone origin
  const dx = x - DRAG_ZONE_X;
  const dz = z - DRAG_ZONE_Z;

  // Then rotate around Y axis (inverse rotation)
  const cosTheta = Math.cos(-DRAG_ZONE_ROTATION);
  const sinTheta = Math.sin(-DRAG_ZONE_ROTATION);
  const localX = dx * cosTheta - dz * sinTheta;
  const localZ = dx * sinTheta + dz * cosTheta;

  // Check if point is inside the box bounds in local space
  // NOTE: Original implementation only checked X and Z, not Y
  // This allows objects at any height to be considered "in zone"
  const halfWidth = DRAG_ZONE_WIDTH / 2;
  const halfDepth = DRAG_ZONE_DEPTH / 2;

  return Math.abs(localX) <= halfWidth && Math.abs(localZ) <= halfDepth;
}

/**
 * Get drag zone bounds for rendering/debugging
 */
export function getDragZoneBounds() {
  return {
    position: [DRAG_ZONE_X, DRAG_ZONE_Y, DRAG_ZONE_Z] as [number, number, number],
    rotation: [0, DRAG_ZONE_ROTATION, 0] as [number, number, number],
    size: [DRAG_ZONE_WIDTH, DRAG_ZONE_HEIGHT, DRAG_ZONE_DEPTH] as [number, number, number],
  };
}
