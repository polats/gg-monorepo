import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { checkTokenBalance } from '@/lib/solana/tokenGating';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { CONFIG, MIN_SRX402_BALANCE } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';

export async function POST(req: NextRequest) {
  try {
    const { wallet, skipTokenCheck } = await req.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Validate wallet address
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(wallet);
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
      // Get or create mock user first (to get TOS status)
      const mockUser = mockStore.getUser(wallet, true); // Pass true initially
      
      // If frontend requests to skip token check (using cached balance)
      if (skipTokenCheck) {
        return NextResponse.json({
          success: true,
          wallet,
          hasAcceptedTOS: mockUser.hasAcceptedTOS,
          _mock: true,
          _cached: true,
        });
      }
      
      let tokenGatingPassed: boolean;
      let tokenBalance: number;

      // Check if we should bypass token gating or check real balance
      if (CONFIG.MOCK_TOKEN_GATING_PASSED) {
        tokenGatingPassed = true;
        tokenBalance = 50000; // Fake balance for display
      } else {
        // Check actual token balance on mainnet
        const balanceResult = await checkTokenBalance(wallet);
        tokenGatingPassed = balanceResult.meetsRequirement;
        tokenBalance = balanceResult.total;
      }

      // Update mock user with token gating status
      mockUser.isTokenGated = tokenGatingPassed;

      return NextResponse.json({
        success: true,
        wallet,
        tokenGatingPassed,
        hasAcceptedTOS: mockUser.hasAcceptedTOS,
        tokenBalance,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE (production)
    // ============================================

    // Connect to database
    await connectDB();

    // Find user first
    let user = await User.findOne({ wallet });
    
    // If frontend requests to skip token check (using cached balance)
    if (skipTokenCheck && user) {
      return NextResponse.json({
        success: true,
        wallet,
        hasAcceptedTOS: user.tosAccepted || false,
        _cached: true,
      });
    }

    // Check token balance for gating (mainnet)
    const balanceResult = await checkTokenBalance(wallet);
    const tokenGatingPassed = balanceResult.meetsRequirement;

    // Check if user has accepted TOS
    const hasAcceptedTOS = user?.tosAccepted || false;

    // Create user record if doesn't exist
    if (!user) {
      user = await User.create({
        wallet,
        tosAccepted: false,
        isTokenGated: tokenGatingPassed,
        tokenBalance: balanceResult.total,
        lastSeen: new Date(),
      });
    } else {
      // Update last seen and token gating status
      user.isTokenGated = tokenGatingPassed;
      user.tokenBalance = balanceResult.total;
      user.lastSeen = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      wallet,
      tokenGatingPassed,
      hasAcceptedTOS,
      tokenBalance: balanceResult.total, // Return actual balance
    });
  } catch (error: any) {
    console.error('Auth connect error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

