'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';

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

function SalesPageContent() {
  const { publicKey } = useWallet();
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      fetchSales();
    }
  }, [publicKey]);

  const fetchSales = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'sales',
        },
      });

      setSales(response.data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.response?.data?.error || 'Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales
    .filter(s => s.status === 'success')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            💰 Sales History
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Track your sales and revenue
          </p>
        </div>

        {/* Stats */}
        {!loading && sales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {sales.filter(s => s.status === 'success').length}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Avg Sale</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${sales.length > 0 ? (totalRevenue / sales.filter(s => s.status === 'success').length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* No Sales */}
        {!loading && !error && sales.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No sales yet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
              Create a listing to start selling
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        )}

        {/* Sales Table */}
        {!loading && !error && sales.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
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
                      Buyer
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
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {sale.listingTitle}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {sale.listingCategory}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        {sale.buyerWallet.slice(0, 4)}...{sale.buyerWallet.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ${sale.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.status === 'success' ? (
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
                          href={`https://solscan.io/tx/${sale.txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                        >
                          {sale.txnHash.slice(0, 8)}...
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

export default function SalesPage() {
  return (
    <ProtectedContent>
      <SalesPageContent />
    </ProtectedContent>
  );
}

