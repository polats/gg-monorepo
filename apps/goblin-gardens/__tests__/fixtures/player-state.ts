import type { PlayerState } from '../../src/shared/types/api';
import { createTestGems } from './gems';

/**
 * Creates a test player state with default values that can be overridden.
 * 
 * @param overrides - Partial player state properties to override defaults
 * @returns A complete PlayerState object suitable for testing
 * 
 * @example
 * ```typescript
 * // Create a basic player state with default coins and 5 gems
 * const state = createTestPlayerState();
 * 
 * // Create a wealthy player with custom coins
 * const wealthyPlayer = createTestPlayerState({
 *   coins: { gold: 10, silver: 50, bronze: 100 }
 * });
 * 
 * // Create a player with no gems
 * const newPlayer = createTestPlayerState({
 *   gems: []
 * });
 * ```
 */
export function createTestPlayerState(overrides?: Partial<PlayerState>): PlayerState {
  return {
    coins: overrides?.coins ?? {
      gold: 0,
      silver: 10,
      bronze: 50,
    },
    gems: overrides?.gems ?? createTestGems(5),
  };
}

/**
 * Creates a player state with specific coin amounts in bronze.
 * Automatically converts bronze to gold, silver, and bronze coins.
 * 
 * @param totalBronze - Total value in bronze coins
 * @param gems - Optional array of gems (defaults to 5 test gems)
 * @returns A PlayerState with converted coin values
 * 
 * @example
 * ```typescript
 * // Create player with 15,250 bronze (1 gold, 52 silver, 50 bronze)
 * const state = createPlayerStateWithBronze(15250);
 * 
 * // Create player with specific gems
 * const customGems = createTestGems(3, { type: 'diamond' });
 * const richPlayer = createPlayerStateWithBronze(50000, customGems);
 * ```
 */
export function createPlayerStateWithBronze(
  totalBronze: number,
  gems?: PlayerState['gems']
): PlayerState {
  const gold = Math.floor(totalBronze / 10000);
  const silver = Math.floor((totalBronze % 10000) / 100);
  const bronze = totalBronze % 100;

  return {
    coins: { gold, silver, bronze },
    gems: gems ?? createTestGems(5),
  };
}

/**
 * Creates a new player state with minimal resources.
 * 
 * @returns A PlayerState representing a new player
 * 
 * @example
 * ```typescript
 * const newPlayer = createNewPlayerState();
 * // Returns: { coins: { gold: 0, silver: 0, bronze: 0 }, gems: [] }
 * ```
 */
export function createNewPlayerState(): PlayerState {
  return {
    coins: {
      gold: 0,
      silver: 0,
      bronze: 0,
    },
    gems: [],
  };
}

/**
 * Creates a wealthy player state with abundant resources.
 * 
 * @returns A PlayerState with high coin amounts and diverse gems
 * 
 * @example
 * ```typescript
 * const wealthyPlayer = createWealthyPlayerState();
 * // Returns player with 100 gold, 500 silver, 999 bronze, and 20 gems
 * ```
 */
export function createWealthyPlayerState(): PlayerState {
  return {
    coins: {
      gold: 100,
      silver: 500,
      bronze: 999,
    },
    gems: createTestGems(20),
  };
}
