import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WalletBalance, WalletBalanceStatus, WalletUser } from '@/types/wallet';
import { MiniKit } from '@worldcoin/minikit-js';
import { generateMockWalletBalance, simulateMockBalanceRefresh, MOCK_DELAYS } from '@/lib/mock/mock-wallet-data';

export interface UseWalletBalanceOptions {
  address?: string;
  user?: WalletUser | null;
  autoFetch?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
  // Performance options
  enableBackgroundRefresh?: boolean;
  throttleRefresh?: number;
  enableOptimisticUpdates?: boolean;
  // Callbacks
  onBalanceUpdate?: (balance: WalletBalance) => void;
  onError?: (error: string) => void;
}

export interface UseWalletBalanceReturn {
  balance: WalletBalance | null;
  status: WalletBalanceStatus;
  error: string | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
  isLoaded: boolean;
  lastUpdated: Date | null;
}

const CACHE_KEY_PREFIX = 'wallet_balance_';
const DEFAULT_CACHE_TIMEOUT = 30 * 1000; // 30 seconds
const DEFAULT_REFRESH_INTERVAL = 60 * 1000; // 60 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const MIN_THROTTLE_DELAY = 1000; // Minimum time between refresh calls
const BACKGROUND_REFRESH_THRESHOLD = 10 * 1000; // Refresh if data is older than 10s

