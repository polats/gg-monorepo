import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';

// POST - Increment view count
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Incrementing view for fundraiser ${id}`);
      return NextResponse.json({ success: true, _mock: true });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    await Fundraiser.findByIdAndUpdate(id, {
      $inc: { views: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Increment view error:', error);
    return NextResponse.json(
      { error: 'Failed to increment view' },
      { status: 500 }
    );
  }
}

