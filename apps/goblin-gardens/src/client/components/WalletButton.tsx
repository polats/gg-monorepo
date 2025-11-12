import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';

interface WalletButtonProps {
  onWalletLinked?: (walletAddress: string) => void;
  onWalletUnlinked?: () => void;
  apiClient: {
    linkWallet: (walletAddress: string, signature: string, message: string) => Promise<any>;
    getLinkedWallet: () => Promise<{ walletAddress: string | null }>;
    unlinkWallet: () => Promise<any>;
  };
}

export const WalletButton: React.FC<WalletButtonProps> = ({ onWalletLinked, onWalletUnlinked, apiClient }) => {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already linked on mount
  useEffect(() => {
    const checkLinkedWallet = async () => {
      try {
        const response = await apiClient.getLinkedWallet();
        setLinkedWallet(response.walletAddress);
      } catch (err) {
        console.error('Failed to check linked wallet:', err);
      }
    };
    checkLinkedWallet();
  }, [apiClient]);

  const handleLinkWallet = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError('Wallet not connected');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      const message = `Link wallet ${walletAddress} to Goblin Gardens account`;
      const messageBytes = new TextEncoder().encode(message);
      
      // Request signature from wallet
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // Send to backend
      const response = await apiClient.linkWallet(walletAddress, signature, message);

      if (response.success) {
        setLinkedWallet(walletAddress);
        onWalletLinked?.(walletAddress);
      } else {
        setError(response.message || 'Failed to link wallet');
      }
    } catch (err: any) {
      console.error('Failed to link wallet:', err);
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLinking(false);
    }
  }, [publicKey, signMessage, apiClient, onWalletLinked]);

  // Auto-link when wallet connects if not already linked
  useEffect(() => {
    if (connected && publicKey && !linkedWallet && !isLinking) {
      const walletAddress = publicKey.toBase58();
      // Check if this wallet is already linked
      apiClient.getLinkedWallet().then((response) => {
        if (response.walletAddress === walletAddress) {
          setLinkedWallet(walletAddress);
        }
      });
    }
  }, [connected, publicKey, linkedWallet, isLinking, apiClient]);

  const handleUnlinkWallet = useCallback(async () => {
    setIsUnlinking(true);
    setError(null);

    try {
      const response = await apiClient.unlinkWallet();

      if (response.success) {
        setLinkedWallet(null);
        onWalletUnlinked?.();
        // Optionally disconnect the wallet
        if (disconnect) {
          await disconnect();
        }
      } else {
        setError(response.message || 'Failed to unlink wallet');
      }
    } catch (err: any) {
      console.error('Failed to unlink wallet:', err);
      setError(err.message || 'Failed to unlink wallet');
    } finally {
      setIsUnlinking(false);
    }
  }, [apiClient, onWalletUnlinked, disconnect]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {linkedWallet ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              padding: 10,
              borderRadius: 6,
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 7,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Linked Wallet
            </span>
            <span
              style={{
                color: '#4caf50',
                fontSize: 9,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {linkedWallet.slice(0, 4)}...{linkedWallet.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleUnlinkWallet}
            disabled={isUnlinking}
            style={{
              background: isUnlinking ? '#666' : '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: isUnlinking ? 'not-allowed' : 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              opacity: isUnlinking ? 0.6 : 1,
            }}
          >
            {isUnlinking ? 'Unlinking...' : 'Unlink Wallet'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10 }}>
            <WalletMultiButton
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 10,
                fontWeight: 'bold',
                color: 'white',
                cursor: 'pointer',
                width: '100%',
              }}
            />
          </div>

          {connected && !linkedWallet && (
            <button
              onClick={handleLinkWallet}
              disabled={isLinking}
              style={{
                background: isLinking ? '#666' : '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: isLinking ? 'not-allowed' : 'pointer',
                fontSize: 10,
                fontWeight: 'bold',
                opacity: isLinking ? 0.6 : 1,
              }}
            >
              {isLinking ? 'Linking...' : 'Link Wallet to Account'}
            </button>
          )}
        </>
      )}

      {error && (
        <div
          style={{
            color: '#ff6b6b',
            fontSize: 8,
            padding: 8,
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
