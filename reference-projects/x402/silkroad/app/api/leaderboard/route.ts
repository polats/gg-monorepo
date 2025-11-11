import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Listing } from '@/models/Listing';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      const transactions = mockStore.getAllTransactions();
      const listings = mockStore.getAllListings();

      // Group transactions by seller
      const sellerStats = new Map<string, {
        wallet: string;
        totalRevenue: number;
        salesCount: number;
        activeListings: number;
      }>();

      // Calculate revenue per seller
      transactions
        .filter(t => t.status === 'success')
        .forEach(txn => {
          const stats = sellerStats.get(txn.sellerWallet) || {
            wallet: txn.sellerWallet,
            totalRevenue: 0,
            salesCount: 0,
            activeListings: 0,
          };

          stats.totalRevenue += txn.amount;
          stats.salesCount += 1;
          sellerStats.set(txn.sellerWallet, stats);
        });

      // Count active listings per seller
      listings
        .filter(l => l.state === 'on_market' && l.approved)
        .forEach(listing => {
          const stats = sellerStats.get(listing.wallet);
          if (stats) {
            stats.activeListings += 1;
          }
        });

      // Convert to array and sort by revenue
      const leaderboard = Array.from(sellerStats.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        leaderboard,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Aggregate transactions by seller wallet
    const sellerRevenue = await Transaction.aggregate([
      {
        $match: { status: 'success' }
      },
      {
        $group: {
          _id: '$sellerWallet',
          totalRevenue: { $sum: '$amount' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Enrich with active listings count
    const leaderboard = await Promise.all(
      sellerRevenue.map(async (seller) => {
        const activeListings = await Listing.countDocuments({
          wallet: seller._id,
          state: 'on_market',
          approved: true
        });

        return {
          wallet: seller._id,
          totalRevenue: seller.totalRevenue,
          salesCount: seller.salesCount,
          activeListings,
        };
      })
    );

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

