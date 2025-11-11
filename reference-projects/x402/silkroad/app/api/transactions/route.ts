/**
 * Transactions API
 * 
 * Fetch transaction history for authenticated users
 * - Sales: Transactions where user is the seller
 * - Purchases: Transactions where user is the buyer
 */

import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const type = searchParams.get('type'); // 'sales' or 'purchases'

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!type || (type !== 'sales' && type !== 'purchases')) {
      return NextResponse.json(
        { error: 'Type must be "sales" or "purchases"' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Fetching ${type} for wallet ${wallet.slice(0, 8)}...`);

      const transactions = type === 'sales'
        ? mockStore.getTransactionsBySeller(wallet)
        : mockStore.getTransactionsByBuyer(wallet);

      console.log(`   Found ${transactions.length} ${type} transactions`);

      // Enrich with listing data
      const enrichedTransactions = transactions.map(tx => {
        const listing = mockStore.getListing(tx.listingId);
        return {
          ...tx,
          listingTitle: listing?.title || 'Unknown',
          listingCategory: listing?.category || 'Unknown',
        };
      });

      return NextResponse.json({
        success: true,
        transactions: enrichedTransactions,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Fetch transactions based on type
    const query = type === 'sales'
      ? { sellerWallet: wallet }
      : { buyerWallet: wallet };

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with listing or fundraiser data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        // Try to find as listing first
        let item = await Listing.findById(tx.listingId).select('title category').lean() as { title: string; category: string } | null;
        
        // If not found, try fundraiser
        if (!item) {
          item = await Fundraiser.findById(tx.listingId).select('title category').lean() as { title: string; category: string } | null;
        }
        
        return {
          ...tx,
          listingTitle: item?.title || 'Unknown',
          listingCategory: item?.category || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      transactions: enrichedTransactions,
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

