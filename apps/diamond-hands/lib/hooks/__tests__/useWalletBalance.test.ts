import { renderHook, act, waitFor } from '@testing-library/react';
import { useWalletBalance } from '../useWalletBalance';
import {
  setupWalletTestEnvironment,
  mockMiniKit,
  mockWalletBalance,
  mockWalletUsers,
  createMockBalanceResponse,
  MockLocalStorage,
  resetWalletMocks,
} from '@/__tests__/setup/wallet-test-utils';

// Setup test environment
setupWalletTestEnvironment();

describe('useWalletBalance', () => {
  const mockLocalStorage = new MockLocalStorage();

  beforeEach(() => {
    resetWalletMocks();
    mockLocalStorage.clear();

    // Reset environment variables
    process.env.NEXT_PUBLIC_MOCK_MODE = 'false';

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default balance state', () => {
      const { result } = renderHook(() => useWalletBalance());

      expect(result.current.balance).toEqual({
        amount: 0,
        formatted: '0.00 WLD',
        lastUpdated: expect.any(Date),
        isLoading: false,
        error: null,
      });
      expect(result.current.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with provided wallet address', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      expect(result.current.walletAddress).toBe(testAddress);
    });

    it('should auto-fetch balance when address is provided', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      mockMiniKit.isInstalled.mockReturnValue(true);

      // Mock balance fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: mockWalletUsers['active-user'].balance,
          formatted: `${mockWalletUsers['active-user'].balance.toFixed(2)} WLD`,
        }),
      });

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(result.current.balance.amount).toBe(mockWalletUsers['active-user'].balance);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Balance Fetching', () => {
    it('should fetch balance successfully', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(result.current.balance.amount).toBe(100);
      expect(result.current.balance.formatted).toBe('100.00 WLD');
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toBe('Failed to fetch balance: Network error');
      expect(result.current.balance.amount).toBe(0);
    });

    it('should handle API error responses', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toContain('HTTP error');
      expect(result.current.error).toContain('404');
    });

    it('should update loading state during fetch', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      global.fetch = jest.fn().mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      act(() => {
        result.current.fetchBalance();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');

      act(() => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({
            balance: 100,
            formatted: '100.00 WLD',
          }),
        });
      });

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Balance Formatting', () => {
    it('should format balance correctly for various amounts', async () => {
      const testCases = [
        { amount: 0, expected: '0.00 WLD' },
        { amount: 1, expected: '1.00 WLD' },
        { amount: 1.5, expected: '1.50 WLD' },
        { amount: 1000, expected: '1000.00 WLD' },
        { amount: 1234.567, expected: '1234.57 WLD' },
        { amount: 0.001, expected: '0.00 WLD' },
        { amount: 0.005, expected: '0.01 WLD' },
      ];

      for (const testCase of testCases) {
        const testAddress = mockWalletUsers['active-user'].address;
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            balance: testCase.amount,
            formatted: testCase.expected,
          }),
        });

        const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

        await act(async () => {
          await result.current.fetchBalance();
        });

        await waitFor(() => {
          expect(result.current.balance.formatted).toBe(testCase.expected);
        });
      }
    });

    it('should handle custom formatting options', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 1234.567,
          formatted: '1,234.57 WLD',
        }),
      });

      const { result } = renderHook(() =>
        useWalletBalance({
          address: testAddress,
          formatOptions: { useGrouping: true, minimumFractionDigits: 2 }
        })
      );

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.balance.formatted).toBe('1,234.57 WLD');
      });
    });
  });

  describe('Auto-refresh and Polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh balance at specified intervals', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: callCount * 10,
            formatted: `${(callCount * 10).toFixed(2)} WLD`,
          }),
        });
      });

      const { result } = renderHook(() =>
        useWalletBalance({
          address: testAddress,
          autoRefresh: true,
          refreshInterval: 5000
        })
      );

      // Initial fetch
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(callCount).toBe(1);
      expect(result.current.balance.amount).toBe(10);

      // Fast-forward and check auto-refresh
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(callCount).toBe(2);
      });

      expect(result.current.balance.amount).toBe(20);

      // Another interval
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(callCount).toBe(3);
      });

      expect(result.current.balance.amount).toBe(30);
    });

    it('should pause auto-refresh when tab is not visible', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: callCount * 10,
            formatted: `${(callCount * 10).toFixed(2)} WLD`,
          }),
        });
      });

      // Mock document visibility API
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible',
      });

      const { result } = renderHook(() =>
        useWalletBalance({
          address: testAddress,
          autoRefresh: true,
          refreshInterval: 1000,
          pauseWhenHidden: true
        })
      );

      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(callCount).toBe(1);

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });

      document.dispatchEvent(new Event('visibilitychange'));

      // Fast-forward time - should not trigger refresh
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(callCount).toBe(1); // Should not increase

      // Make tab visible again
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
      });

      document.dispatchEvent(new Event('visibilitychange'));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(callCount).toBe(2);
      });
    });

    it('should stop auto-refresh on unmount', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: callCount * 10,
            formatted: `${(callCount * 10).toFixed(2)} WLD`,
          }),
        });
      });

      const { result, unmount } = renderHook(() =>
        useWalletBalance({
          address: testAddress,
          autoRefresh: true,
          refreshInterval: 1000
        })
      );

      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(callCount).toBe(1);

      unmount();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not increase after unmount
      expect(callCount).toBe(1);
    });
  });

  describe('Mock Mode Support', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should use mock balance data in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');
      const testAddress = mockWalletUsers['active-user'].address;

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(result.current.balance.amount).toBe(mockWalletUsers['active-user'].balance);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle different mock users', async () => {
      const testCases = ['new-user', 'power-user', 'vip-user', 'problem-user'];

      for (const userId of testCases) {
        mockLocalStorage.setItem('raffletime_mock_user', userId);
        const testAddress = mockWalletUsers[userId as keyof typeof mockWalletUsers].address;

        const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

        await act(async () => {
          await result.current.fetchBalance();
        });

        await waitFor(() => {
          expect(result.current.status).toBe('loaded');
        });

        expect(result.current.balance.amount).toBe(
          mockWalletUsers[userId as keyof typeof mockWalletUsers].balance
        );
      }
    });

    it('should simulate balance updates in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');
      const testAddress = mockWalletUsers['active-user'].address;

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      const initialBalance = result.current.balance.amount;

      // Simulate spending
      await act(async () => {
        result.current.updateMockBalance(initialBalance - 10);
      });

      expect(result.current.balance.amount).toBe(initialBalance - 10);
      expect(result.current.balance.formatted).toBe(`${(initialBalance - 10).toFixed(2)} WLD`);
    });

    it('should handle mock mode errors', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'invalid-user');
      const testAddress = '0xinvalid000000000000000000000000000000000';

      const { result } = renderHook(() => useWalletBalance({ address: testAddress }));

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toContain('Mock user not found');
    });
  });

  describe('Cache Management', () => {
    it('should cache balance data', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, cacheTime: 5000 })
      );

      // First fetch
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second fetch within cache time - should use cache
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only one call
    });

    it('should invalidate cache after expiry', async () => {
      jest.useFakeTimers();

      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, cacheTime: 1000 })
      );

      // First fetch
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fast-forward past cache expiry
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Second fetch after cache expiry - should make new request
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should clear cache manually', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, cacheTime: 5000 })
      );

      // First fetch
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Second fetch after cache clear - should make new request
      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should retry on transient errors', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      let callCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: 100,
            formatted: '100.00 WLD',
          }),
        });
      });

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, retryAttempts: 3 })
      );

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(callCount).toBe(3);
      expect(result.current.balance.amount).toBe(100);
    });

    it('should handle exponential backoff', async () => {
      jest.useFakeTimers();

      const testAddress = mockWalletUsers['active-user'].address;
      let callCount = 0;
      const callTimes: number[] = [];

      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        callTimes.push(Date.now());

        if (callCount < 4) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: 100,
            formatted: '100.00 WLD',
          }),
        });
      });

      const { result } = renderHook(() =>
        useWalletBalance({
          address: testAddress,
          retryAttempts: 4,
          retryDelay: 1000,
          useExponentialBackoff: true
        })
      );

      act(() => {
        result.current.fetchBalance();
      });

      // Advance timers to trigger retries
      for (let i = 0; i < 4; i++) {
        act(() => {
          jest.advanceTimersByTime(Math.pow(2, i) * 1000);
        });
      }

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(callCount).toBe(4);

      jest.useRealTimers();
    });

    it('should give up after max retry attempts', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() =>
        useWalletBalance({ address: testAddress, retryAttempts: 2 })
      );

      await act(async () => {
        await result.current.fetchBalance();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.current.error).toContain('Persistent error');
    });
  });

  describe('Integration with Wallet Connection', () => {
    it('should work with wallet connection state', async () => {
      const testAddress = mockWalletUsers['active-user'].address;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      // Mock wallet connection state
      const mockWalletConnection = {
        address: testAddress,
        isConnected: true,
      };

      const { result } = renderHook(() =>
        useWalletBalance({
          walletConnection: mockWalletConnection,
          autoFetch: true
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('loaded');
      });

      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.balance.amount).toBe(100);
    });

    it('should handle wallet disconnection', async () => {
      const { result, rerender } = renderHook(
        ({ walletConnection }) => useWalletBalance({ walletConnection }),
        {
          initialProps: {
            walletConnection: {
              address: mockWalletUsers['active-user'].address,
              isConnected: true,
            },
          },
        }
      );

      // Connect and fetch balance
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balance: 100,
          formatted: '100.00 WLD',
        }),
      });

      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(result.current.balance.amount).toBe(100);

      // Disconnect wallet
      rerender({
        walletConnection: {
          address: '',
          isConnected: false,
        },
      });

      expect(result.current.walletAddress).toBe('');
      expect(result.current.balance.amount).toBe(0);
    });
  });
});