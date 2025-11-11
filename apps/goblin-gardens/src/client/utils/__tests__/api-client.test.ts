import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  apiCall,
  apiGet,
  apiPost,
  apiDelete,
  getApiBaseUrl,
  setApiUsername,
} from '../api-client';

describe('API Client', () => {
  let originalFetch: typeof global.fetch;
  let originalWindow: typeof global.window;

  beforeEach(() => {
    // Save original fetch and window
    originalFetch = global.fetch;
    originalWindow = global.window;

    // Mock fetch
    global.fetch = vi.fn();

    // Mock window.location for environment detection
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          hostname: 'localhost',
        },
      },
      writable: true,
      configurable: true,
    });

    // Clear username before each test
    setApiUsername('');
  });

  afterEach(() => {
    // Restore original fetch and window
    global.fetch = originalFetch;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe('getApiBaseUrl', () => {
    it('should return localhost URL for local development', () => {
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      const baseUrl = getApiBaseUrl();
      expect(baseUrl).toBe('http://localhost:3000');
    });

    it('should return empty string for Vercel deployment', () => {
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'my-app.vercel.app' },
        writable: true,
      });

      const baseUrl = getApiBaseUrl();
      expect(baseUrl).toBe('');
    });

    it('should return empty string for Reddit Devvit', () => {
      Object.defineProperty(global.window, 'location', {
        value: { hostname: 'reddit.com' },
        writable: true,
      });

      const baseUrl = getApiBaseUrl();
      expect(baseUrl).toBe('');
    });
  });

  describe('setApiUsername', () => {
    it('should set username for subsequent API calls', async () => {
      setApiUsername('TestUser123');

      const mockResponse = { type: 'init', postId: 'test', count: 0, username: 'TestUser123' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiGet('/api/init');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Username': 'TestUser123',
          }),
        })
      );
    });
  });

  describe('apiCall', () => {
    it('should make successful API call with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiCall('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include X-Username header when username is set', async () => {
      setApiUsername('Player_ABC123');

      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiCall('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Username': 'Player_ABC123',
          }),
        })
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiCall('/api/test')).rejects.toThrow('Network error');
    });

    it('should throw error on HTTP error status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        text: async () => 'Server error details',
      });

      await expect(apiCall('/api/test')).rejects.toThrow(
        'API call failed: Internal Server Error - Server error details'
      );
    });

    it('should pass custom headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiCall('/api/test', {
        headers: { 'Custom-Header': 'custom-value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('apiGet', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiPost', () => {
    it('should make POST request with data', async () => {
      const mockResponse = { success: true };
      const postData = { key: 'value' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPost('/api/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without data', async () => {
      const mockResponse = { success: true };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiPost('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('apiDelete', () => {
    it('should make DELETE request', async () => {
      const mockResponse = { success: true };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiDelete('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('init endpoint', () => {
    it('should fetch init data successfully', async () => {
      const mockResponse = {
        type: 'init',
        postId: 'test-post-123',
        count: 42,
        username: 'TestUser',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/init');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/init',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include correct URL for init request', async () => {
      const mockResponse = {
        type: 'init',
        postId: 'test-post',
        count: 0,
        username: 'User',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiGet('/api/init');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/init',
        expect.any(Object)
      );
    });

    it('should parse init response correctly', async () => {
      const mockResponse = {
        type: 'init',
        postId: 'abc123',
        count: 100,
        username: 'Player1',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/init');

      expect(result).toHaveProperty('type', 'init');
      expect(result).toHaveProperty('postId', 'abc123');
      expect(result).toHaveProperty('count', 100);
      expect(result).toHaveProperty('username', 'Player1');
    });

    it('should handle network error on init', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(apiGet('/api/init')).rejects.toThrow('Network connection failed');
    });

    it('should handle HTTP error on init', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Missing postId',
      });

      await expect(apiGet('/api/init')).rejects.toThrow(
        'API call failed: Bad Request - Missing postId'
      );
    });

    it('should handle 500 error on init', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(apiGet('/api/init')).rejects.toThrow(
        'API call failed: Internal Server Error - Server error'
      );
    });
  });

  describe('savePlayerState endpoint', () => {
    it('should save player state successfully', async () => {
      const playerState = {
        coins: { gold: 1, silver: 20, bronze: 50 },
        gems: [],
      };

      const mockResponse = {
        type: 'savePlayerState',
        success: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPost('/api/player-state/save', { playerState });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/player-state/save',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ playerState }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include X-Username header in save request', async () => {
      setApiUsername('Player_XYZ789');

      const playerState = {
        coins: { gold: 0, silver: 10, bronze: 25 },
        gems: [],
      };

      const mockResponse = {
        type: 'savePlayerState',
        success: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiPost('/api/player-state/save', { playerState });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Username': 'Player_XYZ789',
          }),
        })
      );
    });

    it('should serialize request body correctly', async () => {
      const playerState = {
        coins: { gold: 5, silver: 100, bronze: 500 },
        gems: [
          {
            id: 'gem-1',
            type: 'emerald',
            rarity: 'common',
            shape: 'tetrahedron',
            color: '#50C878',
            growthRate: 1.0,
            level: 1,
            experience: 0,
            dateAcquired: Date.now(),
            size: 0.063,
            isGrowing: false,
            isOffering: false,
          },
        ],
      };

      const mockResponse = {
        type: 'savePlayerState',
        success: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiPost('/api/player-state/save', { playerState });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toHaveProperty('playerState');
      expect(body.playerState).toHaveProperty('coins');
      expect(body.playerState).toHaveProperty('gems');
      expect(body.playerState.gems).toHaveLength(1);
      expect(body.playerState.gems[0]).toHaveProperty('id', 'gem-1');
    });

    it('should handle error when saving player state', async () => {
      const playerState = {
        coins: { gold: 0, silver: 0, bronze: 0 },
        gems: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Invalid player state',
      });

      await expect(apiPost('/api/player-state/save', { playerState })).rejects.toThrow(
        'API call failed: Bad Request - Invalid player state'
      );
    });

    it('should handle network error when saving', async () => {
      const playerState = {
        coins: { gold: 0, silver: 0, bronze: 0 },
        gems: [],
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(apiPost('/api/player-state/save', { playerState })).rejects.toThrow(
        'Connection timeout'
      );
    });
  });

  describe('loadPlayerState endpoint', () => {
    it('should load existing player state successfully', async () => {
      const playerState = {
        coins: { gold: 2, silver: 50, bronze: 100 },
        gems: [
          {
            id: 'gem-1',
            type: 'sapphire',
            rarity: 'rare',
            shape: 'octahedron',
            color: '#0F52BA',
            growthRate: 1.5,
            level: 3,
            experience: 50,
            dateAcquired: Date.now(),
            size: 0.075,
            isGrowing: true,
            isOffering: false,
          },
        ],
      };

      const mockResponse = {
        type: 'loadPlayerState',
        playerState,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/player-state/load');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/player-state/load',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.playerState).toBeDefined();
      expect(result.playerState?.gems).toHaveLength(1);
    });

    it('should deserialize player state correctly', async () => {
      const playerState = {
        coins: { gold: 10, silver: 200, bronze: 500 },
        gems: [
          {
            id: 'gem-1',
            type: 'diamond',
            rarity: 'legendary',
            shape: 'dodecahedron',
            color: '#B9F2FF',
            growthRate: 2.0,
            level: 5,
            experience: 75,
            dateAcquired: 1234567890,
            size: 0.1,
            isGrowing: false,
            isOffering: true,
          },
          {
            id: 'gem-2',
            type: 'ruby',
            rarity: 'epic',
            shape: 'tetrahedron',
            color: '#E0115F',
            growthRate: 1.2,
            level: 2,
            experience: 25,
            dateAcquired: 1234567891,
            size: 0.065,
            isGrowing: true,
            isOffering: false,
          },
        ],
      };

      const mockResponse = {
        type: 'loadPlayerState',
        playerState,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/player-state/load');

      expect(result.playerState).toBeDefined();
      expect(result.playerState?.coins).toEqual({ gold: 10, silver: 200, bronze: 500 });
      expect(result.playerState?.gems).toHaveLength(2);
      expect(result.playerState?.gems[0]).toHaveProperty('type', 'diamond');
      expect(result.playerState?.gems[1]).toHaveProperty('type', 'ruby');
    });

    it('should handle null state for new user', async () => {
      const mockResponse = {
        type: 'loadPlayerState',
        playerState: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiGet('/api/player-state/load');

      expect(result).toEqual(mockResponse);
      expect(result.playerState).toBeNull();
    });

    it('should handle error when loading player state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        text: async () => 'Player not found',
      });

      await expect(apiGet('/api/player-state/load')).rejects.toThrow(
        'API call failed: Not Found - Player not found'
      );
    });

    it('should handle network error when loading', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network unavailable'));

      await expect(apiGet('/api/player-state/load')).rejects.toThrow('Network unavailable');
    });
  });

  describe('offers endpoints', () => {
    describe('getOffers', () => {
      it('should fetch offers successfully', async () => {
        const mockResponse = {
          type: 'getActiveOffers',
          offers: [
            {
              username: 'Player1',
              lastActive: '2 minutes ago',
              level: 5,
              itemCount: 3,
              offer: {
                gems: [
                  {
                    name: 'Emerald',
                    rarity: 'common',
                    shape: 'tetrahedron',
                    color: '#50C878',
                  },
                ],
                totalValue: 1000,
              },
            },
          ],
          hasMore: false,
          nextCursor: null,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiGet('/api/offers');

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/offers',
          expect.objectContaining({
            method: 'GET',
          })
        );
        expect(result).toEqual(mockResponse);
        expect(result.offers).toHaveLength(1);
      });

      it('should fetch offers with pagination', async () => {
        const mockResponse = {
          type: 'getActiveOffers',
          offers: [
            {
              username: 'Player2',
              lastActive: '5 minutes ago',
              level: 10,
              itemCount: 5,
              offer: {
                gems: [
                  {
                    name: 'Diamond',
                    rarity: 'legendary',
                    shape: 'dodecahedron',
                    color: '#B9F2FF',
                  },
                ],
                totalValue: 50000,
              },
            },
          ],
          hasMore: true,
          nextCursor: 10,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiGet('/api/offers?cursor=0&limit=10');

        expect(result.hasMore).toBe(true);
        expect(result.nextCursor).toBe(10);
      });

      it('should handle error when fetching offers', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
          text: async () => 'Failed to fetch offers',
        });

        await expect(apiGet('/api/offers')).rejects.toThrow(
          'API call failed: Internal Server Error - Failed to fetch offers'
        );
      });
    });

    describe('updateOffer', () => {
      it('should create offer successfully', async () => {
        const gems = [
          {
            id: 'gem-1',
            type: 'emerald',
            rarity: 'common',
            shape: 'tetrahedron',
            color: '#50C878',
            growthRate: 1.0,
            level: 1,
            experience: 0,
            dateAcquired: Date.now(),
            size: 0.063,
            isGrowing: false,
            isOffering: true,
          },
        ];

        const mockResponse = {
          type: 'updateOffer',
          success: true,
          offer: {
            username: 'TestUser',
            gems,
            totalValue: 2000,
            timestamp: Date.now(),
            level: 5,
            itemCount: 10,
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiPost('/api/offers/update', { gems });

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/offers/update',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ gems }),
          })
        );
        expect(result).toEqual(mockResponse);
        expect(result.success).toBe(true);
      });

      it('should handle error when creating offer', async () => {
        const gems = [];

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
          text: async () => 'Gems array cannot be empty',
        });

        await expect(apiPost('/api/offers/update', { gems })).rejects.toThrow(
          'API call failed: Bad Request - Gems array cannot be empty'
        );
      });
    });

    describe('removeOffer', () => {
      it('should remove offer successfully', async () => {
        const mockResponse = {
          type: 'removeOffer',
          success: true,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiDelete('/api/offers/remove');

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/offers/remove',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
        expect(result).toEqual(mockResponse);
        expect(result.success).toBe(true);
      });

      it('should handle error when removing offer', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
          text: async () => 'No active offer found',
        });

        await expect(apiDelete('/api/offers/remove')).rejects.toThrow(
          'API call failed: Not Found - No active offer found'
        );
      });

      it('should handle network error when removing offer', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Connection lost'));

        await expect(apiDelete('/api/offers/remove')).rejects.toThrow('Connection lost');
      });
    });
  });

  describe('trade execution endpoint', () => {
    it('should execute trade successfully', async () => {
      const gems = [
        {
          id: 'gem-1',
          type: 'sapphire',
          rarity: 'rare',
          shape: 'octahedron',
          color: '#0F52BA',
          growthRate: 1.5,
          level: 2,
          experience: 0,
          dateAcquired: Date.now(),
          size: 0.07,
          isGrowing: false,
          isOffering: false,
        },
      ];

      const mockResponse = {
        type: 'executeTrade',
        success: true,
        message: 'Trade completed successfully',
        transaction: {
          gems,
          coinsSpent: 5000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPost('/api/trade/execute', {
        sellerUsername: 'SellerUser',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/trade/execute',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sellerUsername: 'SellerUser' }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
    });

    it('should include correct request payload structure', async () => {
      const mockResponse = {
        type: 'executeTrade',
        success: true,
        transaction: {
          gems: [],
          coinsSpent: 1000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiPost('/api/trade/execute', {
        sellerUsername: 'Player_ABC123',
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toHaveProperty('sellerUsername', 'Player_ABC123');
    });

    it('should handle success response with transaction details', async () => {
      const gems = [
        {
          id: 'gem-1',
          type: 'diamond',
          rarity: 'legendary',
          shape: 'dodecahedron',
          color: '#B9F2FF',
          growthRate: 2.0,
          level: 5,
          experience: 0,
          dateAcquired: Date.now(),
          size: 0.1,
          isGrowing: false,
          isOffering: false,
        },
        {
          id: 'gem-2',
          type: 'ruby',
          rarity: 'epic',
          shape: 'octahedron',
          color: '#E0115F',
          growthRate: 1.8,
          level: 3,
          experience: 0,
          dateAcquired: Date.now(),
          size: 0.08,
          isGrowing: false,
          isOffering: false,
        },
      ];

      const mockResponse = {
        type: 'executeTrade',
        success: true,
        message: 'Trade completed',
        transaction: {
          gems,
          coinsSpent: 100000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPost('/api/trade/execute', {
        sellerUsername: 'RichPlayer',
      });

      expect(result.transaction?.gems).toHaveLength(2);
      expect(result.transaction?.coinsSpent).toBe(100000);
      expect(result.transaction?.gems[0]).toHaveProperty('type', 'diamond');
      expect(result.transaction?.gems[1]).toHaveProperty('type', 'ruby');
    });

    it('should handle error when buyer equals seller', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Cannot trade with yourself',
      });

      await expect(
        apiPost('/api/trade/execute', { sellerUsername: 'TestUser' })
      ).rejects.toThrow('API call failed: Bad Request - Cannot trade with yourself');
    });

    it('should handle error when offer does not exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        text: async () => 'Offer no longer available',
      });

      await expect(
        apiPost('/api/trade/execute', { sellerUsername: 'NonExistentUser' })
      ).rejects.toThrow('API call failed: Not Found - Offer no longer available');
    });

    it('should handle error when buyer has insufficient coins', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Insufficient coins',
      });

      await expect(
        apiPost('/api/trade/execute', { sellerUsername: 'ExpensiveOffer' })
      ).rejects.toThrow('API call failed: Bad Request - Insufficient coins');
    });

    it('should handle network error during trade', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        apiPost('/api/trade/execute', { sellerUsername: 'AnyUser' })
      ).rejects.toThrow('Network timeout');
    });

    it('should handle server error during trade', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        text: async () => 'Transaction failed',
      });

      await expect(
        apiPost('/api/trade/execute', { sellerUsername: 'AnyUser' })
      ).rejects.toThrow('API call failed: Internal Server Error - Transaction failed');
    });
  });
});
