/**
 * Transaction Verification Utilities
 * 
 * Verify on-chain Solana transactions before delivering software
 */

import { PublicKey } from '@solana/web3.js';
import { paymentConnection } from './connection';
import { PURCHASE_CONFIG } from '@/config/constants';
import type { TransactionVerificationResult } from '@/types/solana';

/**
 * Poll for transaction confirmation
 * 
 * Polls RPC every 500ms for up to 10 seconds to handle RPC latency
 * 
 * @param txnHash - Transaction signature
 * @returns Promise<any | null> - Transaction object or null if not found
 */
export async function pollForTransaction(txnHash: string): Promise<any | null> {
  const { POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } = PURCHASE_CONFIG;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    try {
      const transaction = await paymentConnection.getTransaction(txnHash, {
        maxSupportedTransactionVersion: 0,
      });

      if (transaction) {
        return transaction;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      console.error(`Transaction poll attempt ${attempt + 1} failed:`, error);
    }
  }

  return null; // Timeout
}

/**
 * Verify transaction details
 * 
 * Checks that the transaction:
 * - Exists on-chain
 * - Has correct recipient
 * - Has correct amount
 * - Was successful
 * 
 * @param txnHash - Transaction signature
 * @param expectedRecipient - Expected recipient wallet address
 * @param expectedAmount - Expected USDC amount (in lamports or smallest unit)
 * @returns Promise<TransactionVerificationResult>
 */
export async function verifyTransaction(
  txnHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<TransactionVerificationResult> {
  try {
    // Poll for transaction (handles RPC latency)
    const transaction = await pollForTransaction(txnHash);

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found (timeout after 10s)',
      };
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      return {
        success: false,
        error: 'Transaction failed on-chain',
      };
    }

    // Parse transaction to get recipient and amount
    // Note: This is simplified - actual implementation would parse
    // the SPL token transfer instruction from the transaction
    const { recipient, amount } = parseTransaction(transaction);

    // Verify recipient matches
    if (recipient !== expectedRecipient) {
      return {
        success: false,
        error: 'Recipient mismatch',
      };
    }

    // Verify amount matches (with small tolerance for rounding)
    const amountDiff = Math.abs(amount - expectedAmount);
    const tolerance = 0.01; // Allow 1 cent difference

    if (amountDiff > tolerance) {
      return {
        success: false,
        error: 'Amount mismatch',
      };
    }

    // All checks passed
    return {
      success: true,
      recipient,
      amount,
      token: 'USDC',
    };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse transaction to extract recipient and amount
 * 
 * This is a simplified implementation. In production, you'd parse
 * the actual SPL token transfer instruction from the transaction.
 * 
 * @param transaction - Transaction object from RPC
 * @returns {recipient: string, amount: number}
 */
function parseTransaction(transaction: any): { recipient: string; amount: number } {
  // TODO: Implement proper SPL token transfer parsing
  // For now, return placeholder values
  
  // In a real implementation, you would:
  // 1. Find the SPL token transfer instruction
  // 2. Parse the instruction data to get destination and amount
  // 3. Convert lamports to USDC (divide by 10^6 for USDC)

  return {
    recipient: 'placeholder', // Would be parsed from transaction
    amount: 0, // Would be parsed from transaction
  };
}

/**
 * Check for recent duplicate purchases
 * 
 * Prevents double-pay by checking if buyer already purchased this listing
 * in the last hour
 * 
 * @param listingId - Listing ID
 * @param buyerWallet - Buyer wallet address
 * @returns Promise<boolean> - True if duplicate purchase detected
 */
export async function checkDuplicatePurchase(
  listingId: string,
  buyerWallet: string
): Promise<boolean> {
  // This would query the Transactions collection in MongoDB
  // Implemented in the actual purchase API route
  return false;
}

/**
 * Get transaction status
 * 
 * @param txnHash - Transaction signature
 * @returns Promise<string> - Status: 'confirmed', 'finalized', or 'not_found'
 */
export async function getTransactionStatus(txnHash: string): Promise<string> {
  try {
    const status = await paymentConnection.getSignatureStatus(txnHash);
    
    if (!status.value) {
      return 'not_found';
    }

    if (status.value.confirmationStatus === 'finalized') {
      return 'finalized';
    }

    return 'confirmed';
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return 'not_found';
  }
}

