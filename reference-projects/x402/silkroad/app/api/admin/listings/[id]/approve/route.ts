import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * TEMPORARY Admin Auth Check (MVP)
 */
function checkAdminAuth(req: NextRequest): boolean {
  const adminSession = req.cookies.get('admin_session');
  return adminSession?.value === 'active';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block if admin is disabled
  if (CONFIG.DISABLE_ADMIN) {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Admin approving listing ${id}`);
      
      const listing = mockStore.updateListing(id, {
        approved: true,
        state: 'on_market' as any,
      });

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      // Log admin approval
      await createLog(
        'listing_approved',
        `Admin approved listing: "${listing.title}" (ID: ${id})`,
        undefined,
        getIpFromRequest(req)
      );

      return NextResponse.json({
        success: true,
        listing,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Try to find and update in Listing collection first
    let listing = await Listing.findByIdAndUpdate(
      id,
      {
        approved: true,
        state: 'on_market',
        updatedAt: new Date(),
      },
      { new: true }
    );

    // If not found, try Fundraiser collection
    if (!listing) {
      listing = await Fundraiser.findByIdAndUpdate(
        id,
        {
          approved: true,
          state: 'on_market',
          updatedAt: new Date(),
        },
        { new: true }
      );
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Log admin approval
    await createLog(
      'listing_approved',
      `Admin approved listing: "${listing.title}" ($${listing.price})`,
      undefined,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Admin approve listing error:', error);
    return NextResponse.json(
      { error: 'Failed to approve listing' },
      { status: 500 }
    );
  }
}

