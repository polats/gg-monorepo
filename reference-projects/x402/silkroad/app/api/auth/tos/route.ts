import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Validate wallet address
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE (for testing without database)
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK MODE: Accepting TOS in memory');
      
      const success = mockStore.acceptTOS(wallet);
      
      if (!success) {
        return NextResponse.json(
          { error: 'User not found. Please reconnect your wallet.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        wallet,
        tosAccepted: true,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE (production)
    // ============================================

    // Connect to database
    await connectDB();

    // Find and update user
    const user = await User.findOne({ wallet });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please reconnect your wallet.' },
        { status: 404 }
      );
    }

    // Update TOS acceptance
    user.tosAccepted = true;
    user.tosAcceptedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      wallet,
      tosAccepted: true,
    });
  } catch (error: any) {
    console.error('TOS acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept TOS' },
      { status: 500 }
    );
  }
}

