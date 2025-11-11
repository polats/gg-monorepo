'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Link from 'next/link';

interface Transaction {
  _id: string;
  listingId: string;
  buyerWallet: string;
  deliveryUrl: string;
  amount: number;
  createdAt: Date;
  itemDetails?: {
    title: string;
    category: string;
    type: string;
  };
}

export default function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const { id } = use(params);
  
  const { isConnected, mounted } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mounted && id) {
      fetchDelivery();
    }
  }, [mounted, id]);

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/delivery/${id}`);
      setTransaction(response.data.transaction);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load delivery information');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (transaction?.deliveryUrl) {
      navigator.clipboard.writeText(transaction.deliveryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            {error || 'Delivery Not Found'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            This delivery link may have expired or doesn't exist.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
      <div className="w-full max-w-2xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-4xl">✓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {transaction.itemDetails?.type === 'fundraiser' ? 'Donation Successful!' : 'Purchase Successful!'}
          </h1>
          {transaction.itemDetails && (
            <div className="mt-3">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {transaction.itemDetails.title}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {transaction.itemDetails.type === 'fundraiser' ? '💝' : '📦'} {transaction.itemDetails.category}
                </span>
              </p>
            </div>
          )}
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Thank you for your support
          </p>
        </div>

        {/* Delivery URL Box */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Reward / Thank You Link
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Click the link below or copy it to access your content:
            </p>
          </div>

          {/* URL Display */}
          <div className="mb-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <a
                href={transaction.deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 break-all font-mono text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {transaction.deliveryUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="ml-4 flex-shrink-0 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href={transaction.deliveryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-green-600 py-3 text-center text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Access Now
          </a>
        </div>

        {/* Warning Box */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            ⚠️ Important: Save This Link
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>This link is shown only once</li>
            <li>Save it to a secure location immediately</li>
            <li>Admin recovery is possible but slow (contact support)</li>
            <li>No refunds or replacements for lost links</li>
          </ul>
        </div>

        {/* Transaction Info */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            Transaction Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600 dark:text-zinc-400">Transaction ID:</dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-50">{transaction._id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600 dark:text-zinc-400">Amount:</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">${transaction.amount.toFixed(2)} USDC</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600 dark:text-zinc-400">Date:</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {new Date(transaction.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/browse"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

