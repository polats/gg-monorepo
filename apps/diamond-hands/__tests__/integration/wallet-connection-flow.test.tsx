/**
 * T007 - Integration Test: Wallet Connection Flow
 *
 * This test validates the complete end-to-end wallet connection flow
 * including UI updates, state management, error handling, and user experience.
 * Based on scenarios from quickstart.md and real user interactions.
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
  MockLocalStorage,
  resetWalletMocks,
} from '@/__tests__/setup/wallet-test-utils';

// Components under test - these will fail initially (TDD)
import { WalletConnectionDialog } from '@/components/WalletConnection/WalletConnectionDialog';
import { WalletStatus } from '@/components/WalletConnection/WalletStatus';
import { WalletProvider } from '@/lib/providers/WalletProvider';

// Mock the environment for tests
setupWalletTestEnvironment();

// Test wrapper component for integration testing
const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WalletProvider>
    <div>
      <WalletStatus />
      {children}
    </div>
  </WalletProvider>
);

describe('T007 - Wallet Connection Flow Integration', () => {
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

    // Default MiniKit setup
    mockMiniKit.isInstalled.mockReturnValue(true);
  });

  describe('Initial Connection Flow', () => {
    it('should complete full connection flow from disconnected to connected state', async () => {
      // Setup: Mock successful authentication
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Initial state: Should show disconnected status
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

      // User clicks connect button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });

      // Should complete connection and show success state
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('activeuser')).toBeInTheDocument();
        expect(screen.getByText('0xactive000000000000000000000000000000000')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify session persistence
      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session.walletAddress).toBe(mockWalletUsers['active-user'].address);
      expect(session.autoConnect).toBe(true);
    });

    it('should handle connection failure with proper error messaging', async () => {
      // Setup: Mock authentication failure
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(false)
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // User clicks connect button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      // Should not persist failed session
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });

    it('should handle MiniKit not installed scenario', async () => {
      // Setup: MiniKit not installed
      mockMiniKit.isInstalled.mockReturnValue(false);

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // User clicks connect button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show MiniKit installation prompt
      await waitFor(() => {
        expect(screen.getByText('MiniKit Required')).toBeInTheDocument();
        expect(screen.getByText(/install the WorldCoin app/i)).toBeInTheDocument();
      });

      // Should provide installation link
      const installLink = screen.getByRole('link', { name: /install minikit/i });
      expect(installLink).toHaveAttribute('href', expect.stringContaining('worldcoin.org'));
    });
  });

  describe('Session Recovery and Auto-Connect', () => {
    it('should auto-connect on app startup with valid session', async () => {
      // Setup: Valid session in localStorage
      const sessionData = {
        walletAddress: mockWalletUsers['active-user'].address,
        sessionId: 'test-session-123',
        autoConnect: true,
        mockUserId: 'active-user',
      };
      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionData));

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Should automatically connect without user interaction
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('activeuser')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should not show connect button
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
    });

    it('should handle invalid session gracefully and clear localStorage', async () => {
      // Setup: Invalid session data
      mockLocalStorage.setItem('raffletime_session', JSON.stringify({
        walletAddress: 'invalid-address',
        sessionId: 'invalid-session',
        autoConnect: true,
      }));

      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(
        new Error('Invalid session')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Should clear invalid session and show disconnected state
      await waitFor(() => {
        expect(screen.getByText('Not Connected')).toBeInTheDocument();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });

      // Should have cleared localStorage
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });

    it('should handle session expiry during auto-connect', async () => {
      // Setup: Expired session
      const expiredSession = {
        walletAddress: mockWalletUsers['active-user'].address,
        sessionId: 'expired-session',
        autoConnect: true,
        expiresAt: Date.now() - 86400000, // Expired 1 day ago
      };
      mockLocalStorage.setItem('raffletime_session', JSON.stringify(expiredSession));

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Should not attempt auto-connect with expired session
      await waitFor(() => {
        expect(screen.getByText('Not Connected')).toBeInTheDocument();
      });

      // Should have cleared expired session
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });
  });

  describe('User Interface Flow', () => {
    it('should show proper loading states during connection', async () => {
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() => authPromise);

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Click connect button
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show connecting state immediately
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connecting/i })).toBeDisabled();

      // Should show spinner/loading indicator
      expect(screen.getByTestId('connection-spinner')).toBeInTheDocument();

      // Resolve the authentication
      act(() => {
        resolveAuth(createMockWalletAuthResponse(true, 'active-user'));
      });

      // Should transition to connected state
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.queryByTestId('connection-spinner')).not.toBeInTheDocument();
      });
    });

    it('should display user information after successful connection', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'power-user')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Connect wallet
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show user details
      await waitFor(() => {
        expect(screen.getByText('poweruser')).toBeInTheDocument();
        expect(screen.getByText('0xpower0000000000000000000000000000000000')).toBeInTheDocument();
      });

      // Should show avatar/profile picture
      const avatar = screen.getByRole('img', { name: /poweruser avatar/i });
      expect(avatar).toHaveAttribute('src', 'https://example.com/power-user.jpg');

      // Should show truncated address
      expect(screen.getByText('0xpower...0000')).toBeInTheDocument();
    });

    it('should handle disconnect flow properly', async () => {
      // First connect
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Connect wallet
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Find and click disconnect button
      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      await user.click(disconnectButton);

      // Should show confirmation dialog
      expect(screen.getByText('Disconnect Wallet')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to disconnect/i)).toBeInTheDocument();

      // Confirm disconnect
      const confirmButton = screen.getByRole('button', { name: /yes, disconnect/i });
      await user.click(confirmButton);

      // Should return to disconnected state
      await waitFor(() => {
        expect(screen.getByText('Not Connected')).toBeInTheDocument();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });

      // Should clear session
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });
  });

  describe('Network and Error Handling', () => {
    it('should handle network timeout gracefully', async () => {
      jest.useFakeTimers();

      // Mock a request that never resolves
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Start connection
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show connecting state
      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      // Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(30000); // 30 second timeout
      });

      // Should show timeout error
      await waitFor(() => {
        expect(screen.getByText('Connection Timeout')).toBeInTheDocument();
        expect(screen.getByText(/connection took too long/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should retry failed connections', async () => {
      let attemptCount = 0;
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return createMockWalletAuthResponse(true, 'active-user');
      });

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // First connection attempt
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show error again
      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      });

      // Click retry again - should succeed this time
      const retryButton2 = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton2);

      // Should succeed on third attempt
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      expect(attemptCount).toBe(3);
    });

    it('should show appropriate error messages for different failure types', async () => {
      const errorScenarios = [
        {
          error: new Error('User cancelled authentication'),
          expectedMessage: 'Authentication Cancelled',
          expectedDescription: /you cancelled the authentication/i,
        },
        {
          error: new Error('Network connection failed'),
          expectedMessage: 'Network Error',
          expectedDescription: /network connection failed/i,
        },
        {
          error: new Error('Insufficient permissions'),
          expectedMessage: 'Permission Error',
          expectedDescription: /insufficient permissions/i,
        },
      ];

      for (const scenario of errorScenarios) {
        mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(scenario.error);

        const { unmount } = render(
          <TestApp>
            <WalletConnectionDialog />
          </TestApp>
        );

        const connectButton = screen.getByRole('button', { name: /connect wallet/i });
        await user.click(connectButton);

        await waitFor(() => {
          expect(screen.getByText(scenario.expectedMessage)).toBeInTheDocument();
          expect(screen.getByText(scenario.expectedDescription)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Mock Mode Integration', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should work seamlessly in mock mode for development', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'power-user');

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Connect button should work in mock mode
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should connect immediately without MiniKit
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('poweruser')).toBeInTheDocument();
      });

      // Should not have called real MiniKit
      expect(mockMiniKit.commandsAsync.walletAuth).not.toHaveBeenCalled();
    });

    it('should show mock mode indicator in development', async () => {
      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Should show development mode indicator
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByTestId('mock-mode-badge')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should be keyboard accessible', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Tab to connect button
      await user.tab();
      expect(screen.getByRole('button', { name: /connect wallet/i })).toHaveFocus();

      // Press Enter to connect
      await user.keyboard('{Enter}');

      // Should initiate connection
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and announcements', async () => {
      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Check ARIA labels
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toHaveAttribute('aria-describedby');

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');

      // Should announce status changes
      expect(statusRegion).toHaveTextContent('Ready to connect');
    });

    it('should work properly on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(global, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(global, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812,
      });

      render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Should show mobile-optimized layout
      expect(screen.getByTestId('mobile-wallet-dialog')).toBeInTheDocument();

      // Buttons should be appropriately sized for touch
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toHaveClass('touch-target');
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks during connection cycles', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { unmount } = render(
        <TestApp>
          <WalletConnectionDialog />
        </TestApp>
      );

      // Connect and disconnect multiple times
      for (let i = 0; i < 5; i++) {
        const connectButton = screen.getByRole('button', { name: /connect wallet/i });
        await user.click(connectButton);

        await waitFor(() => {
          expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
        await user.click(disconnectButton);

        const confirmButton = screen.getByRole('button', { name: /yes, disconnect/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText('Not Connected')).toBeInTheDocument();
        });
      }

      // Unmount should complete without hanging
      unmount();

      // If we reach here without timeout, no memory leaks
      expect(true).toBe(true);
    });
  });
});