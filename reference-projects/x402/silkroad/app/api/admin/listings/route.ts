import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';

/**
 * TEMPORARY Admin Auth Check (MVP)
 * 
 * Simple cookie check - frontend manages session via localStorage
 * 
 * TODO: Replace with proper JWT verification for production
 */
function checkAdminAuth(req: NextRequest): boolean {
  // Check for admin session cookie
  const adminSession = req.cookies.get('admin_session');
  const isAuthenticated = adminSession?.value === 'active';
  
  if (!isAuthenticated) {
    console.log('❌ Admin auth failed: No valid session cookie');
  }
  
  return isAuthenticated;
}

export async function GET(req: NextRequest) {
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

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK: Admin fetching all listings');
      
      // Get all listings (not just approved) and sort them
      const rawListings = Array.from((mockStore as any).getAllListings?.() || []);
      
      // Sort: pinned first (by pinnedAt desc), then by createdAt desc
      const allListings = rawListings.sort((a: any, b: any) => {
        const aPinned = a.pinned === true;
        const bPinned = b.pinned === true;
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        if (aPinned && bPinned) {
          const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
          const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
          return bTime - aTime;
        }
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return NextResponse.json({
        success: true,
        listings: allListings,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Fetch both listings and fundraisers
    const [rawListings, rawFundraisers] = await Promise.all([
      Listing.find({}),
      Fundraiser.find({})
    ]);

    // Mark items with their type
    const listingsWithType = rawListings.map((item: any) => ({
      ...item.toObject(),
      type: 'listing' as const
    }));
    const fundraisersWithType = rawFundraisers.map((item: any) => ({
      ...item.toObject(),
      type: 'fundraiser' as const
    }));

    // Combine all items
    const allItems = [...listingsWithType, ...fundraisersWithType];

    // Sort: pinned first (by pinnedAt desc), then by createdAt desc
    const listings = allItems.sort((a: any, b: any) => {
      const aPinned = a.pinned === true;
      const bPinned = b.pinned === true;
      
      // Pinned items come first
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Both pinned: sort by pinnedAt (most recent first)
      if (aPinned && bPinned) {
        const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return bTime - aTime;
      }
      
      // Both unpinned: sort by createdAt (most recent first)
      const aCreated = new Date(a.createdAt).getTime();
      const bCreated = new Date(b.createdAt).getTime();
      return bCreated - aCreated;
    });

    console.log(`📋 Admin fetched ${rawListings.length} listings + ${rawFundraisers.length} fundraisers = ${listings.length} total`);
    const pinnedCount = listings.filter((l: any) => l.pinned === true).length;
    console.log(`   📌 ${pinnedCount} pinned, ${listings.length - pinnedCount} unpinned`);
    if (listings.length > 0) {
      console.log(`   First item: "${listings[0].title}" - type: ${listings[0].type} - pinned: ${listings[0].pinned}`);
    }

    return NextResponse.json({
      success: true,
      listings,
    });
  } catch (error: any) {
    console.error('Admin get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

