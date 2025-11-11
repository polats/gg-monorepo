/**
 * Express middleware integration for Bazaar marketplace
 * 
 * Provides ready-to-use Express routes for marketplace functionality.
 */

import type { Router, Request, Response, NextFunction } from 'express';
import type { BazaarMarketplace } from './marketplace.js';
import { BazaarError } from '@bazaar-x402/core';
import express from 'express';

/**
 * Create Express routes for Bazaar marketplace
 * 
 * @param marketplace - BazaarMarketplace instance
 * @param router - Optional Express router (creates new one if not provided)
 * @returns Express router with all marketplace routes
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { BazaarMarketplace, createBazaarRoutes } from '@bazaar-x402/server';
 * 
 * const app = express();
 * const marketplace = new BazaarMarketplace({ ... });
 * 
 * app.use('/api/bazaar', createBazaarRoutes(marketplace));
 * ```
 */
export function createBazaarRoutes(marketplace: BazaarMarketplace, router?: Router): Router {
  // Create router if not provided
  if (!router) {
    router = express.Router();
    router.use(express.json());
  }
  
  // ===== Listing Routes =====
  
  /**
   * GET /api/bazaar/listings
   * Get active listings with pagination
   */
  router.get('/listings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as 'newest' | 'price_low' | 'price_high' | undefined,
      };
      
      const result = await marketplace.getActiveListings(options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * POST /api/bazaar/listings
   * Create a new listing
   */
  router.post('/listings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await marketplace.createListing(req.body);
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * DELETE /api/bazaar/listings/:id
   * Cancel a listing
   */
  router.delete('/listings/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { username } = req.body;
      
      if (!username) {
        throw new BazaarError('MISSING_USERNAME', 'Username is required', 400);
      }
      
      await marketplace.cancelListing(id, username);
      res.json({ success: true, message: 'Listing cancelled' });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * GET /api/bazaar/listings/user/:username
   * Get all listings by a user
   */
  router.get('/listings/user/:username', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.params;
      const listings = await marketplace.getListingsByUser(username);
      res.json(listings);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * GET /api/bazaar/listings/:id
   * Get a specific listing
   */
  router.get('/listings/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const listing = await marketplace.getListing(id);
      
      if (!listing) {
        throw new BazaarError('LISTING_NOT_FOUND', `Listing ${id} not found`, 404);
      }
      
      res.json(listing);
    } catch (error) {
      next(error);
    }
  });
  
  // ===== Purchase Routes =====
  
  /**
   * POST /api/bazaar/listings/:id/purchase
   * Purchase a listing
   * 
   * Handles both mock and x402 payment modes:
   * - Without X-Payment header: Returns 402 (x402 mode) or completes purchase (mock mode)
   * - With X-Payment header: Verifies payment and completes purchase (x402 mode)
   */
  router.post('/listings/:id/purchase', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: listingId } = req.params;
      const { buyerUsername, buyerWallet } = req.body;
      const paymentHeader = req.headers['x-payment'] as string | undefined;
      
      // Validate required fields
      if (!buyerUsername || !buyerWallet) {
        throw new BazaarError(
          'MISSING_BUYER_INFO',
          'buyerUsername and buyerWallet are required',
          400
        );
      }
      
      // Purchase listing
      const result = await marketplace.purchaseListing({
        listingId,
        buyerUsername,
        buyerWallet,
        paymentHeader,
      });
      
      // Handle response based on status
      if (result.status === 402) {
        // x402 mode: Payment required
        res.status(402).json({
          error: 'PAYMENT_REQUIRED',
          message: 'Payment required to complete purchase',
          paymentRequired: result.paymentRequired,
        });
      } else if (result.success) {
        // Purchase completed successfully
        res.json({
          success: true,
          message: 'Listing purchased successfully',
          listing: result.listing,
          txHash: result.txHash,
          networkId: result.networkId,
        });
      } else {
        // Purchase failed
        throw new BazaarError(
          'PURCHASE_FAILED',
          result.error || 'Purchase failed',
          400
        );
      }
    } catch (error) {
      next(error);
    }
  });
  
  // ===== Mystery Box Routes =====
  
  /**
   * GET /api/bazaar/mystery-box/tiers
   * Get all mystery box tiers
   */
  router.get('/mystery-box/tiers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiers = await marketplace.getMysteryBoxTiers();
      res.json(tiers);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * GET /api/bazaar/mystery-box/:tierId
   * Initiate mystery box purchase (returns 402 in real mode, 200 in mock mode)
   */
  router.get('/mystery-box/:tierId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tierId } = req.params;
      const result = await marketplace.handleMysteryBoxRequest(tierId);
      
      if (result.requiresPayment) {
        // Real mode: Return 402 Payment Required
        res.status(402).json(result.paymentRequirements);
      } else {
        // Mock mode: Return 200 with purchase result
        res.json(result.purchaseResult);
      }
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * POST /api/bazaar/mystery-box/:tierId
   * Complete mystery box purchase with payment verification
   */
  router.post('/mystery-box/:tierId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tierId } = req.params;
      const paymentHeader = req.headers['x-payment'] as string || '';
      const { buyerUsername, buyerWallet } = req.body;
      
      if (!buyerUsername || !buyerWallet) {
        throw new BazaarError(
          'MISSING_BUYER_INFO',
          'buyerUsername and buyerWallet are required',
          400
        );
      }
      
      const result = await marketplace.verifyAndCompleteMysteryBox(
        tierId,
        paymentHeader,
        { buyerUsername, buyerWallet }
      );
      
      res.json({
        success: true,
        message: 'Mystery box purchased',
        item: result.itemGenerated,
        txHash: result.txHash,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // ===== Error Handler =====
  
  /**
   * Error handling middleware
   */
  router.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof BazaarError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  });
  
  return router;
}

/**
 * Type definitions for Express request extensions
 */
export interface BazaarRequest extends Request {
  bazaar?: {
    username?: string;
    wallet?: string;
  };
}
