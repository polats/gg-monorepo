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
      
      <style jsx>{`
        .wallet-button-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        /* Wallet Info Display */
        .wallet-info {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 16px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
        
        .wallet-address {
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: help;
          transition: opacity 0.2s;
        }
        
        .wallet-address:hover {
          opacity: 0.8;
        }
        
        /* Status Indicators */
        .wallet-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 16px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .status-indicator.connected {
          background: #4ade80;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
        }
        
        .status-indicator.connecting {
          background: #fbbf24;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        
        .status-text {
          color: white;
          font-size: 14px;
          font-weight: 500;
        }
        
        /* Custom Wallet Button Styling */
        :global(.wallet-adapter-button-custom) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        :global(.wallet-adapter-button-custom:hover) {
          background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        :global(.wallet-adapter-button-custom:active) {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        :global(.wallet-adapter-button-custom:disabled) {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Wallet Modal Styling */
        :global(.wallet-adapter-modal-wrapper) {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        :global(.wallet-adapter-modal) {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        :global(.wallet-adapter-modal-title) {
          color: #333;
          font-size: 24px;
          font-weight: 700;
        }
        
        :global(.wallet-adapter-modal-list) {
          margin: 0;
          padding: 0;
        }
        
        :global(.wallet-adapter-button) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        :global(.wallet-adapter-button:hover) {
          background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
          transform: translateY(-1px);
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .wallet-button-container {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .wallet-info,
          .wallet-status {
            justify-content: center;
          }
          
          :global(.wallet-adapter-button-custom) {
            width: 100%;
            padding: 12px 20px;
            font-size: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .wallet-address {
            font-size: 12px;
          }
          
          .status-text {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
