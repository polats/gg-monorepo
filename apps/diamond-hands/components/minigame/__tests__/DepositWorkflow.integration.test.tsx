/**
 * T010 - Integration Test: DepositWorkflow Wallet Integration
 *
 * This test validates the integration between the DepositWorkflow component
 * and the wallet system, including balance validation, transaction handling,
 * and minigame flow integration based on quickstart.md scenarios.
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
import { DepositWorkflow } from '@/components/minigame/DepositWorkflow';
import { WalletProvider } from '@/lib/providers/WalletProvider';
import { MinigameProvider } from '@/lib/providers/MinigameProvider';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useWalletBalance } from '@/lib/hooks/useWalletBalance';

// Mock the environment for tests
setupWalletTestEnvironment();

// Test wrapper component
const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WalletProvider>
    <MinigameProvider>
      {children}
    </MinigameProvider>
  </WalletProvider>
);

// Helper component to provide wallet context
const WalletConnectedWrapper: React.FC<{
  children: React.ReactNode;
  userId?: string;
}> = ({ children, userId = 'active-user' }) => {
  const { connect } = useWalletConnection();

  React.useEffect(() => {
    // Auto-connect for tests
    connect();
  }, [connect]);

  return <>{children}</>;
};

describe('T010 - DepositWorkflow Wallet Integration', () => {
  const mockLocalStorage = new MockLocalStorage();
  const user = userEvent.setup();

  const mockOnComplete = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    resetWalletMocks();
    mockLocalStorage.clear();
    mockOnComplete.mockClear();
    mockOnBack.mockClear();

    // Reset environment variables
    process.env.NEXT_PUBLIC_MOCK_MODE = 'false';
    process.env.NEXT_PUBLIC_APP_LAUNCHED = 'false'; // Minigame mode

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Default MiniKit setup
    mockMiniKit.isInstalled.mockReturnValue(true);
    mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
      createMockWalletAuthResponse(true, 'active-user')
    );

    // Mock balance API
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Wallet Connection Integration', () => {
    it('should show connect wallet prompt when wallet is not connected', async () => {
      // Mock disconnected state
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(new Error('Not authenticated'));

      render(
        <TestApp>
          <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
        </TestApp>
      );

      // Should show wallet connection prompt
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet to Continue')).toBeInTheDocument();
        expect(screen.getByText(/connect your WorldCoin wallet to start/i)).toBeInTheDocument();
      });

      // Should show connect button
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();

      // Should not show deposit options
      expect(screen.queryByText('Choose Your Deposit')).not.toBeInTheDocument();
    });

    it('should proceed to deposit selection after successful wallet connection', async () => {
      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Should show deposit selection after connection
      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
        expect(screen.getByText(/select how much WLD you want to start with/i)).toBeInTheDocument();
      });

      // Should show preset deposit amounts
      expect(screen.getByRole('button', { name: /10 WLD/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /50 WLD/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /100 WLD/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /500 WLD/i })).toBeInTheDocument();
    });

    it('should handle wallet connection failure gracefully', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(
        new Error('User rejected connection')
      );

      render(
        <TestApp>
          <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
        </TestApp>
      );

      // Try to connect wallet
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText(/user rejected connection/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Balance Validation Integration', () => {
    it('should display current wallet balance', async () => {
      // Mock balance fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 250,
          formatted: '250.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Should show current balance
      await waitFor(() => {
        expect(screen.getByText('Current Balance: 250.00 WLD')).toBeInTheDocument();
      });

      // Should show balance in header
      expect(screen.getByTestId('wallet-balance-display')).toHaveTextContent('250.00 WLD');
    });

    it('should validate deposit amount against wallet balance', async () => {
      // Mock low balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 25,
          formatted: '25.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Balance: 25.00 WLD')).toBeInTheDocument();
      });

      // Try to select amount higher than balance
      const highAmountButton = screen.getByRole('button', { name: /500 WLD/i });
      await user.click(highAmountButton);

      // Should show insufficient balance warning
      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
      expect(screen.getByText(/you only have 25.00 WLD available/i)).toBeInTheDocument();

      // Start Game button should be disabled
      const startButton = screen.getByRole('button', { name: /start game/i });
      expect(startButton).toBeDisabled();
    });

    it('should allow deposit amounts within balance limits', async () => {
      // Mock sufficient balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 1000,
          formatted: '1000.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Balance: 1000.00 WLD')).toBeInTheDocument();
      });

      // Select valid amount
      const validAmountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(validAmountButton);

      // Should show valid selection
      expect(screen.getByText('Starting with: 100 WLD')).toBeInTheDocument();

      // Start Game button should be enabled
      const startButton = screen.getByRole('button', { name: /start game/i });
      expect(startButton).not.toBeDisabled();
    });

    it('should handle custom deposit amount validation', async () => {
      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 150,
          formatted: '150.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Balance: 150.00 WLD')).toBeInTheDocument();
      });

      // Enter custom amount within balance
      const customInput = screen.getByLabelText(/enter custom amount/i);
      await user.clear(customInput);
      await user.type(customInput, '75');

      // Should accept valid custom amount
      expect(screen.getByText('Starting with: 75 WLD')).toBeInTheDocument();

      // Enter amount exceeding balance
      await user.clear(customInput);
      await user.type(customInput, '200');

      // Should show balance warning
      expect(screen.getByText('Exceeds available balance')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeDisabled();
    });
  });

  describe('Transaction Flow Integration', () => {
    it('should handle deposit transaction successfully', async () => {
      // Mock successful payment
      mockMiniKit.commandsAsync.pay = jest.fn().mockResolvedValue({
        status: 'success',
        transactionId: 'tx-123456',
        amount: 100,
      });

      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 500,
          formatted: '500.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Select deposit amount
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      // Start the game (trigger deposit)
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should show transaction processing
      expect(screen.getByText('Processing Transaction...')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-spinner')).toBeInTheDocument();

      // Should complete transaction and proceed to game
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(100);
      });

      // Should call MiniKit pay
      expect(mockMiniKit.commandsAsync.pay).toHaveBeenCalledWith({
        amount: 100,
        currency: 'WLD',
        description: 'RaffleTime Minigame Deposit',
        reference: expect.any(String),
      });
    });

    it('should handle transaction failure gracefully', async () => {
      // Mock failed payment
      mockMiniKit.commandsAsync.pay = jest.fn().mockRejectedValue(
        new Error('User cancelled payment')
      );

      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 500,
          formatted: '500.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Select amount and try to start
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should show transaction error
      await waitFor(() => {
        expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
        expect(screen.getByText(/user cancelled payment/i)).toBeInTheDocument();
      });

      // Should not proceed to game
      expect(mockOnComplete).not.toHaveBeenCalled();

      // Should show retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should show transaction details during processing', async () => {
      let resolvePayment: (value: any) => void;
      const paymentPromise = new Promise(resolve => {
        resolvePayment = resolve;
      });

      mockMiniKit.commandsAsync.pay = jest.fn().mockReturnValue(paymentPromise);

      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 500,
          formatted: '500.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Select amount and start transaction
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should show detailed transaction info
      expect(screen.getByText('Processing Transaction...')).toBeInTheDocument();
      expect(screen.getByText('Amount: 100.00 WLD')).toBeInTheDocument();
      expect(screen.getByText('Type: Minigame Deposit')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-progress')).toBeInTheDocument();

      // Complete the transaction
      act(() => {
        resolvePayment!({
          status: 'success',
          transactionId: 'tx-123456',
          amount: 100,
        });
      });

      // Should show success and proceed
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(100);
      });
    });
  });

  describe('Balance Updates and Refresh', () => {
    it('should refresh balance after deposit transaction', async () => {
      let balanceCallCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        balanceCallCount++;
        const amount = balanceCallCount === 1 ? 500 : 400; // Balance decreases after deposit
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            amount,
            formatted: `${amount}.00 WLD`,
            timestamp: Date.now(),
          }),
        });
      });

      mockMiniKit.commandsAsync.pay = jest.fn().mockResolvedValue({
        status: 'success',
        transactionId: 'tx-123456',
        amount: 100,
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Initial balance
      await waitFor(() => {
        expect(screen.getByText('Current Balance: 500.00 WLD')).toBeInTheDocument();
      });

      // Make deposit
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should refresh balance after transaction
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      // Should have called balance API twice (initial + after transaction)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle balance refresh errors gracefully', async () => {
      // Mock initial balance success, then failure on refresh
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              amount: 500,
              formatted: '500.00 WLD',
              timestamp: Date.now(),
            }),
          });
        }
        return Promise.reject(new Error('Network error'));
      });

      mockMiniKit.commandsAsync.pay = jest.fn().mockResolvedValue({
        status: 'success',
        transactionId: 'tx-123456',
        amount: 100,
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Balance: 500.00 WLD')).toBeInTheDocument();
      });

      // Make deposit
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should proceed to game despite balance refresh failure
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(100);
      });

      // Should show warning about balance refresh failure
      expect(screen.getByText('Balance refresh failed')).toBeInTheDocument();
    });
  });

  describe('Mock Mode Integration', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should simulate deposit flow in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'power-user');

      render(
        <TestApp>
          <WalletConnectedWrapper userId="power-user">
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Should show mock balance
      await waitFor(() => {
        expect(screen.getByText('Current Balance: 1000.00 WLD')).toBeInTheDocument();
      });

      // Should show development mode indicator
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByTestId('mock-mode-badge')).toBeInTheDocument();

      // Select amount
      const amountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(amountButton);

      // Start game (should simulate transaction)
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);

      // Should proceed immediately without real transaction
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(100);
      });

      // Should not call real MiniKit pay
      expect(mockMiniKit.commandsAsync.pay).not.toHaveBeenCalled();
    });

    it('should allow testing different balance scenarios in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'problem-user'); // Low balance user

      render(
        <TestApp>
          <WalletConnectedWrapper userId="problem-user">
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Should show low mock balance
      await waitFor(() => {
        expect(screen.getByText('Current Balance: 0.01 WLD')).toBeInTheDocument();
      });

      // Try to select high amount
      const highAmountButton = screen.getByRole('button', { name: /100 WLD/i });
      await user.click(highAmountButton);

      // Should show insufficient balance in mock mode
      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeDisabled();
    });
  });

  describe('User Experience and Accessibility', () => {
    it('should be keyboard accessible', async () => {
      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 500,
          formatted: '500.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Tab through preset amounts
      await user.tab();
      expect(screen.getByRole('button', { name: /10 WLD/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /50 WLD/i })).toHaveFocus();

      // Select amount with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Starting with: 50 WLD')).toBeInTheDocument();

      // Tab to Start Game button
      const startButton = screen.getByRole('button', { name: /start game/i });
      while (document.activeElement !== startButton) {
        await user.tab();
      }

      expect(startButton).toHaveFocus();
    });

    it('should have proper ARIA labels and announcements', async () => {
      // Mock balance
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          amount: 500,
          formatted: '500.00 WLD',
          timestamp: Date.now(),
        }),
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Check ARIA labels
      const balanceDisplay = screen.getByTestId('wallet-balance-display');
      expect(balanceDisplay).toHaveAttribute('aria-label', 'Current wallet balance');

      const customAmountInput = screen.getByLabelText(/enter custom amount/i);
      expect(customAmountInput).toHaveAttribute('aria-describedby');

      // Check live region for balance updates
      const balanceRegion = screen.getByRole('status');
      expect(balanceRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should show clear error messages and recovery options', async () => {
      // Mock balance fetch failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Should show balance fetch error
      await waitFor(() => {
        expect(screen.getByText('Failed to load balance')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Should show retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Should offer offline mode
      expect(screen.getByRole('button', { name: /continue offline/i })).toBeInTheDocument();
      expect(screen.getByText(/limited functionality/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup subscriptions and timers on unmount', async () => {
      jest.useFakeTimers();

      const { unmount } = render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      // Unmount component
      unmount();

      // Fast-forward time - should not cause memory leaks
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Should not make any API calls after unmount
      expect(global.fetch).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should debounce balance refresh requests', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            amount: 500,
            formatted: '500.00 WLD',
            timestamp: Date.now(),
          }),
        });
      });

      render(
        <TestApp>
          <WalletConnectedWrapper>
            <DepositWorkflow onComplete={mockOnComplete} onBack={mockOnBack} />
          </WalletConnectedWrapper>
        </TestApp>
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Your Deposit')).toBeInTheDocument();
      });

      // Rapidly trigger balance refresh
      const refreshButton = screen.getByTestId('refresh-balance-btn');
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Should debounce to single request
      await waitFor(() => {
        expect(callCount).toBe(2); // Initial + 1 debounced refresh
      });
    });
  });
});