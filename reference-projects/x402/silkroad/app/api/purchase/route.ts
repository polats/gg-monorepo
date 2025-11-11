/**
 * Purchase API - x402 Payment Integration
 * 
 * Implements x402 protocol for anonymous software purchases
 * 
 * Flow:
 * 1. Initial request (no X-PAYMENT) → Returns 402 with payment requirements
 * 2. Payment request (with X-PAYMENT) → Verifies payment and returns deliveryUrl
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Listing } from '@/models/Listing';
import { safeDecrypt } from '@/lib/crypto/encryption';
import {
  createPaymentRequired,
  extractPaymentHeader,
  decodePaymentPayload,
  createPaymentResponseHeaders,
  validatePaymentPayload,
} from '@/lib/x402/utils';
import { verifyPayment, settlePayment } from '@/lib/x402/facilitator';
import type { SolanaExactPayload } from '@/types/x402';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Check for payment header (indicates this is an actual purchase attempt)
    const paymentHeader = extractPaymentHeader(req.headers);
    
    // ANTI-SPAM: Rate limit purchase attempts
    if (paymentHeader) {
      try {
        const payload = decodePaymentPayload(paymentHeader);
        
        if (payload && payload.payload) {
          const buyerWallet = (payload.payload as SolanaExactPayload).from;
          
          if (buyerWallet) {
            const rateLimit = await checkRateLimit(buyerWallet, RATE_LIMITS.PURCHASE);
            if (!rateLimit.allowed) {
              return NextResponse.json(
                { 
                  error: rateLimit.message,
                  resetAt: rateLimit.resetAt,
                  remaining: rateLimit.remaining
                },
                { status: 429 }
              );
            }
          }
        }
      } catch (e) {
        // Continue if rate limit check fails (fail open)
      }
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      return handleMockPurchase(req, listingId);
    }

    // ============================================
    // REAL MODE - x402 Payment Flow
    // ============================================
    await connectDB();

    // Get listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify listing is available
    if (listing.state !== 'on_market' || !listing.approved) {
      return NextResponse.json(
        { error: 'Listing is not available for purchase' },
        { status: 400 }
      );
    }

    // Note: paymentHeader already extracted above for rate limiting

    // ============================================
    // STEP 1: No payment header → Return 402 Payment Required
    // ============================================
    if (!paymentHeader) {
      const paymentRequired = createPaymentRequired(
        listingId,
        listing.title,
        listing.price,
        listing.wallet,
        listing.description
      );

      return NextResponse.json(paymentRequired, {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // ============================================
    // STEP 2: Payment header present → Verify and settle
    // ============================================

    // Decode payment payload
    const paymentPayload = decodePaymentPayload(paymentHeader);
    
    if (!paymentPayload || !validatePaymentPayload(paymentPayload)) {
      return NextResponse.json(
        { error: 'Invalid payment payload' },
        { status: 400 }
      );
    }

    // Create payment requirements for verification
    const paymentRequirements = createPaymentRequired(
      listingId,
      listing.title,
      listing.price,
      listing.wallet,
      listing.description
    ).accepts[0];

    // Verify payment via facilitator
    const verifyResult = await verifyPayment({
      x402Version: paymentPayload.x402Version,
      paymentHeader,
      paymentRequirements,
    });

    if (!verifyResult.isValid) {
      // Increment failed purchase count
      listing.failedPurchaseCount += 1;
      listing.lastFailureAt = new Date();
      
      // Auto-pull after 3 failures
      if (listing.failedPurchaseCount >= 3) {
        listing.state = 'pulled';
        console.log(`⚠️  Auto-pulled listing ${listingId} after 3 failed purchases`);
      }
      
      await listing.save();

      return NextResponse.json(
        { error: verifyResult.invalidReason || 'Payment verification failed' },
        { status: 402 }
      );
    }

    // Settle payment via facilitator
    const settleResult = await settlePayment({
      x402Version: paymentPayload.x402Version,
      paymentHeader,
      paymentRequirements,
    });

    if (!settleResult.success) {
      // Increment failed purchase count
      listing.failedPurchaseCount += 1;
      listing.lastFailureAt = new Date();
      await listing.save();

      return NextResponse.json(
        { error: settleResult.error || 'Payment settlement failed' },
        { status: 402 }
      );
    }

    // Extract transaction details
    const solanaPayload = paymentPayload.payload as SolanaExactPayload;

    // Listing delivery URL is already encrypted, just copy it
    // (Encryption happens when listing is created)

    // Create transaction record
    const transaction = await Transaction.create({
      listingId: listing._id.toString(),
      buyerWallet: solanaPayload.from,
      sellerWallet: listing.wallet,
      amount: listing.price,
      txnHash: solanaPayload.signature,
      deliveryUrl: listing.deliveryUrl,  // Already encrypted from listing
      status: 'success',
    });

    // Log successful purchase
    await createLog(
      'listing_purchased',
      `Listing "${listing.title}" purchased for $${listing.price} by ${solanaPayload.from.slice(0, 8)}...`,
      solanaPayload.from,
      getIpFromRequest(req)
    );

    // Decrypt delivery URL for buyer (ephemeral, shown once)
    const decryptedDeliveryUrl = safeDecrypt(listing.deliveryUrl);

    // Create payment response headers
    const responseHeaders = createPaymentResponseHeaders({
      success: true,
      txHash: settleResult.txHash!,
      networkId: settleResult.networkId!,
      deliveryUrl: decryptedDeliveryUrl,  // Send decrypted to buyer (ephemeral)
    });

    // Return success with deliveryUrl
    return NextResponse.json(
      {
        success: true,
        transactionId: transaction._id.toString(),
        deliveryUrl: decryptedDeliveryUrl,  // Ephemeral delivery (no recovery)
        txHash: settleResult.txHash,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    console.error('❌ Purchase error:', error);
    return NextResponse.json(
      { error: 'Purchase processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle mock purchase (for development without blockchain)
 */
