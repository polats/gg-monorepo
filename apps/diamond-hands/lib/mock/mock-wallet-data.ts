import { WalletUser, WalletConnection, WalletBalance, WalletError } from '@/types/wallet';

// Mock wallet configurations for different user personas
export const MOCK_WALLET_CONFIGS = {
  'new-user': {
    balance: 0,
    canPay: false,
    canReceive: true,
    description: 'New user with no balance',
  },
  'active-user': {
    balance: 500,
    canPay: true,
    canReceive: true,
    description: 'Standard user with moderate balance',
  },
  'power-user': {
    balance: 1000,
    canPay: true,
    canReceive: true,
    description: 'Power user with high balance',
  },
  'vip-user': {
    balance: 10000,
    canPay: true,
    canReceive: true,
    description: 'VIP user with very high balance',
  },
  'problem-user': {
    balance: 0.01,
    canPay: false,
    canReceive: true,
    description: 'User with insufficient balance for most operations',
  },
} as const;

// Generate mock wallet address based on user ID
export const generateMockAddress = (userId: string): string => {
  const prefix = '0x';
  const userHash = userId.replace('-', '').padEnd(40, '0');
  return prefix + userHash;
};

// Generate mock wallet user
export const generateMockWalletUser = (userId: keyof typeof MOCK_WALLET_CONFIGS): WalletUser => {
  const config = MOCK_WALLET_CONFIGS[userId];
  return {
    address: generateMockAddress(userId),
    username: userId.replace('-', '_'),
    profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    balance: config.balance,
  };
};

// Generate mock wallet connection
export const generateMockWalletConnection = (
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  isConnected = true
): WalletConnection => {
  return {
    address: isConnected ? generateMockAddress(userId) : '',
    isConnected,
    connectionTimestamp: isConnected ? Date.now() : 0,
    lastRefreshTimestamp: isConnected ? Date.now() : 0,
  };
};

// Generate mock wallet balance
export const generateMockWalletBalance = (
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  isLoading = false,
  error: string | null = null
): WalletBalance => {
  const config = MOCK_WALLET_CONFIGS[userId];
  return {
    amount: config.balance,
    formatted: `${config.balance.toFixed(2)} WLD`,
    lastUpdated: new Date(),
    isLoading,
    error,
  };
};

// Simulate wallet authentication with delay
export const simulateMockWalletAuth = async (
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  options: {
    delay?: number;
    shouldFail?: boolean;
    failureReason?: string;
  } = {}
): Promise<WalletUser> => {
  const { delay = 500, shouldFail = false, failureReason = 'Authentication failed' } = options;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (shouldFail) {
    throw new Error(failureReason);
  }

  return generateMockWalletUser(userId);
};

// Simulate balance refresh with delay
export const simulateMockBalanceRefresh = async (
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  options: {
    delay?: number;
    shouldFail?: boolean;
    newBalance?: number;
  } = {}
): Promise<WalletBalance> => {
  const { delay = 300, shouldFail = false, newBalance } = options;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (shouldFail) {
    return generateMockWalletBalance(userId, false, 'Failed to fetch balance');
  }

  const config = MOCK_WALLET_CONFIGS[userId];
  const amount = newBalance !== undefined ? newBalance : config.balance;

  return {
    amount,
    formatted: `${amount.toFixed(2)} WLD`,
    lastUpdated: new Date(),
    isLoading: false,
    error: null,
  };
};

// Generate mock transaction history
export const generateMockTransactionHistory = (userId: keyof typeof MOCK_WALLET_CONFIGS) => {
  const baseTransactions = [
    { type: 'deposit', amount: 50, timestamp: Date.now() - 86400000, description: 'Initial deposit' },
    { type: 'game', amount: -10, timestamp: Date.now() - 72000000, description: 'Diamond Hands entry' },
    { type: 'win', amount: 25, timestamp: Date.now() - 36000000, description: 'Diamond Hands win' },
  ];

  const config = MOCK_WALLET_CONFIGS[userId];

  // Filter transactions based on user balance
  if (config.balance === 0) {
    return [];
  } else if (config.balance < 10) {
    return baseTransactions.slice(0, 1);
  } else if (config.balance < 100) {
    return baseTransactions.slice(0, 2);
  }

  return baseTransactions;
};

// Mock error scenarios
export const MOCK_WALLET_ERRORS: Record<string, WalletError> = {
  NOT_INSTALLED: {
    code: 'MINIKIT_NOT_INSTALLED',
    message: 'World App is required to connect your wallet',
    details: { helpUrl: 'https://worldcoin.org/download' },
  },
  AUTH_FAILED: {
    code: 'AUTH_FAILED',
    message: 'Failed to authenticate with World Wallet',
    details: { retry: true },
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error occurred. Please check your connection',
    details: { retry: true },
  },
  INSUFFICIENT_BALANCE: {
    code: 'INVALID_REQUEST',
    message: 'Insufficient balance for this operation',
    details: { required: 100, available: 0 },
  },
};

// Helper to check if user can perform an action
export const canUserPerformAction = (
  userId: keyof typeof MOCK_WALLET_CONFIGS,
  action: 'pay' | 'receive',
  amount?: number
): boolean => {
  const config = MOCK_WALLET_CONFIGS[userId];

  if (action === 'receive') {
    return config.canReceive;
  }

  if (action === 'pay') {
    if (!config.canPay) return false;
    if (amount !== undefined) {
      return config.balance >= amount;
    }
    return true;
  }

  return false;
};

// Export mock delay constants for consistent testing
export const MOCK_DELAYS = {
  AUTH: 500,
  BALANCE_REFRESH: 300,
  DISCONNECT: 200,
  ERROR: 1000,
} as const;