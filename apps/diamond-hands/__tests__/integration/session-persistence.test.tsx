/**
 * T009 - Integration Test: Session Persistence
 *
 * This test validates complete session persistence functionality including
 * auto-connect, session recovery, expiration handling, and security measures.
 * Tests based on real user scenarios from quickstart.md.
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
import { WalletProvider } from '@/lib/providers/WalletProvider';
import { SessionManager } from '@/lib/session/SessionManager';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { WalletStatus } from '@/components/WalletConnection/WalletStatus';

// Mock the environment for tests
setupWalletTestEnvironment();

// Test component that uses session functionality
const TestSessionComponent: React.FC = () => {
  const { connection, status, connect, disconnect } = useWalletConnection();

  return (
    <div>
      <div data-testid="connection-status">{status}</div>
      <div data-testid="wallet-address">
        {connection.isConnected ? connection.address : 'Not connected'}
      </div>
      <div data-testid="connection-timestamp">
        {connection.connectionTimestamp || 'Never'}
      </div>
      <div data-testid="last-refresh">
        {connection.lastRefreshTimestamp || 'Never'}
      </div>
      <button onClick={connect} data-testid="connect-btn">
        Connect
      </button>
      <button onClick={disconnect} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
};

// Test wrapper component
const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WalletProvider>
    <SessionManager>
      <WalletStatus />
      {children}
    </SessionManager>
  </WalletProvider>
);

describe('T009 - Session Persistence Integration', () => {
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

    // Mock sessionStorage for additional session data
    const mockSessionStorage = new MockLocalStorage();
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // Default MiniKit setup
    mockMiniKit.isInstalled.mockReturnValue(true);

    // Mock Date for consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Session Creation and Storage', () => {
    it('should create and persist session on successful connection', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Connect wallet
      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Verify session is stored in localStorage
      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session).toMatchObject({
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
      });

      // Should have session ID and timestamps
      expect(session.sessionId).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.lastAccessedAt).toBeDefined();
      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should include device and browser fingerprint in session', async () => {
      // Mock device/browser info
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
      });
      Object.defineProperty(screen, 'width', { value: 1920, writable: true });
      Object.defineProperty(screen, 'height', { value: 1080, writable: true });

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session.deviceFingerprint).toBeDefined();
      expect(session.browserInfo).toMatchObject({
        userAgent: expect.stringContaining('Mozilla'),
        screenResolution: '1920x1080',
      });
    });

    it('should encrypt sensitive session data', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const sessionRaw = mockLocalStorage.getItem('raffletime_session');
      const session = JSON.parse(sessionRaw || '{}');

      // Sensitive data should be encrypted
      expect(session.encryptedData).toBeDefined();
      expect(session.salt).toBeDefined();
      expect(session.iv).toBeDefined();

      // Wallet address should not be stored in plain text
      expect(sessionRaw).not.toContain(mockWalletUsers['active-user'].address);
    });
  });

  describe('Session Recovery and Auto-Connect', () => {
    it('should auto-connect from valid session on app restart', async () => {
      // Create a valid session
      const validSession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        deviceFingerprint: 'test-fingerprint',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(validSession));

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should auto-connect without user interaction
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(
          mockWalletUsers['active-user'].address
        );
      }, { timeout: 3000 });

      // Should update lastAccessedAt timestamp
      const updatedSession = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(updatedSession.lastAccessedAt).toBeGreaterThan(validSession.lastAccessedAt);
    });

    it('should not auto-connect when autoConnect is disabled', async () => {
      const sessionWithoutAutoConnect = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: false,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionWithoutAutoConnect));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should remain disconnected
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent('Not connected');
      });

      // Should not call MiniKit
      expect(mockMiniKit.commandsAsync.walletAuth).not.toHaveBeenCalled();
    });

    it('should handle corrupted session data gracefully', async () => {
      // Store corrupted JSON
      mockLocalStorage.setItem('raffletime_session', 'invalid-json{');

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should clear corrupted session and start fresh
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });

      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      expect(screen.getByText('Session corrupted - please reconnect')).toBeInTheDocument();
    });

    it('should validate device fingerprint on session recovery', async () => {
      const sessionWithDifferentFingerprint = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        deviceFingerprint: 'different-fingerprint',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionWithDifferentFingerprint));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should reject session due to fingerprint mismatch
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });

      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      expect(screen.getByText('Session security validation failed')).toBeInTheDocument();
    });
  });

  describe('Session Expiration and Renewal', () => {
    it('should handle expired sessions by clearing and requesting re-authentication', async () => {
      const expiredSession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        lastAccessedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // Expired 1 day ago
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(expiredSession));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should clear expired session
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });

      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      expect(screen.getByText('Session expired - please reconnect')).toBeInTheDocument();
    });

    it('should extend session on user activity', async () => {
      const nearExpirySession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
        lastAccessedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() + 60 * 60 * 1000, // Expires in 1 hour
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(nearExpirySession));

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Wait for auto-connect
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate user activity (clicking refresh button)
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      if (refreshBtn) {
        await user.click(refreshBtn);
      }

      // Session should be extended
      const updatedSession = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(updatedSession.expiresAt).toBeGreaterThan(nearExpirySession.expiresAt);
      expect(updatedSession.lastAccessedAt).toBeGreaterThan(nearExpirySession.lastAccessedAt);
    });

    it('should warn user before session expiry', async () => {
      jest.useRealTimers();

      const soonToExpireSession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000, // Expires in 15 minutes
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(soonToExpireSession));

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should auto-connect first
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Should show expiry warning
      await waitFor(() => {
        expect(screen.getByText('Session expires soon')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /extend session/i })).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should automatically refresh session before expiry', async () => {
      jest.useFakeTimers();

      const sessionNearExpiry = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // Expires in 10 minutes
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionNearExpiry));

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Auto-connect
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Fast-forward to 5 minutes before expiry (auto-refresh threshold)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should automatically refresh session
      await waitFor(() => {
        const updatedSession = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
        expect(updatedSession.expiresAt).toBeGreaterThan(sessionNearExpiry.expiresAt);
      });

      jest.useRealTimers();
    });
  });

  describe('Multi-Tab Session Synchronization', () => {
    it('should sync session state across multiple tabs', async () => {
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Connect in first tab
      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate another tab updating the session
      const updatedSession = {
        ...JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}'),
        lastAccessedAt: Date.now() + 1000,
        tabId: 'other-tab',
      };

      // Trigger storage event (simulates update from another tab)
      const storageEvent = new StorageEvent('storage', {
        key: 'raffletime_session',
        newValue: JSON.stringify(updatedSession),
        oldValue: mockLocalStorage.getItem('raffletime_session'),
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);

      // Should sync the updated session data
      await waitFor(() => {
        expect(screen.getByTestId('last-refresh')).toHaveTextContent(
          expect.stringContaining(updatedSession.lastAccessedAt.toString())
        );
      });
    });

    it('should handle session conflicts between tabs', async () => {
      const initialSession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        tabId: 'current-tab',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(initialSession));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Simulate conflicting session from another tab (different wallet)
      const conflictingSession = {
        ...initialSession,
        walletAddress: mockWalletUsers['power-user'].address,
        mockUserId: 'power-user',
        tabId: 'other-tab',
        lastAccessedAt: Date.now() + 1000,
      };

      const storageEvent = new StorageEvent('storage', {
        key: 'raffletime_session',
        newValue: JSON.stringify(conflictingSession),
        oldValue: JSON.stringify(initialSession),
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);

      // Should detect conflict and show resolution dialog
      await waitFor(() => {
        expect(screen.getByText('Session conflict detected')).toBeInTheDocument();
        expect(screen.getByText(/another tab has connected a different wallet/i)).toBeInTheDocument();
      });

      // Should offer options to resolve conflict
      expect(screen.getByRole('button', { name: /use this session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep current session/i })).toBeInTheDocument();
    });

    it('should handle tab closing and cleanup', async () => {
      const sessionWithTabId = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        tabId: 'current-tab',
        activeTabs: ['current-tab', 'other-tab'],
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionWithTabId));

      const { unmount } = render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Simulate tab closing
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      unmount();

      // Should remove tab from active tabs list
      await waitFor(() => {
        const updatedSession = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
        expect(updatedSession.activeTabs).toEqual(['other-tab']);
      });
    });
  });

  describe('Session Security and Privacy', () => {
    it('should clear session on security violation', async () => {
      const sessionData = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        securityHash: 'original-hash',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionData));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Simulate security violation (tampering detected)
      window.dispatchEvent(new CustomEvent('security-violation', {
        detail: { type: 'session-tampering', severity: 'high' }
      }));

      // Should immediately clear session and disconnect
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      });

      // Should show security warning
      expect(screen.getByText('Security violation detected')).toBeInTheDocument();
      expect(screen.getByText(/session has been cleared for security/i)).toBeInTheDocument();
    });

    it('should not store sensitive data in session when in incognito mode', async () => {
      // Mock private browsing detection
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: () => Promise.resolve({ quota: 0 }),
        },
        writable: true,
      });

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Should use session storage instead of local storage in private mode
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      expect(global.sessionStorage.getItem('raffletime_temp_session')).toBeTruthy();

      // Should show privacy mode indicator
      expect(screen.getByText('Private browsing detected')).toBeInTheDocument();
      expect(screen.getByText(/session will not persist/i)).toBeInTheDocument();
    });

    it('should validate session integrity on each access', async () => {
      const validSession = {
        sessionId: 'test-session-123',
        walletAddress: mockWalletUsers['active-user'].address,
        autoConnect: true,
        mockUserId: 'active-user',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        checksum: 'valid-checksum',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(validSession));

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Should validate integrity and proceed normally
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate session tampering (invalid checksum)
      const tamperedSession = {
        ...validSession,
        walletAddress: 'hacker-address',
        // checksum remains the same (invalid)
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(tamperedSession));

      // Trigger session validation
      window.dispatchEvent(new Event('focus'));

      // Should detect tampering and clear session
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
      });

      expect(screen.getByText('Session integrity check failed')).toBeInTheDocument();
    });
  });

  describe('Session Analytics and Monitoring', () => {
    it('should track session duration and usage patterns', async () => {
      jest.useRealTimers();
      const startTime = Date.now();

      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Wait a bit to simulate usage
      await new Promise(resolve => setTimeout(resolve, 100));

      // Disconnect to end session
      const disconnectBtn = screen.getByTestId('disconnect-btn');
      await user.click(disconnectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });

      // Should track session analytics
      const analytics = JSON.parse(mockLocalStorage.getItem('raffletime_analytics') || '{}');
      expect(analytics.sessions).toBeDefined();
      expect(analytics.sessions).toHaveLength(1);

      const sessionAnalytics = analytics.sessions[0];
      expect(sessionAnalytics.duration).toBeGreaterThan(0);
      expect(sessionAnalytics.startTime).toBeGreaterThanOrEqual(startTime);
      expect(sessionAnalytics.endTime).toBeGreaterThan(sessionAnalytics.startTime);
      expect(sessionAnalytics.walletType).toBe('minikit');
    });

    it('should monitor for unusual session patterns', async () => {
      // Simulate rapid connection/disconnection pattern (potential bot behavior)
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      const disconnectBtn = screen.getByTestId('disconnect-btn');

      // Rapid connect/disconnect cycle
      for (let i = 0; i < 5; i++) {
        await user.click(connectBtn);
        await waitFor(() => {
          expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        });

        await user.click(disconnectBtn);
        await waitFor(() => {
          expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        });
      }

      // Should detect unusual pattern
      await waitFor(() => {
        expect(screen.getByText('Unusual activity detected')).toBeInTheDocument();
      });

      // Should implement rate limiting
      await user.click(connectBtn);
      expect(screen.getByText('Too many connection attempts')).toBeInTheDocument();
      expect(screen.getByText(/please wait before trying again/i)).toBeInTheDocument();
    });
  });

  describe('Mock Mode Session Testing', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should handle mock user sessions in development', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'power-user');

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(
          mockWalletUsers['power-user'].address
        );
      });

      // Should create mock session
      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session.mockUserId).toBe('power-user');
      expect(session.isMockMode).toBe(true);

      // Should show development indicators
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByTestId('mock-session-badge')).toBeInTheDocument();
    });

    it('should allow switching between mock users', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');

      render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      const connectBtn = screen.getByTestId('connect-btn');
      await user.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(
          mockWalletUsers['active-user'].address
        );
      });

      // Switch to different mock user
      const userSwitcher = screen.getByTestId('mock-user-switcher');
      await user.selectOptions(userSwitcher, 'vip-user');

      // Should switch sessions
      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(
          mockWalletUsers['vip-user'].address
        );
      });

      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session.mockUserId).toBe('vip-user');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup session timers and listeners on unmount', async () => {
      jest.useFakeTimers();

      const { unmount } = render(
        <TestApp>
          <TestSessionComponent />
        </TestApp>
      );

      // Verify timers are set up
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // Unmount component
      unmount();

      // Should clear all timers
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });

    it('should efficiently manage session state updates', async () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <TestSessionComponent />;
      };

      render(
        <TestApp>
          <TestComponent />
        </TestApp>
      );

      renderSpy.mockClear();

      // Multiple session updates should batch renders
      act(() => {
        window.dispatchEvent(new CustomEvent('session-update', {
          detail: { type: 'heartbeat' }
        }));
        window.dispatchEvent(new CustomEvent('session-update', {
          detail: { type: 'activity' }
        }));
        window.dispatchEvent(new CustomEvent('session-update', {
          detail: { type: 'refresh' }
        }));
      });

      // Should batch updates to minimize re-renders
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});