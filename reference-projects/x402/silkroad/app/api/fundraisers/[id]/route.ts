import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';

// GET - Get fundraiser by ID
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
      console.log(`🧪 MOCK: Fetching fundraiser ${id}`);
      
      // Mock mode doesn't have fundraisers yet, return error
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const fundraiser = await Fundraiser.findById(id);
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // Calculate actual raised amount from transactions (source of truth)
    const { Transaction } = await import('@/models/Transaction');
    const transactions = await Transaction.find({
      listingId: id,
      status: 'success',
    });
    
    const actualRaisedAmount = transactions.reduce((sum: number, txn: any) => sum + txn.amount, 0);

    return NextResponse.json({
      success: true,
      fundraiser: {
        ...fundraiser.toObject(),
        raisedAmount: actualRaisedAmount, // Override with actual amount from transactions
      },
    });
  } catch (error: any) {
    console.error('Get fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fundraiser' },
      { status: 500 }
    );
  }
}

// PATCH - Update fundraiser
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Updating fundraiser ${id}`);
      
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const fundraiser = await Fundraiser.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fundraiser,
    });
  } catch (error: any) {
    console.error('Update fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to update fundraiser' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fundraiser
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Deleting fundraiser ${id}`);
      
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const fundraiser = await Fundraiser.findByIdAndDelete(id);
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fundraiser deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fundraiser' },
      { status: 500 }
    );
  }
}

