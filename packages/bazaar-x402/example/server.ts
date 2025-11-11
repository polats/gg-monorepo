/**
 * Example Bazaar x402 server
 * Demonstrates how to set up a marketplace with configurable payment modes
 */

import express from 'express';
import cors from 'cors';
import { BazaarMarketplace, createBazaarRoutes } from '@bazaar-x402/server';
import { MemoryStorageAdapter, MockPaymentAdapter } from '@bazaar-x402/server';
import {
  loadAndValidateConfig,
  getConfigSummary,
  createCurrencyAdapter,
} from '@bazaar-x402/core';
import { SimpleItemAdapter } from './simple-item-adapter.js';

const app = express();
const PORT = 3001;

// Load and validate configuration from environment
let config;
try {
  config = loadAndValidateConfig(process.env);
  console.log(getConfigSummary(config));
} catch (error) {
  console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create adapters
const storageAdapter = new MemoryStorageAdapter();
const paymentAdapter = new MockPaymentAdapter();
const itemAdapter = new SimpleItemAdapter();

// Create currency adapter based on configuration
const currencyAdapter = createCurrencyAdapter({
  config,
  verbose: true,
});

// Create marketplace instance
// mockMode should match the payment mode from configuration
const marketplace = new BazaarMarketplace({
  storageAdapter,
  paymentAdapter,
  itemAdapter,
  mockMode: config.mode === 'mock', // Use config to determine mock mode
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
createBazaarRoutes(marketplace, router as any); // Type assertion to handle Express version mismatch
app.use('/api/bazaar', router);

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    mode: config.mode,
    network: config.mode === 'production' ? config.x402Config?.network : undefined,
  });
});

// Add inventory endpoint
app.get('/api/inventory/:username', (req, res) => {
  const { username } = req.params;
  const items = itemAdapter.getItemsByOwner(username);
  res.json(items);
});

