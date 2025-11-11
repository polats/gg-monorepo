/**
 * Hook to fetch and display USDC balance for connected wallet
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { CONFIG } from '@/config/constants';

export function useUSDCBalance() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }

    let isMounted = true;

    async function fetchBalance() {
      if (!publicKey) return;

      try {
        setLoading(true);
        setError(null);

        // Always use mainnet for real USDC balance
        // const rpcUrl = CONFIG.MAINNET_RPC;
        // const usdcMintAddress = CONFIG.USDC_MINT_MAINNET;

        const rpcUrl = CONFIG.DEVNET_RPC;
        const usdcMintAddress = CONFIG.USDC_MINT_DEVNET


        console.log(`💰 Fetching USDC balance from mainnet...`);
        console.log(`   RPC: ${rpcUrl.slice(0, 50)}...`);
        console.log(`   Wallet: ${publicKey.toBase58().slice(0, 8)}...`);
        
        const connection = new Connection(rpcUrl, 'confirmed');
        const usdcMint = new PublicKey(usdcMintAddress);

        // Get associated token account
        const tokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey
        );

        console.log(`   Token Account: ${tokenAccount.toBase58().slice(0, 8)}...`);

        // Get balance
        const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
        
        if (isMounted) {
          const balanceValue = parseFloat(tokenBalance.value.uiAmount?.toString() || '0');
          console.log(`✅ USDC Balance: $${balanceValue.toFixed(2)}`);
          console.log(`   Raw: ${tokenBalance.value.amount} (${tokenBalance.value.decimals} decimals)`);
          setBalance(balanceValue);
        }
      } catch (err: any) {
        // Token account might not exist if user has never received USDC
        if (isMounted) {
          if (err.message?.includes('could not find account')) {
            console.log('ℹ️ No USDC token account found - balance is $0.00');
            setBalance(0);
          } else {
            console.warn('⚠️ Failed to fetch USDC balance:', err.message);
            setError('Failed to load balance');
            setBalance(0); // Show 0 instead of "--"
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [connected, publicKey]);

  return { balance, loading, error };
}

