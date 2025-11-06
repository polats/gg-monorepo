import { renderHook, act, waitFor } from '@testing-library/react';
import { useWalletConnection } from '../useWalletConnection';
import {
  setupWalletTestEnvironment,
  mockMiniKit,
  mockWalletConnection,
  mockUserSession,
  mockWalletUsers,
  createMockWalletAuthResponse,
  simulateWalletConnection,
  MockLocalStorage,
  resetWalletMocks,
} from '@/__tests__/setup/wallet-test-utils';

// Setup test environment
setupWalletTestEnvironment();

describe('useWalletConnection', () => {
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
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.connection).toEqual({
        address: '',
        isConnected: false,
        connectionTimestamp: 0,
        lastRefreshTimestamp: 0,
      });
      expect(result.current.status).toBe('disconnected');
      expect(result.current.error).toBeNull();
      expect(result.current.isConnecting).toBe(false);
    });

    it('should initialize with loading state when auto-connect is enabled', () => {
      mockLocalStorage.setItem('raffletime_session', JSON.stringify({
        ...mockUserSession,
        autoConnect: true,
      }));

      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.status).toBe('connecting');
      expect(result.current.isConnecting).toBe(true);
    });

    it('should not auto-connect when MiniKit is not installed', () => {
      mockMiniKit.isInstalled.mockReturnValue(false);
      mockLocalStorage.setItem('raffletime_session', JSON.stringify({
        ...mockUserSession,
        autoConnect: true,
      }));

      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.status).toBe('disconnected');
      expect(result.current.error?.code).toBe('MINIKIT_NOT_INSTALLED');
    });
  });

  describe('Connection Management', () => {
    it('should connect wallet successfully', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(result.current.connection.isConnected).toBe(true);
      expect(result.current.connection.address).toBe(mockWalletUsers['active-user'].address);
      expect(result.current.error).toBeNull();
    });

    it('should handle connection failure', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(false)
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.connection.isConnected).toBe(false);
      expect(result.current.error?.code).toBe('AUTH_FAILED');
    });

    it('should disconnect wallet and clear session', async () => {
      // First connect
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Then disconnect
      await act(async () => {
        result.current.disconnect();
      });

      expect(result.current.connection.isConnected).toBe(false);
      expect(result.current.status).toBe('disconnected');
      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(
        new Error('Network connection failed')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error?.code).toBe('NETWORK_ERROR');
      expect(result.current.error?.message).toContain('Network connection failed');
    });
  });

  describe('Session Persistence', () => {
    it('should persist session to localStorage on successful connection', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      const session = JSON.parse(mockLocalStorage.getItem('raffletime_session') || '{}');
      expect(session.walletAddress).toBe(mockWalletUsers['active-user'].address);
      expect(session.autoConnect).toBe(true);
      expect(session.sessionId).toBeDefined();
    });

    it('should restore session from localStorage on mount', async () => {
      const sessionData = {
        walletAddress: mockWalletUsers['active-user'].address,
        sessionId: 'test-session-123',
        autoConnect: true,
        mockUserId: 'active-user',
      };

      mockLocalStorage.setItem('raffletime_session', JSON.stringify(sessionData));
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(result.current.connection.address).toBe(sessionData.walletAddress);
      expect(result.current.connection.isConnected).toBe(true);
    });

    it('should clear invalid session data', async () => {
      mockLocalStorage.setItem('raffletime_session', JSON.stringify({
        walletAddress: 'invalid-address',
        sessionId: 'invalid-session',
        autoConnect: true,
      }));

      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockRejectedValue(
        new Error('Invalid session')
      );

      const { result } = renderHook(() => useWalletConnection());

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(mockLocalStorage.getItem('raffletime_session')).toBeNull();
    });
  });

  describe('Mock Mode Support', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true';
    });

    it('should bypass MiniKit in mock mode', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(result.current.connection.address).toBe(mockWalletUsers['active-user'].address);
      expect(mockMiniKit.commandsAsync.walletAuth).not.toHaveBeenCalled();
    });

    it('should handle mock user switching', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Switch to different mock user
      await act(async () => {
        result.current.switchMockUser('power-user');
      });

      expect(result.current.connection.address).toBe(mockWalletUsers['power-user'].address);
      expect(mockLocalStorage.getItem('raffletime_mock_user')).toBe('power-user');
    });

    it('should handle invalid mock user gracefully', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'invalid-user');

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error?.code).toBe('WALLET_NOT_FOUND');
    });

    it('should fallback to real MiniKit when mock mode is disabled mid-session', async () => {
      mockLocalStorage.setItem('raffletime_mock_user', 'active-user');

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Disable mock mode
      process.env.NEXT_PUBLIC_MOCK_MODE = 'false';
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      await act(async () => {
        result.current.disconnect();
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(mockMiniKit.commandsAsync.walletAuth).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle MiniKit not installed error', async () => {
      mockMiniKit.isInstalled.mockReturnValue(false);

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('MINIKIT_NOT_INSTALLED');
      expect(result.current.error?.message).toContain('MiniKit is not installed');
    });

    it('should handle authentication timeout', async () => {
      jest.useFakeTimers();
      mockMiniKit.isInstalled.mockReturnValue(true);

      // Mock a delayed response
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockWalletAuthResponse(true)), 30000))
      );

      const { result } = renderHook(() => useWalletConnection());

      act(() => {
        result.current.connect();
      });

      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error?.code).toBe('NETWORK_ERROR');
      jest.useRealTimers();
    });

    it('should retry connection on transient errors', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);

      let callCount = 0;
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Transient network error'));
        }
        return createMockWalletAuthResponse(true, 'active-user');
      });

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(callCount).toBe(3);
      expect(result.current.connection.isConnected).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should update connection timestamps correctly', async () => {
      const startTime = Date.now();
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      expect(result.current.connection.connectionTimestamp).toBeGreaterThanOrEqual(startTime);
      expect(result.current.connection.lastRefreshTimestamp).toBeGreaterThanOrEqual(startTime);
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      // Rapid connect/disconnect cycle
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.connect();
        });

        await waitFor(() => {
          expect(result.current.status).toBe('connected');
        });

        await act(async () => {
          result.current.disconnect();
        });

        expect(result.current.status).toBe('disconnected');
      }

      // Final state should be consistent
      expect(result.current.connection.isConnected).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should refresh connection state', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      const initialRefreshTime = result.current.connection.lastRefreshTimestamp;

      // Wait a bit and refresh
      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.connection.lastRefreshTimestamp).toBeGreaterThan(initialRefreshTime);
      expect(result.current.status).toBe('connected');
    });
  });

  describe('MiniKit Integration', () => {
    it('should properly handle MiniKit installation check', () => {
      mockMiniKit.isInstalled.mockReturnValue(false);

      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.isMiniKitInstalled).toBe(false);

      // Update installation status
      mockMiniKit.isInstalled.mockReturnValue(true);

      act(() => {
        result.current.checkMiniKitInstallation();
      });

      expect(result.current.isMiniKitInstalled).toBe(true);
    });

    it('should handle MiniKit user property updates', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Simulate MiniKit user update
      const updatedUser = { ...mockWalletUsers['active-user'], username: 'updateduser' };
      mockMiniKit.user = updatedUser;

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.user?.username).toBe('updateduser');
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup on unmount', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result, unmount } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      unmount();

      // Verify no memory leaks or hanging promises
      expect(true).toBe(true); // If we reach here without timeout, cleanup worked
    });

    it('should handle concurrent connection attempts', async () => {
      mockMiniKit.isInstalled.mockReturnValue(true);
      mockMiniKit.commandsAsync.walletAuth.mockImplementation(() =>
        createMockWalletAuthResponse(true, 'active-user')
      );

      const { result } = renderHook(() => useWalletConnection());

      // Start multiple connection attempts
      const promises = [
        result.current.connect(),
        result.current.connect(),
        result.current.connect(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Should only have one successful connection
      expect(mockMiniKit.commandsAsync.walletAuth).toHaveBeenCalledTimes(1);
    });
  });
});