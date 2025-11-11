import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';

/**
 * TEMPORARY Admin Auth Check (MVP)
 */
function checkAdminAuth(req: NextRequest): boolean {
  const adminSession = req.cookies.get('admin_session');
  return adminSession?.value === 'active';
}

/**
 * Republish a pulled listing
 * 
 * Admin can restore a pulled listing back to the marketplace.
 * Listing returns to 'on_market' state with approved status.
 */
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
      console.log(`🧪 MOCK: Admin republishing listing ${id}`);
      
      const listing = mockStore.updateListing(id, {
        approved: true,
        state: 'on_market' as any,
        failedPurchaseCount: 0, // Reset failure count
      });

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

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
        failedPurchaseCount: 0, // Reset failure count on republish
        lastFailureAt: null, // Clear failure timestamp
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
          failedPurchaseCount: 0,
          lastFailureAt: null,
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

    console.log(`✅ Admin republished listing ${id}`);

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Admin republish listing error:', error);
    return NextResponse.json(
      { error: 'Failed to republish listing' },
      { status: 500 }
    );
  }
}

