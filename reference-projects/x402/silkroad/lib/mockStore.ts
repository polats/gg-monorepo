/**
 * Mock Data Store (Development Only)
 * 
 * FILE-PERSISTED store for testing without database
 * Data survives server restarts via .mock-data.json
 * Shared across all API routes
 * 
 * DESIGN: Easy to gut - all mock logic contained here
 * When ready for real DB: simply route API calls to Mongoose models instead
 */

import fs from 'fs';
import path from 'path';

interface MockUser {
  hasAcceptedTOS: boolean;
  isTokenGated: boolean;
  wallet: string;
}

interface MockListing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  deliveryUrl: string;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: 'in_review' | 'on_market' | 'pulled';
  approved: boolean;
  pinned: boolean;
  pinnedAt?: Date;
  reportsCount: number;
  failedPurchaseCount: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MockTransaction {
  _id: string;
  listingId: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  txnHash: string;
  deliveryUrl: string; // encrypted in real DB
  status: 'success' | 'failed';
  createdAt: Date;
}

interface PersistedData {
  users: Array<[string, MockUser]>;
  listings: Array<[string, MockListing]>;
  transactions: Array<[string, MockTransaction]>;
  listingIdCounter: number;
  transactionIdCounter: number;
}

// File path for persistence
const MOCK_DATA_FILE = path.join(process.cwd(), '.mock-data.json');

// Global mock stores
const mockUsers = new Map<string, MockUser>();
const mockListings = new Map<string, MockListing>();
const mockTransactions = new Map<string, MockTransaction>();
let listingIdCounter = 1;
let transactionIdCounter = 1;

