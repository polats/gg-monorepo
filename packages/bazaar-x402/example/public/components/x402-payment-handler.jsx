/**
 * x402 Payment Handler
 * 
 * Utility functions for handling x402 payment protocol flow:
 * 1. Detect 402 Payment Required responses
 * 2. Create Solana transactions from payment requirements
 * 3. Sign transactions with connected wallet
 * 4. Retry requests with X-Payment header
 */

import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

/**
 * Handle x402 payment flow for a purchase
 * 
 * @param {string} url - The API endpoint URL
 * @param {Object} wallet - Solana wallet adapter instance
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} Purchase result
 */
export async function handleX402Purchase(url, wallet, onStatusUpdate = () => {}) {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Step 1: Initial request (may return 402)
  onStatusUpdate('Initiating purchase...');
  const initialResponse = await fetch(url);
  
  // If not 402, return the response (mock mode or already paid)
  if (initialResponse.status !== 402) {
    if (!initialResponse.ok) {
      const error = await initialResponse.json();
      throw new Error(error.message || 'Purchase failed');
    }
    return await initialResponse.json();
  }
  
  // Step 2: Parse payment requirements
  onStatusUpdate('Payment required. Preparing transaction...');
  const paymentRequirements = await initialResponse.json();
  
  if (!paymentRequirements.paymentRequired) {
    throw new Error('Invalid 402 response: missing payment requirements');
  }
  
  const requirements = paymentRequirements.requirements;
  
  // Step 3: Create and sign transaction
  onStatusUpdate('Please sign the transaction in your wallet...');
  const { transaction, signature } = await createAndSignTransaction(
    wallet,
    requirements
  );
  
  // Step 4: Broadcast transaction to Solana
  onStatusUpdate('Broadcasting transaction to Solana...');
  const connection = new Connection(
    requirements.network === 'solana-mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  const txSignature = await connection.sendRawTransaction(transaction.serialize());
  
  // Step 5: Wait for confirmation
  onStatusUpdate('Waiting for transaction confirmation...');
  await connection.confirmTransaction(txSignature, 'confirmed');
  
  // Step 6: Create payment payload
  const paymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: requirements.network,
    payload: {
      signature: txSignature,
      from: wallet.publicKey.toBase58(),
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
    },
  };
  
  // Step 7: Encode payment header
  const paymentHeader = btoa(JSON.stringify(paymentPayload));
  
  // Step 8: Retry request with X-Payment header
  onStatusUpdate('Verifying payment...');
  const finalResponse = await fetch(url, {
    headers: {
      'X-Payment': paymentHeader,
    },
  });
  
  if (!finalResponse.ok) {
    const error = await finalResponse.json();
    throw new Error(error.message || 'Payment verification failed');
  }
  
  onStatusUpdate('Purchase complete!');
  return await finalResponse.json();
}

/**
 * Create and sign a Solana USDC transfer transaction
 * 
 * @param {Object} wallet - Solana wallet adapter
 * @param {Object} requirements - Payment requirements from 402 response
 * @returns {Promise<{transaction: Transaction, signature: string}>}
 */
async function createAndSignTransaction(wallet, requirements) {
  const connection = new Connection(
    requirements.network === 'solana-mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  // Parse addresses
  const fromPubkey = wallet.publicKey;
  const toPubkey = new PublicKey(requirements.payTo);
  const mintPubkey = new PublicKey(requirements.asset);
  const amount = BigInt(requirements.maxAmountRequired);
  
  // Get associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey
  );
  
  const toTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey
  );
  
  // Create transaction
  const transaction = new Transaction();
  
  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  // Sign transaction
  const signedTransaction = await wallet.signTransaction(transaction);
  
  return {
    transaction: signedTransaction,
    signature: signedTransaction.signature?.toString('base64') || '',
  };
}

/**
 * Check if response is a 402 Payment Required
 * 
 * @param {Response} response - Fetch response
 * @returns {boolean}
 */
export function is402Response(response) {
  return response.status === 402;
}

/**
 * Extract payment requirements from 402 response
 * 
 * @param {Response} response - 402 response
 * @returns {Promise<Object>} Payment requirements
 */
export async function extractPaymentRequirements(response) {
  if (!is402Response(response)) {
    throw new Error('Not a 402 response');
  }
  
  const data = await response.json();
  
  if (!data.paymentRequired || !data.requirements) {
    throw new Error('Invalid 402 response format');
  }
  
  return data.requirements;
}
