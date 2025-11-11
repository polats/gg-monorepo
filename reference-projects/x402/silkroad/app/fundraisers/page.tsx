'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

interface Fundraiser {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  goalAmount?: number;
  raisedAmount?: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  pinned?: boolean;
  pinnedAt?: Date;
  views?: number;
}

function FundraisersPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();
  
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideMyFundraisers, setHideMyFundraisers] = useState(false);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pre-fill wallet search from URL params
  useEffect(() => {
    const walletParam = searchParams.get('wallet');
    if (walletParam) {
      setWalletSearch(walletParam);
      setHideMyFundraisers(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted) {
      fetchFundraisers();
    }
  }, [mounted]);

  const fetchFundraisers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/fundraisers');
      setFundraisers(response.data.fundraisers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load fundraisers');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const categories = [
    { id: 'all', label: 'All Fundraisers', icon: '💝', count: fundraisers.length },
    { id: 'Medical', label: 'Medical', icon: '🏥', count: fundraisers.filter(f => f.category === 'Medical').length },
    { id: 'Education', label: 'Education', icon: '📚', count: fundraisers.filter(f => f.category === 'Education').length },
    { id: 'Community', label: 'Community', icon: '🤝', count: fundraisers.filter(f => f.category === 'Community').length },
    { id: 'Emergency', label: 'Emergency', icon: '🚨', count: fundraisers.filter(f => f.category === 'Emergency').length },
    { id: 'Animal Welfare', label: 'Animal Welfare', icon: '🐾', count: fundraisers.filter(f => f.category === 'Animal Welfare').length },
    { id: 'Environmental', label: 'Environmental', icon: '🌍', count: fundraisers.filter(f => f.category === 'Environmental').length },
    { id: 'Arts & Culture', label: 'Arts & Culture', icon: '🎭', count: fundraisers.filter(f => f.category === 'Arts & Culture').length },
    { id: 'Technology', label: 'Technology', icon: '💻', count: fundraisers.filter(f => f.category === 'Technology').length },
    { id: 'Sports', label: 'Sports', icon: '⚽', count: fundraisers.filter(f => f.category === 'Sports').length },
    { id: 'Religious', label: 'Religious', icon: '🙏', count: fundraisers.filter(f => f.category === 'Religious').length },
    { id: 'Memorial', label: 'Memorial', icon: '🕯️', count: fundraisers.filter(f => f.category === 'Memorial').length },
    { id: 'Business', label: 'Business', icon: '💼', count: fundraisers.filter(f => f.category === 'Business').length },
    { id: 'Personal', label: 'Personal', icon: '👤', count: fundraisers.filter(f => f.category === 'Personal').length },
    { id: 'Other', label: 'Other', icon: '⚡', count: fundraisers.filter(f => f.category === 'Other').length },
  ];
  
  // Filter by category
  let filteredFundraisers = selectedCategory === 'all' 
    ? fundraisers 
    : fundraisers.filter(f => f.category === selectedCategory);
  
  // Filter out user's own fundraisers if toggle is enabled
  if (hideMyFundraisers && publicKey) {
    filteredFundraisers = filteredFundraisers.filter(f => f.wallet !== publicKey.toBase58());
  }
  
  // Filter by wallet search
  if (walletSearch.trim()) {
    filteredFundraisers = filteredFundraisers.filter(f => 
      f.wallet.toLowerCase().includes(walletSearch.toLowerCase().trim())
    );
  }

  // Utility to truncate wallet address
  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-6 px-4 pb-20 relative">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            💝 Browse Fundraisers
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Support anonymous fundraising campaigns using crypto
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>👀 Browse Mode:</strong> Connect your wallet to donate or create fundraisers.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Action Required:</strong> Accept TOS to interact with fundraisers.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>👀 Browse Mode:</strong> Need 50,000 $SRx402 tokens to donate/create.
            </p>
          </div>
        ) : null}

        {/* Mobile Category Filter - Horizontal Scroll */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <span>{category.icon}</span>
                  {sidebarOpen && <span>{category.label}</span>}
                  {category.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-700'
                    }`}>
                      {category.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex gap-6 pb-20">
          {/* Sidebar - Desktop Only */}
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'}`}>
            <div className="sticky top-4 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden max-h-[calc(100vh-8rem)]">
              {/* Sidebar Header */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between flex-shrink-0">
                {sidebarOpen && (
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    Categories
                  </h3>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? (
                    <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Category Menu */}
              <div className="overflow-y-auto p-2 flex-1" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
                <nav className="space-y-1">
                  {categories.map((category) => {
                    const isActive = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? 'bg-green-500 text-white shadow-md'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{category.icon}</span>
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-sm font-medium truncate">
                              {category.label}
                            </span>
                            {category.count > 0 && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                isActive ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'
                              }`}>
                                {category.count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full lg:w-auto">
            {/* Toolbar */}
            <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Left: Search */}
                <div className="flex-1 w-full md:max-w-md">
                  <input
                    type="text"
                    placeholder="🔍 Search by organizer wallet..."
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
                  />
                </div>

                {/* Right: View & Hide toggles */}
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-green-600 text-white'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                      title="Grid view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-green-600 text-white'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                      title="List view"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Hide My Fundraisers Toggle */}
                  {publicKey && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideMyFundraisers}
                        onChange={(e) => setHideMyFundraisers(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-green-600 relative"></div>
                      <span className="ms-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden sm:inline">
                        Hide mine
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{filteredFundraisers.length}</span> {filteredFundraisers.length === 1 ? 'fundraiser' : 'fundraisers'} found
                  {selectedCategory !== 'all' && <span> in <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong></span>}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
              </div>
            )}

            {/* Fundraisers Display */}
            {!loading && !error && (
              <>
            {filteredFundraisers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 text-6xl">💝</div>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">No fundraisers found in this category</p>
                {isTokenGated && (
                  <Link
                    href="/fundraisers/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    <span>💝</span>
                    Be the first to create a fundraiser here!
                  </Link>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFundraisers.map((fundraiser) => (
                  <div
                    key={fundraiser._id}
                    className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={fundraiser.imageUrl}
                        alt={fundraiser.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {fundraiser.pinned === true && (
                        <div className="absolute top-2 left-2 rounded-full bg-yellow-500 px-3 py-1 text-xs font-medium text-white shadow-lg animate-pulse">
                          📌 Featured
                        </div>
                      )}
                      {fundraiser.riskLevel === 'high-risk' && (
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                          High Risk
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                          {fundraiser.title}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {fundraiser.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          <span className="font-medium">${(fundraiser.raisedAmount || 0).toFixed(2)} raised</span>
                          <span>of ${(fundraiser.goalAmount || fundraiser.price).toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                            style={{ width: `${Math.min(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                          {Math.round(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100)}% funded
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Link
                          href={`/fundraisers/${fundraiser._id}`}
                          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                        >
                          💝 Donate Now
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {fundraiser.category}
                        </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                            👁️ {fundraiser.views || 0}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {truncateWallet(fundraiser.wallet)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Progress Bar - Visual indicator at card bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.min(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100, 100)}%` }}
                        title={`${Math.round(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100)}% funded`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-1">
                {filteredFundraisers.map((fundraiser) => (
                  <Link
                    key={fundraiser._id}
                    href={`/fundraisers/${fundraiser._id}`}
                    className="group block"
                  >
                    <div className="relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 transition-all hover:border-purple-500 hover:bg-purple-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-purple-500 dark:hover:bg-purple-950/30 overflow-hidden">
                      {/* Background Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-700">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                          style={{ width: `${Math.min(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100, 100)}%` }}
                        />
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {fundraiser.pinned === true && (
                          <span className="text-sm" title="Featured">📌</span>
                        )}
                        {fundraiser.riskLevel === 'high-risk' && (
                          <span className="text-sm" title="High Risk">⚠️</span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {fundraiser.title}
                        </h3>
                      </div>

                      {/* Progress Amount (Mobile & Up) */}
                      <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium flex-shrink-0">
                        <span className="hidden sm:inline">${(fundraiser.raisedAmount || 0).toFixed(0)}</span>
                        <span className="hidden sm:inline text-zinc-400">/</span>
                        <span className="hidden sm:inline">${(fundraiser.goalAmount || fundraiser.price).toFixed(0)}</span>
                      </div>

                      {/* Category */}
                      <span className="hidden md:inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex-shrink-0">
                        {fundraiser.category}
                      </span>

                      {/* Organizer */}
                      <span className="hidden lg:block text-xs text-zinc-500 dark:text-zinc-400 font-mono flex-shrink-0">
                        {truncateWallet(fundraiser.wallet)}
                      </span>

                      {/* Views */}
                      <span className="hidden xl:flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                        👁️ {fundraiser.views || 0}
                      </span>

                      {/* Percentage */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                          {Math.round(((fundraiser.raisedAmount || 0) / (fundraiser.goalAmount || fundraiser.price)) * 100)}%
                        </span>
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FundraisersPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black relative">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <FundraisersPageContent />
    </Suspense>
  );
}

