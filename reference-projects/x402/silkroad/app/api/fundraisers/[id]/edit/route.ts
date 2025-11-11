import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { sanitizeString } from '@/lib/validation/sanitization';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';

// PUT - Edit fundraiser (limited fields)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      wallet,
      title, 
      description, 
      price, 
      category, 
      imageUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl 
    } = await req.json();

    // Validation
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet is required' },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title && (title.length < 5 || title.length > 100)) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && (description.length < 50 || description.length > 2000)) {
      return NextResponse.json(
        { error: 'Description must be 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price if provided
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 1 || priceNum > 10000) {
        return NextResponse.json(
          { error: 'Fundraising goal must be between $1 and $10,000 USDC' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    const validFundraiserCategories = [
      'Medical',
      'Education',
      'Community',
      'Emergency',
      'Animal Welfare',
      'Environmental',
      'Arts & Culture',
      'Technology',
      'Sports',
      'Religious',
      'Memorial',
      'Business',
      'Personal',
      'Other',
    ];
    
    if (category && !validFundraiserCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid fundraiser category' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Editing fundraiser ${id}`);
      return NextResponse.json({
        success: true,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Check rate limit (reuse listing creation limit)
    const rateLimit = await checkRateLimit(wallet, RATE_LIMITS.CREATE_LISTING);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: rateLimit.message || 'Too many requests',
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Find fundraiser and verify ownership
    const fundraiser = await Fundraiser.findById(id);
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    if (fundraiser.wallet !== wallet) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own fundraisers' },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = { updatedAt: new Date() };

    if (title) updates.title = sanitizeString(title);
    if (description) updates.description = sanitizeString(description);
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      updates.price = priceNum;
      updates.goalAmount = priceNum; // Update goalAmount to match price
    }
    if (category) updates.category = category;
    if (imageUrl) updates.imageUrl = imageUrl;
    if (demoVideoUrl !== undefined) updates.demoVideoUrl = demoVideoUrl;
    if (whitepaperUrl !== undefined) updates.whitepaperUrl = whitepaperUrl;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;

    // If fundraiser was previously approved and live, set back to in_review for admin approval
    if (fundraiser.state === 'on_market' && fundraiser.approved) {
      updates.state = 'in_review';
      updates.approved = false;
    }

    // Update fundraiser
    const updatedFundraiser = await Fundraiser.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    // Log the update
    await createLog(
      'fundraiser_created',
      `Fundraiser updated: "${updates.title || fundraiser.title}" by ${wallet.slice(0, 8)}...`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      fundraiser: {
        _id: updatedFundraiser!._id,
        title: updatedFundraiser!.title,
        description: updatedFundraiser!.description,
        price: updatedFundraiser!.price,
        category: updatedFundraiser!.category,
        imageUrl: updatedFundraiser!.imageUrl,
        state: updatedFundraiser!.state,
        approved: updatedFundraiser!.approved,
      },
      message: updatedFundraiser!.state === 'in_review' && !updatedFundraiser!.approved
        ? 'Fundraiser updated and sent for admin review' 
        : 'Fundraiser updated successfully',
    });
  } catch (error: any) {
    console.error('Edit fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to edit fundraiser' },
      { status: 500 }
    );
  }
}

