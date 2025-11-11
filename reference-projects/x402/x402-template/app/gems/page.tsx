'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useGemBalance } from '@/contexts/gem-balance-context'

// Gem tier configuration matching middleware.ts
interface GemTierOption {
  id: string
  route: string
  gems: number
  bonus: number
  price: string
  priceValue: number
  description: string
  popular?: boolean
}

const GEM_TIERS: GemTierOption[] = [
  {
    id: 'starter',
    route: '/purchase/starter',
    gems: 100,
    bonus: 0,
    price: '$0.01',
    priceValue: 0.01,
    description: 'Starter Pack',
  },
  {
    id: 'value',
    route: '/purchase/value',
    gems: 550,
    bonus: 10,
    price: '$0.02',
    priceValue: 0.02,
    description: 'Value Pack',
    popular: true,
  },
  {
    id: 'premium',
    route: '/purchase/premium',
    gems: 1200,
    bonus: 20,
    price: '$0.03',
    priceValue: 0.03,
    description: 'Premium Pack',
  },
]

export default function GemPurchasePage() {
  const { balance } = useGemBalance()
  const [x402Enabled, setX402Enabled] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Fetch X402 status from API
    fetch('/api/x402/status')
      .then(res => res.json())
      .then(data => setX402Enabled(data.enabled))
      .catch(err => {
        console.error('Failed to fetch X402 status:', err)
        setX402Enabled(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* X402 Debug Banner */}
        {x402Enabled === false && (
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-yellow-300 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div>
                <p className="text-yellow-100 font-semibold">
                  🔧 Debug Mode: X402 Gateway Disabled
                </p>
                <p className="text-yellow-200/80 text-sm">
                  Payment verification is bypassed. Purchases will credit gems directly without blockchain payment. Set X402_GATEWAY=true in .env.local to enable payments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Purchase Gems
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Choose your gem package and power up your gacha experience
          </p>
          <p className="text-lg text-white/60">
            Current Balance: <span className="font-bold text-yellow-300">{mounted ? balance.toLocaleString() : '0'}</span> gems
          </p>
        </div>

        {/* Gem Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {GEM_TIERS.map((tier) => {
            const baseGems = tier.bonus > 0 
              ? Math.round(tier.gems / (1 + tier.bonus / 100))
              : tier.gems
            const bonusGems = tier.gems - baseGems

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-3xl ${
                  tier.popular ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">
                    BEST VALUE
                  </div>
                )}

                {/* Card Content */}
                <div className="p-8">
                  {/* Package Name */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.description}
                  </h2>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-purple-600">
                      {tier.price}
                    </span>
                  </div>

                  {/* Gem Amount */}
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3">
                      {/* Gem Icon */}
                      <svg
                        className="w-12 h-12 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      
                      <div className="text-left">
                        <div className="text-4xl font-bold text-white">
                          {tier.gems.toLocaleString()}
                        </div>
                        <div className="text-white/90 text-sm font-medium">
                          Gems
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{baseGems.toLocaleString()} base gems</span>
                    </div>

                    {tier.bonus > 0 && (
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>+{bonusGems.toLocaleString()} bonus gems ({tier.bonus}%)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{Math.floor(tier.gems / 10)} gacha pulls</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Instant delivery</span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Link
                    href={tier.route}
                    className={`block w-full text-center px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg ${
                      tier.popular
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    Purchase Now
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-3">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Choose Package</h3>
              <p className="text-white/70 text-sm">
                Select the gem package that fits your needs
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-3">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Pay with Crypto</h3>
              <p className="text-white/70 text-sm">
                Complete payment using Coinbase Pay widget
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-full mb-3">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Get Gems</h3>
              <p className="text-white/70 text-sm">
                Gems are instantly added to your balance
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-500 rounded-full mb-3">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Play Gacha</h3>
              <p className="text-white/70 text-sm">
                Use your gems to unlock amazing items
              </p>
            </div>
          </div>
        </div>

        {/* X402 Protocol Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-start gap-4">
            <svg
              className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-white font-semibold mb-2">
                Powered by X402 Protocol
              </h3>
              <p className="text-white/70 text-sm">
                This demo uses the X402 payment protocol for secure cryptocurrency transactions on the Solana blockchain. 
                All payments are verified on-chain before granting access. Currently running on{' '}
                <span className="font-semibold text-yellow-300">
                  {process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'Mainnet' : 'Devnet'}
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
