import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { Transaction } from '@/models/Transaction';
import { Listing } from '@/models/Listing';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * GET /api/listings/[id]/comments
 * 
 * Fetch all comments for a listing (public endpoint)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Fetching comments for listing ${id}`);
      
      // Return empty comments for now
      return NextResponse.json({
        success: true,
        comments: [],
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const comments = await Comment.find({ listingId: id })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error: any) {
    console.error('❌ Fetch comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings/[id]/comments
 * 
 * Create a comment (requires verified purchase)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { wallet, comment } = await req.json();

    if (!wallet || !comment) {
      return NextResponse.json(
        { error: 'Wallet and comment are required' },
        { status: 400 }
      );
    }

    // Validate comment length
    if (comment.trim().length < 5 || comment.trim().length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 5-500 characters' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Creating comment for listing ${id} by ${wallet.slice(0, 8)}`);
      
      // Return success without persisting
      return NextResponse.json({
        success: true,
        comment: {
          _id: 'mock-comment-id',
          listingId: id,
          buyerWallet: wallet,
          comment: comment.trim(),
          createdAt: new Date(),
        },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Verify user has purchased this listing
    const purchase = await Transaction.findOne({
      listingId: id,
      buyerWallet: wallet,
      status: 'success',
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'You must purchase this listing before leaving a review' },
        { status: 403 }
      );
    }

    // Check if user already commented
    const existingComment = await Comment.findOne({
      listingId: id,
      buyerWallet: wallet,
    });

    if (existingComment) {
      return NextResponse.json(
        { error: 'You have already reviewed this listing' },
        { status: 409 }
      );
    }

    // Create comment
    const newComment = await Comment.create({
      listingId: id,
      buyerWallet: wallet,
      comment: comment.trim(),
    });

    console.log(`💬 New comment on listing ${id} by ${wallet.slice(0, 8)}`);

    // Log comment creation
    const listing = await Listing.findById(id).lean() as { title: string } | null;
    await createLog(
      'comment_posted',
      `New review on "${listing?.title || 'Unknown'}" by ${wallet.slice(0, 8)}...`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error: any) {
    console.error('❌ Create comment error:', error);
    
    // Handle duplicate comment (race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already reviewed this listing' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

