import React, { useMemo, useCallback, useEffect } from 'react';
import { 
  ConnectionProvider, 
  WalletProvider,
  useWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Session storage key for wallet connection state
const WALLET_CONNECTION_KEY = 'walletConnected';

/**
 * Solana Wallet Provider Component
 * 
 * Wraps the application with Solana wallet adapter providers:
 * - ConnectionProvider: Manages connection to Solana network
 * - WalletProvider: Manages wallet state and connections
 * - WalletModalProvider: Provides wallet selection modal UI
 * 
 * Features:
 * - Auto-connect on page load if previously connected
 * - Session persistence for wallet connection state
 * - Graceful error handling for connection failures
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 */
export function SolanaWalletProvider({ children }) {
  // Configure network endpoint (devnet for development)
  const network = 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize wallet adapters
  // Currently supports Phantom wallet
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );
  
  // Check if wallet was previously connected
  const autoConnect = useMemo(() => {
    try {
      const wasConnected = sessionStorage.getItem(WALLET_CONNECTION_KEY);
      return wasConnected === 'true';
    } catch (error) {
      // Session storage might not be available (e.g., in private browsing)
      console.warn('Failed to check wallet connection state:', error);
      return false;
    }
  }, []);
  
  // Handle wallet connection errors
  const onError = useCallback((error) => {
    console.error('Wallet error:', error);
    
    // Clear connection state on error
    try {
      sessionStorage.removeItem(WALLET_CONNECTION_KEY);
    } catch (e) {
      console.warn('Failed to clear wallet connection state:', e);
    }
    
    // Provide user-friendly error messages
    if (error.name === 'WalletNotReadyError') {
      console.log('Wallet is not ready. Please unlock your wallet.');
    } else if (error.name === 'WalletConnectionError') {
      console.log('Failed to connect to wallet. Please try again.');
    } else if (error.name === 'WalletDisconnectedError') {
      console.log('Wallet disconnected.');
    } else if (error.name === 'WalletNotFoundError') {
      console.log('Phantom wallet not detected. Please install Phantom.');
    }
  }, []);
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={autoConnect}
        onError={onError}
      >
        <WalletModalProvider>
          <WalletConnectionManager>
            {children}
          </WalletConnectionManager>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Wallet Connection Manager
 * 
 * Internal component that manages session storage for wallet connection state.
 * Tracks connection/disconnection events and updates session storage accordingly.
 */
function WalletConnectionManager({ children }) {
  const { connected, publicKey } = useWallet();
  
  // Update session storage when connection state changes
  useEffect(() => {
    try {
      if (connected && publicKey) {
        // Store connection state when wallet connects
        sessionStorage.setItem(WALLET_CONNECTION_KEY, 'true');
      } else {
        // Clear connection state when wallet disconnects
        sessionStorage.removeItem(WALLET_CONNECTION_KEY);
      }
    } catch (error) {
      console.warn('Failed to update wallet connection state:', error);
    }
  }, [connected, publicKey]);
  
  return children;
}
