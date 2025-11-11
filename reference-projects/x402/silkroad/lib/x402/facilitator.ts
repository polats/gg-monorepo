/**
 * x402 Facilitator
 * 
 * Verify and settle payments on Solana
 * Adapted from x402 protocol for Solana USDC
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana/connection';
import type {
  VerifyRequest,
  VerifyResponse,
  SettleRequest,
  SettleResponse,
  PaymentPayload,
  SolanaExactPayload,
} from '@/types/x402';
import { X402_VERSION } from '@/types/x402';
import { PURCHASE_CONFIG } from '@/config/constants';

/**
 * Decode payment header from Base64 JSON
 */
function decodePaymentHeader(paymentHeader: string): PaymentPayload | null {
  try {
    const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
    return JSON.parse(decoded) as PaymentPayload;
  } catch (error) {
    console.error('Failed to decode payment header:', error);
    return null;
  }
}

/**
 * Verify payment payload
 * 
 * Checks that:
 * - Signature is valid on-chain
 * - Amount matches requirements
 * - Recipient matches seller wallet
 * - Mint matches USDC
 */
export async function verifyPayment(request: VerifyRequest): Promise<VerifyResponse> {
  try {
    // Decode payment header
    const payload = decodePaymentHeader(request.paymentHeader);
    
    if (!payload) {
      return {
        isValid: false,
        invalidReason: 'Invalid payment header encoding',
      };
    }

    // Verify version
    if (payload.x402Version !== X402_VERSION) {
      return {
        isValid: false,
        invalidReason: `Unsupported x402 version: ${payload.x402Version}`,
      };
    }

    // Verify scheme
    if (payload.scheme !== 'exact') {
      return {
        isValid: false,
        invalidReason: `Unsupported scheme: ${payload.scheme}`,
      };
    }

    // Verify network matches
    if (payload.network !== request.paymentRequirements.network) {
      return {
        isValid: false,
        invalidReason: `Network mismatch: expected ${request.paymentRequirements.network}, got ${payload.network}`,
      };
    }

    // Extract Solana payload
    const solanaPayload = payload.payload as SolanaExactPayload;

    // Verify amount
    const expectedAmount = BigInt(request.paymentRequirements.maxAmountRequired);
    const actualAmount = BigInt(solanaPayload.amount);
    
    if (actualAmount < expectedAmount) {
      return {
        isValid: false,
        invalidReason: `Insufficient amount: expected ${expectedAmount}, got ${actualAmount}`,
      };
    }

    // Verify recipient
    if (solanaPayload.to.toLowerCase() !== request.paymentRequirements.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: `Recipient mismatch: expected ${request.paymentRequirements.payTo}, got ${solanaPayload.to}`,
      };
    }

    // Verify mint (USDC)
    if (solanaPayload.mint.toLowerCase() !== request.paymentRequirements.asset.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: `Asset mismatch: expected ${request.paymentRequirements.asset}, got ${solanaPayload.mint}`,
      };
    }

    // Verify transaction on-chain
    const connection = getConnection('payment');
    const isValidOnChain = await verifyTransactionOnChain(
      connection,
      solanaPayload.signature,
      solanaPayload.from,
      solanaPayload.to,
      solanaPayload.amount,
      solanaPayload.mint
    );

    if (!isValidOnChain) {
      return {
        isValid: false,
        invalidReason: 'Transaction not found or invalid on blockchain',
      };
    }

    return {
      isValid: true,
      invalidReason: null,
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return {
      isValid: false,
      invalidReason: error.message || 'Verification failed',
    };
  }
}

/**
 * Settle payment
 * 
 * For Solana, this just confirms the transaction exists and is valid
 * (payment already happened on-chain, we're just verifying)
 */
export async function settlePayment(request: SettleRequest): Promise<SettleResponse> {
  try {
    // First verify the payment
    const verifyResult = await verifyPayment({
      x402Version: request.x402Version,
      paymentHeader: request.paymentHeader,
      paymentRequirements: request.paymentRequirements,
    });

    if (!verifyResult.isValid) {
      return {
        success: false,
        error: verifyResult.invalidReason,
        txHash: null,
        networkId: null,
      };
    }

    // Decode payload to get transaction hash
    const payload = decodePaymentHeader(request.paymentHeader);
    if (!payload) {
      return {
        success: false,
        error: 'Failed to decode payment header',
        txHash: null,
        networkId: null,
      };
    }

    const solanaPayload = payload.payload as SolanaExactPayload;

    return {
      success: true,
      error: null,
      txHash: solanaPayload.signature,
      networkId: request.paymentRequirements.network,
    };
  } catch (error: any) {
    console.error('Payment settlement error:', error);
    return {
      success: false,
      error: error.message || 'Settlement failed',
      txHash: null,
      networkId: null,
    };
  }
}

/**
 * Verify transaction on Solana blockchain
 * 
 * Polls for transaction confirmation with retry logic
 */
async function verifyTransactionOnChain(
  connection: Connection,
  signature: string,
  from: string,
  to: string,
  amount: string,
  mint: string
): Promise<boolean> {
  try {
    // Poll for transaction with retries
    for (let i = 0; i < PURCHASE_CONFIG.MAX_POLL_ATTEMPTS; i++) {
      try {
        const tx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (tx && tx.meta && !tx.meta.err) {
          // Transaction exists and succeeded
          // TODO: In production, validate the actual transfer details
          // (from, to, amount, mint) by parsing transaction data
          return true;
        }

        // Transaction not found yet, wait and retry
        if (i < PURCHASE_CONFIG.MAX_POLL_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, PURCHASE_CONFIG.POLL_INTERVAL_MS));
        }
      } catch (err) {
        // Transaction not found yet, continue polling
        if (i < PURCHASE_CONFIG.MAX_POLL_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, PURCHASE_CONFIG.POLL_INTERVAL_MS));
        }
      }
    }

    // Transaction not found after all retries
    return false;
  } catch (error) {
    console.error('On-chain verification error:', error);
    return false;
  }
}

/**
 * Check if scheme and network are supported
 */
export function isSupported(scheme: string, network: string): boolean {
  return scheme === 'exact' && (network === 'solana-devnet' || network === 'solana-mainnet');
}

/**
 * Get supported payment schemes and networks
 */
export function getSupported() {
  return {
    kinds: [
      { scheme: 'exact', network: 'solana-devnet' },
      { scheme: 'exact', network: 'solana-mainnet' },
    ],
  };
}

