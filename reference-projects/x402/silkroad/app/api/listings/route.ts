import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Transaction } from '@/models/Transaction';
import { sanitizeString } from '@/lib/validation/sanitization';
import { encrypt } from '@/lib/crypto/encryption';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

// GET - Fetch all approved listings or user's listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet'); // If provided, get user's listings

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      if (wallet) {
        const listings = mockStore.getListingsByWallet(wallet);
        return NextResponse.json({
          success: true,
          listings,
          _mock: true,
        });
      }

      
      // Seed data if empty
      const listings = mockStore.getApprovedListings();
      if (listings.length === 0) {
        mockStore.seedListings();
        const seededListings = mockStore.getApprovedListings();
        return NextResponse.json({
          success: true,
          listings: seededListings,
          _mock: true,
        });
      }

      return NextResponse.json({
        success: true,
        listings,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    try {
    await connectDB();
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError.message);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError.message },
        { status: 500 }
      );
    }

    if (wallet) {
      console.log('📝 Fetching listings for wallet:', wallet);
      const listings = await Listing.find({ wallet })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`✅ Found ${listings.length} listings for wallet`);
      
      // Calculate revenue for each listing
      const listingsWithRevenue = await Promise.all(
        listings.map(async (listing: any) => {
          const transactions = await Transaction.find({
            listingId: listing._id.toString(),
            status: 'success',
          });
          
          const revenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
          const salesCount = transactions.length;
          
          return {
            ...listing,
            revenue,
            salesCount,
          };
        })
      );
      
      return NextResponse.json({
        success: true,
        listings: listingsWithRevenue,
      });
    }

    console.log('📝 Fetching all approved listings');
    const rawListings = await Listing.find({
      approved: true,
      state: 'on_market',
    })
      .select('-deliveryUrl') // Never expose delivery URL in list
      .lean();

    // Sort listings: pinned first (by pinnedAt desc), then unpinned (by createdAt desc)
    const listings = rawListings.sort((a: any, b: any) => {
      const aPinned = a.pinned === true;
      const bPinned = b.pinned === true;
      
      // Pinned listings come first
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

    console.log(`✅ Found ${listings?.length || 0} approved listings`);
    const pinnedCount = listings.filter((l: any) => l.pinned === true).length;
    console.log(`   📌 ${pinnedCount} pinned, ${listings.length - pinnedCount} unpinned`);

    return NextResponse.json({
      success: true,
      listings: listings || [],
    });
  } catch (error: any) {
    console.error('❌ Get listings error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch listings', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new listing
export async function POST(req: NextRequest) {
  try {
    const { 
      wallet, 
      title, 
      description, 
      price, 
      category, 
      imageUrl, 
      deliveryUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl 
    } = await req.json();

    // Validation
    if (!wallet || !title || !description || !price || !category || !imageUrl || !deliveryUrl) {
      return NextResponse.json(
        { error: 'Required fields: wallet, title, description, price, category, imageUrl, deliveryUrl' },
        { status: 400 }
      );
    }

    // Validate wallet
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate title
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description
    if (description.length < 50 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.10) {
      return NextResponse.json(
        { error: 'Price must be at least $0.10 USDC' },
        { status: 400 }
      );
    }

    // ANTI-SPAM: Rate limiting (3 listings per hour)
    const rateLimit = await checkRateLimit(wallet, RATE_LIMITS.CREATE_LISTING);
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

    // ANTI-SPAM: Check listing count (max 3 per wallet)
    const existingListingsCount = await Listing.countDocuments({
      wallet,
      state: { $in: ['in_review', 'on_market'] } // Only count active listings
    });

    if (existingListingsCount >= 3) {
      return NextResponse.json(
        { 
          error: 'Maximum 3 active listings allowed per wallet. Delete or deactivate existing listings to create new ones.',
          currentCount: existingListingsCount,
          limit: 3
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // ANTI-SPAM: Check listing count (max 3 per wallet)
      const existingListings = mockStore.getListingsByWallet(wallet);
      const activeListings = existingListings.filter((l: any) => 
        l.state === 'in_review' || l.state === 'on_market'
      );

      if (activeListings.length >= 3) {
        return NextResponse.json(
          { 
            error: 'Maximum 3 active listings allowed per wallet. Delete or deactivate existing listings to create new ones.',
            currentCount: activeListings.length,
            limit: 3
          },
          { status: 429 }
        );
      }

      const listing = mockStore.createListing({
        wallet,
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: priceNum,
        category,
        imageUrl,
        deliveryUrl,
        demoVideoUrl,
        whitepaperUrl,
        githubUrl,
      });

      // Log listing creation
      await createLog(
        'listing_created',
        `New listing created: "${sanitizedTitle}" by ${wallet.slice(0, 8)}...`,
        wallet,
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

    // Encrypt delivery URL before storing
    const encryptedDeliveryUrl = encrypt(deliveryUrl);

    const listing = await Listing.create({
      wallet,
      title: sanitizedTitle,
      description: sanitizedDescription,
      price: priceNum,
      category,
      imageUrl,
      deliveryUrl: encryptedDeliveryUrl,  // Store encrypted
      demoVideoUrl,
      whitepaperUrl,
      githubUrl,
      riskLevel: 'standard',
      state: 'in_review',
      approved: false,
    });

    // Log listing creation
    await createLog(
      'listing_created',
      `New listing created: "${sanitizedTitle}" ($${priceNum}) by ${wallet.slice(0, 8)}...`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

