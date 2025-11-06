"use client";

import { useCallback, useState, useEffect } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { WalletBalance } from "@/types/wallet";
import {
  formatBalance,
  formatBalanceCompact,
  formatTimeAgo,
  getBalanceAge,
  shouldRefreshBalance,
  getBalanceStatusBadge,
} from "@/lib/utils/wallet";

/**
 * Props for the BalanceDisplay component
 */
export interface BalanceDisplayProps {
  /** The wallet balance data to display */
  balance: WalletBalance | null;
  /** Whether the balance is currently loading */
  isLoading?: boolean;
  /** Error message to display if balance loading failed */
  error?: string | null;
  /** Callback to refresh the balance */
  onRefresh?: () => Promise<void>;
  /** Whether to show the refresh button */
  showRefreshButton?: boolean;
  /** Whether to use compact display mode */
  compact?: boolean;
  /** Whether to show the last updated timestamp */
  showLastUpdated?: boolean;
  /** Whether to show automatic refresh indicators */
  autoRefreshIndicator?: boolean;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * BalanceDisplay component shows wallet balance with loading states, error handling,
 * and refresh capabilities. Supports both compact and full display modes.
 *
 * Features:
 * - Real-time balance display with automatic formatting
 * - Loading states with spinner animations
 * - Error handling with retry capabilities
 * - Manual refresh functionality
 * - Auto-refresh indicators for stale data
 * - USD conversion estimates
 * - Accessibility support with ARIA labels
 * - Compact mode for inline display
 *
 * @param props - BalanceDisplay component props
 * @returns JSX element representing the balance display
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BalanceDisplay balance={balance} />
 *
 * // Compact mode
 * <BalanceDisplay balance={balance} compact />
 *
 * // With refresh capability
 * <BalanceDisplay
 *   balance={balance}
 *   onRefresh={handleRefresh}
 *   showRefreshButton
 * />
 * ```
 */
export const BalanceDisplay = ({
  balance,
  isLoading = false,
  error = null,
  onRefresh,
  showRefreshButton = false,
  compact = false,
  showLastUpdated = true,
  autoRefreshIndicator = true,
  className = "",
}: BalanceDisplayProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  /**
   * Handles manual balance refresh with loading state management
   */
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;

    try {
      setRefreshing(true);
      await onRefresh();
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  /**
   * Get the appropriate status badge for the current balance state
   */
  const statusBadge = getBalanceStatusBadge(balance);

  /**
   * Determine if auto-refresh warning should be shown
   */
  const shouldShowAutoRefresh = autoRefreshIndicator && balance && shouldRefreshBalance(balance);

  /**
   * Computed loading and error states
   */
  const isActuallyLoading = isLoading || (balance?.isLoading) || refreshing;
  const hasError = error || (balance?.error);
  const errorMessage = error || (balance?.error) || null;

  /**
   * Format balance amount based on display mode
   */
  const formatBalanceForDisplay = useCallback((amount: number) => {
    return compact ? formatBalanceCompact(amount) : formatBalance(amount);
  }, [compact]);

  if (compact) {
    // Compact mode for inline display
    return (
      <div
        className={`inline-flex items-center space-x-1 ${className}`}
        role="status"
        aria-label="Wallet balance"
      >
        {isActuallyLoading ? (
          <div className="flex items-center space-x-1" role="status" aria-label="Loading balance">
            <div
              className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        ) : hasError ? (
          <div
            className="flex items-center space-x-1"
            role="alert"
            aria-label={`Balance error: ${errorMessage}`}
          >
            <span className="text-xs text-red-500" aria-hidden="true">⚠️</span>
            <span className="text-xs text-red-500">Error</span>
          </div>
        ) : balance ? (
          <div className="flex items-center space-x-1">
            <span
              className="text-sm font-medium text-gray-900"
              aria-label={`Balance: ${formatBalanceForDisplay(balance.amount)}`}
            >
              {formatBalanceForDisplay(balance.amount)}
            </span>
            {shouldShowAutoRefresh && (
              <span
                className="text-xs text-yellow-500"
                title="Balance may be outdated"
                aria-label="Balance may be outdated"
                role="status"
              >
                ⚠️
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400" aria-label="No balance available">No balance</span>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div
      className={`w-full max-w-sm ${className}`}
      role="region"
      aria-label="Wallet balance details"
    >
      {/* Balance Card */}
      <div
        className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-4"
        role="article"
        aria-labelledby="balance-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 id="balance-title" className="text-sm font-medium text-gray-700">Wallet Balance</h3>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              statusBadge.color === 'green' ? 'bg-green-100 text-green-800' :
              statusBadge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              statusBadge.color === 'red' ? 'bg-red-100 text-red-800' :
              statusBadge.color === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}
            role="status"
            aria-label={`Balance status: ${statusBadge.text}`}
          >
            {statusBadge.showPulse && (
              <div
                className="w-2 h-2 bg-current rounded-full animate-pulse mr-1"
                aria-hidden="true"
              />
            )}
            {statusBadge.text}
          </div>
        </div>

        {/* Balance Amount */}
        <div className="mb-3" role="status" aria-live="polite">
          {isActuallyLoading ? (
            <div className="flex items-center space-x-2" aria-label="Loading balance">
              <div
                className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
                aria-hidden="true"
              />
              <span className="text-lg text-gray-600">Loading balance...</span>
            </div>
          ) : hasError ? (
            <div className="text-center py-2" role="alert" aria-live="assertive">
              <div className="text-red-500 text-sm mb-2">
                <span aria-hidden="true">⚠️</span> {errorMessage}
              </div>
              {onRefresh && (
                <Button
                  onClick={handleRefresh}
                  variant="secondary"
                  size="sm"
                  disabled={refreshing}
                  aria-label="Retry loading balance"
                >
                  {refreshing ? "Retrying..." : "Retry"}
                </Button>
              )}
            </div>
          ) : balance ? (
            <div className="text-center">
              <div
                className="text-3xl font-bold text-gray-900 mb-1"
                aria-label={`Current balance: ${formatBalanceForDisplay(balance.amount)}`}
              >
                {formatBalanceForDisplay(balance.amount)}
              </div>

              {/* Balance in different format */}
              {!compact && balance.amount > 0 && (
                <div
                  className="text-sm text-gray-600"
                  aria-label={`Approximate USD value: $${(balance.amount * 2.50).toFixed(2)}`}
                >
                  ≈ ${(balance.amount * 2.50).toFixed(2)} USD {/* Rough WLD to USD conversion */}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500" aria-label="No balance data available">
              No balance data available
            </div>
          )}
        </div>

        {/* Last Updated */}
        {showLastUpdated && balance && balance.lastUpdated && !isActuallyLoading && (
          <div
            className="text-xs text-gray-500 text-center mb-3"
            role="status"
            aria-label={`Balance last updated ${formatTimeAgo(balance.lastUpdated)}`}
          >
            Last updated: {formatTimeAgo(balance.lastUpdated)}
            {lastRefreshTime && (
              <span className="ml-1">
                (refreshed {formatTimeAgo(lastRefreshTime)})
              </span>
            )}
          </div>
        )}

        {/* Auto-refresh warning */}
        {shouldShowAutoRefresh && (
          <div
            className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center space-x-1">
              <span className="text-yellow-600 text-xs" aria-hidden="true">⚠️</span>
              <span className="text-xs text-yellow-700">
                Balance may be outdated (last updated {formatTimeAgo(balance!.lastUpdated)})
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showRefreshButton && onRefresh && (
          <div className="flex justify-center">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="sm"
              disabled={refreshing || isActuallyLoading}
              aria-label="Refresh wallet balance"
            >
              {refreshing ? (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Refreshing...</span>
                </div>
              ) : (
                "Refresh Balance"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Balance Details (Debug) */}
      {process.env.NODE_ENV === 'development' && balance && (
        <details className="mt-2 text-xs text-gray-500">
          <summary className="cursor-pointer">Balance Debug Info</summary>
          <div className="mt-1 p-2 bg-gray-50 rounded text-left">
            <div>Raw Amount: {balance.amount}</div>
            <div>Formatted: {balance.formatted}</div>
            <div>Last Updated: {balance.lastUpdated.toISOString()}</div>
            <div>Age: {Math.round(getBalanceAge(balance) / 1000)}s</div>
            <div>Is Loading: {balance.isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {balance.error || 'None'}</div>
            <div>Should Refresh: {shouldRefreshBalance(balance) ? 'Yes' : 'No'}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default BalanceDisplay;