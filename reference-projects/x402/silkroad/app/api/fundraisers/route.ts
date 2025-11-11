import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { Transaction } from '@/models/Transaction';
import { sanitizeString } from '@/lib/validation/sanitization';
import { encrypt } from '@/lib/crypto/encryption';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

// GET - Fetch all approved fundraisers or user's fundraisers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet'); // If provided, get user's fundraisers

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      // In mock mode, return empty array since we don't have mock fundraisers
      return NextResponse.json({
        success: true,
        fundraisers: [],
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
      console.log('📝 Fetching fundraisers for wallet:', wallet);
      const fundraisers = await Fundraiser.find({ wallet })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`✅ Found ${fundraisers.length} fundraisers for wallet`);
      
      // Calculate revenue for each fundraiser
      const fundraisersWithRevenue = await Promise.all(
        fundraisers.map(async (fundraiser: any) => {
          const transactions = await Transaction.find({
            listingId: fundraiser._id.toString(),
            status: 'success',
          });
          
          const revenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
          const salesCount = transactions.length;
          
          return {
            ...fundraiser,
            revenue,
            salesCount,
          };
        })
      );
      
      return NextResponse.json({
        success: true,
        fundraisers: fundraisersWithRevenue,
      });
    }

    console.log('📝 Fetching all approved fundraisers');
    const rawFundraisers = await Fundraiser.find({
      approved: true,
      state: 'on_market',
    })
      .select('-deliveryUrl') // Never expose delivery URL in list
      .lean();

    // Calculate actual raised amounts from transactions for each fundraiser
    const fundraisersWithActualAmounts = await Promise.all(
      rawFundraisers.map(async (fundraiser: any) => {
        const transactions = await Transaction.find({
          listingId: fundraiser._id.toString(),
          status: 'success',
        });
        
        const actualRaisedAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
        
        return {
          ...fundraiser,
          raisedAmount: actualRaisedAmount, // Override with actual amount from transactions
        };
      })
    );

    // Sort fundraisers: pinned first (by pinnedAt desc), then unpinned (by createdAt desc)
    const fundraisers = fundraisersWithActualAmounts.sort((a: any, b: any) => {
      const aPinned = a.pinned === true;
      const bPinned = b.pinned === true;
      
      // Pinned fundraisers come first
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

    console.log(`✅ Found ${fundraisers?.length || 0} approved fundraisers`);
    const pinnedCount = fundraisers.filter((f: any) => f.pinned === true).length;
    console.log(`   📌 ${pinnedCount} pinned, ${fundraisers.length - pinnedCount} unpinned`);

    return NextResponse.json({
      success: true,
      fundraisers: fundraisers || [],
    });
  } catch (error: any) {
    console.error('❌ Get fundraisers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch fundraisers', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new fundraiser
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

    // ANTI-SPAM: Rate limiting (3 fundraisers per hour)
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

    // ANTI-SPAM: Check fundraiser count (max 3 per wallet)
    const existingFundraisersCount = await Fundraiser.countDocuments({
      wallet,
      state: { $in: ['in_review', 'on_market'] } // Only count active fundraisers
    });

    if (existingFundraisersCount >= 3) {
      return NextResponse.json(
        { 
          error: 'Maximum 3 active fundraisers allowed per wallet. Delete or deactivate existing fundraisers to create new ones.',
          currentCount: existingFundraisersCount,
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
      // In mock mode, just return success
      return NextResponse.json({
        success: true,
        fundraiser: {
          _id: 'mock-fundraiser-' + Date.now(),
          wallet,
          title: sanitizedTitle,
          description: sanitizedDescription,
          price: priceNum,
          category,
          imageUrl,
          deliveryUrl: '***encrypted***',
          demoVideoUrl,
          whitepaperUrl,
          githubUrl,
          state: 'in_review',
          approved: false,
          createdAt: new Date(),
        },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Encrypt delivery URL before storing
    const encryptedDeliveryUrl = encrypt(deliveryUrl);

    const fundraiser = await Fundraiser.create({
      wallet,
      title: sanitizedTitle,
      description: sanitizedDescription,
      price: priceNum, // Store as price for compatibility
      goalAmount: priceNum, // Use the user's input as the goal amount
      raisedAmount: 0, // Initialize at 0
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

    // Log fundraiser creation
    await createLog(
      'fundraiser_created',
      `New fundraiser created: "${sanitizedTitle}" ($${priceNum}) by ${wallet.slice(0, 8)}...`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      fundraiser,
    });
  } catch (error: any) {
    console.error('Create fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to create fundraiser' },
      { status: 500 }
    );
  }
}

