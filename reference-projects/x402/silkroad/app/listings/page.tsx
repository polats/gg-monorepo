'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  pinned?: boolean;
  pinnedAt?: Date;
}

function ListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideMyListings, setHideMyListings] = useState(true);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (mounted) {
      fetchListings();
    }
  }, [mounted]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/listings');
      setListings(response.data.listings || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const categories = [
    { id: 'all', label: 'All Listings', icon: '🛍️', count: listings.length },
    { id: 'Trading Bot', label: 'Trading Bots', icon: '🤖', count: listings.filter(l => l.category === 'Trading Bot').length },
    { id: 'API Tool', label: 'API Tools', icon: '🔌', count: listings.filter(l => l.category === 'API Tool').length },
    { id: 'Script', label: 'Scripts', icon: '📜', count: listings.filter(l => l.category === 'Script').length },
    { id: 'Jobs/Services', label: 'Jobs & Services', icon: '💼', count: listings.filter(l => l.category === 'Jobs/Services').length },
    { id: 'Music', label: 'Music', icon: '🎵', count: listings.filter(l => l.category === 'Music').length },
    { id: 'Games', label: 'Games', icon: '🎮', count: listings.filter(l => l.category === 'Games').length },
    { id: 'Mods', label: 'Mods', icon: '🔧', count: listings.filter(l => l.category === 'Mods').length },
    { id: 'Private Access', label: 'Private Access', icon: '🔐', count: listings.filter(l => l.category === 'Private Access').length },
    { id: 'Call Groups', label: 'Call Groups', icon: '📞', count: listings.filter(l => l.category === 'Call Groups').length },
    { id: 'Raid Services', label: 'Raid Services', icon: '⚔️', count: listings.filter(l => l.category === 'Raid Services').length },
    { id: 'Telegram Groups', label: 'Telegram Groups', icon: '✈️', count: listings.filter(l => l.category === 'Telegram Groups').length },
    { id: 'Discord Services', label: 'Discord Services', icon: '💬', count: listings.filter(l => l.category === 'Discord Services').length },
    { id: 'Art & Design', label: 'Art & Design', icon: '🎨', count: listings.filter(l => l.category === 'Art & Design').length },
    { id: 'Video Content', label: 'Video Content', icon: '🎬', count: listings.filter(l => l.category === 'Video Content').length },
    { id: 'Courses & Tutorials', label: 'Courses & Tutorials', icon: '📚', count: listings.filter(l => l.category === 'Courses & Tutorials').length },
    { id: 'Data & Analytics', label: 'Data & Analytics', icon: '📊', count: listings.filter(l => l.category === 'Data & Analytics').length },
    { id: 'Marketing Tools', label: 'Marketing Tools', icon: '📈', count: listings.filter(l => l.category === 'Marketing Tools').length },
    { id: 'Social Media', label: 'Social Media', icon: '📱', count: listings.filter(l => l.category === 'Social Media').length },
    { id: 'NFT Tools', label: 'NFT Tools', icon: '🖼️', count: listings.filter(l => l.category === 'NFT Tools').length },
    { id: 'Custom', label: 'Custom', icon: '⚡', count: listings.filter(l => l.category === 'Custom').length },
  ];
  
  // Filter by category
  let filteredListings = selectedCategory === 'all' 
    ? listings 
    : listings.filter(l => l.category === selectedCategory);
  
  // Filter out user's own listings if toggle is enabled
  if (hideMyListings && publicKey) {
    filteredListings = filteredListings.filter(l => l.wallet !== publicKey.toBase58());
  }
  
  // Filter by wallet search
  if (walletSearch.trim()) {
    filteredListings = filteredListings.filter(l => 
      l.wallet.toLowerCase().includes(walletSearch.toLowerCase().trim())
    );
  }

  // Utility to truncate wallet address
  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-6 px-4 relative">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            🛍️ Browse Marketplace
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Discover software, services, content, and more
          </p>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>👀 Browse Mode:</strong> Connect your wallet to purchase or create listings.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Action Required:</strong> Accept TOS to interact with the marketplace.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>👀 Browse Mode:</strong> Need 50,000 $SRx402 tokens to purchase/create.
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
                    placeholder="🔍 Search by vendor wallet..."
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

                  {/* Hide My Listings Toggle */}
                  {publicKey && (
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideMyListings}
                        onChange={(e) => setHideMyListings(e.target.checked)}
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
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{filteredListings.length}</span> {filteredListings.length === 1 ? 'listing' : 'listings'} found
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

            {/* Listings Display */}
            {!loading && !error && (
              <>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">No listings found in this category</p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {listing.riskLevel === 'high-risk' && (
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                          High Risk
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                          {listing.title}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">Price</span>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            ${listing.price.toFixed(2)} USDC
                          </p>
                        </div>

                        <Link
                          href={`/listings/${listing._id}`}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {listing.category}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {truncateWallet(listing.wallet)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View - Forum Style
              <div className="space-y-1">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing._id}
                    href={`/listings/${listing._id}`}
                    className="group block"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 transition-all hover:border-green-500 hover:bg-green-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-500 dark:hover:bg-green-950/30 max-h-[50px]">
                      {/* Status Badge */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {listing.riskLevel === 'high-risk' && (
                          <span className="text-sm" title="High Risk">⚠️</span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-green-600 dark:group-hover:text-green-400">
                          {listing.title}
                        </h3>
                      </div>

                      {/* Category */}
                      <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex-shrink-0">
                        {listing.category}
                      </span>

                      {/* Vendor */}
                      <span className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400 font-mono flex-shrink-0">
                        {truncateWallet(listing.wallet)}
                      </span>

                      {/* Price */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          ${listing.price.toFixed(2)}
                        </span>
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default function ListingsPage() {
  return <ListingsPageContent />;
}

