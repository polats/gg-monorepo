'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getCachedTokenGate, setCachedTokenGate, clearCachedTokenGate } from '@/lib/tokenGatingCache';

interface AuthState {
  isConnected: boolean;
  hasAcceptedTOS: boolean;
  isTokenGated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { publicKey, connected, disconnect } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    hasAcceptedTOS: false,
    isTokenGated: false,
    isLoading: false,
    error: null,
  });
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showTokenGateModal, setShowTokenGateModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastCheckedWallet = useRef<string | null>(null); // Track which wallet was checked
  const lastCheckTimestamp = useRef<number>(0); // Track when we last checked (throttle)

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth status when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const currentWallet = publicKey.toBase58();
      
      // Check if this is a new wallet or a reconnection
      const isNewWallet = lastCheckedWallet.current !== currentWallet;
      
      if (isNewWallet) {
        console.log(`🔄 ${lastCheckedWallet.current ? 'Reconnected' : 'Connected'} wallet`);
        console.log(`   Wallet: ${currentWallet.slice(0, 8)}...${currentWallet.slice(-6)}`);
        
        // Check balance - will use cache if available (< 5 min old)
        checkAuthStatus(false); // false = use cache if available
        lastCheckedWallet.current = currentWallet;
      }
    } else {
      // Reset state on disconnect
      console.log('🔌 Wallet disconnected');
      
      setAuthState({
        isConnected: false,
        hasAcceptedTOS: false,
        isTokenGated: false,
        isLoading: false,
        error: null,
      });
      setShowTOSModal(false);
      setShowTokenGateModal(false);
      setTokenBalance(0);
      
      // Clear cache and reset wallet tracker
      if (lastCheckedWallet.current) {
        console.log('🧹 Clearing cache for:', lastCheckedWallet.current.slice(0, 8) + '...');
        clearCachedTokenGate(lastCheckedWallet.current);
        lastCheckedWallet.current = null;
      }
      
      // Reset throttle timestamp
      lastCheckTimestamp.current = 0;
    }
  }, [connected, publicKey]);

  const checkAuthStatus = async (forceRefresh = false) => {
    if (!publicKey) return;

    const wallet = publicKey.toBase58();
    
    // Throttle: Don't allow checks within 3 seconds of each other
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimestamp.current;
    const THROTTLE_MS = 3000; // 3 seconds
    
    if (timeSinceLastCheck < THROTTLE_MS && !forceRefresh) {
      console.log(`⏱️  Throttled: Last check was ${Math.round(timeSinceLastCheck / 1000)}s ago, skipping`);
      return;
    }

    // Try to use cached token gating result
    const cached = getCachedTokenGate(wallet);
    if (cached && !forceRefresh) {
      console.log(`💾 Using cached balance: ${cached.tokenBalance.toLocaleString()} tokens`);
      setTokenBalance(cached.tokenBalance);
      
      // Still need to check TOS status (fast, no RPC call)
      try {
        const response = await axios.post('/api/auth/connect', {
          wallet,
          skipTokenCheck: true, // Tell backend to skip balance check
        });

        const { hasAcceptedTOS } = response.data;

        setAuthState({
          isConnected: true,
          hasAcceptedTOS,
          isTokenGated: cached.isTokenGated,
          isLoading: false,
          error: null,
        });

        // Show appropriate modal
        if (!cached.isTokenGated) {
          setShowTokenGateModal(true);
          setShowTOSModal(false);
        } else if (!hasAcceptedTOS) {
          setShowTOSModal(true);
          setShowTokenGateModal(false);
        }

        return;
      } catch (error) {
        console.warn('⚠️ TOS check failed, will do full auth check');
      }
    }

    // No cache or forced refresh - do full check (includes RPC call)
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Update throttle timestamp
    lastCheckTimestamp.current = Date.now();

    try {
      console.log('🔍 Performing full token balance check (RPC call)');
      
      // Call /api/auth/connect to check token gating and TOS status
      const response = await axios.post('/api/auth/connect', {
        wallet,
      });

      const { tokenGatingPassed, hasAcceptedTOS, tokenBalance: balance } = response.data;

      // Cache the token gating result
      if (balance !== undefined) {
        setTokenBalance(balance);
        setCachedTokenGate(wallet, balance, tokenGatingPassed);
        console.log(`✅ Fresh balance cached: ${balance.toLocaleString()} tokens`);
      }

      setAuthState({
        isConnected: true,
        hasAcceptedTOS,
        isTokenGated: tokenGatingPassed,
        isLoading: false,
        error: null,
      });

      // Priority 1: Show token gate modal if insufficient tokens
      if (!tokenGatingPassed) {
        setShowTokenGateModal(true);
        setShowTOSModal(false);
      }
      // Priority 2: Show TOS modal if tokens are sufficient but TOS not accepted
      else if (!hasAcceptedTOS && tokenGatingPassed) {
        setShowTOSModal(true);
        setShowTokenGateModal(false);
      }
    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      
      // If we have a cached balance and the check failed due to network/rate limit,
      // use the cached value instead of blocking the user
      const cached = getCachedTokenGate(wallet);
      if (cached && error.response?.status === 429) {
        console.warn('⚠️ Rate limited! Using last known balance:', cached.tokenBalance.toLocaleString());
        setTokenBalance(cached.tokenBalance);
        setAuthState({
          isConnected: true,
          hasAcceptedTOS: authState.hasAcceptedTOS, // Keep current TOS state
          isTokenGated: cached.isTokenGated,
          isLoading: false,
          error: null,
        });
        
        // Show appropriate modal based on cached state
        if (!cached.isTokenGated) {
          setShowTokenGateModal(true);
        }
        return;
      }
      
      const errorMessage = error.response?.data?.error || 'Failed to connect wallet';
      
      setAuthState({
        isConnected: false,
        hasAcceptedTOS: false,
        isTokenGated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  const acceptTOS = async () => {
    if (!publicKey) return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call /api/auth/tos to update TOS acceptance
      const response = await axios.post('/api/auth/tos', {
        wallet: publicKey.toBase58(),
      });

      if (response.data.success) {
        setAuthState(prev => ({
          ...prev,
          hasAcceptedTOS: true,
          isLoading: false,
        }));
        setShowTOSModal(false);
        console.log('✅ TOS accepted');
      }
    } catch (error: any) {
      console.error('❌ TOS acceptance failed:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to accept TOS',
      }));
    }
  };

  const declineTOS = () => {
    disconnect();
    setShowTOSModal(false);
  };

  return {
    ...authState,
    showTOSModal,
    showTokenGateModal,
    tokenBalance,
    acceptTOS,
    declineTOS,
    checkAuthStatus,
    mounted,
  };
}