async function handleMockPurchase(req: NextRequest, listingId: string) {
  
  // Get listing
  const listing = mockStore.getListing(listingId);
  if (!listing) {
    return NextResponse.json(
      { error: 'Listing not found' },
      { status: 404 }
    );
  }

  // Verify listing is available
  if (listing.state !== 'on_market' || !listing.approved) {
    return NextResponse.json(
      { error: 'Listing is not available for purchase' },
      { status: 400 }
    );
  }

  // Check for payment header
  const paymentHeader = extractPaymentHeader(req.headers);

  // No payment header → Return 402
  if (!paymentHeader) {
    const paymentRequired = createPaymentRequired(
      listingId,
      listing.title,
      listing.price,
      listing.wallet,
      listing.description
    );

    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Decode payment payload to get buyer wallet
  const paymentPayload = decodePaymentPayload(paymentHeader);
  
  if (!paymentPayload) {
    return NextResponse.json(
      { error: 'Invalid payment payload' },
      { status: 400 }
    );
  }

  // Extract buyer wallet from payload
  const solanaPayload = paymentPayload.payload as any;
  const buyerWallet = solanaPayload.from || 'MockBuyer_Unknown';
  const mockTxHash = solanaPayload.signature || `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


  // Create mock transaction with real buyer wallet
  const transaction = mockStore.createTransaction({
    listingId,
    buyerWallet,
    sellerWallet: listing.wallet,
    amount: listing.price,
    txnHash: mockTxHash,
    deliveryUrl: listing.deliveryUrl,
    status: 'success',
  });


  // Return success with transactionId
  return NextResponse.json(
    {
      success: true,
      transactionId: transaction._id,
      deliveryUrl: listing.deliveryUrl,
      txHash: mockTxHash,
      _mock: true,
    },
    {
      status: 200,
    }
  );
}

