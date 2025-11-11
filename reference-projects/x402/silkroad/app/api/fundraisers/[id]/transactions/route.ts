import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';

/**
 * GET /api/fundraisers/[id]/transactions
 * 
 * Fetch all successful donations for a fundraiser
 * Returns anonymized transaction data (amounts, timestamps, truncated wallets)
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
      console.log(`🧪 MOCK: Fetching transactions for fundraiser ${id}`);
      return NextResponse.json({
        success: true,
        transactions: [],
        totalRaised: 0,
        donationCount: 0,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Fetch all successful transactions for this fundraiser
    const transactions = await Transaction.find({
      listingId: id,
      status: 'success',
    })
      .select('buyerWallet amount createdAt txnHash')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalRaised = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const donationCount = transactions.length;

    // Return transactions with anonymized wallet addresses
    const anonymizedTransactions = transactions.map((txn: any) => ({
      _id: txn._id.toString(),
      wallet: txn.buyerWallet, // Frontend will truncate for display
      amount: txn.amount,
      createdAt: txn.createdAt,
      txnHash: txn.txnHash,
    }));

    return NextResponse.json({
      success: true,
      transactions: anonymizedTransactions,
      totalRaised,
      donationCount,
    });
  } catch (error: any) {
    console.error('❌ Get fundraiser transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

