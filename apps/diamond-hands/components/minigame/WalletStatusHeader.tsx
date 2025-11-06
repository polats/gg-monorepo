'use client';

import { useState, useCallback } from 'react';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useWalletBalance } from '@/lib/hooks/useWalletBalance';
import { useMockMode } from '@/lib/hooks/useMockMode';
import { formatWalletAddress, getUserDisplayName, formatBalance } from '@/lib/utils/wallet';

export interface WalletStatusHeaderProps {
  /** Position of the header */
  position?: 'top-left' | 'top-right' | 'top-center';
  /** Whether to show detailed balance information */
  showBalance?: boolean;
  /** Whether to show connection status indicator */
  showStatus?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when wallet is disconnected */
  onDisconnect?: () => void;
}

export function WalletStatusHeader({
  position = 'top-right',
  showBalance = true,
  showStatus = true,
  className = '',
  onDisconnect,
}: WalletStatusHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMockMode, mockUser } = useMockMode();

  const { isConnected, user, disconnect, status } = useWalletConnection({
    autoConnect: true,
    onDisconnect,
  });

  const { balance, isLoading: balanceLoading } = useWalletBalance({
    user,
    autoFetch: isConnected && showBalance,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsExpanded(false);
  }, [disconnect]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Don't render if not connected
  if (!isConnected || !user) {
    return null;
  }

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  };

  // Status indicator
  const statusIndicator = showStatus ? (
    <div className={`w-2 h-2 rounded-full ${
      status === 'connected' ? 'bg-green-500' :
      status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
      status === 'error' ? 'bg-red-500' :
      'bg-gray-400'
    }`} />
  ) : null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg">
        {/* Compact View */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={toggleExpanded}
        >
          {/* Mock mode indicator */}
          {isMockMode && (
            <div className="px-1 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-mono">
              🧪
            </div>
          )}

          {/* Status indicator */}
          {statusIndicator}

          {/* User avatar */}
          {user.profilePicture && (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-6 h-6 rounded-full border border-gray-200"
            />
          )}

          {/* User name */}
          <span className="text-sm font-medium text-gray-800">
            {getUserDisplayName(user)}
          </span>

          {/* Balance (compact) */}
          {showBalance && balance && !balanceLoading && (
            <span className="text-sm text-green-600 font-mono">
              {formatBalance(balance.amount, 1)}
            </span>
          )}

          {/* Loading indicator */}
          {showBalance && balanceLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}

          {/* Expand/collapse indicator */}
          <div className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-3 py-3 space-y-2 bg-gray-50/50">
            {/* Address */}
            <div className="text-xs text-gray-600">
              <span className="font-mono">
                {formatWalletAddress(user.address, 8, 6)}
              </span>
            </div>

            {/* Detailed Balance */}
            {showBalance && balance && (
              <div className="text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-mono text-green-600">
                    {formatBalance(balance.amount, 4)}
                  </span>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  Updated: {balance.lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Mock mode info */}
            {isMockMode && mockUser && (
              <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="font-medium text-yellow-800">Mock Mode Active</div>
                <div className="text-yellow-700">Persona: {mockUser.persona}</div>
                <div className="text-yellow-600 mt-1">
                  💡 Use persona switcher (bottom-left) to test different user scenarios
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDisconnect}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletStatusHeader;