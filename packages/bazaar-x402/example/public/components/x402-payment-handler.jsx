/**
 * x402 Payment Handler
 * 
 * Utility functions for handling x402 payment protocol flow:
 * 1. Detect 402 Payment Required responses
 * 2. Create Solana transactions from payment requirements
 * 3. Sign transactions with connected wallet
 * 4. Retry requests with X-Payment header
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js';
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
  
  console.log('Payment requirements:', paymentRequirements);
  
  if (!paymentRequirements.paymentRequired) {
    throw new Error('Invalid 402 response: missing payment requirements');
  }
  
  // Extract the actual requirements from the x402 response structure
  // Server returns: { requirements: { x402Version: 1, accepts: [...] } }
  // We need the first item from the accepts array
  const x402Response = paymentRequirements.requirements;
  if (!x402Response || !x402Response.accepts || x402Response.accepts.length === 0) {
    throw new Error('Invalid 402 response: missing payment requirements in accepts array');
  }
  
  const requirements = x402Response.accepts[0];
  
  // Step 3: Create and sign transaction
  onStatusUpdate('Please sign the transaction in your wallet...');
  let signedTransaction;
  try {
    signedTransaction = await createAndSignTransaction(wallet, requirements);
  } catch (error) {
    console.error('Transaction creation/signing error:', error);
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
  
  // Step 4: Create payment payload with SIGNED TRANSACTION (not signature)
  // The server will broadcast the transaction after verification
  onStatusUpdate('Preparing payment proof...');
  
  // Serialize the signed transaction to base64
  const serializedTx = signedTransaction.serialize().toString('base64');
  
  const paymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: requirements.network,
    payload: {
      // Note: signature will be generated when server broadcasts the transaction
      signature: '', // Placeholder - server will fill this after broadcasting
      from: wallet.publicKey.toBase58(),
      to: requirements.payTo,
      amount: requirements.maxAmountRequired,
      mint: requirements.asset,
      signedTransaction: serializedTx, // Include the signed transaction
    },
  };
  
  // Step 5: Encode payment header
  const paymentHeader = btoa(JSON.stringify(paymentPayload));
  
  // Step 6: Send request with X-Payment header
  // Server will verify and broadcast the transaction
  onStatusUpdate('Verifying payment with server...');
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
 * @returns {Promise<Transaction>} Signed transaction ready to be serialized
 */
async function createAndSignTransaction(wallet, requirements) {
  console.log('Creating transaction with requirements:', requirements);
  
  if (!wallet.signTransaction) {
    throw new Error('Wallet does not support transaction signing');
  }
  
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
  
  // Convert amount to BigInt - handle both string and number
  const amountValue = typeof requirements.maxAmountRequired === 'string' 
    ? parseInt(requirements.maxAmountRequired, 10)
    : requirements.maxAmountRequired;
  const amount = BigInt(amountValue);
  
  console.log('Transaction details:', {
    from: fromPubkey.toBase58(),
    to: toPubkey.toBase58(),
    mint: mintPubkey.toBase58(),
    amount: amount.toString()
  });
  
  // Get associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey
  );
  
  const toTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey
  );
  
  console.log('Token accounts:', {
    from: fromTokenAccount.toBase58(),
    to: toTokenAccount.toBase58()
  });
  
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
  
  console.log('Transaction created, requesting signature...');
  
  // Sign transaction (but don't broadcast it yet)
  // The server will broadcast it after verification
  const signedTransaction = await wallet.signTransaction(transaction);
  
  console.log('Transaction signed successfully');
  console.log('Transaction will be broadcast by server after verification');
  
  return signedTransaction;
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