export function useWalletBalance(options: UseWalletBalanceOptions = {}): UseWalletBalanceReturn {
  const {
    address,
    user,
    autoFetch = true,
    refreshInterval,
    cacheTimeout = DEFAULT_CACHE_TIMEOUT,
    enableBackgroundRefresh = true,
    throttleRefresh = MIN_THROTTLE_DELAY,
    enableOptimisticUpdates = false,
    onBalanceUpdate,
    onError,
  } = options;

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [status, setStatus] = useState<WalletBalanceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const pendingRefreshRef = useRef<Promise<void> | null>(null);
  const previousAddressRef = useRef<string>('');

  // Check if we're in mock mode
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  // Memoize the current address to prevent unnecessary re-renders
  const currentAddress = useMemo(() => {
    return address || user?.address;
  }, [address, user?.address]);

  // Get cache key for the current address
  const getCacheKey = useCallback((addr: string) => {
    return `${CACHE_KEY_PREFIX}${addr}`;
  }, []);

  // Get cached balance
  const getCachedBalance = useCallback((addr: string): WalletBalance | null => {
    try {
      const cacheKey = getCacheKey(addr);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsedBalance = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsedBalance.lastUpdated).getTime();

        if (cacheAge < cacheTimeout) {
          return {
            ...parsedBalance,
            lastUpdated: new Date(parsedBalance.lastUpdated),
          };
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.warn('Failed to read cached balance:', err);
    }
    return null;
  }, [getCacheKey, cacheTimeout]);

  // Cache balance
  const cacheBalance = useCallback((addr: string, balanceData: WalletBalance) => {
    try {
      const cacheKey = getCacheKey(addr);
      localStorage.setItem(cacheKey, JSON.stringify(balanceData));
    } catch (err) {
      console.warn('Failed to cache balance:', err);
    }
  }, [getCacheKey]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (address) {
      const cacheKey = getCacheKey(address);
      localStorage.removeItem(cacheKey);
    }
  }, [address, getCacheKey]);

  // Format balance amount
  const formatBalance = useCallback((amount: number): string => {
    return `${amount.toFixed(2)} WLD`;
  }, []);

  // Fetch balance from MiniKit or mock
  const fetchBalance = useCallback(async (addr: string, forceRefresh = false): Promise<WalletBalance> => {
    console.log('🔍 [useWalletBalance] fetchBalance called:', {
      addr,
      forceRefresh,
      isMockMode,
      currentAddress
    });

    const isMiniKitAvailable = typeof MiniKit !== 'undefined' &&
                               typeof MiniKit.isInstalled === 'function' &&
                               MiniKit.isInstalled();

    console.log('🔍 [useWalletBalance] Environment check:', {
      isMockMode,
      isMiniKitAvailable,
      willUseMock: isMockMode || !isMiniKitAvailable
    });

    if (isMockMode || !isMiniKitAvailable) {
      // Mock mode balance fetch or fallback when MiniKit not available
      const mockUserId = localStorage.getItem('mockUserId') || 'active-user';
      console.log('🔍 [useWalletBalance] Using mock balance for:', {
        reason: isMiniKitAvailable ? 'mock mode' : 'no MiniKit',
        mockUserId,
        fromStorage: localStorage.getItem('mockUserId'),
        defaulting: 'active-user'
      });

      const mockResult = await simulateMockBalanceRefresh(mockUserId as any, {
        delay: MOCK_DELAYS.BALANCE_REFRESH,
      });

      console.log('🔍 [useWalletBalance] Mock balance result:', mockResult);
      return mockResult;
    } else {
      // Real MiniKit balance fetch
      console.log('🔍 [useWalletBalance] Using real MiniKit balance');

      const currentUser = MiniKit.user;
      if (!currentUser) {
        throw new Error('No user data available');
      }

      // For now, return a default balance since MiniKit doesn't provide balance directly
      const defaultBalance = 100; // Default for testing

      return {
        amount: currentUser.balance || defaultBalance,
        formatted: formatBalance(currentUser.balance || defaultBalance),
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };
    }
  }, [isMockMode, formatBalance]);

  // Throttled refresh function to prevent excessive calls
  const throttledRefresh = useCallback(async (forceRefresh = false): Promise<void> => {
    const now = Date.now();

    // Check throttle limit (unless forcing refresh)
    if (!forceRefresh && throttleRefresh > 0) {
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      if (timeSinceLastRefresh < throttleRefresh) {
        // Too soon, skip this refresh
        return;
      }
    }

    // If there's already a pending refresh, return that promise
    if (pendingRefreshRef.current && !forceRefresh) {
      return pendingRefreshRef.current;
    }

    // Start the refresh operation
    const refreshPromise = performRefresh(forceRefresh);
    pendingRefreshRef.current = refreshPromise;

    try {
      await refreshPromise;
    } finally {
      pendingRefreshRef.current = null;
      lastRefreshTimeRef.current = now;
    }
  }, [throttleRefresh]);

  // Actual refresh implementation
  const performRefresh = useCallback(async (forceRefresh = false): Promise<void> => {

    if (!currentAddress || fetchingRef.current) {
      return;
    }

    // Optimistic update: if we have a balance and enableOptimisticUpdates is true,
    // show loading state immediately
    if (enableOptimisticUpdates && balance && !balance.isLoading) {
      setBalance(prev => prev ? { ...prev, isLoading: true } : null);
    }

    try {
      fetchingRef.current = true;
      setStatus('loading');
      setError(null);

      // Update loading state in current balance
      if (balance) {
        setBalance(prev => prev ? { ...prev, isLoading: true, error: null } : null);
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedBalance(currentAddress);
        if (cached) {
          // For background refresh, check if data is stale
          if (enableBackgroundRefresh) {
            const dataAge = Date.now() - cached.lastUpdated.getTime();
            if (dataAge > BACKGROUND_REFRESH_THRESHOLD) {
              // Data is getting stale, start background refresh but return cached data immediately
              setTimeout(() => {
                performRefresh(true).catch(err => {
                  console.warn('Background refresh failed:', err);
                });
              }, 0);
            }
          }

          setBalance(cached);
          setStatus('loaded');
          setLastUpdated(cached.lastUpdated);
          retryCountRef.current = 0;
          return;
        }
      }

      // Fetch fresh balance
      const freshBalance = await fetchBalance(currentAddress, forceRefresh);

      setBalance(freshBalance);
      setStatus('loaded');
      setLastUpdated(freshBalance.lastUpdated);

      // Cache the result
      cacheBalance(currentAddress, freshBalance);

      // Reset retry count on success
      retryCountRef.current = 0;

      // Notify callback
      onBalanceUpdate?.(freshBalance);

    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);

      const errorMessage = err.message.includes('MiniKit')
        ? 'Wallet connection lost'
        : err.message.includes('network') || err.message.includes('timeout')
        ? 'Network error occurred'
        : 'Unable to load balance';

      setError(errorMessage);
      setStatus('error');

      // Update error in current balance
      if (balance) {
        setBalance(prev => prev ? {
          ...prev,
          isLoading: false,
          error: errorMessage
        } : null);
      }

      // Retry logic with exponential backoff
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1;
        const retryDelay = RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);

        setTimeout(() => {
          if (fetchingRef.current) {
            fetchingRef.current = false;
            refresh(forceRefresh);
          }
        }, retryDelay);
        return;
      }

      onError?.(errorMessage);
    } finally {
      fetchingRef.current = false;

      // Reset optimistic loading state on error
      if (enableOptimisticUpdates && balance && balance.isLoading) {
        setBalance(prev => prev ? { ...prev, isLoading: false } : null);
      }
    }
  }, [
    currentAddress,
    balance,
    enableOptimisticUpdates,
    enableBackgroundRefresh,
    getCachedBalance,
    fetchBalance,
    cacheBalance,
    onBalanceUpdate,
    onError,
  ]);

  // Main refresh function that uses throttling
  const refresh = useCallback(() => throttledRefresh(true), [throttledRefresh]);

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && status === 'loaded') {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if tab is visible to save resources
        if (!document.hidden) {
          throttledRefresh(false);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [throttledRefresh, refreshInterval, status]);

  // Auto-fetch on mount or when address changes
  useEffect(() => {
    const currentAddress = address || user?.address;

    console.log('🔍 [useWalletBalance] Auto-fetch effect triggered:', {
      autoFetch,
      currentAddress,
      status,
      address,
      userAddress: user?.address,
      willFetch: autoFetch && currentAddress && status === 'idle'
    });

    if (autoFetch && currentAddress && status === 'idle') {
      console.log('🔍 [useWalletBalance] Triggering throttledRefresh');
      throttledRefresh(false);
    } else {
      console.log('🔍 [useWalletBalance] Not fetching because:', {
        autoFetch,
        hasCurrentAddress: !!currentAddress,
        statusIsIdle: status === 'idle',
        status
      });
    }
  }, [autoFetch, currentAddress, status, throttledRefresh]);

  // Reset state when address changes
  useEffect(() => {
    const previousAddress = previousAddressRef.current;

    console.log('🔍 [useWalletBalance] Address change check:', {
      currentAddress,
      previousAddress,
      hasBalance: !!balance,
      shouldReset: currentAddress && previousAddress && currentAddress !== previousAddress
    });

    if (currentAddress && previousAddress && currentAddress !== previousAddress) {
      console.log('🔍 [useWalletBalance] Address changed, resetting balance state');
      setBalance(null);
      setStatus('idle');
      setError(null);
      setLastUpdated(null);
      retryCountRef.current = 0;
      lastRefreshTimeRef.current = 0;
      pendingRefreshRef.current = null;
    }

    // Update the previous address ref
    if (currentAddress) {
      previousAddressRef.current = currentAddress;
    }
  }, [currentAddress]);

  // In mock mode, watch for persona changes and refresh balance
  useEffect(() => {
    if (isMockMode && user?.address) {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'mockUserId' && event.newValue !== event.oldValue) {
          // Mock persona changed, refresh balance
          setTimeout(() => {
            throttledRefresh(true);
          }, 100);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isMockMode, currentAddress, throttledRefresh]);

  // Handle visibility change for refresh interval
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && refreshInterval && status === 'loaded') {
        // Tab became visible, refresh balance if data is stale
        if (balance && enableBackgroundRefresh) {
          const dataAge = Date.now() - balance.lastUpdated.getTime();
          if (dataAge > BACKGROUND_REFRESH_THRESHOLD) {
            throttledRefresh(false);
          }
        } else {
          throttledRefresh(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [throttledRefresh, refreshInterval, status, balance, enableBackgroundRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    balance,
    status,
    error,
    refresh,
    clearCache,
    isLoading: status === 'loading',
    isLoaded: status === 'loaded',
    lastUpdated,
  }), [balance, status, error, refresh, clearCache, lastUpdated]);
}