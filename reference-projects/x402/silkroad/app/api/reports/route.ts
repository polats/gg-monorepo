import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report } from '@/models/Report';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * POST /api/reports
 * 
 * User reports a listing
 */
export async function POST(req: NextRequest) {
  try {
    const { listingId, wallet, reason } = await req.json();

    if (!listingId || !wallet) {
      return NextResponse.json(
        { error: 'Listing ID and wallet are required' },
        { status: 400 }
      );
    }

    // Rate limit: 5 reports per day per wallet
    const rateLimit = await checkRateLimit(wallet, {
      keyPrefix: 'report',
      maxRequests: 5,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.message,
          resetAt: rateLimit.resetAt,
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: User ${wallet.slice(0, 8)} reporting listing ${listingId}`);
      
      // In mock mode, just return success (reports aren't persisted)
      return NextResponse.json({
        success: true,
        message: 'Report submitted successfully',
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Check if listing or fundraiser exists
    let listing = await Listing.findById(listingId);
    let itemType = 'listing';
    
    if (!listing) {
      listing = await Fundraiser.findById(listingId);
      itemType = 'fundraiser';
    }
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this listing
    const existingReport = await Report.findOne({
      listingId,
      reporterWallet: wallet,
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this listing' },
        { status: 409 }
      );
    }

    // Create report
    await Report.create({
      listingId,
      reporterWallet: wallet,
      reason: reason?.trim() || undefined,
    });

    // Increment report count on listing
    listing.reportsCount += 1;
    await listing.save();

    console.log(`🚨 ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${listingId} reported by ${wallet.slice(0, 8)} (total: ${listing.reportsCount})`);

    // Log report submission
    await createLog(
      'report_submitted',
      `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${listing.title}" reported by ${wallet.slice(0, 8)}... (Total reports: ${listing.reportsCount})`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportsCount: listing.reportsCount,
    });
  } catch (error: any) {
    console.error('❌ Report submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

