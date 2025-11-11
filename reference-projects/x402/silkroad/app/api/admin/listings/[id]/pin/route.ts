import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * Admin Auth Check
 */
function checkAdminAuth(req: NextRequest): boolean {
  const adminSession = req.cookies.get('admin_session');
  const isAuthenticated = adminSession?.value === 'active';
  
  if (!isAuthenticated) {
    console.log('❌ Admin auth failed: No valid session cookie');
  }
  
  return isAuthenticated;
}

/**
 * POST - Pin or Unpin a listing
 * Body: { pinned: boolean }
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
    // Check admin auth
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { pinned } = await req.json();

    if (typeof pinned !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: pinned must be a boolean' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Admin ${pinned ? 'pinning' : 'unpinning'} listing ${id}`);
      
      const listing = mockStore.getListing(id);
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      // If pinning, check if we already have 3 pinned listings
      if (pinned) {
        const allListings = Array.from((mockStore as any).getAllListings?.() || []);
        const pinnedCount = allListings.filter((l: any) => l.pinned && l._id !== id).length;
        
        if (pinnedCount >= 3) {
          return NextResponse.json(
            { error: 'Maximum 3 listings can be pinned at once. Unpin another listing first.' },
            { status: 400 }
          );
        }
      }

      const updated = mockStore.updateListing(id, {
        pinned,
        pinnedAt: pinned ? new Date() : undefined,
      });

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update listing' },
          { status: 500 }
        );
      }

      console.log(`✅ Listing ${id} ${pinned ? 'pinned' : 'unpinned'}`);

      return NextResponse.json({
        success: true,
        listing: updated,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Try to find in Listing collection first
    let listing = await Listing.findById(id);
    
    // If not found, try Fundraiser collection
    if (!listing) {
      listing = await Fundraiser.findById(id);
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // If pinning, check if we already have 3 pinned listings
    if (pinned) {
      const pinnedCount = await Listing.countDocuments({
        pinned: true,
        _id: { $ne: id }, // Exclude current listing
      });
      
      if (pinnedCount >= 3) {
        return NextResponse.json(
          { error: 'Maximum 3 listings can be pinned at once. Unpin another listing first.' },
          { status: 400 }
        );
      }
    }

    // Update listing
    listing.pinned = pinned;
    listing.pinnedAt = pinned ? new Date() : undefined;
    await listing.save();

    // Log the action
    await createLog(
      'admin_action',
      `Listing ${pinned ? 'pinned' : 'unpinned'}: "${listing.title}" (${id})`,
      undefined,
      getIpFromRequest(req)
    );

    console.log(`✅ Listing ${id} ${pinned ? 'pinned' : 'unpinned'}`);
    console.log(`   Pinned field value: ${listing.pinned}`);
    console.log(`   PinnedAt value: ${listing.pinnedAt}`);

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Pin listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

