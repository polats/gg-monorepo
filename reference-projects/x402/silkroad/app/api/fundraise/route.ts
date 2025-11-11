/**
 * Fundraise API - x402 Payment Integration for Donations
 * 
 * Implements x402 protocol for anonymous fundraiser donations
 * Uses same flow as purchase but for fundraisers
 * 
 * Flow:
 * 1. Initial request (no X-PAYMENT) → Returns 402 with payment requirements
 * 2. Payment request (with X-PAYMENT) → Verifies payment and returns thank you/reward URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Fundraiser } from '@/models/Fundraiser';
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
    const { fundraiserId, customAmount } = await req.json();

    if (!fundraiserId) {
      return NextResponse.json(
        { error: 'Fundraiser ID is required' },
        { status: 400 }
      );
    }

    // Validate custom amount if provided
    if (customAmount !== undefined) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 0.10) {
        return NextResponse.json(
          { error: 'Custom donation amount must be at least $0.10 USDC' },
          { status: 400 }
        );
      }
    }

    // Check for payment header (indicates this is an actual donation attempt)
    const paymentHeader = extractPaymentHeader(req.headers);
    
    // ANTI-SPAM: Rate limit donation attempts
    if (paymentHeader) {
      try {
        const payload = decodePaymentPayload(paymentHeader);
        
        if (payload && payload.payload) {
          const donorWallet = (payload.payload as SolanaExactPayload).from;
          
          if (donorWallet) {
            const rateLimit = await checkRateLimit(donorWallet, RATE_LIMITS.PURCHASE);
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
      // Mock mode - just return success
      if (paymentHeader) {
        return NextResponse.json({
          success: true,
          deliveryUrl: 'https://example.com/thank-you',
          txHash: 'mock-tx-hash-' + Date.now(),
          _mock: true,
        });
      } else {
        return NextResponse.json(
          {
            x402Version: 1,
            accepts: [{
              scheme: 'exact',
              network: 'solana-mainnet',
              maxAmountRequired: '1000000',
              payTo: 'mock-wallet',
              asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            }],
          },
          { status: 402 }
        );
      }
    }

    // ============================================
    // REAL MODE - x402 Payment Flow
    // ============================================
    await connectDB();

    // Get fundraiser
    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // Verify fundraiser is available
    if (fundraiser.state !== 'on_market' || !fundraiser.approved) {
      return NextResponse.json(
        { error: 'Fundraiser is not available for donations' },
        { status: 400 }
      );
    }

    // Use custom amount if provided, otherwise use goal amount (price)
    const donationAmount = customAmount ? parseFloat(customAmount) : fundraiser.price;

    // ============================================
    // STEP 1: No payment header → Return 402 Payment Required
    // ============================================
    if (!paymentHeader) {
      const paymentRequired = createPaymentRequired(
        fundraiserId,
        fundraiser.title,
        donationAmount, // Use custom/specified donation amount
        fundraiser.wallet,
        fundraiser.description
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

        // Create payment requirements for verification (use custom amount)
        const paymentRequirements = createPaymentRequired(
          fundraiserId,
          fundraiser.title,
          donationAmount, // Use custom/specified donation amount
          fundraiser.wallet,
          fundraiser.description
        ).accepts[0];

    // Verify payment via facilitator
    const verifyResult = await verifyPayment({
      x402Version: paymentPayload.x402Version,
      paymentHeader,
      paymentRequirements,
    });

    if (!verifyResult.isValid) {
      console.error('❌ Payment verification failed:', verifyResult.invalidReason);
      
      return NextResponse.json(
        { error: verifyResult.invalidReason || 'Payment verification failed' },
        { status: 402 }
      );
    }

    console.log('✅ Payment verified successfully');

    // Settle payment (confirm transaction)
    const settleResult = await settlePayment({
      x402Version: paymentPayload.x402Version,
      paymentHeader,
      paymentRequirements,
    });

    if (!settleResult.success) {
      console.error('❌ Payment settlement failed:', settleResult.error);
      
      return NextResponse.json(
        { error: settleResult.error || 'Payment settlement failed' },
        { status: 500 }
      );
    }

    console.log('✅ Payment settled successfully');

    // Decrypt thank you/reward URL
    const decryptedUrl = safeDecrypt(fundraiser.deliveryUrl);

    // Record transaction
    const solanaPayload = paymentPayload.payload as SolanaExactPayload;
    
    const newTransaction = await Transaction.create({
      listingId: fundraiserId,  // Store fundraiser ID in listingId field
      buyerWallet: solanaPayload.from,
      sellerWallet: solanaPayload.to,
      amount: parseFloat(solanaPayload.amount) / 1_000_000, // Convert microUSDC to USDC
      txnHash: solanaPayload.signature,
      deliveryUrl: fundraiser.deliveryUrl, // Store encrypted
      status: 'success',
    });

    // Update fundraiser raised amount (use actual donation amount)
    await Fundraiser.findByIdAndUpdate(fundraiserId, {
      $inc: { raisedAmount: donationAmount },
    });

    console.log(`✅ Updated fundraiser raised amount: +$${donationAmount}`);

    // Log successful donation (use actual amount)
    await createLog(
      'fundraiser_donated',
      `Donation of $${donationAmount} to fundraiser "${fundraiser.title}"`,
      solanaPayload.from,
      getIpFromRequest(req)
    );

    console.log('✅ Transaction recorded successfully');

    // Return success with transaction ID for redirect
    return NextResponse.json({
      success: true,
      transactionId: newTransaction._id.toString(),
      txHash: solanaPayload.signature,
    }, {
      headers: createPaymentResponseHeaders({
        success: true,
        txHash: settleResult.txHash!,
        networkId: settleResult.networkId!,
      }),
    });

  } catch (error: any) {
    console.error('❌ Fundraise error:', error);
    return NextResponse.json(
      { 
        error: 'Donation failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

