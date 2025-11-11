'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

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

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && publicKey) {
      fetchTransactions();
    }
  }, [isOpen, publicKey, activeTab]);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: activeTab,
        },
      });

      if (activeTab === 'purchases') {
        setPurchases(response.data.transactions || []);
      } else {
        setSales(response.data.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentTransactions = activeTab === 'purchases' ? purchases : sales;
  const totalAmount = currentTransactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      style={{ marginTop: activeTab === 'sales' ? '350px' : '250px' }}
    >
      {/* Modal */}
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Transaction History</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mt-1">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'purchases'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Purchases
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Sales
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto flex-1">
          {/* Stats */}
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
                    ? 'text-blue-600 dark:text-blue-400' 
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
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
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                {activeTab === 'purchases' 
                  ? 'Browse listings to make your first purchase' 
                  : 'Create a listing to start selling'}
              </p>
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
                  className="p-4 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
                          ? 'text-blue-600 dark:text-blue-400'
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

