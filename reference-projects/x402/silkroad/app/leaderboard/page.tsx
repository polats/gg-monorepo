'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';

interface LeaderboardEntry {
  wallet: string;
  totalRevenue: number;
  salesCount: number;
  activeListings: number;
}

function LeaderboardPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) {
      fetchLeaderboard();
    }
  }, [mounted]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaderboard?limit=20');
      setLeaderboard(response.data.leaderboard);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const isCurrentUser = (wallet: string) => {
    return publicKey?.toBase58() === wallet;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            🏆 Top Sellers Leaderboard
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            The highest earning vendors on SilkRoadx402
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>👀 Browse Mode:</strong> You're viewing the leaderboard. Connect your wallet to create listings and make purchases.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Action Required:</strong> Please accept the Terms of Service to interact with the marketplace.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>👀 Browse Mode:</strong> You're viewing the leaderboard. Hold <strong>50,000 $SRx402</strong> tokens to create listings and make purchases.
            </p>
          </div>
        ) : null}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            <span className="ml-3 text-zinc-600 dark:text-zinc-400">Loading leaderboard...</span>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Seller
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Total Revenue
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Sales
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Active Listings
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                {leaderboard.map((entry, index) => {
                  const isTopTen = index < 10;
                  const isCurrentUserRow = isCurrentUser(entry.wallet);
                  
                  return (
                    <tr
                      key={entry.wallet}
                      className={`transition-all duration-300 ${
                        isTopTen
                          ? 'bg-gradient-to-r from-green-50/80 via-emerald-50/60 to-green-50/80 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/40 border-l-4 border-green-500 hover:from-green-100/80 hover:via-emerald-100/60 hover:to-green-100/80 dark:hover:from-green-900/50 dark:hover:via-emerald-900/40 dark:hover:to-green-900/50'
                          : isCurrentUserRow
                          ? 'bg-green-50 dark:bg-green-950'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      } ${
                        isTopTen ? 'shadow-sm' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="text-3xl mr-2">🥇</span>
                            )}
                            {index === 1 && (
                              <span className="text-3xl mr-2">🥈</span>
                            )}
                            {index === 2 && (
                              <span className="text-3xl mr-2">🥉</span>
                            )}
                            <span className={`text-lg font-bold ${
                              index < 3 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent' 
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}>
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </td>

                    {/* Seller Wallet */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="font-mono text-sm text-zinc-900 dark:text-zinc-50">
                          {truncateWallet(entry.wallet)}
                        </code>
                        {isCurrentUser(entry.wallet) && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Revenue */}
                    <td className="px-6 py-4 text-right">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${entry.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        USDC
                      </div>
                    </td>

                    {/* Sales Count */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 dark:bg-purple-900">
                        <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                          {entry.salesCount}
                        </span>
                      </div>
                    </td>

                    {/* Active Listings */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {entry.activeListings}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/browse?wallet=${entry.wallet}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Listings →
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No Sales Yet
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Be the first to make a sale and claim the top spot!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
            <h3 className="mb-2 text-sm font-bold text-green-900 dark:text-green-100">
              📊 How Rankings Work
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>• Rankings based on <strong>total revenue</strong> from successful sales</li>
              <li>• Updated in real-time as transactions complete</li>
              <li>• Only successful (completed) transactions count toward revenue</li>
              <li>• Your rank is highlighted when you're on the leaderboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardPageContent />;
}

