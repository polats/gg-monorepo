"use client";

import { useCallback, useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useWalletConnection } from "@/lib/hooks/useWalletConnection";
import { useWalletBalance } from "@/lib/hooks/useWalletBalance";
import { useWalletSession } from "@/lib/hooks/useWalletSession";
import { useMockMode } from "@/lib/hooks/useMockMode";
import { BalanceDisplay } from "./BalanceDisplay";
import {
  formatWalletAddress,
  getUserDisplayName,
  getConnectionStatusText,
  getConnectionStatusColor,
  getWalletErrorMessage,
  isRetryableError,
  copyToClipboard,
} from "@/lib/utils/wallet";
import { WalletUser, WalletError } from "@/types/wallet";

/**
 * Props for the WalletConnection component
 */
export interface WalletConnectionProps {
  /** Callback fired when wallet connection is successful */
  onConnect?: (user: WalletUser) => void;
  /** Callback fired when wallet is disconnected */
  onDisconnect?: () => void;
  /** Callback fired when an error occurs during wallet operations */
  onError?: (error: WalletError) => void;
  /** Whether to display the wallet balance */
  showBalance?: boolean;
  /** Whether to use compact display mode for smaller spaces */
  compact?: boolean;
  /** Whether to automatically connect on component mount */
  autoConnect?: boolean;
  /** Additional CSS classes to apply to the component */
  className?: string;
}

/**
 * WalletConnection component provides a complete wallet integration interface
 * supporting WorldCoin MiniKit authentication, balance display, and session management.
 *
 * Features:
 * - WorldID authentication with MiniKit integration
 * - Real-time balance monitoring with automatic refresh
 * - Session management with validity tracking
 * - Mock mode support for development/testing
 * - Compact and full display modes
 * - Comprehensive error handling with retry mechanisms
 * - Accessibility support with ARIA labels and live regions
 * - Performance optimizations with caching and throttling
 *
 * @param props - WalletConnection component props
 * @returns JSX element representing the wallet connection interface
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WalletConnection onConnect={(user) => console.log('Connected:', user)} />
 *
 * // Compact mode
 * <WalletConnection compact showBalance={false} />
 *
 * // With custom error handling
 * <WalletConnection
 *   onError={(error) => toast.error(error.message)}
 *   autoConnect={false}
 * />
 * ```
 */
