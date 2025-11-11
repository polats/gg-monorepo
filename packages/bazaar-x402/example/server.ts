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

// Create router and add bazaar routes
const router = express.Router();
createBazaarRoutes(marketplace, router);
app.use('/api', router);

// Start server
app.listen(PORT, () => {
  console.log(`🎪 Bazaar example server running on http://localhost:${PORT}`);
  console.log(`📖 Open http://localhost:${PORT} to see the demo`);
  console.log(`🔧 Mock mode enabled - no real payments required`);
});