// Load persisted data on module initialization
function loadPersistedData() {
  try {
    if (fs.existsSync(MOCK_DATA_FILE)) {
      const fileContent = fs.readFileSync(MOCK_DATA_FILE, 'utf-8');
      const data: PersistedData = JSON.parse(fileContent, (key, value) => {
        // Revive Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });

      // Restore data to Maps
      data.users.forEach(([key, value]) => mockUsers.set(key, value));
      data.listings.forEach(([key, value]) => mockListings.set(key, value));
      data.transactions.forEach(([key, value]) => mockTransactions.set(key, value));
      
      listingIdCounter = data.listingIdCounter;
      transactionIdCounter = data.transactionIdCounter;

      console.log('🧪 MOCK: Loaded persisted data from disk');
      console.log(`   Users: ${mockUsers.size}, Listings: ${mockListings.size}, Transactions: ${mockTransactions.size}`);
    } else {
      console.log('🧪 MOCK: No persisted data found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Failed to load persisted data:', error);
    console.log('🧪 MOCK: Starting with empty data store');
  }
}

// Save data to disk
function savePersistedData() {
  try {
    const data: PersistedData = {
      users: Array.from(mockUsers.entries()),
      listings: Array.from(mockListings.entries()),
      transactions: Array.from(mockTransactions.entries()),
      listingIdCounter,
      transactionIdCounter,
    };

    fs.writeFileSync(MOCK_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Failed to save persisted data:', error);
  }
}

// Load data when module is imported
loadPersistedData();

export const mockStore = {
  /**
   * Get or create mock user
   */
  getUser(wallet: string, defaultTokenGating: boolean = false): MockUser {
    let user = mockUsers.get(wallet);
    
    if (!user) {
      user = {
        wallet,
        hasAcceptedTOS: false,
        isTokenGated: defaultTokenGating,
      };
      mockUsers.set(wallet, user);
      console.log(`🧪 MOCK: Created user ${wallet.slice(0, 8)}...`);
    }
    
    return user;
  },

  /**
   * Update user TOS acceptance
   */
  acceptTOS(wallet: string): boolean {
    let user = mockUsers.get(wallet);
    
    // Create user if doesn't exist
    if (!user) {
      console.log(`🧪 MOCK: Creating user ${wallet.slice(0, 8)}... for TOS acceptance`);
      user = {
        wallet,
        hasAcceptedTOS: true,
        isTokenGated: false,
      };
      mockUsers.set(wallet, user);
      console.log(`🧪 MOCK: User ${wallet.slice(0, 8)}... created and accepted TOS`);
      savePersistedData();
      return true;
    }
    
    user.hasAcceptedTOS = true;
    mockUsers.set(wallet, user);
    console.log(`🧪 MOCK: User ${wallet.slice(0, 8)}... accepted TOS`);
    savePersistedData();
    return true;
  },

  /**
   * Update token gating status
   */
  updateTokenGating(wallet: string, passed: boolean): void {
    const user = mockUsers.get(wallet);
    
    if (user) {
      user.isTokenGated = passed;
      mockUsers.set(wallet, user);
      savePersistedData();
    }
  },

  /**
   * Clear all mock data
   */
  clear(): void {
    mockUsers.clear();
    console.log('🧪 MOCK: Store cleared');
    savePersistedData();
  },

  /**
   * Get all users (for debugging)
   */
  getAllUsers(): MockUser[] {
    return Array.from(mockUsers.values());
  },

  /**
   * Get ALL listings (for admin)
   */
  getAllListings(): MockListing[] {
    return Array.from(mockListings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // ============================================
  // LISTINGS
  // ============================================

  /**
   * Create listing
   */
  createListing(data: Omit<MockListing, '_id' | 'createdAt' | 'updatedAt' | 'reportsCount' | 'failedPurchaseCount' | 'approved' | 'state' | 'riskLevel' | 'pinned' | 'views'>): MockListing {
    const listing: MockListing = {
      _id: `listing_${listingIdCounter++}`,
      ...data,
      riskLevel: 'standard',
      state: 'in_review',
      approved: false,
      pinned: false,
      reportsCount: 0,
      failedPurchaseCount: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockListings.set(listing._id, listing);
    console.log(`🧪 MOCK: Created listing ${listing._id}`);
    savePersistedData();
    return listing;
  },

  /**
   * Get listing by ID
   */
  getListing(id: string): MockListing | undefined {
    return mockListings.get(id);
  },

  /**
   * Get all approved listings (for browse page)
   * Pinned listings appear first, sorted by pinnedAt (most recent first)
   * Then unpinned listings sorted by createdAt (most recent first)
   */
  getApprovedListings(): MockListing[] {
    return Array.from(mockListings.values())
      .filter(l => l.state === 'on_market' && l.approved)
      .sort((a, b) => {
        // Pinned listings come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // Both pinned: sort by pinnedAt (most recent first)
        if (a.pinned && b.pinned) {
          const aTime = a.pinnedAt?.getTime() || 0;
          const bTime = b.pinnedAt?.getTime() || 0;
          return bTime - aTime;
        }
        
        // Both unpinned: sort by createdAt (most recent first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  },

  /**
   * Get listings by wallet (seller's listings)
   */
  getListingsByWallet(wallet: string): MockListing[] {
    return Array.from(mockListings.values())
      .filter(l => l.wallet === wallet)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Update listing
   */
  updateListing(id: string, updates: Partial<MockListing>): MockListing | null {
    const listing = mockListings.get(id);
    if (!listing) return null;
    
    const updated = {
      ...listing,
      ...updates,
      updatedAt: new Date(),
    };
    
    mockListings.set(id, updated);
    console.log(`🧪 MOCK: Updated listing ${id}`);
    savePersistedData();
    return updated;
  },

  /**
   * Delete listing
   */
  deleteListing(id: string): boolean {
    const result = mockListings.delete(id);
    if (result) {
      console.log(`🧪 MOCK: Deleted listing ${id}`);
      savePersistedData();
    }
    return result;
  },

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Create transaction
   */
  createTransaction(data: Omit<MockTransaction, '_id' | 'createdAt'>): MockTransaction {
    const transaction: MockTransaction = {
      _id: `txn_${transactionIdCounter++}`,
      ...data,
      createdAt: new Date(),
    };
    
    mockTransactions.set(transaction._id, transaction);
    console.log(`🧪 MOCK: Created transaction ${transaction._id}`);
    console.log(`   Buyer: ${data.buyerWallet.slice(0, 8)}... → Seller: ${data.sellerWallet.slice(0, 8)}...`);
    console.log(`   Amount: $${data.amount.toFixed(2)} USDC`);
    savePersistedData();
    return transaction;
  },

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): MockTransaction | undefined {
    return mockTransactions.get(id);
  },

  /**
   * Get transactions by buyer wallet
   */
  getTransactionsByBuyer(wallet: string): MockTransaction[] {
    return Array.from(mockTransactions.values())
      .filter(t => t.buyerWallet === wallet)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get transactions by seller wallet
   */
  getTransactionsBySeller(wallet: string): MockTransaction[] {
    return Array.from(mockTransactions.values())
      .filter(t => t.sellerWallet === wallet)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get all transactions (for debugging)
   */
  getAllTransactions(): MockTransaction[] {
    return Array.from(mockTransactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // ============================================
  // SEED DATA (for testing UI)
  // ============================================

  /**
   * Seed with sample listings
   */
  seedListings(): void {
    const sampleListings = [
      {
        wallet: 'mockSeller1',
        title: 'Advanced Trading Bot - MEV Arbitrage',
        description: 'High-frequency trading bot optimized for Solana DEX arbitrage. Includes advanced MEV strategies, customizable parameters, and detailed profit tracking. Built with Rust for maximum performance.',
        imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
        deliveryUrl: 'https://github.com/seller/mev-bot/releases/download/v1.0.0/bot.zip',
        price: 49.99,
        category: 'Trading Bot',
      },
      {
        wallet: 'mockSeller2',
        title: 'NFT Sniper Bot - Multi-Marketplace',
        description: 'Lightning-fast NFT minting and sniping bot supporting Magic Eden, Tensor, and other major Solana marketplaces. Real-time floor tracking and automated bidding.',
        imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop',
        deliveryUrl: 'https://mega.nz/file/nft-sniper-v2.1.0.zip',
        price: 29.99,
        category: 'Trading Bot',
      },
      {
        wallet: 'mockSeller1',
        title: 'Solana RPC Analytics API',
        description: 'RESTful API providing real-time Solana blockchain analytics, wallet tracking, and transaction monitoring. Perfect for building dashboards and monitoring tools.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        deliveryUrl: 'https://drive.google.com/file/d/analytics-api-docs',
        price: 19.99,
        category: 'API Tool',
      },
      {
        wallet: 'mockSeller3',
        title: 'Token Launcher Script - Full Automation',
        description: 'Complete token launch automation for Solana. Creates mint, metadata, and initial liquidity pool. Includes anti-bot measures and customizable tokenomics.',
        imageUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop',
        deliveryUrl: 'https://dropbox.com/s/token-launcher-script.tar.gz',
        price: 15.50,
        category: 'Script',
      },
      {
        wallet: 'mockSeller2',
        title: 'Wallet Drainer Detection Tool',
        description: 'Security tool that analyzes smart contracts and transaction patterns to detect potential wallet drainers and malicious dApps. Includes real-time alerts.',
        imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
        deliveryUrl: 'https://github.com/security/drainer-detector/releases/v1.5.0.zip',
        price: 24.99,
        category: 'Custom',
      },
      {
        wallet: 'mockSeller3',
        title: 'DeFi Yield Optimizer Bot',
        description: 'Automated yield farming optimizer that rebalances your portfolio across multiple Solana DeFi protocols to maximize APY. Set it and forget it.',
        imageUrl: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&h=600&fit=crop',
        deliveryUrl: 'https://mega.nz/file/yield-optimizer-pro.zip',
        price: 34.99,
        category: 'Trading Bot',
      },
    ];

    sampleListings.forEach(listing => {
      const created = this.createListing(listing);
      // Auto-approve for testing
      this.updateListing(created._id, {
        approved: true,
        state: 'on_market',
      });
    });

    console.log('🧪 MOCK: Seeded 6 sample listings');
  },

  /**
   * Clear all mock data
   */
  clearAll(): void {
    mockUsers.clear();
    mockListings.clear();
    mockTransactions.clear();
    listingIdCounter = 1;
    transactionIdCounter = 1;
    console.log('🧪 MOCK: All data cleared');
    savePersistedData();
  },
};

