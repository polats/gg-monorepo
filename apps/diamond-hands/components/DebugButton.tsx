"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function DebugButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false); // Start minimized

  // Don't show on the debug page itself
  if (pathname === '/debug-wallet') {
    return null;
  }

  // Always show in development, and also show in production for World App testing
  // (Eruda is also enabled in non-production, so debug button should be too)
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    return null;
  }

  return (
    <>
      {/* Floating Debug Panel */}
      {isVisible && (
        <div
          className="fixed top-4 right-4 z-[9999] bg-red-500 text-white p-3 rounded-lg shadow-xl border-2 border-white"
          style={{
            zIndex: 9999,
            minWidth: '120px'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">🔧 DEBUG MODE</span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-red-200 ml-2"
              style={{ fontSize: '12px' }}
            >
              ✕
            </button>
          </div>

          <Link
            href="/debug-wallet"
            className="block w-full bg-white text-red-500 hover:bg-red-50 text-sm px-3 py-2 rounded font-bold text-center transition-colors"
          >
            🔍 Test Wallet
          </Link>

          <div className="text-xs mt-2 opacity-90">
            Test MiniKit auth issues
          </div>
        </div>
      )}

      {/* Minimized button when panel is hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed top-4 right-4 z-[9999] bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg border border-white"
          style={{ zIndex: 9999 }}
        >
          🔧
        </button>
      )}
    </>
  );
}