'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function X402DebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const loadDebugData = async () => {
    try {
      const response = await fetch('/api/x402/debug', { credentials: 'include' })
      const data = await response.json()
      setDebugData(data)
      console.log('[X402 Debug Page] Data loaded:', data)
    } catch (error) {
      console.error('[X402 Debug Page] Error loading data:', error)
      setDebugData({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebugData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadDebugData, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h1 className="text-3xl font-bold text-gray-900">X402 Payment Debug Console</h1>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              ← Home
            </Link>
          </div>
          <p className="text-gray-600">
            Real-time debugging information for X402 payment gateway integration
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={loadDebugData}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
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
                Refresh Data
              </button>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-gray-700 font-medium">Auto-refresh (2s)</span>
              </label>
            </div>
            
            {debugData?.timestamp && (
              <div className="text-sm text-gray-600">
                Last updated: {new Date(debugData.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Debug Data Display */}
        {loading && !debugData ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4"
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
            <p className="text-gray-600 font-medium">Loading debug data...</p>
          </div>
        ) : debugData?.error ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800">{debugData.error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* X402 Session Token */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                X402 Session Token
              </h2>
              {debugData?.x402SessionToken ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-900 font-semibold">Token Found</span>
                  </div>
                  <div className="font-mono text-sm break-all bg-white p-3 rounded border border-green-200">
                    {debugData.x402SessionToken}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span className="text-red-900 font-semibold">No Token Found</span>
                  </div>
                  <p className="text-red-800 text-sm mt-2">
                    The X402 session token has not been received. This could indicate:
                  </p>
                  <ul className="list-disc ml-5 mt-2 text-red-800 text-sm space-y-1">
                    <li>X402 gateway is disabled (running in debug mode)</li>
                    <li>No payment has been completed yet</li>
                    <li>Session token endpoint was not called</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Payment Data */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Payment Data
              </h2>
              {debugData?.x402PaymentData ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugData.x402PaymentData, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-4 text-gray-600">
                  No payment data available
                </div>
              )}
            </div>

            {/* App Session ID */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                App Session ID
              </h2>
              {debugData?.appSessionId ? (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <div className="font-mono text-sm break-all">
                    {debugData.appSessionId}
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span className="text-orange-900 font-semibold">No App Session Found</span>
                  </div>
                </div>
              )}
            </div>

            {/* All Cookies */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                All Cookies
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugData?.allCookies || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Raw Debug Data */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Raw Debug Data
              </h2>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-xs text-green-400 overflow-auto">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/gems"
              className="px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
            >
              Buy Gems
            </Link>
            <Link
              href="/gacha"
              className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              Play Gacha
            </Link>
            <button
              onClick={() => {
                document.cookie.split(';').forEach(cookie => {
                  const name = cookie.split('=')[0].trim()
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                })
                loadDebugData()
              }}
              className="px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
            >
              Clear All Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
