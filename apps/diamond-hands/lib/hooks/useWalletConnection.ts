import { useState, useEffect, useCallback, useRef } from 'react';
import { WalletConnection, WalletUser, WalletConnectionStatus, WalletError } from '@/types/wallet';
import { MiniKit, WalletAuthInput } from '@worldcoin/minikit-js';
import { generateMockWalletUser, simulateMockWalletAuth, MOCK_DELAYS } from '@/lib/mock/mock-wallet-data';

export interface UseWalletConnectionOptions {
  autoConnect?: boolean;
  onConnect?: (user: WalletUser) => void;
  onDisconnect?: () => void;
  onError?: (error: WalletError) => void;
}

export interface UseWalletConnectionReturn {
  connection: WalletConnection | null;
  status: WalletConnectionStatus;
  user: WalletUser | null;
  error: WalletError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
}

const STORAGE_KEY = 'worldWalletSession';

export function useWalletConnection(options: UseWalletConnectionOptions = {}): UseWalletConnectionReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [status, setStatus] = useState<WalletConnectionStatus>('disconnected');
  const [user, setUser] = useState<WalletUser | null>(null);
  const [error, setError] = useState<WalletError | null>(null);
  const connectingRef = useRef(false);

  // Generate nonce for authentication
  const generateNonce = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // Get stored session
  const getStoredSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse stored wallet session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }, []);

  // Save session to localStorage and notify other components
  const saveSession = useCallback((walletAddress: string, sessionId: string) => {
    const session = {
      walletAddress,
      sessionId,
      autoConnect: true,
      mockUserId: null,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    // Dispatch custom event to notify other components in same tab
    window.dispatchEvent(new CustomEvent('walletSessionChange', {
      detail: { type: 'connected', session }
    }));
  }, []);

  // Clear stored session and notify other components
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);

    // Dispatch custom event to notify other components in same tab
    window.dispatchEvent(new CustomEvent('walletSessionChange', {
      detail: { type: 'disconnected' }
    }));
  }, []);

  // Connect to wallet - EXACT COPY of working debug page pattern
  const connect = useCallback(async () => {
    console.log('🔍 [useWalletConnection] Connect function called - using debug page pattern');

    if (connectingRef.current) {
      console.log('🔍 [useWalletConnection] Already connecting, skipping');
      return;
    }

    try {
      console.log('🔍 [useWalletConnection] Starting connection process');
      connectingRef.current = true;
      setStatus('connecting');
      setError(null);

      // Step 1: Check if MiniKit is installed - fallback to mock if not available
      console.log('🔍 [useWalletConnection] Step 1: Checking MiniKit installation...');

      const isMiniKitAvailable = typeof MiniKit !== 'undefined' &&
                                 typeof MiniKit.isInstalled === 'function' &&
                                 MiniKit.isInstalled();

      if (!isMiniKitAvailable) {
        console.log('🔍 [useWalletConnection] ❌ MiniKit not available, using mock fallback');

        // Use mock user when MiniKit is not available
        const mockUserId = 'active-user';
        const mockUser = await simulateMockWalletAuth(mockUserId as any, {
          delay: MOCK_DELAYS.AUTH,
        });
        console.log('🔍 [useWalletConnection] 🧪 Generated mock user:', mockUser);

        const newConnection: WalletConnection = {
          address: mockUser.address,
          isConnected: true,
          connectionTimestamp: Date.now(),
          lastRefreshTimestamp: Date.now(),
        };

        setConnection(newConnection);
        setUser(mockUser);
        setStatus('connected');

        // Save session
        const sessionId = `mock-session-${Date.now()}`;
        saveSession(mockUser.address, sessionId);

        onConnect?.(mockUser);
        console.log('🔍 [useWalletConnection] ✅ Mock connection completed successfully');
        return;
      }

      console.log('🔍 [useWalletConnection] ✅ MiniKit is installed');

      // Step 2: Fetch nonce from backend (EXACT debug page pattern)
      console.log('🔍 [useWalletConnection] Step 2: Fetching nonce from /api/nonce...');
      const res = await fetch('/api/nonce');
      const { nonce } = await res.json();
      console.log('🔍 [useWalletConnection] ✅ Received nonce:', nonce);

      // Step 3: Configure wallet auth parameters (EXACT debug page pattern)
      console.log('🔍 [useWalletConnection] Step 3: Configuring wallet auth parameters...');
      const authParams: WalletAuthInput = {
        nonce: nonce,
        requestId: '0',
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        statement: 'Connect to RaffleTime Diamond Hands minigame'
      };
      console.log('🔍 [useWalletConnection] ✅ Auth params:', authParams);

      // Step 4: Execute wallet authentication (EXACT debug page pattern)
      console.log('🔍 [useWalletConnection] Step 4: Calling MiniKit.commandsAsync.walletAuth...');
      const result = await MiniKit.commandsAsync.walletAuth(authParams);
      console.log('🔍 [useWalletConnection] ✅ walletAuth result:', result);

      const { commandPayload, finalPayload } = result;
      console.log('🔍 [useWalletConnection] Command payload:', commandPayload);
      console.log('🔍 [useWalletConnection] Final payload:', finalPayload);

      // Step 5: Handle the response (EXACT debug page pattern)
      if (finalPayload.status === 'success') {
        console.log('🔍 [useWalletConnection] ✅ Authentication successful!');

        // Step 6: Get wallet address (EXACT debug page pattern)
        console.log('🔍 [useWalletConnection] Step 6: Getting wallet address...');
        const address = MiniKit.walletAddress;
        console.log('🔍 [useWalletConnection] Wallet address:', address);

        // Create user object matching our types
        const walletUser: WalletUser = {
          address: address,
          username: undefined,
          profilePicture: undefined,
          balance: undefined
        };

        const newConnection: WalletConnection = {
          address: address,
          isConnected: true,
          connectionTimestamp: Date.now(),
          lastRefreshTimestamp: Date.now(),
        };

        setConnection(newConnection);
        setUser(walletUser);
        setStatus('connected');

        // Save session
        const sessionId = `session-${Date.now()}`;
        saveSession(address, sessionId);

        onConnect?.(walletUser);
        console.log('🔍 [useWalletConnection] ✅ Connection completed successfully');

        // Step 7: Send to backend for verification (EXACT debug page pattern)
        console.log('🔍 [useWalletConnection] Step 7: Sending to backend for verification...');
        const response = await fetch('/api/complete-siwe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: finalPayload,
            nonce
          })
        });

        const verificationResult = await response.json();
        console.log('🔍 [useWalletConnection] Backend verification:', verificationResult);

      } else {
        console.log('🔍 [useWalletConnection] ❌ Authentication failed:', finalPayload.status);
        if (finalPayload.message) {
          console.log('🔍 [useWalletConnection] Error message:', finalPayload.message);
        }
        throw new Error(finalPayload.message || 'Authentication failed');
      }

    } catch (err: any) {
      console.error('🔍 [useWalletConnection] ❌ Error occurred:', err.message);
      console.error('🔍 [useWalletConnection] Error stack:', err.stack);

      let walletError: WalletError;

      if (err.message.includes('denied') || err.message.includes('cancelled')) {
        walletError = {
          code: 'AUTH_FAILED',
          message: 'Connection was cancelled by user',
        };
      } else if (err.message.includes('network') || err.message.includes('timeout')) {
        walletError = {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please check your connection',
          details: { retry: true },
        };
      } else {
        walletError = {
          code: 'AUTH_FAILED',
          message: 'Failed to connect wallet. Please try again',
          details: { retry: true },
        };
      }

      setError(walletError);
      setStatus('error');
      onError?.(walletError);
      console.error('🔍 [useWalletConnection] Set error state:', walletError);
    } finally {
      connectingRef.current = false;
      console.log('🔍 [useWalletConnection] === Wallet Authentication Complete ===');
    }
  }, [
    generateNonce,
    saveSession,
    onConnect,
    onError,
  ]);

  // Disconnect from wallet
  const disconnect = useCallback(() => {
    setConnection(null);
    setUser(null);
    setStatus('disconnected');
    setError(null);
    clearSession();
    onDisconnect?.();
  }, [clearSession, onDisconnect]);

  // Refresh connection - using direct MiniKit
  const refresh = useCallback(async () => {
    if (!connection || !user) {
      return;
    }

    try {
      setError(null);

      // Get current wallet address using direct MiniKit
      const currentAddress = MiniKit.walletAddress;

      if (currentAddress) {
        // Update user with current address
        const walletUser: WalletUser = {
          address: currentAddress,
          username: undefined,
          profilePicture: undefined,
          balance: undefined
        };
        setUser(walletUser);

        // Update connection with current address
        setConnection(prev => prev ? {
          ...prev,
          address: currentAddress,
          lastRefreshTimestamp: Date.now(),
        } : null);
      } else {
        // User disconnected externally
        disconnect();
        return;
      }
    } catch (err) {
      console.error('Failed to refresh wallet connection:', err);
      setError({
        code: 'NETWORK_ERROR',
        message: 'Failed to refresh connection',
        details: { retry: true },
      });
    }
  }, [connection, user, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    const session = getStoredSession();
    if (session && session.autoConnect && session.walletAddress) {
      // Check if session is recent (within 7 days)
      const sessionAge = Date.now() - (session.timestamp || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge < maxAge) {
        // Attempt auto-connect
        connect().catch(() => {
          // Auto-connect failed, clear invalid session
          clearSession();
        });
      } else {
        // Session expired
        clearSession();
      }
    }
  }, [autoConnect, connect, getStoredSession, clearSession]);

  // Listen for wallet session changes to sync state between components
  useEffect(() => {
    const handleSessionChange = (event: CustomEvent) => {
      const { type, session } = event.detail;
      console.log('🔍 [useWalletConnection] Session change event:', { type, session });

      if (type === 'connected' && session) {
        // New session was created (wallet connected in another component)
        if (session.walletAddress && status !== 'connected') {
          console.log('🔍 [useWalletConnection] Syncing wallet state from other component');

          // Create user object from session
          const walletUser: WalletUser = {
            address: session.walletAddress,
            username: undefined,
            profilePicture: undefined,
            balance: undefined
          };

          const newConnection: WalletConnection = {
            address: session.walletAddress,
            isConnected: true,
            connectionTimestamp: session.timestamp,
            lastRefreshTimestamp: Date.now(),
          };

          // Update local state to match the connected session
          setConnection(newConnection);
          setUser(walletUser);
          setStatus('connected');
          setError(null);

          console.log('🔍 [useWalletConnection] Local state synced with other component');
        }
      } else if (type === 'disconnected') {
        // Session was cleared (wallet disconnected in another component)
        console.log('🔍 [useWalletConnection] Session cleared by other component, disconnecting');
        if (status === 'connected') {
          setConnection(null);
          setUser(null);
          setStatus('disconnected');
          setError(null);
        }
      }
    };

    window.addEventListener('walletSessionChange', handleSessionChange as EventListener);
    return () => {
      window.removeEventListener('walletSessionChange', handleSessionChange as EventListener);
    };
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectingRef.current = false;
    };
  }, []);

  return {
    connection,
    status,
    user,
    error,
    connect,
    disconnect,
    refresh,
    isConnecting: status === 'connecting',
    isConnected: status === 'connected',
  };
}