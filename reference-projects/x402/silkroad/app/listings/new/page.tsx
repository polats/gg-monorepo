'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

function NewListingPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const router = useRouter();

  const [listingType, setListingType] = useState<'market' | 'fundraiser'>('market');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Trading Bot',
    imageUrl: '',
    deliveryUrl: '',  // REQUIRED: Download link for buyers
    demoVideoUrl: '',  // Optional
    whitepaperUrl: '',  // Optional
    githubUrl: '',  // Optional
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Image must be JPEG, PNG, or WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);

    // Auto-upload image
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // Include wallet for rate limiting
      const wallet = publicKey?.toBase58() || '';
      const uploadUrl = `/api/upload/image${wallet ? `?wallet=${wallet}` : ''}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload image';
      setError(errorMsg);
      
      // Show rate limit info if available
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        }
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('🚀 Form submitted', { formData, listingType });

    // Validation
    console.log('✅ Validating title...');
    if (formData.title.length < 5 || formData.title.length > 100) {
      setError('Title must be 5-100 characters');
      console.error('❌ Title validation failed');
      return;
    }

    console.log('✅ Validating description...');
    if (formData.description.length < 50 || formData.description.length > 2000) {
      setError('Description must be 50-2000 characters');
      console.error('❌ Description validation failed');
      return;
    }

    console.log('✅ Validating price...');
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.10) {
      setError('Price must be at least $0.10 USDC');
      console.error('❌ Price validation failed');
      return;
    }

    console.log('✅ Image is optional, skipping validation...');

    console.log('✅ Validating delivery URL...');
    if (!formData.deliveryUrl) {
      setError('Delivery URL is required (the download link buyers will receive)');
      console.error('❌ Delivery URL validation failed');
      return;
    }

    console.log('✅ Validating category...');
    if (!formData.category) {
      setError('Please select a category');
      console.error('❌ Category validation failed');
      return;
    }

    console.log('✅ Validating wallet...');
    if (!publicKey) {
      setError('Wallet not connected');
      console.error('❌ Wallet validation failed');
      return;
    }

    console.log('✅ All validations passed!');

    try {
      setLoading(true);

      // ====================================
      // VALIDATE: Check if seller has USDC account
      // ====================================
      try {
        console.log('🔍 Validating seller can receive USDC payments...');
        
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // USDC mainnet mint
        const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        
        // Get seller's USDC token account
        const sellerUsdcAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey
        );
        
        console.log(`📤 Checking USDC account: ${sellerUsdcAccount.toBase58()}`);
        
        // Check if account exists
        const accountInfo = await connection.getAccountInfo(sellerUsdcAccount);
        
        if (!accountInfo) {
          console.error('❌ Seller does not have a USDC token account');
          setError(
            '❌ Your wallet cannot receive USDC payments. You need to create a USDC token account first. ' +
            'Solution: Open Phantom wallet → Add a small amount of USDC (even $0.01) to create your account, ' +
            'or use a different wallet like Phantom that automatically creates token accounts. ' +
            'This is a one-time setup to enable receiving payments.'
          );
          setLoading(false);
          return;
        }
        
        console.log('✅ Seller has a valid USDC account');
      } catch (rpcError: any) {
        console.error('⚠️ USDC validation failed, but continuing:', rpcError);
        // Continue anyway - let the backend handle this
      }

      // ====================================
      // CREATE LISTING OR FUNDRAISER
      // ====================================
      const endpoint = listingType === 'fundraiser' ? '/api/fundraisers' : '/api/listings';
      
      console.log('📤 Sending request to:', endpoint);
      console.log('📦 Payload:', {
        wallet: publicKey.toBase58(),
        title: formData.title,
        description: formData.description,
        price,
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryUrl: formData.deliveryUrl,
        demoVideoUrl: formData.demoVideoUrl || undefined,
        whitepaperUrl: formData.whitepaperUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      });
      
      const response = await axios.post(endpoint, {
        wallet: publicKey.toBase58(),
        title: formData.title,
        description: formData.description,
        price,
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryUrl: formData.deliveryUrl,
        demoVideoUrl: formData.demoVideoUrl || undefined,
        whitepaperUrl: formData.whitepaperUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      });

      console.log('✅ Response received:', response.data);

      // Redirect to my-listings
      console.log('🔄 Redirecting to /listings/my');
      router.push('/listings/my');
    } catch (err: any) {
      console.error('❌ Failed to create listing:', err);
      const errorMsg = err.response?.data?.error || 'Failed to create listing';
      setError(errorMsg);

      // Show additional info for rate limits (429 status)
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        const currentCount = err.response?.data?.currentCount;
        const limit = err.response?.data?.limit;

        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        } else if (currentCount !== undefined && limit !== undefined) {
          setError(`${errorMsg} (${currentCount}/${limit} listings)`);
        }
      }
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
            You need to connect your wallet and accept TOS to create listings
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {listingType === 'fundraiser' ? 'Create Fundraiser' : 'List Your Product'}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {listingType === 'fundraiser' ? 'Start a fundraising campaign' : 'Create a new listing for the marketplace'}
          </p>
        </div>

        {/* Listing Type Selector */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <label className="mb-3 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Listing Type <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setListingType('market');
                setFormData(prev => ({ ...prev, category: 'Trading Bot' }));
              }}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                listingType === 'market'
                  ? 'border-green-600 bg-green-50 dark:bg-green-950'
                  : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              <span className="text-4xl">🏪</span>
              <div className="text-center">
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Market Item
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Sell software, tools, services
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setListingType('fundraiser');
                setFormData(prev => ({ ...prev, category: 'Medical' }));
              }}
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                listingType === 'fundraiser'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950'
                  : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              <span className="text-4xl">💝</span>
              <div className="text-center">
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Fundraiser
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Raise funds for a cause
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Token Gating Warning */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You don't have enough $SRx402 tokens. Listing creation may be restricted.
            </p>
          </div>
        )}

        {/* Critical USDC Account Warning */}
        <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div>
              <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                CRITICAL: USDC Account Required
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>YOU MUST HAVE A USDC ACCOUNT ON YOUR WALLET TO RECEIVE USDC FROM SALES.</strong> If you don't do this, it will error for the buyer in Phantom when they try to purchase.
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                ✅ <strong>Ensure you have a USDC account by transferring at least $0.10 USDC to your wallet before listing.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Delivery URL Info */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Important: Delivery URL Cannot Be Changed
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Once your listing is created, the <strong>delivery URL cannot be edited</strong>. Make sure it's correct before submitting! You can edit all other fields (title, description, price, category, image) later.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Advanced Trading Bot - MEV Arbitrage"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              maxLength={100}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">{formData.title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your software in detail. What does it do? What are the key features? Who is it for?"
              rows={6}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              maxLength={2000}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">{formData.description.length}/2000 characters (min 50)</p>
          </div>

          {/* Price / Goal Amount */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {listingType === 'fundraiser' ? 'Fundraising Goal (USDC)' : 'Price (USDC)'} <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                min={listingType === 'fundraiser' ? '1' : '0.10'}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder={listingType === 'fundraiser' ? '500.00' : '0.00'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 pl-8 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
                required
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {listingType === 'fundraiser' 
                ? 'Your fundraising target amount. Donors can contribute any amount they choose.' 
                : 'Minimum $0.10 USDC'}
            </p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              required
            >
              {listingType === 'market' ? (
                <>
                  <optgroup label="🤖 Software & Tools">
                    <option value="Trading Bot">Trading Bot</option>
                    <option value="API Tool">API Tool</option>
                    <option value="Script">Script</option>
                    <option value="NFT Tools">NFT Tools</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Marketing Tools">Marketing Tools</option>
                  </optgroup>
                  <optgroup label="🎨 Creative Content">
                    <option value="Art & Design">Art & Design</option>
                    <option value="Music">Music</option>
                    <option value="Video Content">Video Content</option>
                  </optgroup>
                  <optgroup label="🎮 Gaming">
                    <option value="Games">Games</option>
                    <option value="Mods">Mods</option>
                  </optgroup>
                  <optgroup label="💼 Services & Access">
                    <option value="Jobs/Services">Jobs/Services</option>
                    <option value="Private Access">Private Access</option>
                    <option value="Call Groups">Call Groups</option>
                    <option value="Courses & Tutorials">Courses & Tutorials</option>
                  </optgroup>
                  <optgroup label="💬 Community Services">
                    <option value="Telegram Groups">Telegram Groups</option>
                    <option value="Discord Services">Discord Services</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Raid Services">Raid Services</option>
                  </optgroup>
                  <optgroup label="⚡ Other">
                    <option value="Custom">Custom</option>
                  </optgroup>
                </>
              ) : (
                <>
                  <option value="Medical">🏥 Medical</option>
                  <option value="Education">📚 Education</option>
                  <option value="Community">🤝 Community</option>
                  <option value="Emergency">🚨 Emergency</option>
                  <option value="Animal Welfare">🐾 Animal Welfare</option>
                  <option value="Environmental">🌍 Environmental</option>
                  <option value="Arts & Culture">🎭 Arts & Culture</option>
                  <option value="Technology">💻 Technology</option>
                  <option value="Sports">⚽ Sports</option>
                  <option value="Religious">🙏 Religious</option>
                  <option value="Memorial">🕯️ Memorial</option>
                  <option value="Business">💼 Business</option>
                  <option value="Personal">👤 Personal</option>
                  <option value="Other">⚡ Other</option>
                </>
              )}
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Product Image (Optional)
            </label>
            <div className="flex items-start space-x-4">
              {imagePreview && (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-700 dark:text-zinc-400"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  JPEG, PNG, or WebP. Max 5MB. Recommended 800x600px
                </p>
                {uploadingImage && (
                  <p className="mt-2 text-sm text-green-600">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Private Delivery URL Section */}
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold flex-shrink-0">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                  Private Delivery URL <span className="text-red-600">*</span>
                </h3>
                <p className="text-xs text-red-800 dark:text-red-200">
                  ⚠️ <strong>ENCRYPTED & PRIVATE:</strong> Only shown to buyers after successful payment. Never displayed publicly.
                </p>
              </div>
            </div>
            
            <input
              type="url"
              value={formData.deliveryUrl}
              onChange={(e) => setFormData({ ...formData, deliveryUrl: e.target.value })}
              placeholder="https://github.com/yourrepo/releases/v1.0.0/software.zip"
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 dark:border-red-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              required
            />
            <p className="mt-2 text-xs text-red-700 dark:text-red-300">
              The download link buyers receive after purchase (GitHub release, Dropbox, Google Drive, etc.)
            </p>
          </div>

          {/* Public Information Section */}
          <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold flex-shrink-0">
                👁️
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-1">
                  Public Resources (Optional)
            </h3>
                <p className="text-xs text-green-800 dark:text-green-200">
                  ✅ <strong>PUBLICLY VISIBLE:</strong> Shown on your listing page to help buyers make informed decisions.
                </p>
              </div>
            </div>

            {/* Demo Video URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                🎥 Demo Video URL (YouTube)
              </label>
              <input
                type="url"
                value={formData.demoVideoUrl}
                onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                YouTube video that will auto-play (muted) on your listing page
              </p>
            </div>

            {/* Whitepaper URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                📄 Whitepaper URL
              </label>
              <input
                type="url"
                value={formData.whitepaperUrl}
                onChange={(e) => setFormData({ ...formData, whitepaperUrl: e.target.value })}
                placeholder="https://docs.google.com/document/..."
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Public technical documentation or whitepaper shown on your listing page
              </p>
            </div>

            {/* GitHub URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                💻 GitHub URL (Public Repo)
              </label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Public GitHub repository link shown on your listing page
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/listings/my"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              onClick={() => console.log('Button clicked', { loading, uploadingImage, formData })}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : uploadingImage ? 'Uploading Image...' : 'Create Listing'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Your listing will be reviewed by admins before going live on the marketplace.
              This usually takes 24-48 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedContent>
      <NewListingPageContent />
    </ProtectedContent>
  );
}

