/**
 * Example Bazaar x402 server
 * Demonstrates how to set up a marketplace with configurable payment modes
 */

// Load environment variables from .env file
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

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

const WALLET_WITH_NO_USDC_ACCOUNT = '5Ueu3rRwUbpvgcB2FWLKqwkeHZTVAvFJ7CF1RUsHHwDd'
const WALLET_WITH_USDC = '5Ueu3rRwUbpvgcB2FWLKqwkeHZTVAvFJ7CF1RUsHHwDd'
const TEST_WALLET_1 = '9gJenaJYRCFbahPMtcfaWZ4LnCFtaqzriw5tcMwWBiuW'
const TEST_WALLET_2 = '5JegAwbg2qKjCxJNvrKw6bFhVY4okC5spyhHYs6jrit2'
const TEST_WALLET_3 = '4BTPWUuMRRu1iibuqEPKvGQK8EE8ZwEtz923J8oHVmap'


// Load and validate configuration from environment
console.log('\n🔍 DEBUG: Loading configuration...');
console.log('🔍 DEBUG: process.env.PAYMENT_MODE =', process.env.PAYMENT_MODE);
console.log('🔍 DEBUG: process.env.SOLANA_NETWORK =', process.env.SOLANA_NETWORK);

let config;
try {
  config = loadAndValidateConfig(process.env);
  console.log('\n🔍 DEBUG: Configuration loaded successfully');
  console.log('🔍 DEBUG: config.mode =', config.mode);
  console.log('🔍 DEBUG: config.x402Config?.network =', config.x402Config?.network);
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
console.log('\n🔍 DEBUG: Creating currency adapter...');
console.log('🔍 DEBUG: Passing config.mode =', config.mode);

const currencyAdapter = createCurrencyAdapter({
  config,
  verbose: true,
});

console.log('🔍 DEBUG: Currency adapter created');
console.log('🔍 DEBUG: Currency adapter type:', currencyAdapter.constructor.name);

// Create marketplace instance
// mockMode should match the payment mode from configuration
console.log('\n🔍 DEBUG: Creating marketplace...');
console.log('🔍 DEBUG: config.mode === "mock" =', config.mode === 'mock');
console.log('🔍 DEBUG: Setting mockMode to:', config.mode === 'mock');

const marketplace = new BazaarMarketplace({
  storageAdapter,
  paymentAdapter,
  itemAdapter,
  mockMode: config.mode === 'mock', // Use config to determine mock mode
});

console.log('🔍 DEBUG: Marketplace created');

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
      sellerWallet: WALLET_WITH_USDC,
      priceUSDC: 0.025,
    },
    {
      itemId: 'epic-shield-002',
      itemType: 'armor',
      itemData: { description: 'Epic Titanium Shield of Protection' },
      sellerUsername: 'SampleSeller2',
      sellerWallet: WALLET_WITH_NO_USDC_ACCOUNT,
      priceUSDC: 0.015,
    },
    {
      itemId: 'rare-potion-003',
      itemType: 'consumable',
      itemData: { description: 'Rare Health Restoration Potion' },
      sellerUsername: 'SampleSeller3',
      sellerWallet: TEST_WALLET_1,
      priceUSDC: 0.005,
    },
    {
      itemId: 'magic-staff-004',
      itemType: 'weapon',
      itemData: { description: 'Ancient Staff of Wisdom' },
      sellerUsername: 'SampleSeller1',
      sellerWallet: TEST_WALLET_2,
      priceUSDC: 0.05,
    },
    {
      itemId: 'enchanted-boots-005',
      itemType: 'armor',
      itemData: { description: 'Enchanted Boots of Speed' },
      sellerUsername: 'SampleSeller4',
      sellerWallet: TEST_WALLET_3,
      priceUSDC: 1.0,
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
  console.log('\n🔍 DEBUG: /api/config endpoint called');
  console.log('🔍 DEBUG: Returning config.mode =', config.mode);
  console.log('🔍 DEBUG: Returning config.network =', config.mode === 'production' ? config.x402Config?.network : undefined);
  
  const response = {
    mode: config.mode,
    network: config.mode === 'production' ? config.x402Config?.network : undefined,
  };
  
  console.log('🔍 DEBUG: Response:', JSON.stringify(response, null, 2));
  res.json(response);
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
    
    console.log('\n🔍 ===== PURCHASE REQUEST =====');
    console.log('🔍 Listing ID:', listingId);
    console.log('🔍 Buyer:', buyer);
    console.log('🔍 Buyer Wallet:', buyerWallet);
    console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 X-Payment header present:', !!req.headers['x-payment']);
    
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
    
    // Check for X-Payment header
    const paymentHeader = req.headers['x-payment'] as string | undefined;
    
    // In production mode, check for payment header
    if (config.mode === 'production') {
      if (!paymentHeader) {
        // No payment header - return 402 Payment Required
        console.log('🔍 DEBUG: No X-Payment header - returning 402 Payment Required');
        const initiation = await currencyAdapter.initiatePurchase({
          buyerId: buyer as string,
          sellerId: listing.sellerWallet,
          amount: listing.priceUSDC,
          resource: `/api/bazaar/purchase/${listingId}`,
          description: `Purchase ${listing.itemType} from ${listing.sellerUsername}`,
        });
        return res.status(402).json({
          error: 'Payment Required',
          message: 'Please sign the transaction with your wallet',
          paymentRequired: true,
          requirements: initiation.requirements,
        });
      }
      
      // Payment header present - verify payment
      console.log('🔍 DEBUG: X-Payment header present - verifying payment');
      console.log('🔍 Payment header length:', paymentHeader.length);
      console.log('🔍 Payment header (first 100 chars):', paymentHeader.substring(0, 100));
      
      try {
        const verification = await currencyAdapter.verifyPurchase({
          paymentHeader,
          expectedAmount: listing.priceUSDC,
          expectedRecipient: listing.sellerWallet,
        });
        
        console.log('🔍 Verification result:', verification);
        
        if (!verification.success) {
          console.error('🔍 Payment verification failed:', verification.error);
          return res.status(400).json({
            error: 'Payment verification failed',
            message: verification.error || 'Unknown error',
          });
        }
        
        // Payment verified - complete the purchase
        console.log('🔍 Payment verified - completing purchase');
        const result = await marketplace.verifyAndCompletePurchase(
          listingId,
          verification.txHash || '',
          buyer as string,
          buyerWallet as string
        );
        
        console.log('🔍 Purchase completed successfully');
        return res.json({
          success: true,
          message: 'Purchase completed',
          item: result.item,
          txHash: verification.txHash,
        });
      } catch (error) {
        console.error('🔍 Error during payment verification:', error);
        return res.status(500).json({
          error: 'Payment verification failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Mock mode: Check balance before proceeding
    const balance = await currencyAdapter.getBalance(buyer as string);
    if (balance.amount < listing.priceUSDC) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Insufficient balance. Need $${listing.priceUSDC.toFixed(2)}, have $${balance.amount.toFixed(2)}`,
      });
    }
    
    
    // Deduct from buyer (mock mode only)
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
    
    // In production mode, return 402 Payment Required immediately (skip balance check)
    if (config.mode === 'production') {
      console.log('🔍 DEBUG: Production mode - returning 402 Payment Required for mystery box');
      const initiation = await currencyAdapter.initiatePurchase({
        buyerId: buyer as string,
        sellerId: 'platform', // Mystery boxes go to platform
        amount: tier.priceUSDC,
        resource: `/api/bazaar/mystery-box/${tierId}`,
        description: `Purchase ${tier.name} mystery box`,
      });
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Please sign the transaction with your wallet',
        paymentRequired: true,
        requirements: initiation.requirements,
      });
    }

    // Mock mode: Check balance before proceeding
    const balance = await currencyAdapter.getBalance(buyer as string);
    if (balance.amount < tier.priceUSDC) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Insufficient balance. Need $${tier.priceUSDC.toFixed(2)}, have $${balance.amount.toFixed(2)}`,
      });
    }
    
    
    // Deduct from buyer (mock mode only)
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
