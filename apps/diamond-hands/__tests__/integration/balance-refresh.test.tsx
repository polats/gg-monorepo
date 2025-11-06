/**
 * T008 - Integration Test: Balance Refresh Flow
 *
 * This test validates the complete balance refresh functionality including
 * real-time updates, error handling, cache management, and user feedback.
 * Tests both automatic and manual refresh scenarios from quickstart.md.
 *
 * IMPORTANT: This test will initially FAIL as implementations don't exist yet.
 * This follows TDD (Test-Driven Development) principles.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  setupWalletTestEnvironment,
  mockMiniKit,
  mockWalletUsers,
  createMockWalletAuthResponse,
  createMockBalanceResponse,
  MockLocalStorage,
  resetWalletMocks,
} from '@/__tests__/setup/wallet-test-utils';

// Components under test - these will fail initially (TDD)
import { WalletBalance } from '@/components/WalletConnection/WalletBalance';
import { BalanceRefreshButton } from '@/components/WalletConnection/BalanceRefreshButton';
import { WalletProvider } from '@/lib/providers/WalletProvider';
import { useWalletBalance } from '@/lib/hooks/useWalletBalance';

// Mock the environment for tests
setupWalletTestEnvironment();

// Test component that uses the balance hook
const TestBalanceComponent: React.FC = () => {
  const { balance, refresh, isRefreshing, error, lastUpdated } = useWalletBalance();

  return (
    <div>
      <div data-testid="balance-amount">{balance?.formatted || 'No balance'}</div>
      <div data-testid="balance-status">
        {isRefreshing ? 'Refreshing...' : 'Ready'}
      </div>
      <div data-testid="last-updated">
        {lastUpdated ? new Date(lastUpdated).toISOString() : 'Never'}
      </div>
      <div data-testid="error-message">{error?.message || 'No error'}</div>
      <button onClick={refresh} data-testid="manual-refresh">
        Refresh Balance
      </button>
    </div>
  );
};

// Test wrapper component
const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WalletProvider>
    <div>
      <WalletBalance />
      <BalanceRefreshButton />
      {children}
    </div>
  </WalletProvider>
);

describe('T008 - Balance Refresh Integration', () => {
  const mockLocalStorage = new MockLocalStorage();
  const user = userEvent.setup();

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

    // Setup connected wallet state
    mockMiniKit.isInstalled.mockReturnValue(true);
    mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
      createMockWalletAuthResponse(true, 'active-user')
    );

    // Mock balance API calls
    mockMiniKit.commandsAsync.pay = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Balance Loading', () => {
    it('should load balance automatically after wallet connection', async () => {
      // Mock successful balance fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          amount: 100,
          formatted: '100.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance load
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      }, { timeout: 3000 });

      // Should show last updated timestamp
      const lastUpdated = screen.getByTestId('last-updated').textContent;
      expect(lastUpdated).not.toBe('Never');
      expect(new Date(lastUpdated!).getTime()).toBeGreaterThan(Date.now() - 5000);
    });

    it('should show loading state during initial balance fetch', async () => {
      let resolveBalance: (value: any) => void;
      const balancePromise = new Promise(resolve => {
        resolveBalance = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce({
        ok: true,
        json: () => balancePromise,
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Should show loading state
      expect(screen.getByTestId('balance-status')).toHaveTextContent('Refreshing...');
      expect(screen.getByTestId('balance-amount')).toHaveTextContent('No balance');

      // Should show loading spinner
      expect(screen.getByTestId('balance-spinner')).toBeInTheDocument();

      // Resolve the balance
      act(() => {
        resolveBalance!({
          amount: 150,
          formatted: '150.00 WLD',
          timestamp: Date.now(),
        });
      });

      // Should show loaded balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('150.00 WLD');
        expect(screen.getByTestId('balance-status')).toHaveTextContent('Ready');
      });

      expect(screen.queryByTestId('balance-spinner')).not.toBeInTheDocument();
    });

    it('should handle balance fetch failure gracefully', async () => {
      // Mock failed balance fetch
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('No balance');
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Manual Balance Refresh', () => {
    it('should refresh balance when user clicks refresh button', async () => {
      // Mock initial balance
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 125,
            formatted: '125.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show refreshing state
      expect(screen.getByTestId('balance-status')).toHaveTextContent('Refreshing...');

      // Should update to new balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('125.00 WLD');
        expect(screen.getByTestId('balance-status')).toHaveTextContent('Ready');
      });

      // Should have made two API calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should disable refresh button during refresh', async () => {
      let resolveBalance: (value: any) => void;
      const balancePromise = new Promise(resolve => {
        resolveBalance = resolve;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockReturnValueOnce({
          ok: true,
          json: () => balancePromise,
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();
      expect(screen.getByTestId('balance-status')).toHaveTextContent('Refreshing...');

      // Resolve the refresh
      act(() => {
        resolveBalance!({
          amount: 110,
          formatted: '110.00 WLD',
          timestamp: Date.now(),
        });
      });

      // Button should be enabled again
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
        expect(screen.getByTestId('balance-status')).toHaveTextContent('Ready');
      });
    });

    it('should show user feedback on successful refresh', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 200,
            formatted: '200.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show success feedback
      await waitFor(() => {
        expect(screen.getByText('Balance updated')).toBeInTheDocument();
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Should show balance change notification
      expect(screen.getByText('+100.00 WLD')).toBeInTheDocument();
      expect(screen.getByTestId('balance-change-indicator')).toHaveClass('positive');
    });
  });

  describe('Automatic Balance Refresh', () => {
    it('should refresh balance automatically on interval', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Clear the initial call
      (global.fetch as jest.Mock).mockClear();

      // Mock updated balance for auto-refresh
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 105,
          formatted: '105.00 WLD',
          timestamp: Date.now(),
        }),
      });

      // Fast-forward time to trigger auto-refresh (30 seconds)
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should auto-refresh balance
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });

    it('should not auto-refresh when app is in background', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 100,
          formatted: '100.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Simulate app going to background
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Clear the initial call
      (global.fetch as jest.Mock).mockClear();

      // Fast-forward time - should not auto-refresh while hidden
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // Simulate app coming back to foreground
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Should refresh when app becomes visible again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });

    it('should refresh balance after transaction completion', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 90,
            formatted: '90.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Simulate a transaction event
      window.dispatchEvent(new CustomEvent('transaction-completed', {
        detail: { type: 'payment', amount: 10 }
      }));

      // Should automatically refresh balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('90.00 WLD');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Balance Cache Management', () => {
    it('should cache balance and use cache for quick subsequent requests', async () => {
      const balanceData = {
        amount: 100,
        formatted: '100.00 WLD',
        timestamp: Date.now(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(balanceData),
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance load
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Refresh immediately - should use cache
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show cached balance immediately without loading
      expect(screen.getByTestId('balance-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');

      // Should not make additional API call for cached data
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after timeout', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 110,
            formatted: '110.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Fast-forward past cache timeout (5 minutes)
      act(() => {
        jest.advanceTimersByTime(300000);
      });

      // Refresh after cache timeout - should fetch fresh data
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('110.00 WLD');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should force refresh and bypass cache when requested', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 105,
            formatted: '105.00 WLD',
            timestamp: Date.now(),
          }),
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Force refresh (e.g., double-click or Ctrl+click)
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton, { ctrlKey: true });

      // Should bypass cache and fetch fresh data
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('105.00 WLD');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during refresh', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockRejectedValueOnce(new Error('Network unavailable'));

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Try to refresh - should fail
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show error but keep old balance
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network unavailable');
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Should show error toast
      expect(screen.getByText('Failed to refresh balance')).toBeInTheDocument();
      expect(screen.getByTestId('error-toast')).toBeInTheDocument();
    });

    it('should handle server errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Try to refresh - should fail with server error
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show appropriate error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/server error/i);
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should implement exponential backoff for failed retries', async () => {
      jest.useFakeTimers();

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            amount: 100,
            formatted: '100.00 WLD',
            timestamp: Date.now(),
          }),
        });
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Initial load should fail and start retries
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Temporary failure');
      });

      // Fast-forward through retry intervals (1s, 2s, 4s)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      expect(callCount).toBe(4); // Initial + 3 retries

      jest.useRealTimers();
    });
  });

  describe('Real-time Balance Updates', () => {
    it('should update balance when receiving WebSocket updates', async () => {
      // Mock WebSocket connection
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
      };
      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 100,
          formatted: '100.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial balance
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      // Simulate WebSocket balance update
      const balanceUpdateEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'balance_update',
          address: mockWalletUsers['active-user'].address,
          balance: {
            amount: 120,
            formatted: '120.00 WLD',
            timestamp: Date.now(),
          },
        }),
      });

      // Trigger WebSocket message handler
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler(balanceUpdateEvent);
      }

      // Should update balance without API call
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('120.00 WLD');
      });

      // Should show real-time update indicator
      expect(screen.getByTestId('realtime-indicator')).toBeInTheDocument();
      expect(screen.getByText('Live update')).toBeInTheDocument();
    });

    it('should handle WebSocket connection failures gracefully', async () => {
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
      };
      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Simulate WebSocket error
      const errorHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];
      if (errorHandler) {
        errorHandler(new Event('error'));
      }

      // Should fall back to polling
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
      expect(screen.getByText('Checking for updates...')).toBeInTheDocument();
    });
  });

  describe('Mock Mode Balance Testing', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should simulate balance changes in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'power-user');

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Should show mock balance immediately
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('1000.00 WLD');
      });

      // Mock balance refresh should simulate change
      const refreshButton = screen.getByTestId('manual-refresh');
      await user.click(refreshButton);

      // Should show simulated balance change
      await waitFor(() => {
        const balanceText = screen.getByTestId('balance-amount').textContent;
        expect(balanceText).not.toBe('1000.00 WLD');
        expect(balanceText).toMatch(/\d+\.\d{2} WLD/);
      });
    });

    it('should show mock mode indicators', async () => {
      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Should show development mode indicators
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByTestId('mock-balance-badge')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup timers and subscriptions on unmount', async () => {
      jest.useFakeTimers();

      const { unmount } = render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Unmount component
      unmount();

      // Fast-forward time - should not cause any API calls
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Should not have made any calls after unmount
      expect(global.fetch).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should debounce rapid refresh requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 100,
          formatted: '100.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <TestBalanceComponent />
        </TestApp>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('balance-amount')).toHaveTextContent('100.00 WLD');
      });

      const refreshButton = screen.getByTestId('manual-refresh');

      // Rapidly click refresh multiple times
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Should debounce to single request
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 debounced refresh
      });
    });
  });
});