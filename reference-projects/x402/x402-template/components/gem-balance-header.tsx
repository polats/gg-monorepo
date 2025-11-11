'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useGemBalance } from '@/contexts/gem-balance-context'

interface GemBalanceHeaderProps {
  showPurchaseButton?: boolean
}

export function GemBalanceHeader({ showPurchaseButton = true }: GemBalanceHeaderProps) {
  const { balance } = useGemBalance()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch by only rendering balance after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  console.log('[GemBalanceHeader] Rendering with balance:', balance, 'mounted:', mounted)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Gem Balance Display */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              {/* Gem Icon */}
              <svg
                className="w-6 h-6 text-yellow-300"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              
              {/* Balance Value - Only show after mount to prevent hydration mismatch */}
              <span className="text-white font-bold text-lg tabular-nums">
                {mounted ? balance.toLocaleString() : '0'}
              </span>
              
              <span className="text-white/80 text-sm font-medium hidden sm:inline">
                Gems
              </span>
            </div>
          </div>

          {/* Purchase Button */}
          {showPurchaseButton && (
            <Link
              href="/gems"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Purchase Gems</span>
              <span className="sm:hidden">Buy</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
