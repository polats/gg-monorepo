import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Wallet Button Component
 * 
 * Provides a user interface for connecting and managing Solana wallet connections.
 * 
 * Features:
 * - Connect/disconnect wallet functionality
 * - Displays truncated wallet address when connected
 * - Shows full address on hover via tooltip
 * - Loading state during connection
 * - Connection status indicator
 * - Styled to match bazaar purple gradient theme
 * 
 * @returns {JSX.Element} Wallet button component
 */
export function WalletButton() {
  const { publicKey, connected, connecting } = useWallet();
  
  /**
   * Format wallet address for display
   * Shows first 4 and last 4 characters with ellipsis in between
   * 
   * @param {string} address - Full wallet address
   * @returns {string} Formatted address (e.g., "7xKX...9Abc")
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  return (
    <div className="wallet-button-container">
      {/* Connection Status Indicator */}
      {connecting && (
        <div className="wallet-status">
          <span className="status-indicator connecting"></span>
          <span className="status-text">Connecting...</span>
        </div>
      )}
      
      {/* Wallet Address Display */}
      {connected && publicKey && !connecting && (
        <div className="wallet-info">
          <span className="status-indicator connected"></span>
          <span 
            className="wallet-address" 
            title={publicKey.toBase58()}
            aria-label={`Connected wallet: ${publicKey.toBase58()}`}
          >
            {formatAddress(publicKey.toBase58())}
          </span>
        </div>
      )}
      
      {/* Wallet Multi Button */}
      <WalletMultiButton className="wallet-adapter-button-custom" />
    </div>
  );
}
