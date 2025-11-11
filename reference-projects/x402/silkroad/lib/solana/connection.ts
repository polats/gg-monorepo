/**
 * Solana RPC Connection Manager
 * 
 * Maintains mainnet connections for:
 * - Token gating ($SRx402 balance checks)
 * - USDC payments (real money transactions)
 */

import { Connection } from '@solana/web3.js';
import type { RPCConfig } from '@/types/solana';
import { CONFIG } from '@/config/constants';

// RPC endpoints from environment config
const MAINNET_RPC = CONFIG.MAINNET_RPC;
const DEVNET_RPC = CONFIG.DEVNET_RPC;

// Connection configuration
const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 60000,
};

/**
 * Mainnet Connection (Token Gating)
 * 
 * Always uses mainnet RPC for checking $SRx402 balance
 */
export const mainnetConnection = new Connection(MAINNET_RPC, CONNECTION_CONFIG);

/**
 * Payment Connection
 * 
 * Always uses mainnet for USDC transactions (real money)
 */
export const paymentConnection = new Connection(MAINNET_RPC, CONNECTION_CONFIG);

/**
 * Get RPC Configuration
 * 
 * @returns {RPCConfig} Dual connection object
 */
export function getRPCConfig(): RPCConfig {
  return {
    mainnet: mainnetConnection,
    devnet: paymentConnection, // Name is semantic; actual network depends on env
  };
}

/**
 * Test RPC Connection
 * 
 * @param connection - Connection to test
 * @returns Promise<boolean> - True if connection is healthy
 */
export async function testConnection(connection: Connection): Promise<boolean> {
  try {
    const version = await connection.getVersion();
    console.log(`✅ RPC connected: Solana v${version['solana-core']}`);
    return true;
  } catch (error) {
    console.error('❌ RPC connection failed:', error);
    return false;
  }
}

/**
 * Get Connection for Environment
 * 
 * Helper to get appropriate connection based on use case
 */
export function getConnection(purpose: 'gating' | 'payment'): Connection {
  return purpose === 'gating' ? mainnetConnection : paymentConnection;
}

