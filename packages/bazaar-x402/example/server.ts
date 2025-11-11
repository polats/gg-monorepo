/**
 * Example Bazaar x402 server
 * Demonstrates how to set up a marketplace with mock payment support
 */

import express from 'express';
import cors from 'cors';
import { BazaarMarketplace, createBazaarRoutes } from '@bazaar-x402/server';
import { MemoryStorageAdapter, MockPaymentAdapter } from '@bazaar-x402/server';
import { SimpleItemAdapter } from './simple-item-adapter.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create adapters
const storageAdapter = new MemoryStorageAdapter();
const paymentAdapter = new MockPaymentAdapter();
const itemAdapter = new SimpleItemAdapter();

// Create marketplace instance
const marketplace = new BazaarMarketplace({
  storageAdapter,
  paymentAdapter,
  itemAdapter,
  mockMode: true, // Enable mock mode for easy testing
});

// Initialize sample listings for testing
async function initializeSampleListings() {
  // First, create sample items and assign them to sellers
  const sampleItems = [
    {
      id: 'legendary-sword-001',
      name: 'Dragon Slayer',
      description: 'Legendary Dragon Slayer Sword',
      rarity: 'legendary' as const,
      owner: 'SampleSeller1',
    },
    {
      id: 'epic-shield-002',
      name: 'Titanium Shield',
      description: 'Epic Titanium Shield of Protection',
      rarity: 'epic' as const,
      owner: 'SampleSeller2',
    },
    {
      id: 'rare-potion-003',
      name: 'Health Potion',
      description: 'Rare Health Restoration Potion',
      rarity: 'rare' as const,
      owner: 'SampleSeller3',
    },
    {
      id: 'magic-staff-004',
      name: 'Staff of Wisdom',
      description: 'Ancient Staff of Wisdom',
      rarity: 'legendary' as const,
      owner: 'SampleSeller1',
    },
    {
      id: 'enchanted-boots-005',
      name: 'Boots of Speed',
      description: 'Enchanted Boots of Speed',
      rarity: 'epic' as const,
      owner: 'SampleSeller4',
    },
  ];

  // Grant items to sellers
  for (const item of sampleItems) {
    await itemAdapter.grantItemToUser(item, item.owner);
    console.log(`✅ Created item: ${item.name} for ${item.owner}`);
  }

  // Now create listings for these items
  const sampleListings = [
    {
      itemId: 'legendary-sword-001',
      itemType: 'weapon',
      itemData: { description: 'Legendary Dragon Slayer Sword' },
      sellerUsername: 'SampleSeller1',
      sellerWallet: 'wallet-sample-1',
      priceUSDC: 25.0,
    },
    {
      itemId: 'epic-shield-002',
      itemType: 'armor',
      itemData: { description: 'Epic Titanium Shield of Protection' },
      sellerUsername: 'SampleSeller2',
      sellerWallet: 'wallet-sample-2',
      priceUSDC: 15.5,
    },
    {
      itemId: 'rare-potion-003',
      itemType: 'consumable',
      itemData: { description: 'Rare Health Restoration Potion' },
      sellerUsername: 'SampleSeller3',
      sellerWallet: 'wallet-sample-3',
      priceUSDC: 5.0,
    },
    {
      itemId: 'magic-staff-004',
      itemType: 'weapon',
      itemData: { description: 'Ancient Staff of Wisdom' },
      sellerUsername: 'SampleSeller1',
      sellerWallet: 'wallet-sample-1',
      priceUSDC: 30.0,
    },
    {
      itemId: 'enchanted-boots-005',
      itemType: 'armor',
      itemData: { description: 'Enchanted Boots of Speed' },
      sellerUsername: 'SampleSeller4',
      sellerWallet: 'wallet-sample-4',
      priceUSDC: 12.75,
    },
  ];

  for (const listing of sampleListings) {
    try {
      await marketplace.createListing(listing);
      console.log(`✅ Created listing: ${listing.itemData.description} - $${listing.priceUSDC}`);
    } catch (error) {
      console.error(
        `❌ Failed to create listing: ${listing.itemData.description}`,
        error
      );
    }
  }
}

// Initialize sample data
initializeSampleListings().catch(console.error);

// Create router and add bazaar routes
const router = express.Router();
createBazaarRoutes(marketplace, router);
app.use('/api/bazaar', router);

// Add inventory endpoint
app.get('/api/inventory/:username', (req, res) => {
  const { username } = req.params;
  const items = itemAdapter.getItemsByOwner(username);
  res.json(items);
});

// Start server
app.listen(PORT, () => {
  console.log(`🎪 Bazaar example server running on http://localhost:${PORT}`);
  console.log(`📖 Open http://localhost:${PORT} to see the demo`);
  console.log(`🔧 Mock mode enabled - no real payments required`);
});
