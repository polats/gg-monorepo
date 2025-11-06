import {
  WalletBalance,
  WalletError,
  WalletUser
} from '@/types/wallet';
import {
  MOCK_WALLET_CONFIGS,
  generateMockWalletBalance,
  MOCK_WALLET_ERRORS,
  MOCK_DELAYS
} from './mock-wallet-data';

export interface MockTransactionOptions {
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'claim';
  delay?: number;
  shouldFail?: boolean;
  failureReason?: string;
}

export interface MockTransactionResult {
  success: boolean;
  transactionHash?: string;
  newBalance?: WalletBalance;
  error?: WalletError;
  gasUsed?: number;
  confirmations?: number;
}

/**
 * Simulate a wallet transaction in mock mode
 */
export async function simulateWalletTransaction(
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  options: MockTransactionOptions
): Promise<MockTransactionResult> {
  const { amount, type, delay = MOCK_DELAYS.AUTH, shouldFail = false, failureReason } = options;
  const config = MOCK_WALLET_CONFIGS[userId];

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, delay));

  // Check for failures
  if (shouldFail) {
    const errorMessage = failureReason || 'Transaction failed';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        details: { retry: true }
      }
    };
  }

  // Validate balance for outgoing transactions
  if ((type === 'withdrawal' || type === 'payment') && config.balance < amount) {
    return {
      success: false,
      error: MOCK_WALLET_ERRORS.INSUFFICIENT_BALANCE
    };
  }

  // Simulate different scenarios based on user persona
  if (userId === 'problem-user' && amount > 0.1) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Transaction amount exceeds account limits',
        details: { maxAmount: 0.1 }
      }
    };
  }

  if (userId === 'new-user' && type === 'payment' && amount > 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'New users cannot make payments until account is verified',
        details: { helpUrl: '/verification' }
      }
    };
  }

  // Calculate new balance
  let newBalance = config.balance;
  switch (type) {
    case 'deposit':
    case 'claim':
      newBalance += amount;
      break;
    case 'withdrawal':
    case 'payment':
      newBalance -= amount;
      break;
  }

  // Generate transaction hash
  const transactionHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // Create updated balance object
  const updatedBalance = generateMockWalletBalance(userId, false, null);
  updatedBalance.amount = newBalance;
  updatedBalance.formatted = `${newBalance.toFixed(2)} WLD`;

  return {
    success: true,
    transactionHash,
    newBalance: updatedBalance,
    gasUsed: Math.floor(Math.random() * 50000) + 21000,
    confirmations: Math.floor(Math.random() * 20) + 1,
  };
}

/**
 * Simulate a deposit transaction for the minigame
 */
export async function simulateMinigameDeposit(
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  amount: number
): Promise<MockTransactionResult> {
  return simulateWalletTransaction(userId, {
    amount,
    type: 'payment',
    delay: MOCK_DELAYS.AUTH,
  });
}

/**
 * Simulate a withdrawal/payout from the minigame
 */
export async function simulateMinigamePayout(
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  amount: number
): Promise<MockTransactionResult> {
  return simulateWalletTransaction(userId, {
    amount,
    type: 'claim',
    delay: MOCK_DELAYS.BALANCE_REFRESH,
  });
}

/**
 * Update mock user balance in localStorage for persistence across sessions
 */
export function updateMockUserBalance(
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  newBalance: number
): void {
  try {
    const storageKey = `mock_balance_${userId}`;
    localStorage.setItem(storageKey, newBalance.toString());
  } catch (error) {
    console.warn('Failed to save mock balance:', error);
  }
}

/**
 * Get stored mock user balance from localStorage
 */
export function getStoredMockBalance(
  userId: keyof typeof MOCK_WALLET_CONFIGS
): number | null {
  try {
    const storageKey = `mock_balance_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return parseFloat(stored);
    }
  } catch (error) {
    console.warn('Failed to read stored mock balance:', error);
  }
  return null;
}

/**
 * Reset mock user balance to default
 */
export function resetMockUserBalance(userId: keyof typeof MOCK_WALLET_CONFIGS): void {
  try {
    const storageKey = `mock_balance_${userId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('Failed to reset mock balance:', error);
  }
}

/**
 * Simulate network error for testing error handling
 */
export async function simulateNetworkError(
  delay: number = 2000
): Promise<MockTransactionResult> {
  await new Promise(resolve => setTimeout(resolve, delay));

  return {
    success: false,
    error: MOCK_WALLET_ERRORS.NETWORK_ERROR
  };
}

/**
 * Get mock transaction history for a user
 */
export function getMockTransactionHistory(userId: keyof typeof MOCK_WALLET_CONFIGS) {
  const baseTransactions = [
    {
      id: '1',
      type: 'deposit',
      amount: 100,
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      status: 'completed',
      description: 'Initial deposit',
      hash: '0x1234567890abcdef...',
    },
    {
      id: '2',
      type: 'payment',
      amount: -25,
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      status: 'completed',
      description: 'Diamond Hands entry',
      hash: '0xabcdef1234567890...',
    },
    {
      id: '3',
      type: 'claim',
      amount: 50,
      timestamp: new Date(Date.now() - 21600000), // 6 hours ago
      status: 'completed',
      description: 'Diamond Hands payout',
      hash: '0xfedcba0987654321...',
    },
  ];

  const config = MOCK_WALLET_CONFIGS[userId];

  // Filter based on user type
  switch (userId) {
    case 'new-user':
      return [];
    case 'problem-user':
      return baseTransactions.slice(0, 1);
    case 'active-user':
      return baseTransactions.slice(0, 2);
    case 'power-user':
    case 'vip-user':
      return baseTransactions;
    default:
      return baseTransactions.slice(0, 2);
  }
}

/**
 * Mock wallet operation errors for testing
 */
export const MOCK_OPERATION_ERRORS = {
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  USER_CANCELLED: 'user_cancelled',
  NETWORK_ERROR: 'network_error',
  VERIFICATION_FAILED: 'verification_failed',
  TRANSACTION_TIMEOUT: 'transaction_timeout',
} as const;

/**
 * Trigger specific error scenarios for testing
 */
export async function triggerMockError(
  errorType: keyof typeof MOCK_OPERATION_ERRORS,
  delay: number = 1000
): Promise<MockTransactionResult> {
  await new Promise(resolve => setTimeout(resolve, delay));

  switch (errorType) {
    case 'INSUFFICIENT_FUNDS':
      return {
        success: false,
        error: MOCK_WALLET_ERRORS.INSUFFICIENT_BALANCE
      };
    case 'USER_CANCELLED':
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'User cancelled the transaction',
          details: { userCancelled: true }
        }
      };
    case 'NETWORK_ERROR':
      return {
        success: false,
        error: MOCK_WALLET_ERRORS.NETWORK_ERROR
      };
    case 'VERIFICATION_FAILED':
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Identity verification failed',
          details: { helpUrl: '/help/verification' }
        }
      };
    case 'TRANSACTION_TIMEOUT':
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Transaction timed out. Please try again.',
          details: { retry: true, timeout: true }
        }
      };
    default:
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Unknown error occurred',
        }
      };
  }
}