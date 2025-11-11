/**
 * Item adapter interface for game-specific item operations
 */

/**
 * Item adapter interface with generic type support
 * 
 * This interface allows games to define their own item validation,
 * transfer, and generation logic while maintaining type safety.
 * 
 * @template TItem - The game-specific item type
 */
export interface ItemAdapter<TItem = any> {
  // ===== Validation =====
  
  /**
   * Validate that a user owns a specific item
   * @param itemId - The item ID to check
   * @param username - The username to check ownership for
   * @returns True if the user owns the item, false otherwise
   */
  validateItemOwnership(itemId: string, username: string): Promise<boolean>;
  
  /**
   * Validate that an item exists in the game
   * @param itemId - The item ID to check
   * @returns True if the item exists, false otherwise
   */
  validateItemExists(itemId: string): Promise<boolean>;
  
  // ===== Listing Management =====
  
  /**
   * Lock an item to prevent it from being used while listed
   * This should mark the item as unavailable for other operations
   * @param itemId - The item ID to lock
   * @param username - The username of the owner
   */
  lockItem(itemId: string, username: string): Promise<void>;
  
  /**
   * Unlock an item (e.g., when listing is cancelled)
   * @param itemId - The item ID to unlock
   * @param username - The username of the owner
   */
  unlockItem(itemId: string, username: string): Promise<void>;
  
  // ===== Transfer =====
  
  /**
   * Transfer an item from one user to another
   * This should handle all game-specific logic for item ownership transfer
   * @param itemId - The item ID to transfer
   * @param fromUsername - The current owner's username
   * @param toUsername - The new owner's username
   */
  transferItem(itemId: string, fromUsername: string, toUsername: string): Promise<void>;
  
  // ===== Mystery Box =====
  
  /**
   * Generate a random item for a mystery box purchase
   * @param tierId - The mystery box tier ID
   * @param rarityWeights - Weighted rarity distribution
   * @returns The generated item
   */
  generateRandomItem(tierId: string, rarityWeights: Record<string, number>): Promise<TItem>;
  
  /**
   * Grant an item to a user (e.g., from mystery box)
   * @param item - The item to grant
   * @param username - The username to grant the item to
   */
  grantItemToUser(item: TItem, username: string): Promise<void>;
  
  // ===== Serialization =====
  
  /**
   * Serialize an item for storage or transmission
   * @param item - The item to serialize
   * @returns Serialized item data
   */
  serializeItem(item: TItem): any;
  
  /**
   * Deserialize item data back into an item object
   * @param data - The serialized item data
   * @returns The deserialized item
   */
  deserializeItem(data: any): TItem;
}
