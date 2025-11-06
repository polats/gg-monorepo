import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnection } from '../index';
import { setupWalletTestEnvironment, mockMiniKit, simulateWalletConnection } from '@/__tests__/setup/wallet-test-utils';

// Setup test environment
setupWalletTestEnvironment();

describe('WalletConnection Component', () => {
  describe('Disconnected State', () => {
    it('should render connect button when wallet is not connected', () => {
      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('should show loading state when connecting', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockResolvedValue({
        status: 'success',
        address: '0x1234567890',
      });

      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });

    it('should handle MiniKit not installed error', async () => {
      mockMiniKit.isInstalled.mockReturnValue(false);

      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/world app required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Connected State', () => {
    beforeEach(async () => {
      await simulateWalletConnection('active-user');
    });

    it('should display wallet address when connected', async () => {
      render(<WalletConnection />);

      await waitFor(() => {
        expect(screen.getByText(/0xactive/i)).toBeInTheDocument();
      });
    });

    it('should display wallet balance', async () => {
      render(<WalletConnection />);

      await waitFor(() => {
        expect(screen.getByText(/100\.00 WLD/i)).toBeInTheDocument();
      });
    });

    it('should show disconnect button when connected', async () => {
      render(<WalletConnection />);

      await waitFor(() => {
        const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
        expect(disconnectButton).toBeInTheDocument();
      });
    });

    it('should handle balance refresh', async () => {
      render(<WalletConnection />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
        expect(screen.getByTestId('balance-loading')).toBeInTheDocument();
      });
    });
  });

  describe('Session Persistence', () => {
    it('should save connection to localStorage', async () => {
      const { rerender } = render(<WalletConnection />);

      // Connect wallet
      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        const session = localStorage.getItem('worldWalletSession');
        expect(session).toBeTruthy();

        const parsedSession = JSON.parse(session!);
        expect(parsedSession.walletAddress).toBeDefined();
      });
    });

    it('should restore connection from localStorage on mount', async () => {
      // Set up localStorage with a session
      const mockSession = {
        walletAddress: '0xactive000000000000000000000000000000000',
        sessionId: 'test-session',
        autoConnect: true,
        mockUserId: 'active-user',
      };
      localStorage.setItem('worldWalletSession', JSON.stringify(mockSession));

      render(<WalletConnection />);

      await waitFor(() => {
        expect(screen.queryByText(/connect world wallet/i)).not.toBeInTheDocument();
        expect(screen.getByText(/100\.00 WLD/i)).toBeInTheDocument();
      });
    });

    it('should clear localStorage on disconnect', async () => {
      await simulateWalletConnection('active-user');

      render(<WalletConnection />);

      await waitFor(async () => {
        const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
        fireEvent.click(disconnectButton);

        await waitFor(() => {
          const session = localStorage.getItem('worldWalletSession');
          expect(session).toBeNull();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on connection failure', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(new Error('Authentication failed'));

      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });
    });

    it('should display error message on balance fetch failure', async () => {
      await simulateWalletConnection('active-user');
      mockMiniKit.user = null; // Simulate balance fetch failure

      render(<WalletConnection />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/unable to load balance/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(new Error('Network error'));

      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mock Mode', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_MOCK_MODE;
    });

    it('should work with mock mode enabled', async () => {
      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/100\.00 WLD/i)).toBeInTheDocument();
      });
    });

    it('should allow switching between mock users', async () => {
      localStorage.setItem('mockUserId', 'power-user');

      render(<WalletConnection />);

      const connectButton = screen.getByRole('button', { name: /connect world wallet/i });
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/1000\.00 WLD/i)).toBeInTheDocument();
      });
    });
  });
});