export const WalletConnection = ({
  onConnect,
  onDisconnect,
  onError,
  showBalance = true,
  compact = false,
  autoConnect = true,
  className = "",
}: WalletConnectionProps) => {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const { isMockMode, mockUser } = useMockMode();

  // Wallet connection hook
  const {
    connection,
    status,
    user,
    error,
    connect,
    disconnect,
    refresh,
    isConnecting,
    isConnected,
  } = useWalletConnection({
    autoConnect,
    onConnect,
    onDisconnect,
    onError,
  });

  // Wallet balance hook (only if connected and showBalance is true)
  const {
    balance,
    status: balanceStatus,
    error: balanceError,
    refresh: refreshBalance,
    isLoading: balanceLoading,
  } = useWalletBalance({
    user,
    autoFetch: isConnected && showBalance,
    refreshInterval: showBalance ? 60000 : undefined, // Refresh every minute if showing balance
  });

  // Debug balance state in WalletConnection component
  console.log('🔍 [WalletConnection] Balance debug:', {
    showBalance,
    isConnected,
    user: user ? { address: user.address, username: user.username } : null,
    balance: balance ? {
      amount: balance.amount,
      formatted: balance.formatted,
      isLoading: balance.isLoading,
      error: balance.error
    } : 'BALANCE_NULL',
    balanceLoading,
    balanceStatus,
    balanceError,
    autoFetch: isConnected && showBalance
  });

  // Session management
  const { session, isSessionValid } = useWalletSession();

  /**
   * Handles wallet connection with error handling
   */
  const handleConnect = useCallback(async () => {
    console.log('🔍 [WalletConnection] handleConnect called');
    console.log('🔍 [WalletConnection] isConnecting:', isConnecting);
    console.log('🔍 [WalletConnection] isConnected:', isConnected);
    console.log('🔍 [WalletConnection] Current status:', status);

    try {
      console.log('🔍 [WalletConnection] Calling connect() function...');
      await connect();
      console.log('🔍 [WalletConnection] connect() completed successfully');
    } catch (err) {
      console.error('🔍 [WalletConnection] Connection failed:', err);
    }
  }, [connect, isConnecting, isConnected, status]);

  /**
   * Handles wallet disconnection
   */
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  /**
   * Handles wallet and balance refresh with error handling
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
      if (showBalance) {
        await refreshBalance();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  }, [refresh, refreshBalance, showBalance]);

  /**
   * Handles copying wallet address to clipboard with user feedback
   */
  const handleCopyAddress = useCallback(async () => {
    if (!user?.address) return;

    const success = await copyToClipboard(user.address);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [user?.address]);

  /**
   * Toggles between full and shortened address display
   */
  const toggleAddressDisplay = useCallback(() => {
    setShowFullAddress(!showFullAddress);
  }, [showFullAddress]);

  /**
   * Computed display address based on current toggle state
   */
  const displayAddress = user?.address
    ? showFullAddress
      ? user.address
      : formatWalletAddress(user.address)
    : "";

  /**
   * Computed error message and retry capability
   */
  const errorMessage = error ? getWalletErrorMessage(error) : null;
  const canRetry = error ? isRetryableError(error) : false;

  if (compact) {
    // Compact mode for smaller spaces
    return (
      <div
        className={`flex items-center space-x-2 ${className}`}
        role="banner"
        aria-label="Wallet connection status"
      >
        {/* Mock mode indicator */}
        {isMockMode && (
          <div
            className="px-1 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded"
            role="status"
            aria-label="Mock mode active"
            title="Mock mode is active for development"
          >
            🧪
          </div>
        )}

        {!isConnected ? (
          <div className={isConnecting ? "connecting-button-compact" : ""}>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="sm"
              variant="primary"
              aria-describedby={error ? "wallet-error" : undefined}
              className={isConnecting ? "!bg-yellow-500 !border-yellow-600 hover:!bg-yellow-600" : ""}
            >
              {isConnecting ? "..." : "Connect"}
            </Button>
            {isConnecting && (
              <style jsx global>{`
                .connecting-button-compact button {
                  background-color: rgb(234 179 8) !important;
                  border-color: rgb(202 138 4) !important;
                }
                .connecting-button-compact button:hover {
                  background-color: rgb(202 138 4) !important;
                }
              `}</style>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            {user?.profilePicture && (
              <img
                src={user.profilePicture}
                alt={`Profile picture for ${getUserDisplayName(user!)}`}
                className="w-6 h-6 rounded-full"
                role="img"
              />
            )}
            <span className="text-sm font-medium text-green-600">
              {getUserDisplayName(user!)}
            </span>
            {showBalance && (
              <BalanceDisplay
                balance={balance}
                isLoading={balanceLoading}
                error={balanceError}
                compact={true}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div
      className={`flex flex-col items-center space-y-3 ${className}`}
      role="main"
      aria-label="Wallet connection interface"
    >
      {/* Mock mode indicator */}
      {isMockMode && (
        <div
          className="mb-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg"
          role="status"
          aria-label={`Mock mode active with persona: ${mockUser?.persona || 'No User'}`}
        >
          🧪 Mock Mode: {mockUser?.persona || 'No User'}
        </div>
      )}


      {/* Error Display */}
      {error && (
        <div
          className="w-full max-w-sm p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
          id="wallet-error"
        >
          <p className="text-sm text-red-700 mb-2">{errorMessage}</p>
          {canRetry && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="sm"
              variant="secondary"
              aria-describedby="wallet-error"
            >
              {isConnecting ? "Retrying..." : "Retry"}
            </Button>
          )}
        </div>
      )}

      {/* Connection Button or User Info */}
      {!isConnected ? (
        <div className={isConnecting ? "connecting-button-wrapper" : ""}>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            variant="primary"
            aria-describedby={error ? "wallet-error" : undefined}
            aria-expanded="false"
            className={isConnecting ? "!bg-yellow-500 !border-yellow-600 hover:!bg-yellow-600" : ""}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
          {isConnecting && (
            <style jsx global>{`
              .connecting-button-wrapper button {
                background-color: rgb(234 179 8) !important;
                border-color: rgb(202 138 4) !important;
              }
              .connecting-button-wrapper button:hover {
                background-color: rgb(202 138 4) !important;
              }
            `}</style>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            {user?.profilePicture && (
              <img
                src={user.profilePicture}
                alt={`Profile picture for ${getUserDisplayName(user!)}`}
                className="w-12 h-12 rounded-full border-2 border-green-200"
                role="img"
              />
            )}

            <div className="text-center">
              <div className="font-medium text-green-600 text-lg">
                ✓ Connected {isMockMode && '(Mock)'}
              </div>

              {user?.username && (
                <div className="text-gray-700 font-medium">
                  {user.username}
                </div>
              )}

              {/* Address Display */}
              <div className="flex items-center space-x-2 mt-1" role="group" aria-label="Wallet address">
                <button
                  onClick={toggleAddressDisplay}
                  className="text-sm text-gray-600 hover:text-gray-800 font-mono"
                  title="Click to toggle full address"
                  aria-label={`Wallet address: ${displayAddress}. Click to ${showFullAddress ? 'shorten' : 'expand'} address`}
                  aria-expanded={showFullAddress}
                >
                  {displayAddress}
                </button>

                <button
                  onClick={handleCopyAddress}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  title="Copy address"
                  aria-label={copyFeedback ? "Address copied to clipboard" : "Copy wallet address to clipboard"}
                >
                  {copyFeedback ? "✓" : "📋"}
                </button>
              </div>

              {copyFeedback && (
                <div
                  className="text-xs text-green-600 mt-1"
                  role="status"
                  aria-live="polite"
                >
                  Address copied!
                </div>
              )}
            </div>
          </div>

          {/* Balance Display */}
          {(() => {
            console.log('🔍 [WalletConnection] BalanceDisplay render check:', {
              showBalance,
              shouldRender: showBalance,
              balance: balance ? 'HAS_BALANCE' : 'NO_BALANCE',
              balanceAmount: balance?.amount,
              balanceLoading
            });

            if (!showBalance) {
              console.log('🔍 [WalletConnection] Not showing balance because showBalance =', showBalance);
              return null;
            }

            console.log('🔍 [WalletConnection] Rendering BalanceDisplay with:', {
              balance,
              isLoading: balanceLoading,
              error: balanceError
            });

            return (
              <BalanceDisplay
                balance={balance}
                isLoading={balanceLoading}
                error={balanceError}
                onRefresh={refreshBalance}
                showRefreshButton={true}
              />
            );
          })()}

          {/* Disconnect Button Only */}
          <Button
            onClick={handleDisconnect}
            variant="secondary"
            size="sm"
            disabled={isConnecting}
            aria-label="Disconnect from wallet"
          >
            Disconnect
          </Button>
        </div>
      )}

    </div>
  );
};

export default WalletConnection;