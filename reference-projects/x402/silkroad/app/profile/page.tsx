'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
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

interface UserStats {
  totalListings: number;
  activeListings: number;
  totalRevenue: number;
  totalPurchases: number;
  totalSpent: number;
}

function ProfilePageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const { balance: usdcBalance } = useUSDCBalance();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isConnected && hasAcceptedTOS && publicKey) {
      fetchProfileData();
    }
  }, [mounted, isConnected, hasAcceptedTOS, publicKey, activeTab]);

  const fetchProfileData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch transactions
      const txResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: activeTab,
        },
      });

      if (activeTab === 'purchases') {
        setPurchases(txResponse.data.transactions || []);
      } else {
        setSales(txResponse.data.transactions || []);
      }

      // Fetch user stats (listings)
      const listingsResponse = await axios.get('/api/listings', {
        params: {
          wallet: publicKey.toBase58(),
        },
      });

      const listings = listingsResponse.data.listings || [];
      const activeListings = listings.filter((l: any) => l.state === 'on_market' && l.approved).length;
      
      // Calculate total revenue and purchases
      const allPurchasesResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'purchases',
        },
      });
      const allSalesResponse = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'sales',
        },
      });

      const allPurchases = allPurchasesResponse.data.transactions || [];
      const allSales = allSalesResponse.data.transactions || [];

      const totalSpent = allPurchases
        .filter((t: Transaction) => t.status === 'success')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const totalRevenue = allSales
        .filter((t: Transaction) => t.status === 'success')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setStats({
        totalListings: listings.length,
        activeListings,
        totalRevenue,
        totalPurchases: allPurchases.filter((t: Transaction) => t.status === 'success').length,
        totalSpent,
      });

    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected || !hasAcceptedTOS) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You need to connect your wallet and accept TOS to view your profile
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const currentTransactions = activeTab === 'purchases' ? purchases : sales;
  const totalAmount = currentTransactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Profile & Analytics
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 font-mono">
            {publicKey?.toBase58().slice(0, 12)}...{publicKey?.toBase58().slice(-12)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* USDC Balance */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">USDC Balance</span>
              <svg className="h-6 w-6 text-green-600" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#2775CA"/>
              </svg>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              ${usdcBalance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Total Listings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Listings</span>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalListings}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.activeListings} active
            </p>
          </div>

          {/* Total Revenue */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Revenue</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              From sales
            </p>
          </div>

          {/* Total Spent */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Spent</span>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalSpent.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.totalPurchases} purchases
            </p>
          </div>
        </div>

        {/* Token Gating Status */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You don't have enough $SRx402 tokens. Some features may be restricted.
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'purchases'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              My Purchases
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'sales'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              My Sales
            </button>
          </div>

          {/* Tab Stats */}
          {!loading && currentTransactions.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-6 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {currentTransactions.filter(t => t.status === 'success').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {activeTab === 'purchases' ? 'Spent' : 'Earned'}
                </p>
                <p className={`text-2xl font-bold ${
                  activeTab === 'purchases' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Average</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${currentTransactions.filter(t => t.status === 'success').length > 0 
                    ? (totalAmount / currentTransactions.filter(t => t.status === 'success').length).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* No Transactions */}
          {!loading && !error && currentTransactions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                No {activeTab} yet
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                {activeTab === 'purchases' 
                  ? 'Browse listings to make your first purchase' 
                  : 'Create a listing to start selling'}
              </p>
              <Link
                href={activeTab === 'purchases' ? '/browse' : '/listings/new'}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                {activeTab === 'purchases' ? 'Browse Listings' : 'Create Listing'}
              </Link>
            </div>
          )}

          {/* Transactions List */}
          {!loading && !error && currentTransactions.length > 0 && (
            <div className="p-6 space-y-3">
              {activeTab === 'purchases' && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Delivery URLs are only shown once at purchase time
                </div>
              )}

              {currentTransactions.map((tx) => (
                <div 
                  key={tx._id}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {tx.listingTitle}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {tx.listingCategory} • {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-lg font-bold ${
                        activeTab === 'purchases'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        ${tx.amount.toFixed(2)}
                      </p>
                      {tx.status === 'success' ? (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Success</span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400">✗ Failed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                      {activeTab === 'purchases' ? 'Seller' : 'Buyer'}: {
                        activeTab === 'purchases' 
                          ? `${tx.sellerWallet.slice(0, 4)}...${tx.sellerWallet.slice(-4)}`
                          : `${tx.buyerWallet.slice(0, 4)}...${tx.buyerWallet.slice(-4)}`
                      }
                    </span>
                    <a
                      href={`https://solscan.io/tx/${tx.txnHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 font-mono"
                    >
                      {tx.txnHash.slice(0, 8)}... ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedContent>
      <ProfilePageContent />
    </ProtectedContent>
  );
}

