/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletStatusHeader } from '../WalletStatusHeader';
import { MockUserSwitcher } from '../MockUserSwitcher';

// Mock the hooks
jest.mock('@/lib/hooks/useWalletConnection', () => ({
  useWalletConnection: jest.fn(() => ({
    isConnected: true,
    user: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'test_user',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      balance: 100,
    },
    disconnect: jest.fn(),
    connect: jest.fn(),
    status: 'connected',
  })),
}));

jest.mock('@/lib/hooks/useWalletBalance', () => ({
  useWalletBalance: jest.fn(() => ({
    balance: {
      amount: 100,
      formatted: '100.00 WLD',
      lastUpdated: new Date(),
      isLoading: false,
      error: null,
    },
    isLoading: false,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useMockMode', () => ({
  useMockMode: jest.fn(() => ({
    isMockMode: true,
    mockUser: {
      persona: 'active-user',
      username: 'active_user',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: 100,
    },
  })),
}));

// Mock environment
process.env.NEXT_PUBLIC_MOCK_MODE = 'true';

describe('Wallet Integration Components', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Set up mock mode
    localStorage.setItem('mockUserId', 'active-user');
  });

  describe('WalletStatusHeader', () => {
    it('renders wallet connection status in compact mode', () => {
      render(<WalletStatusHeader showBalance={true} showStatus={true} />);

      expect(screen.getByText('🧪')).toBeInTheDocument();
      expect(screen.getByText('test_user')).toBeInTheDocument();
      expect(screen.getByText('100.0 WLD')).toBeInTheDocument();
    });

    it('expands to show detailed information when clicked', async () => {
      render(<WalletStatusHeader showBalance={true} showStatus={true} />);

      // Click to expand
      const header = screen.getByText('test_user').closest('div');
      fireEvent.click(header!);

      await waitFor(() => {
        expect(screen.getByText('Mock Mode Active')).toBeInTheDocument();
        expect(screen.getByText('Persona: active-user')).toBeInTheDocument();
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('shows mock mode indicator when in mock mode', () => {
      render(<WalletStatusHeader showBalance={true} showStatus={true} />);

      expect(screen.getByText('🧪')).toBeInTheDocument();
    });
  });

  describe('MockUserSwitcher', () => {
    it('renders persona selector in mock mode', () => {
      render(<MockUserSwitcher compact={false} />);

      expect(screen.getByText('🧪')).toBeInTheDocument();
      expect(screen.getByText('👤 Active User')).toBeInTheDocument();
    });

    it('shows available personas when expanded', async () => {
      render(<MockUserSwitcher compact={false} />);

      // Click to expand
      const trigger = screen.getByText('👤 Active User').closest('button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(screen.getByText('🆕')).toBeInTheDocument(); // New User
        expect(screen.getByText('💪')).toBeInTheDocument(); // Power User
        expect(screen.getByText('⭐')).toBeInTheDocument(); // VIP User
        expect(screen.getByText('⚠️')).toBeInTheDocument(); // Problem User
      });
    });

    it('renders in compact mode with dropdown', () => {
      render(<MockUserSwitcher compact={true} />);

      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveValue('active-user');
    });
  });

  describe('Mock Wallet Operations', () => {
    it('properly validates balance checking functions', () => {
      const { hasSufficientBalance } = require('@/lib/utils/wallet');

      const mockBalance = {
        amount: 100,
        formatted: '100.00 WLD',
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };

      expect(hasSufficientBalance(mockBalance, 50)).toBe(true);
      expect(hasSufficientBalance(mockBalance, 150)).toBe(false);
      expect(hasSufficientBalance(null, 50)).toBe(false);
    });

    it('handles mock persona data correctly', () => {
      const { MOCK_WALLET_CONFIGS } = require('@/lib/mock/mock-wallet-data');

      expect(MOCK_WALLET_CONFIGS['active-user'].balance).toBe(100);
      expect(MOCK_WALLET_CONFIGS['new-user'].balance).toBe(0);
      expect(MOCK_WALLET_CONFIGS['power-user'].balance).toBe(1000);
      expect(MOCK_WALLET_CONFIGS['vip-user'].balance).toBe(10000);
      expect(MOCK_WALLET_CONFIGS['problem-user'].balance).toBe(0.01);
    });
  });

  describe('Mock Mode Integration', () => {
    it('provides consistent mock user experience across components', () => {
      render(
        <div>
          <WalletStatusHeader showBalance={true} showStatus={true} />
          <MockUserSwitcher compact={false} />
        </div>
      );

      // All components should show mock mode indicators
      const mockIndicators = screen.getAllByText('🧪');
      expect(mockIndicators.length).toBeGreaterThan(0);

      // Should show consistent user information
      expect(screen.getByText('test_user')).toBeInTheDocument();
      expect(screen.getByText('👤 Active User')).toBeInTheDocument();
    });

    it('handles mock mode environment properly', () => {
      // Test with mock mode disabled
      process.env.NEXT_PUBLIC_MOCK_MODE = 'false';

      const { useMockMode } = require('@/lib/hooks/useMockMode');
      useMockMode.mockReturnValue({
        isMockMode: false,
        mockUser: null,
      });

      render(<MockUserSwitcher compact={false} />);

      // MockUserSwitcher should not render when not in mock mode
      expect(screen.queryByText('🧪')).not.toBeInTheDocument();

      // Reset for other tests
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });
  });
});