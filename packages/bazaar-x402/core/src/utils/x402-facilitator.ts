/**
 * X402 Facilitator
 * 
 * Handles payment verification for x402 protocol on Solana blockchain
 */

import { Connection, PublicKey } from '@solana/web3.js';
import type {
  PaymentPayload,
  SolanaNetwork,
  VerificationResult,
} from '../types/payment.js';
import { X402_VERSION } from '../types/payment.js';
import { decodePaymentHeader, isValidPaymentPayload } from './x402.js';

/**
 * Configuration for X402Facilitator
 */
export interface X402FacilitatorConfig {
  /** Solana network to use */
  network: SolanaNetwork;
  
  /** RPC endpoint for devnet */
  devnetRpcUrl: string;
  
  /** RPC endpoint for mainnet */
  mainnetRpcUrl: string;
  
  /** USDC mint address for devnet */
  usdcMintDevnet: string;
  
  /** USDC mint address for mainnet */
  usdcMintMainnet: string;
  
  /** Maximum polling attempts for transaction confirmation */
  maxPollAttempts: number;
  
  /** Interval between polling attempts (milliseconds) */
  pollIntervalMs: number;
}

/**
 * Parameters for verifying payment with facilitator
 */
export interface FacilitatorVerifyParams {
  /** Base64-encoded payment payload from X-Payment header */
  paymentHeader: string;
  
  /** Expected payment amount in USDC */
  expectedAmount: number;
  
  /** Expected recipient wallet address */
  expectedRecipient: string;
  
  /** Network to verify against */
  network: SolanaNetwork;
}

/**
 * X402 Facilitator for payment verification
 * 
 * Verifies Solana USDC payments according to x402 protocol
 */
export class X402Facilitator {
  private connection: Connection;
  private config: X402FacilitatorConfig;
  
  constructor(config: X402FacilitatorConfig) {
    this.config = config;
    
    // Initialize Solana connection with network-specific RPC
    const rpcUrl = config.network === 'solana-mainnet'
      ? config.mainnetRpcUrl
      : config.devnetRpcUrl;
    
    this.connection = new Connection(rpcUrl, 'confirmed');
  }
  
  /**
   * Verify payment from X-Payment header
   * 
   * Validates:
   * - Payment header decoding
   * - x402 version
   * - Network match
   * - Amount match
   * - Recipient match
   * - USDC mint match
   * - On-chain transaction existence and success
   * 
   * @param params - Verification parameters
   * @returns Verification result
   */
  async verifyPayment(params: FacilitatorVerifyParams): Promise<VerificationResult> {
    try {
      // Decode payment header
      const payload = decodePaymentHeader(params.paymentHeader);
      
      if (!payload) {
        return {
          success: false,
          txHash: '',
          networkId: params.network,
          error: 'Invalid payment header encoding',
        };
      }
      
      // Validate payload structure
      if (!isValidPaymentPayload(payload)) {
        return {
          success: false,
          txHash: '',
          networkId: params.network,
          error: 'Invalid payment payload structure',
        };
      }
      
      // Verify x402 version
      if (payload.x402Version !== X402_VERSION) {
        return {
          success: false,
          txHash: '',
          networkId: params.network,
          error: `Unsupported x402 version: ${payload.x402Version}`,
        };
      }
      
      // Verify scheme
      if (payload.scheme !== 'exact') {
        return {
          success: false,
          txHash: '',
          networkId: params.network,
          error: `Unsupported payment scheme: ${payload.scheme}`,
        };
      }
      
      // Verify network matches
      if (payload.network !== params.network) {
        return {
          success: false,
          txHash: '',
          networkId: params.network,
          error: `Network mismatch: expected ${params.network}, got ${payload.network}`,
        };
      }
      
      // Verify amount (convert USDC to smallest unit - 6 decimals)
      const expectedAmount = BigInt(Math.floor(params.expectedAmount * 1_000_000));
      const actualAmount = BigInt(payload.payload.amount);
      
      if (actualAmount < expectedAmount) {
        return {
          success: false,
          txHash: payload.payload.signature,
          networkId: params.network,
          error: `Insufficient amount: expected ${expectedAmount}, got ${actualAmount}`,
        };
      }
      
      // Verify recipient wallet
      if (payload.payload.to.toLowerCase() !== params.expectedRecipient.toLowerCase()) {
        return {
          success: false,
          txHash: payload.payload.signature,
          networkId: params.network,
          error: `Recipient mismatch: expected ${params.expectedRecipient}, got ${payload.payload.to}`,
        };
      }
      
      // Verify USDC mint address
      const expectedMint = this.getUsdcMint();
      if (payload.payload.mint.toLowerCase() !== expectedMint.toLowerCase()) {
        return {
          success: false,
          txHash: payload.payload.signature,
          networkId: params.network,
          error: `Token mint mismatch: expected ${expectedMint}, got ${payload.payload.mint}`,
        };
      }
      
      // Verify transaction on-chain
      const isValidOnChain = await this.verifyTransactionOnChain(
        payload.payload.signature,
        payload.payload.from,
        payload.payload.to,
        payload.payload.amount,
        payload.payload.mint
      );
      
      if (!isValidOnChain) {
        return {
          success: false,
          txHash: payload.payload.signature,
          networkId: params.network,
          error: 'Transaction not found or invalid on blockchain',
        };
      }
      
      return {
        success: true,
        txHash: payload.payload.signature,
        networkId: params.network,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        txHash: '',
        networkId: params.network,
        error: `Payment verification failed: ${errorMessage}`,
      };
    }
  }
  
  /**
   * Verify transaction exists on Solana blockchain
   * 
   * Polls for transaction confirmation with retry logic
   * 
   * @param signature - Transaction signature
   * @param from - Sender wallet address
   * @param to - Recipient wallet address
   * @param amount - Transfer amount in smallest unit
   * @param mint - Token mint address
   * @returns True if transaction is valid on-chain
   */
  private async verifyTransactionOnChain(
    signature: string,
    from: string,
    to: string,
    amount: string,
    mint: string
  ): Promise<boolean> {
    try {
      // Poll for transaction with retries
      for (let i = 0; i < this.config.maxPollAttempts; i++) {
        try {
          const tx = await this.connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            // Transaction exists and succeeded
            // In production, you could parse transaction data to validate
            // the actual transfer details (from, to, amount, mint)
            return true;
          }
          
          // Transaction not found yet or failed, wait and retry
          if (i < this.config.maxPollAttempts - 1) {
            await this.sleep(this.config.pollIntervalMs);
          }
        } catch (err) {
          // Transaction not found yet, continue polling
          if (i < this.config.maxPollAttempts - 1) {
            await this.sleep(this.config.pollIntervalMs);
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
   * Get USDC mint address for current network
   */
  private getUsdcMint(): string {
    return this.config.network === 'solana-mainnet'
      ? this.config.usdcMintMainnet
      : this.config.usdcMintDevnet;
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get current network
   */
  getNetwork(): SolanaNetwork {
    return this.config.network;
  }
  
  /**
   * Get Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}
