'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CommentSkeleton } from '@/components/ui/LoadingSkeleton';
import { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface Listing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: string;
  approved: boolean;
  createdAt: Date;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  views?: number;
}

function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const { id } = use(params);
  
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey, signTransaction } = useWallet();
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);

  // Track navigation context from URL params
  const [backUrl, setBackUrl] = useState('/browse');
  
  useEffect(() => {
    // Check if we have a 'from' query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    
    if (from === 'my-listings') {
      setBackUrl('/listings/my');
    } else {
      setBackUrl('/browse');
    }
  }, []);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/listings/${id}`);
      setListing(response.data.listing);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/listings/${id}/comments`);
      setComments(response.data.comments || []);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const incrementViews = async () => {
    try {
      await axios.post(`/api/listings/${id}/view`);
      console.log('✅ View tracked for listing:', id);
    } catch (err) {
      // Silently fail - view tracking is not critical
      console.debug('Failed to track view:', err);
    }
  };

  useEffect(() => {
    if (mounted && id) {
      fetchListing();
      fetchComments();
      incrementViews();
    }
  }, [mounted, id]);

  useEffect(() => {
    if (mounted && id && publicKey) {
      checkPurchaseStatus();
    }
  }, [mounted, id, publicKey]);

  const checkPurchaseStatus = async () => {
    if (!publicKey) return;
    
    try {
      const response = await axios.get('/api/transactions', {
        params: {
          wallet: publicKey.toBase58(),
          type: 'purchases',
        },
      });
      
      const purchases = response.data.transactions || [];
      const purchased = purchases.some((tx: any) => tx.listingId === id && tx.status === 'success');
      setHasPurchased(purchased);
      
      // Check if already commented
      const commented = comments.some((c: any) => c.buyerWallet === publicKey.toBase58());
      setHasCommented(commented);
    } catch (err: any) {
      console.error('Failed to check purchase status:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!publicKey || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await axios.post(`/api/listings/${id}/comments`, {
        wallet: publicKey.toBase58(),
        comment: newComment.trim(),
      });
      
      toast.success('Review submitted successfully!');
      setNewComment('');
      setHasCommented(true);
      
      // Refresh comments
      await fetchComments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit review';
      toast.error(errorMsg);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Utility to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];
    
    // Handle youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) return embedMatch[1];
    
    return null;
  };

  const handleReport = async () => {
    if (!publicKey || !listing) return;

    if (!isConnected || !hasAcceptedTOS) {
      toast.warning('Please connect your wallet and accept TOS first');
      router.push('/');
      return;
    }

    const confirmed = await confirm({
      title: 'Report Listing',
      message: 'Report this listing? This will be reviewed by administrators.',
      confirmLabel: 'Submit Report',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        setReporting(true);
        await axios.post('/api/reports', {
          listingId: listing._id,
          wallet: publicKey.toBase58(),
          reason: reportReason.trim() || undefined,
        });
        toast.success('Report submitted successfully. Thank you for helping keep the marketplace safe!');
        setReportReason('');
        setShowReportForm(false);
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Failed to submit report';
        toast.error(errorMsg);
      } finally {
        setReporting(false);
      }
    }
  };

  const handlePurchase = async () => {
    if (!publicKey || !listing) return;

    if (!isConnected || !hasAcceptedTOS) {
      toast.warning('Please connect your wallet and accept TOS first');
      router.push('/');
      return;
    }

    if (!isTokenGated) {
      toast.warning('You need ≥50k $SRx402 tokens to make purchases');
      return;
    }

    if (!signTransaction) {
      toast.error('Wallet does not support transaction signing');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Purchase',
      message: `Purchase "${listing.title}" for $${listing.price.toFixed(2)} USDC? Payment will be sent directly to the seller.`,
      confirmLabel: 'Purchase Now',
      variant: 'info',
    });

    if (confirmed) {
      try {
        setPurchasing(true);
        setError(null);

        console.log('🛒 Starting x402 purchase flow...');

        // ====================================
        // STEP 1: Get 402 Payment Required
        // ====================================
        console.log('📋 Step 1: Requesting payment requirements...');
        let paymentRequired;
        
        try {
          await axios.post('/api/purchase', {
            listingId: listing._id,
          });
          // If we get here, payment wasn't required (shouldn't happen)
          throw new Error('Expected 402 Payment Required response');
        } catch (err: any) {
          if (err.response?.status === 402) {
            paymentRequired = err.response.data;
            console.log('✅ Got payment requirements:', paymentRequired);
          } else {
            throw err;
          }
        }

        // Extract payment requirements
        const requirements = paymentRequired.accepts[0];
        const amountLamports = parseInt(requirements.maxAmountRequired);
        const sellerWallet = new PublicKey(requirements.payTo);
        const usdcMint = new PublicKey(requirements.asset);
        
        console.log(`💰 Amount: ${amountLamports / 1_000_000} USDC`);
        console.log(`👤 Seller: ${sellerWallet.toBase58()}`);
        console.log(`🪙 Mint: ${usdcMint.toBase58()}`);

        // ====================================
        // STEP 2: Construct SPL Transfer
        // ====================================
        console.log('🔨 Step 2: Constructing USDC transfer transaction...');
        
        // Get RPC connection (devnet or mainnet based on requirements)
        const rpcUrl = requirements.network === 'solana-devnet' 
          ? process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com'
          : process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
        
        const connection = new Connection(rpcUrl, 'confirmed');

        // Get associated token accounts
        const buyerTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey
        );

        const sellerTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          sellerWallet
        );

        console.log(`📥 Buyer token account: ${buyerTokenAccount.toBase58()}`);
        console.log(`📤 Seller token account: ${sellerTokenAccount.toBase58()}`);

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          buyerTokenAccount,
          sellerTokenAccount,
          publicKey,
          amountLamports,
          [],
          TOKEN_PROGRAM_ID
        );

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        transaction.feePayer = publicKey;
        
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        console.log('✅ Transaction constructed');

        // ====================================
        // STEP 3: Sign & Broadcast
        // ====================================
        console.log('✍️  Step 3: Signing transaction with wallet...');
        
        const signed = await signTransaction(transaction);
        
        console.log('📡 Broadcasting transaction...');
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        console.log(`✅ Transaction sent! Signature: ${signature}`);
        console.log(`🔗 View: https://explorer.solana.com/tx/${signature}?cluster=${requirements.network === 'solana-devnet' ? 'devnet' : 'mainnet'}`);

        // Wait for confirmation using polling (avoid WebSocket issues)
        console.log('⏳ Waiting for confirmation...');
        
        let confirmed = false;
        const maxAttempts = 30; // 30 attempts = ~30 seconds
        
        for (let i = 0; i < maxAttempts; i++) {
          try {
            const status = await connection.getSignatureStatus(signature);
            
            if (status?.value?.confirmationStatus === 'confirmed' || 
                status?.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log(`✅ Transaction confirmed! (${status.value.confirmationStatus})`);
              break;
            }
            
            if (status?.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            
            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.warn(`Attempt ${i + 1}/${maxAttempts} - checking status...`);
          }
        }
        
        if (!confirmed) {
          console.warn('⚠️ Could not confirm transaction in time, proceeding anyway...');
          console.warn('   Backend will verify on-chain');
        }

        // ====================================
        // STEP 4: Send Payment to Backend
        // ====================================
        console.log('📨 Step 4: Sending payment proof to backend...');
        
        // Construct payment payload
        const paymentPayload = {
          x402Version: 1,
          scheme: 'exact',
          network: requirements.network,
          payload: {
            signature,
            from: publicKey.toBase58(),
            to: sellerWallet.toBase58(),
            amount: amountLamports.toString(),
            mint: usdcMint.toBase58(),
          },
        };

        // Encode to Base64
        const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

        // Send to backend with X-PAYMENT header
        const finalResponse = await axios.post(
          '/api/purchase',
          { listingId: listing._id },
          {
            headers: {
              'X-PAYMENT': paymentHeader,
            },
          }
        );

        console.log('✅ Backend response received:', finalResponse.data);

        if (finalResponse.data.success && finalResponse.data.transactionId) {
          console.log('🎉 Purchase successful! Transaction ID:', finalResponse.data.transactionId);
          
          // Redirect to delivery page to show the URL
          router.push(`/delivery/${finalResponse.data.transactionId}`);
        } else {
          console.error('❌ No transaction ID in response:', finalResponse.data);
          throw new Error('Purchase succeeded but no transaction ID received');
        }

      } catch (err: any) {
        console.error('❌ Purchase error:', err);
        
        // Handle user rejection gracefully
        if (err.code === 4001 || err.name === 'WalletSignTransactionError' || err.message?.includes('rejected')) {
          console.log('ℹ️ User cancelled transaction');
          setError('Transaction cancelled');
          return; // Don't show toast, user knows they cancelled
        } else if (err.response?.status === 402) {
          setError('Payment verification failed: ' + (err.response.data.error || 'Unknown error'));
          toast.error('Payment verification failed. Please try again.');
        } else {
          const errorMsg = err.response?.data?.error || err.message || 'Purchase failed';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setPurchasing(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            {error || 'Listing Not Found'}
          </h1>
          <Link
            href={backUrl}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            {backUrl === '/listings/my' ? 'Back to My Listings' : 'Back to Browse'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Browse', href: '/browse' },
          { label: listing?.title || 'Loading...', href: undefined },
        ]} />
        
        {/* Back Button */}
        <Link
          href={backUrl}
          className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {backUrl === '/listings/my' ? '← Back to My Listings' : '← Back to Browse'}
        </Link>


        {/* Critical Warning Banner (Toggleable) */}
        {showWarning && (
          <div className="mb-8 rounded-lg border-2 border-red-600 bg-red-50 p-6 dark:border-red-500 dark:bg-red-950">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white text-2xl font-bold flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                  CRITICAL WARNING
                </h2>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 leading-relaxed">
                  DO NOT TRUST VENDORS. DO NOT PURCHASE ANYTHING WITHOUT DOING YOUR RESEARCH. 
                  YOU SHOULD FIND A VENDOR LISTING VIA WALLET DIRECTLY. SHOP AT YOUR OWN RISK.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
            {listing.riskLevel === 'high-risk' && (
              <div className="absolute top-4 right-4 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                ⚠️ High Risk
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-6 relative">
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 mb-3">
                {listing.category}
              </span>
              
              {/* Icon Buttons - Top Right */}
              <div className="absolute top-0 right-0 flex items-center space-x-2">
                {/* Warning Icon */}
                <button
                  onClick={() => setShowWarning(!showWarning)}
                  className="text-2xl hover:scale-110 transition-transform"
                  title={showWarning ? 'Hide Critical Safety Warning' : 'Show Critical Safety Warning'}
                >
                  ⚠️
                </button>
                
                {/* Flag Icon - Greyed Out */}
                <button
                  onClick={() => setShowReportForm(!showReportForm)}
                  className="text-2xl opacity-40 hover:opacity-100 hover:scale-110 transition-all grayscale"
                  title={showReportForm ? 'Close report form' : 'Report this listing'}
                >
                  🚩
                </button>
              </div>

              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 pr-20">
                {listing.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Price & Purchase */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 mb-6">
              <div className="mb-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Price</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${listing.price.toFixed(2)} USDC
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
              )}

              {publicKey && listing.wallet === publicKey.toBase58() ? (
                <div className="w-full rounded-lg bg-zinc-100 border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-600 text-center dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
                  👤 This is your listing
                </div>
              ) : !isConnected || !hasAcceptedTOS ? (
                <Link
                  href="/"
                  className="block w-full rounded-lg bg-green-600 py-3 text-center text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Connect Wallet to Purchase
                </Link>
              ) : !isTokenGated ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ You need ≥50k $SRx402 tokens to make purchases
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full rounded-lg bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {purchasing ? 'Processing...' : 'Purchase Now'}
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>ℹ️ How it works:</strong>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Payment goes directly to the seller (P2P)</li>
                <li>Delivery URL shown immediately after payment</li>
                <li>No refunds or chargebacks (caveat emptor)</li>
                <li>Contact support only for delivery issues</li>
              </ul>
            </div>

            {/* Stats Row - Views & Seller */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {/* Views */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Views</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👁️</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {listing.views?.toLocaleString() || 0}
                  </span>
                </div>
            </div>

            {/* Seller Info */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Seller</div>
              <Link
                href={`/browse?wallet=${listing.wallet}`}
                className="text-xs font-mono text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors block truncate"
                title={listing.wallet}
              >
                {listing.wallet.slice(0, 6)}...{listing.wallet.slice(-4)}
              </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        {listing.demoVideoUrl && getYouTubeVideoId(listing.demoVideoUrl) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              🎥 Demo Video
            </h2>
            <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 h-full w-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(listing.demoVideoUrl)}?autoplay=1&mute=1&rel=0`}
                title="Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Additional Resources Section */}
        {(listing.whitepaperUrl || listing.githubUrl) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              📚 Additional Resources
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {listing.whitepaperUrl && (
                <a
                  href={listing.whitepaperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 hover:border-green-600 hover:bg-green-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-600 dark:hover:bg-green-950"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        Whitepaper
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Read documentation
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-400">→</span>
                </a>
              )}

              {listing.githubUrl && (
                <a
                  href={listing.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 hover:border-green-600 hover:bg-green-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-600 dark:hover:bg-green-950"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <span className="text-xl">💻</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        GitHub
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        View repository
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-400">→</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Report Listing Section (Collapsible) */}
        {showReportForm && (
          <div className="mt-8 rounded-lg border-2 border-red-600 bg-red-50 p-6 dark:border-red-500 dark:bg-red-950 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100 flex items-center">
                <span className="text-xl mr-2">🚨</span>
                Report This Listing
              </h3>
              <button
                onClick={() => setShowReportForm(false)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold"
                title="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              Found a problem? Report this listing if it contains malware, scams, or violates our terms.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Optional: Describe the issue (max 100 characters)"
              maxLength={100}
              rows={2}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 dark:border-red-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 mb-3"
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReport}
                disabled={reporting || !isConnected}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {reporting ? 'Submitting...' : '🚨 Submit Report'}
              </button>
              {!isConnected && (
                <p className="text-xs text-red-700 dark:text-red-300">
                  Connect your wallet to report
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reviews/Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            📝 Reviews ({comments.length})
          </h2>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                No reviews yet. Be the first to review!
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment: any) => {
                const wallet = comment.buyerWallet;
                const truncatedWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
                
                // Calculate time ago
                const timeAgo = () => {
                  const now = new Date();
                  const created = new Date(comment.createdAt);
                  const diffMs = now.getTime() - created.getTime();
                  const diffSecs = Math.floor(diffMs / 1000);
                  const diffMins = Math.floor(diffSecs / 60);
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);
                  const diffMonths = Math.floor(diffDays / 30);
                  
                  if (diffSecs < 60) return 'Just now';
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays < 30) return `${diffDays}d ago`;
                  return `${diffMonths}mo ago`;
                };

                return (
                  <div
                    key={comment._id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                          <span className="text-sm">👤</span>
                        </div>
                        <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                          {truncatedWallet}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {timeAgo()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {comment.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Review Input (Only for buyers who haven't reviewed) */}
          {isConnected && hasPurchased && !hasCommented && (
            <div className="mt-6 rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-3">
                Leave a Review
              </h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this product... (5-500 characters)"
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700 dark:text-green-300">
                  {newComment.length}/500 characters
                </span>
                <button
                  onClick={handleSubmitComment}
                  disabled={submittingComment || newComment.trim().length < 5}
                  className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {submittingComment ? 'Submitting...' : '📝 Post Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export directly (token gating handled within component for purchases only)
export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetail params={params} />;
}

