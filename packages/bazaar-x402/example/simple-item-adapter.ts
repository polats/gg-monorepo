/**
 * Simple item adapter for demo purposes
 * In a real app, this would integrate with your game's item system
 */

import type { ItemAdapter } from '@bazaar-x402/core';

interface SimpleItem {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  owner: string;
}

export class SimpleItemAdapter implements ItemAdapter<SimpleItem> {
  private items = new Map<string, SimpleItem>();
  private lockedItems = new Set<string>();

  constructor() {
    // Create some demo items
    this.createDemoItems();
  }

  private createDemoItems() {
    const demoItems: SimpleItem[] = [
      {
        id: 'sword-1',
        name: 'Iron Sword',
        description: 'A basic iron sword',
        rarity: 'common',
        owner: 'player1',
      },
      {
        id: 'shield-1',
        name: 'Wooden Shield',
        description: 'A sturdy wooden shield',
        rarity: 'common',
        owner: 'player1',
      },
    ];

    demoItems.forEach((item) => this.items.set(item.id, item));
  }

  async validateItemOwnership(
    itemId: string,
    username: string
  ): Promise<boolean> {
    const item = this.items.get(itemId);
    return item?.owner === username;
  }

  async validateItemExists(itemId: string): Promise<boolean> {
    return this.items.has(itemId);
  }

  async lockItem(itemId: string, username: string): Promise<void> {
    if (this.lockedItems.has(itemId)) {
      throw new Error(`Item ${itemId} is already locked`);
    }
    this.lockedItems.add(itemId);
  }

  async unlockItem(itemId: string, username: string): Promise<void> {
    this.lockedItems.delete(itemId);
  }

  async transferItem(
    itemId: string,
    fromUsername: string,
    toUsername: string
  ): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }
    if (item.owner !== fromUsername) {
      throw new Error(`Item ${itemId} not owned by ${fromUsername}`);
    }
    item.owner = toUsername;
    this.lockedItems.delete(itemId);
  }

  async generateRandomItem(tierId: string): Promise<SimpleItem> {
    const rarities: SimpleItem['rarity'][] = [
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
    ];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Item`,
      description: `A ${rarity} item from ${tierId} mystery box`,
      rarity,
      owner: '', // Will be set when granted
    };
  }

  async grantItemToUser(item: SimpleItem, username: string): Promise<void> {
    item.owner = username;
    this.items.set(item.id, item);
  }

  serializeItem(item: SimpleItem): any {
    return item;
  }

  deserializeItem(data: any): SimpleItem {
    return data as SimpleItem;
  }

  getItemsByOwner(username: string): SimpleItem[] {
    const items: SimpleItem[] = [];
    for (const item of this.items.values()) {
      if (item.owner === username && !this.lockedItems.has(item.id)) {
        items.push(item);
      }
    }
    return items;
  }
}
