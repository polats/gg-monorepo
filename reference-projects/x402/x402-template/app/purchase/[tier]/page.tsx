'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useGemBalance } from '@/contexts/gem-balance-context'

// Gem tier configuration matching middleware.ts
interface GemTier {
  gems: number
  bonus: number
  price: string
  description: string
}

const GEM_TIERS: Record<string, GemTier> = {
  starter: {
    gems: 100,
    bonus: 0,
    price: '$0.01',
    description: 'Starter Pack'
  },
  value: {
    gems: 550,
    bonus: 10,
    price: '$0.02',
    description: 'Value Pack'
  },
  premium: {
    gems: 1200,
    bonus: 20,
    price: '$0.03',
    description: 'Premium Pack'
  }
}

export default function PurchaseSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { addGems, balance } = useGemBalance()
  const [credited, setCredited] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [x402DebugInfo, setX402DebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Use ref to prevent double execution during re-renders
  const creditInitiatedRef = useRef(false)

  const tier = params.tier as string
  const tierConfig = GEM_TIERS[tier]
  
  // Debug function to check balance and x402 data
  const checkBalance = async () => {
    try {
      // Check gem balance
      const balanceResponse = await fetch('/api/gems/balance', { credentials: 'include' })
      const balanceData = await balanceResponse.json()
      
      // Check x402 debug info
      const x402Response = await fetch('/api/x402/debug', { credentials: 'include' })
      const x402Data = await x402Response.json()
      
      const combinedDebug = {
        gemBalance: balanceData,
        x402Data: x402Data
      }
      
      setDebugInfo(JSON.stringify(combinedDebug, null, 2))
      setX402DebugInfo(x402Data)
      console.log('[PurchasePage] Manual balance check:', balanceData)
      console.log('[PurchasePage] X402 debug info:', x402Data)
    } catch (error) {
      console.error('[PurchasePage] Error checking balance:', error)
      setDebugInfo('Error: ' + error)
    }
  }
  
  // Load x402 debug info on mount
  useEffect(() => {
    const loadX402Debug = async () => {
      try {
        const response = await fetch('/api/x402/debug', { credentials: 'include' })
        const data = await response.json()
        setX402DebugInfo(data)
        console.log('[PurchasePage] X402 debug info loaded:', data)
      } catch (error) {
        console.error('[PurchasePage] Error loading x402 debug info:', error)
      }
    }
    
    loadX402Debug()
  }, [])

  // Retry function for failed credits
  const retryCredit = () => {
    console.log('[PurchasePage] Retrying credit...')
    creditInitiatedRef.current = false
    setCredited(false)
    setError(null)
  }

  useEffect(() => {
    setMounted(true)
    
    // Log all cookies for debugging
    console.log('[PurchasePage] All cookies:', document.cookie)
    
    // Try to extract x402 session token from cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    console.log('[PurchasePage] Parsed cookies:', cookies)
    console.log('[PurchasePage] X402 Session Token:', cookies.x402_session_token)
    console.log('[PurchasePage] X402 Payment Data:', cookies.x402_payment_data)
  }, [])

  useEffect(() => {
    console.log('[PurchasePage] useEffect triggered', { 
      tier, 
      tierConfig: !!tierConfig, 
      credited, 
      creditInitiated: creditInitiatedRef.current 
    })
    
    // Validate tier exists
    if (!tierConfig) {
      console.error('[PurchasePage] Invalid tier:', tier)
      router.push('/')
      return
    }

    // Credit gems to player balance (only once)
    // Use ref to prevent double execution during re-renders
    if (!credited && !loading && !creditInitiatedRef.current) {
      creditInitiatedRef.current = true
      console.log('[PurchasePage] Starting credit process for', tierConfig.gems, 'gems')
      
      const creditGems = async () => {
        setLoading(true)
        setError(null)
        
        try {
          console.log('[PurchasePage] Calling addGems...')
          
          // Use the context's addGems which handles API call and state update
          const success = await addGems(tierConfig.gems, `${tierConfig.description} purchase`)
          
          if (!success) {
            throw new Error('Failed to credit gems. Please try again.')
          }
          
          console.log('[PurchasePage] addGems completed successfully')
          
          setCredited(true)
          
          // Trigger animation
          setAnimating(true)
          setTimeout(() => setAnimating(false), 1000)
        } catch (error) {
          console.error('[PurchasePage] Error crediting gems:', error)
          setError(error instanceof Error ? error.message : 'An unexpected error occurred')
          creditInitiatedRef.current = false // Reset on error to allow retry
        } finally {
          setLoading(false)
        }
      }
      
      creditGems()
    } else {
      console.log('[PurchasePage] Skipping credit:', { 
        credited, 
        loading, 
        creditInitiated: creditInitiatedRef.current 
      })
    }
  }, [tier, tierConfig, credited, addGems, router, loading])

  // Handle invalid tier
  if (!tierConfig) {
    return null
  }

  // Calculate base gems (without bonus)
  const baseGems = tierConfig.bonus > 0 
    ? Math.round(tierConfig.gems / (1 + tierConfig.bonus / 100))
    : tierConfig.gems
  const bonusGems = tierConfig.gems - baseGems

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-center ${
            error 
              ? 'bg-gradient-to-r from-red-500 to-rose-600' 
              : loading 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                : 'bg-gradient-to-r from-green-500 to-emerald-600'
          }`}>
            {/* Status Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              {error ? (
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : loading ? (
                <svg
                  className="w-12 h-12 text-blue-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {error ? 'Credit Failed' : loading ? 'Processing...' : 'Purchase Successful!'}
            </h1>
            <p className="text-white/90 text-lg">
              {error 
                ? 'There was an error crediting your gems' 
                : loading 
                  ? 'Adding gems to your account...'
                  : 'Your gems have been added to your account'
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-red-900 font-bold text-lg mb-1">Error</h3>
                    <p className="text-red-800">{error}</p>
                    <button
                      onClick={retryCredit}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Message */}
            {loading && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-blue-900 font-semibold">Processing your purchase...</span>
                </div>
              </div>
            )}

            {/* Gem Amount Display */}
            <div className={`text-center mb-8 transition-all duration-500 ${animating ? 'scale-110' : 'scale-100'}`}>
              <div className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl px-8 py-6 shadow-lg">
                {/* Gem Icon */}
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                
                <div className="text-left">
                  <div className="text-5xl font-bold text-white">
                    +{tierConfig.gems.toLocaleString()}
                  </div>
                  <div className="text-white/90 text-lg font-medium">
                    Gems Added
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Transaction Summary
              </h2>
              
              <div className="space-y-3">
                {/* Package */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Package:</span>
                  <span className="text-gray-900 font-semibold">
                    {tierConfig.description}
                  </span>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Price:</span>
                  <span className="text-gray-900 font-semibold">
                    {tierConfig.price}
                  </span>
                </div>

                {/* Base Gems */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Base Gems:</span>
                  <span className="text-gray-900 font-semibold">
                    {baseGems.toLocaleString()}
                  </span>
                </div>

                {/* Bonus (if applicable) */}
                {tierConfig.bonus > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">
                        Bonus ({tierConfig.bonus}%):
                      </span>
                      <span className="text-green-600 font-semibold">
                        +{bonusGems.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold text-lg">Total Gems:</span>
                        <span className="text-gray-900 font-bold text-lg">
                          {tierConfig.gems.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Current Balance */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold">Current Balance:</span>
                    <span className="text-purple-600 font-bold text-xl">
                      {mounted ? balance.toLocaleString() : '0'} gems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus Badge (if applicable) */}
            {tierConfig.bonus > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-semibold">
                    You saved {tierConfig.bonus}% with this pack!
                  </span>
                </div>
              </div>
            )}

            {/* X402 Debug Panel */}
            {x402DebugInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-bold text-blue-900">X402 Payment Debug Info</h3>
                </div>
                
                <div className="space-y-3">
                  {/* Session Token */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-600 mb-1">X402 Session Token:</div>
                    <div className="font-mono text-sm break-all text-gray-900">
                      {x402DebugInfo.x402SessionToken || (
                        <span className="text-red-600 font-semibold">❌ No session token found</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Data */}
                  {x402DebugInfo.x402PaymentData && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-600 mb-2">Payment Data:</div>
                      <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded border border-gray-200">
                        {JSON.stringify(x402DebugInfo.x402PaymentData, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* App Session ID */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-600 mb-1">App Session ID:</div>
                    <div className="font-mono text-sm break-all text-gray-900">
                      {x402DebugInfo.appSessionId || (
                        <span className="text-orange-600 font-semibold">⚠️ No app session found</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Debug Timestamp:</div>
                    <div className="text-sm text-gray-900">
                      {x402DebugInfo.timestamp}
                    </div>
                  </div>
                  
                  {/* Warning if no session token */}
                  {!x402DebugInfo.x402SessionToken && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <div className="text-sm text-red-900">
                          <strong>No X402 session token detected.</strong> This could mean:
                          <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>X402 gateway is disabled (debug mode)</li>
                            <li>Payment was not processed through X402</li>
                            <li>Session token endpoint was not called</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-2">Full Debug Info:</h3>
                <pre className="text-xs overflow-auto max-h-96">{debugInfo}</pre>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Debug Button */}
              <button
                onClick={checkBalance}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 text-white rounded-xl font-bold text-sm hover:bg-yellow-600 transition-all hover:scale-105 active:scale-95"
              >
                🐛 Debug
              </button>
              
              {/* Start Playing Button */}
              <Link
                href="/gacha"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Play Gacha
              </Link>

              {/* Return Home Button */}
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return Home
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-6 text-white/70 text-sm">
          <p>Your gems are stored in your browser session</p>
          <p>Use them wisely on gacha pulls!</p>
        </div>
      </div>
    </div>
  )
}
