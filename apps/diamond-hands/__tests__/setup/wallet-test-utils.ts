import { WalletConnection, WalletBalance, UserSession, WalletUser } from '@/types/wallet';

// Mock MiniKit for testing
export const mockMiniKit = {
  isInstalled: jest.fn(() => true),
  user: null as WalletUser | null,
  commandsAsync: {
    walletAuth: jest.fn(),
    pay: jest.fn(),
    verify: jest.fn(),
  },
};

// Mock wallet connection data
export const mockWalletConnection: WalletConnection = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
  connectionTimestamp: Date.now(),
  lastRefreshTimestamp: Date.now(),
};

// Mock wallet balance data
export const mockWalletBalance: WalletBalance = {
  amount: 100,
  formatted: '100.00 WLD',
  lastUpdated: new Date(),
  isLoading: false,
  error: null,
};

// Mock user session
export const mockUserSession: UserSession = {
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  sessionId: 'test-session-123',
  autoConnect: true,
  mockUserId: 'active-user',
};

// Mock wallet users for different test scenarios
export const mockWalletUsers = {
  'new-user': {
    address: '0xnew0000000000000000000000000000000000000',
    username: 'newuser',
    profilePicture: 'https://example.com/new-user.jpg',
    balance: 0,
  },
  'active-user': {
    address: '0xactive000000000000000000000000000000000',
    username: 'activeuser',
    profilePicture: 'https://example.com/active-user.jpg',
    balance: 100,
  },
  'power-user': {
    address: '0xpower0000000000000000000000000000000000',
    username: 'poweruser',
    profilePicture: 'https://example.com/power-user.jpg',
    balance: 1000,
  },
  'vip-user': {
    address: '0xvip000000000000000000000000000000000000',
    username: 'vipuser',
    profilePicture: 'https://example.com/vip-user.jpg',
    balance: 10000,
  },
  'problem-user': {
    address: '0xproblem00000000000000000000000000000000',
    username: 'problemuser',
    profilePicture: 'https://example.com/problem-user.jpg',
    balance: 0.01,
  },
};

// Helper to create a mock wallet auth response
export const createMockWalletAuthResponse = (success = true, userId = 'active-user') => {
  if (!success) {
    return Promise.reject(new Error('Authentication failed'));
  }

  const user = mockWalletUsers[userId as keyof typeof mockWalletUsers];
  return Promise.resolve({
    status: 'success',
    address: user.address,
    user,
  });
};

// Helper to create a mock balance response
export const createMockBalanceResponse = (userId = 'active-user') => {
  const user = mockWalletUsers[userId as keyof typeof mockWalletUsers];
  return Promise.resolve({
    amount: user.balance,
    formatted: `${user.balance.toFixed(2)} WLD`,
  });
};

// Helper to reset all mocks
export const resetWalletMocks = () => {
  mockMiniKit.isInstalled.mockClear();
  mockMiniKit.commandsAsync.walletAuth.mockClear();
  mockMiniKit.commandsAsync.pay.mockClear();
  mockMiniKit.commandsAsync.verify.mockClear();
  mockMiniKit.user = null;
};

// Helper to simulate wallet connection flow
export const simulateWalletConnection = async (userId = 'active-user') => {
  const user = mockWalletUsers[userId as keyof typeof mockWalletUsers];
  mockMiniKit.user = user;
  return {
    connection: {
      ...mockWalletConnection,
      address: user.address,
    },
    balance: {
      ...mockWalletBalance,
      amount: user.balance,
      formatted: `${user.balance.toFixed(2)} WLD`,
    },
  };
};

// Helper to simulate localStorage for session persistence
export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Setup global test environment
export const setupWalletTestEnvironment = () => {
  // Mock window.MiniKit
  (global as any).MiniKit = mockMiniKit;

  // Mock localStorage
  const mockLocalStorage = new MockLocalStorage();
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Reset mocks before each test
  beforeEach(() => {
    resetWalletMocks();
    mockLocalStorage.clear();
  });
};