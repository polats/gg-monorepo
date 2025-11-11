'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { publicKey } = useWallet();
  const { balance, loading } = useUSDCBalance();
  const activeUsers = useActiveUsers();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-orange-900/30 bg-gradient-to-r from-black via-orange-900/60 to-black backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button - Always show */}
          {mounted && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-orange-200 hover:bg-orange-900/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-2xl">🦃</span>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-orange-100">
              SilkRoad<span className="text-green-500">x402</span>
            </div>
          </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Market, Fundraisers & Leaderboard - Always visible */}
          <Link 
            href="/browse" 
            className="text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors"
          >
            Market
          </Link>
          <Link 
            href="/fundraisers" 
            className="text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors"
          >
            Fundraisers
          </Link>
          <Link 
            href="/leaderboard" 
            className="text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors flex items-center gap-1"
          >
            <span>🏆</span>
            Leaderboard
          </Link>
          
          {/* Sell & My Listings - Only when wallet connected */}
          {publicKey && (
            <>
              <Link 
                href="/sell" 
                className="text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors"
              >
                Sell
              </Link>
              <Link 
                href="/my-listings" 
                className="text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors"
              >
                My Listings
              </Link>
            </>
          )}
        </div>

          {/* Right Side: Active Users + USDC Balance + Profile + Wallet Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Users Counter - Hidden on mobile (shown in hamburger menu) */}
            {mounted && (
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-orange-700/50 bg-black/40 px-2 sm:px-3 py-2">
                <span className="text-green-500 text-xs sm:text-sm">🟢</span>
                <span className="text-xs sm:text-sm font-semibold text-orange-100">
                  {activeUsers}
                </span>
                <span className="hidden sm:inline text-xs text-orange-200">
                  online
                </span>
              </div>
            )}

            {/* USDC Balance - Hidden on mobile when connected */}
            {mounted && publicKey && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-orange-700/50 bg-black/40 px-3 py-2">
                <svg 
                  className="h-5 w-5 text-blue-600" 
                  viewBox="0 0 40 40" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="20" r="20" fill="#2775CA"/>
                  <path d="M24.5 17.5C24.5 15.567 22.933 14 21 14H16V21H21C22.933 21 24.5 19.433 24.5 17.5Z" fill="white"/>
                  <path d="M21 23H16V26H21C22.933 26 24.5 24.433 24.5 22.5C24.5 21.567 22.933 23 21 23Z" fill="white"/>
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs text-orange-300">USDC</span>
                  {loading ? (
                    <span className="text-sm font-semibold text-orange-100">
                      Loading...
                    </span>
                  ) : balance !== null ? (
                    <span className="text-sm font-semibold text-orange-100">
                      ${balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-orange-200">
                      --
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Profile Button - Icon only on mobile */}
            {mounted && publicKey && (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-orange-700/50 bg-black/40 px-2 sm:px-3 py-2 hover:bg-orange-900/50 transition-colors"
                title="View Profile & Analytics"
              >
                <svg className="h-5 w-5 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Wallet Button - Compact on mobile */}
            {mounted && (
              <WalletMultiButton className="!bg-green-600 hover:!bg-green-700 !rounded-lg !h-10 !px-3 sm:!px-4 !text-xs sm:!text-sm !font-medium transition-colors" />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mounted && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-white dark:bg-zinc-900 md:hidden overflow-y-auto">
            <div className="flex flex-col p-6 space-y-6">
              {/* Active Users on Mobile - Always visible */}
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800">
                <span className="text-2xl">🟢</span>
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Active Users</span>
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {activeUsers} online
                  </span>
                </div>
              </div>

              {/* USDC Balance on Mobile - Only show when wallet connected */}
              {publicKey && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800">
                <svg 
                  className="h-6 w-6 text-blue-600" 
                  viewBox="0 0 40 40" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="20" r="20" fill="#2775CA"/>
                  <path d="M24.5 17.5C24.5 15.567 22.933 14 21 14H16V21H21C22.933 21 24.5 19.433 24.5 17.5Z" fill="white"/>
                  <path d="M21 23H16V26H21C22.933 26 24.5 24.433 24.5 22.5C24.5 21.567 22.933 23 21 23Z" fill="white"/>
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">USDC Balance</span>
                  {loading ? (
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Loading...
                    </span>
                  ) : balance !== null ? (
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      ${balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                      --
                    </span>
                  )}
                </div>
              </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-2">
                {/* Market, Fundraisers & Leaderboard - Always visible */}
                <Link 
                  href="/browse" 
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    pathname === '/browse'
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Market
                </Link>

                <Link 
                  href="/fundraisers" 
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    pathname === '/fundraisers' || pathname?.startsWith('/fundraisers/')
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-xl">💝</span>
                  Fundraisers
                </Link>

                <Link 
                  href="/leaderboard" 
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    pathname === '/leaderboard'
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-xl">🏆</span>
                  Leaderboard
                </Link>

                {/* Sell, My Listings, Profile - Only when wallet connected */}
                {publicKey && (
                  <>
                    <Link 
                      href="/sell" 
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        pathname === '/sell'
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      List Product
                    </Link>

                    <Link 
                      href="/my-listings" 
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        pathname === '/my-listings'
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      My Listings
                    </Link>

                    <Link 
                      href="/profile" 
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        pathname === '/profile'
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile & Analytics
                    </Link>
                  </>
                )}
              </nav>

              {/* Footer Links in Mobile Menu */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/faq" 
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-base">❓</span>
                    FAQ
                  </Link>

                  <Link 
                    href="/updates" 
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-base">📋</span>
                    Updates
                  </Link>

                  <a 
                    href="https://silk-roadx402.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-base">📄</span>
                    Whitepaper
                  </a>

                  <a 
                    href="https://github.com/Tanner253?tab=repositories" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-base">💻</span>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

