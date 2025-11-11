'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';

interface Transaction {
  _id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  txnHash: string;
  status: 'success' | 'failed';
  createdAt: string;
}

function PurchasesPageContent() {
  const { publicKey } = useWallet();
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      fetchPurchases();
    }
  }, [publicKey]);

  const fetchPurchases = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'purchases',
        },
      });

      setPurchases(response.data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching purchases:', err);
      setError(err.response?.data?.error || 'Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = purchases
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumbs */}
        <Breadcrumbs />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            🛒 Purchase History
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            View all your software purchases
          </p>
        </div>

        {/* Stats */}
        {!loading && purchases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Purchases</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {purchases.filter(p => p.status === 'success').length}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Spent</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${totalSpent.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Avg Purchase</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                ${purchases.length > 0 ? (totalSpent / purchases.filter(p => p.status === 'success').length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <TableSkeleton rows={5} cols={6} />
          </>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* No Purchases */}
        {!loading && !error && purchases.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No purchases yet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
              Browse our marketplace to find software
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        )}

        {/* Purchases Table */}
        {!loading && !error && purchases.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {/* Warning about delivery URLs */}
            <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-900 px-6 py-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Important:</strong> Delivery URLs are only shown once at purchase time. 
                Make sure you saved them! They are not stored for recovery.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {purchase.listingTitle}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {purchase.listingCategory}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        {purchase.sellerWallet.slice(0, 4)}...{purchase.sellerWallet.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ${purchase.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.status === 'success' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://solscan.io/tx/${purchase.txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-mono transition-colors"
                        >
                          <span>{purchase.txnHash.slice(0, 8)}...</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <ProtectedContent>
      <PurchasesPageContent />
    </ProtectedContent>
  );
}

