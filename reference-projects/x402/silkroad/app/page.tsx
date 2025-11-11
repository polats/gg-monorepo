'use client';

import { useAuth } from '@/hooks/useAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { FallingLeavesCSS } from '@/components/effects/FallingLeavesCSS';

export default function Home() {
  const { 
    isConnected, 
    hasAcceptedTOS, 
    isTokenGated, 
    isLoading, 
    error,
    mounted,
  } = useAuth();

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <FallingLeavesCSS />
      {/* Homepage */}
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4 py-12 relative z-10">
        <div className="w-full max-w-4xl text-center">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
              Anonymous Digital Marketplace
          </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Peer-to-peer marketplace for private commerce using{' '}
              <span className="font-semibold text-green-600">x402 micropayments</span> on Solana.
              No KYC. No middlemen. Just freedom.
            </p>
          </div>

          {/* 0% Fees Banner */}
          <div className="mb-8 rounded-2xl border-2 border-green-500 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-950 dark:via-emerald-950 dark:to-green-950 p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl">💰</span>
                <div className="text-left">
                  <h3 className="text-3xl font-black text-green-600 dark:text-green-400">
                    0% FEES
                  </h3>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    100% Direct P2P
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-zinc-400">|</div>
              <p className="text-center sm:text-left text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                <span className="font-bold text-zinc-900 dark:text-zinc-50">No platform fees.</span> Sellers keep <span className="text-green-600 dark:text-green-400 font-bold">100%</span> of every sale. Payments go straight from buyer to seller via Solana USDC.
              </p>
            </div>
          </div>

          {/* Status Cards */}
          {isConnected ? (
            <div className="mb-8 space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Checking authentication...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
              )}

              {/* Success State */}
              {!isLoading && hasAcceptedTOS && (
                <div className="space-y-4">
                  {/* Token Gating Status */}
                  <div className={`rounded-lg border p-6 shadow-sm ${
                    isTokenGated
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
                  }`}>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">{isTokenGated ? '✅' : '⚠️'}</span>
                      <p className={`text-sm font-medium ${
                        isTokenGated 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {isTokenGated 
                          ? 'Token Gating Passed - Full Access Granted' 
                          : 'Insufficient $SRx402 Balance - Restricted Access'}
                      </p>
                    </div>
                    {!isTokenGated && (
                      <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        You need ≥50,000 $SRx402 tokens for full platform access
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link
                      href="/browse"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-500"
                    >
                      <div className="text-3xl mb-2">🔍</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Browse</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Explore listings</p>
                    </Link>

                    <Link
                      href="/sell"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-500"
                    >
                      <div className="text-3xl mb-2">💼</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sell</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">List your products</p>
                    </Link>

                    <Link
                      href="/my-listings"
                      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-500"
                    >
                      <div className="text-3xl mb-2">📦</div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Listings</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your products</p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Disconnected State
            <div className="mb-8">
              <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Connect Your Wallet
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Connect your Solana wallet to get started. You'll need Phantom installed.
                  </p>
                </div>
                <WalletMultiButton className="!bg-green-600 hover:!bg-green-700 !rounded-lg !h-12 !w-full !text-base !font-medium transition-colors" />
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">🕵️</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Anonymous</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No KYC, no emails. Your wallet is your identity.
              </p>
            </div>


            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">💰</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">0% Platform Fees</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sellers keep 100% of every sale. Direct P2P payments via USDC.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl mb-3">🪙</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Token Gated</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Hold ≥50k $SRx402 tokens for full access.
          </p>
        </div>
          </div>
        </div>
    </div>
    </>
  );
}
