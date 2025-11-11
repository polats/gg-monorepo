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
  
  console.log('🔍 Sending payment to server...');
  console.log('🔍 URL:', url);
  console.log('🔍 Payment header length:', paymentHeader.length);
  console.log('🔍 Payment header (first 100 chars):', paymentHeader.substring(0, 100));
  
  const finalResponse = await fetch(url, {
    headers: {
      'X-Payment': paymentHeader,
    },
  });
  
  console.log('🔍 Server response status:', finalResponse.status);
  
  if (!finalResponse.ok) {
    const error = await finalResponse.json();
    console.error('🔍 Server error response:', error);
    throw new Error(error.message || 'Payment verification failed');
  }
  
  onStatusUpdate('Purchase complete!');
  const result = await finalResponse.json();
  console.log('🔍 Purchase result:', result);
  return result;
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
  
  // Validate requirements
  if (!requirements.payTo) {
    throw new Error('Missing payTo address in payment requirements');
  }
  
  if (!requirements.asset) {
    throw new Error('Missing asset (USDC mint) in payment requirements');
  }
  
  if (!requirements.maxAmountRequired) {
    throw new Error('Missing maxAmountRequired in payment requirements');
  }
  
  const connection = new Connection(
    requirements.network === 'solana-mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  // Parse addresses with validation
  const fromPubkey = wallet.publicKey;
  
  let toPubkey;
  try {
    toPubkey = new PublicKey(requirements.payTo);
  } catch (error) {
    throw new Error(`Invalid recipient address: ${requirements.payTo}`);
  }
  
  let mintPubkey;
  try {
    mintPubkey = new PublicKey(requirements.asset);
  } catch (error) {
    throw new Error(`Invalid USDC mint address: ${requirements.asset}`);
  }
  
  // Convert amount to BigInt - handle both string and number
  const amountValue = typeof requirements.maxAmountRequired === 'string' 
    ? parseInt(requirements.maxAmountRequired, 10)
    : requirements.maxAmountRequired;
  const amount = BigInt(amountValue);
  
  console.log('Transaction details:', {
    from: fromPubkey.toBase58(),
    to: toPubkey.toBase58(),
    mint: mintPubkey.toBase58(),
    amount: amount.toString(),
    amountUSDC: (Number(amount) / 1_000_000).toFixed(6) + ' USDC',
    network: requirements.network
  });
  
  // Validate that addresses are valid Solana public keys
  if (!PublicKey.isOnCurve(fromPubkey.toBytes())) {
    throw new Error('Buyer wallet address is not a valid Solana public key');
  }
  
  if (!PublicKey.isOnCurve(toPubkey.toBytes())) {
    throw new Error(`Seller wallet address is not a valid Solana public key: ${requirements.payTo}`);
  }
  
  // Get associated token accounts with error handling
  let fromTokenAccount;
  let toTokenAccount;
  
  try {
    // Get the associated token account addresses
    // These are deterministic addresses derived from the wallet and mint
    fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      fromPubkey,
      false // allowOwnerOffCurve = false (strict validation)
    );
    
    toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      toPubkey,
      false
    );
    
    console.log('Token accounts:', {
      from: fromTokenAccount.toBase58(),
      to: toTokenAccount.toBase58()
    });
    
    // Check if token accounts exist
    console.log('Checking if token accounts exist...');
    const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    
    if (!fromAccountInfo) {
      throw new Error(
        `Your wallet doesn't have a USDC token account. Please create one first by receiving some USDC.`
      );
    }
    
    if (!toAccountInfo) {
      console.warn('Recipient does not have a USDC token account. Transaction may fail.');
      // Note: In production, you might want to add an instruction to create the account
      // For now, we'll let the transaction fail with a clear error
    }
    
    console.log('Token accounts verified');
  } catch (error) {
    console.error('Error with token accounts:', error);
    
    // Provide helpful error messages
    if (error.message && error.message.includes("doesn't have a USDC token account")) {
      throw error; // Re-throw our custom error
    }
    
    throw new Error(
      `Failed to prepare USDC transfer. ${error.message || 'Unknown error'}. ` +
      `Make sure you have a USDC token account and the recipient address is valid.`
    );
  }
  
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