// Balance API endpoints
app.get('/api/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await currencyAdapter.getBalance(userId);
    res.json(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      error: 'Failed to get balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/balance/add', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId and positive amount are required',
      });
    }
    
    const result = await currencyAdapter.add(userId, amount);
    res.json({
      success: true,
      newBalance: result.newBalance,
      txId: result.txId,
    });
  } catch (error) {
    console.error('Error adding balance:', error);
    res.status(500).json({
      error: 'Failed to add balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Transaction history endpoint
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, sortOrder } = req.query;
    
    // Parse pagination parameters
    const options = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };
    
    // Validate pagination parameters
    if (options.page < 1) {
      return res.status(400).json({
        error: 'Invalid page',
        message: 'Page must be greater than 0',
      });
    }
    
    if (options.limit < 1 || options.limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100',
      });
    }
    
    // Get transactions
    const transactions = await currencyAdapter.getTransactions(userId, options);
    
    res.json({
      transactions,
      page: options.page,
      limit: options.limit,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Custom purchase endpoint with currency integration
app.get('/api/bazaar/purchase-with-currency/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { buyer, buyerWallet } = req.query;
    
    if (!buyer || !buyerWallet) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'buyer and buyerWallet are required',
      });
    }
    
    // Get listing
    const listing = await marketplace.getListing(listingId);
    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: `Listing ${listingId} not found`,
      });
    }
    
    if (listing.status !== 'active') {
      return res.status(400).json({
        error: 'Listing not active',
        message: `Listing ${listingId} is not active`,
      });
    }
    
    // Check if buyer is trying to buy their own listing
    if (listing.sellerUsername === buyer) {
      return res.status(400).json({
        error: 'Cannot buy own listing',
        message: 'You cannot purchase your own listing',
      });
    }
    
    // Check balance
    const balance = await currencyAdapter.getBalance(buyer as string);
    if (balance.amount < listing.priceUSDC) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Insufficient balance. Need $${listing.priceUSDC.toFixed(2)}, have $${balance.amount.toFixed(2)}`,
      });
    }
    
    // Deduct from buyer
    const deductionResult = await currencyAdapter.deduct(buyer as string, listing.priceUSDC);
    
    try {
      // Add to seller
      await currencyAdapter.add(listing.sellerUsername, listing.priceUSDC);
      
      // Complete the purchase through marketplace
      const result = await marketplace.verifyAndCompletePurchase(
        listingId,
        '',
        buyer as string,
        buyerWallet as string
      );
      
      // Record transaction
      await currencyAdapter.recordTransaction({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        userId: buyer as string,
        type: 'listing_purchase',
        amount: listing.priceUSDC,
        txId: deductionResult.txId,
        networkId: 'mock',
        timestamp: Date.now(),
        listingId: listingId,
        itemId: listing.itemId,
      });
      
      await currencyAdapter.recordTransaction({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        userId: listing.sellerUsername,
        type: 'listing_sale',
        amount: listing.priceUSDC,
        txId: deductionResult.txId,
        networkId: 'mock',
        timestamp: Date.now(),
        listingId: listingId,
        itemId: listing.itemId,
      });
      
      res.json({
        success: true,
        message: 'Purchase completed',
        item: result.item,
        txId: deductionResult.txId,
        newBalance: deductionResult.newBalance,
      });
    } catch (error) {
      // Rollback: refund buyer
      await currencyAdapter.add(buyer as string, listing.priceUSDC);
      throw error;
    }
  } catch (error) {
    console.error('Error purchasing listing:', error);
    res.status(500).json({
      error: 'Purchase failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Custom mystery box purchase endpoint with currency integration
app.get('/api/bazaar/mystery-box-with-currency/:tierId', async (req, res) => {
  try {
    const { tierId } = req.params;
    const { buyer, buyerWallet } = req.query;
    
    if (!buyer || !buyerWallet) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'buyer and buyerWallet are required',
      });
    }
    
    // Get tier
    const tiers = await marketplace.getMysteryBoxTiers();
    const tier = tiers.find(t => t.id === tierId);
    
    if (!tier) {
      return res.status(404).json({
        error: 'Mystery box tier not found',
        message: `Mystery box tier ${tierId} not found`,
      });
    }
    
    // Check balance
    const balance = await currencyAdapter.getBalance(buyer as string);
    if (balance.amount < tier.priceUSDC) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Insufficient balance. Need $${tier.priceUSDC.toFixed(2)}, have $${balance.amount.toFixed(2)}`,
      });
    }
    
    // Deduct from buyer
    const deductionResult = await currencyAdapter.deduct(buyer as string, tier.priceUSDC);
    
    try {
      // Complete the purchase through marketplace
      const result = await marketplace.verifyAndCompleteMysteryBox(
        tierId,
        '',
        {
          buyerUsername: buyer as string,
          buyerWallet: buyerWallet as string,
        }
      );
      
      // Record transaction
      await currencyAdapter.recordTransaction({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        userId: buyer as string,
        type: 'mystery_box_purchase',
        amount: tier.priceUSDC,
        txId: deductionResult.txId,
        networkId: 'mock',
        timestamp: Date.now(),
        boxId: tierId,
        items: [result.itemGenerated.id],
      });
      
      res.json({
        success: true,
        message: 'Mystery box purchased',
        item: result.itemGenerated,
        txId: deductionResult.txId,
        newBalance: deductionResult.newBalance,
      });
    } catch (error) {
      // Rollback: refund buyer
      await currencyAdapter.add(buyer as string, tier.priceUSDC);
      throw error;
    }
  } catch (error) {
    console.error('Error purchasing mystery box:', error);
    res.status(500).json({
      error: 'Purchase failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎪 Bazaar example server running on http://localhost:${PORT}`);
  console.log(`\n💳 Payment Mode: ${config.mode}`);
  
  if (config.mode === 'mock') {
    console.log(`🔧 Mock mode enabled - no real payments required`);
    console.log(`💰 Default balance: ${config.mockConfig?.defaultBalance} USDC`);
  } else if (config.mode === 'production') {
    console.log(`⚡ Production mode - real USDC payments via x402`);
    console.log(`🌐 Network: ${config.x402Config?.network}`);
  }
  
  console.log('');
});
