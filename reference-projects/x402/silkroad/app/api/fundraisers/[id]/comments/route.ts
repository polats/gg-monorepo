import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Comment } from '@/models/Comment';

// GET - Get comments for a fundraiser
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
      console.log(`🧪 MOCK: Fetching comments for fundraiser ${id}`);
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
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a fundraiser
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { wallet, comment } = await req.json();

    // Validation
    if (!wallet || !comment) {
      return NextResponse.json(
        { error: 'Required fields: wallet, comment' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Adding comment to fundraiser ${id}`);
      return NextResponse.json({
        success: true,
        comment: { wallet, comment, createdAt: new Date() },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const newComment = await Comment.create({
      listingId: id,
      buyerWallet: wallet,
      comment,
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

