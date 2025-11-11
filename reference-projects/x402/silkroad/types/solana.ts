/**
 * Solana-Specific Types
 * 
 * Types for Solana blockchain interactions
 */

import { PublicKey, Connection } from '@solana/web3.js';

// ============================================
// Token Account
// ============================================
export interface TokenAccountInfo {
  pubkey: PublicKey;
  account: {
    data: {
      parsed: {
        info: {
          tokenAmount: {
            uiAmount: number;
            amount: string;
            decimals: number;
          };
          mint: string;
          owner: string;
        };
      };
    };
  };
}

// ============================================
// Token Gating
// ============================================
export interface TokenBalanceResult {
  total: number;
  accounts: TokenAccountInfo[];
  meetsRequirement: boolean;
  required: number;
}

// ============================================
// Transaction Verification
// ============================================
export interface TransactionVerificationResult {
  success: boolean;
  recipient?: string;
  amount?: number;
  token?: string;
  error?: string;
}

// ============================================
// RPC Configuration
// ============================================
export interface RPCConfig {
  mainnet: Connection;
  devnet: Connection;
}

// ============================================
// SIWS (Sign-In With Solana) Message
// ============================================
export interface SIWSMessage {
  message: string;
  nonce: string;
  timestamp: number;
}

export interface SIWSVerification {
  valid: boolean;
  publicKey?: PublicKey;
  error?: string;
}

