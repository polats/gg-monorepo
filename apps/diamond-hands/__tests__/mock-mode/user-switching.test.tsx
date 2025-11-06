/**
 * Integration Tests: User Persona Switching
 * Tests mock user profile management and persona switching functionality
 */

describe('User Persona Switching', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
    
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Mock User Profiles', () => {
    it('should define all required mock personas', async () => {
      // This test will fail until mock user profiles are implemented
      const { mockUserProfiles } = await import('@/lib/mock/mock-users')

      expect(mockUserProfiles).toBeDefined()
      expect(mockUserProfiles['new-user']).toBeDefined()
      expect(mockUserProfiles['active-user']).toBeDefined()
      expect(mockUserProfiles['power-user']).toBeDefined()
      expect(mockUserProfiles['vip-user']).toBeDefined()
      expect(mockUserProfiles['problem-user']).toBeDefined()
    })

    it('should have properly structured user profiles', async () => {
      const { mockUserProfiles } = await import('@/lib/mock/mock-users')

      const newUser = mockUserProfiles['new-user']
      
      expect(newUser.id).toBe('mock-new-001')
      expect(newUser.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(newUser.username).toBe('NewTester')
      expect(newUser.isVerified).toBe(true)
      expect(newUser.persona).toBe('new-user')
      expect(newUser.metadata.testingNotes).toBe('Fresh user for onboarding flow testing')
    })

    it('should have different wallet addresses for each persona', async () => {
      const { mockUserProfiles } = await import('@/lib/mock/mock-users')

      const addresses = Object.values(mockUserProfiles).map(user => user.walletAddress)
      const uniqueAddresses = new Set(addresses)

      expect(uniqueAddresses.size).toBe(addresses.length)
    })

    it('should have appropriate balances for each persona', async () => {
      const { mockUserProfiles } = await import('@/lib/mock/mock-users')
      const { getMockWallet } = await import('@/lib/mock/mock-users')

      const newUserWallet = getMockWallet(mockUserProfiles['new-user'])
      const activeUserWallet = getMockWallet(mockUserProfiles['active-user'])
      const powerUserWallet = getMockWallet(mockUserProfiles['power-user'])
      const vipUserWallet = getMockWallet(mockUserProfiles['vip-user'])
      const problemUserWallet = getMockWallet(mockUserProfiles['problem-user'])

      expect(parseFloat(newUserWallet.balance)).toBe(0)
      expect(parseFloat(activeUserWallet.balance)).toBe(100)
      expect(parseFloat(powerUserWallet.balance)).toBe(1000)
      expect(parseFloat(vipUserWallet.balance)).toBe(10000)
      expect(parseFloat(problemUserWallet.balance)).toBe(0.01)
    })
  })

  describe('Mock Mode Context Provider', () => {
    it('should provide user switching functionality', async () => {
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      const { useMockMode } = await import('@/lib/hooks/useMockMode')

      // Mock the hook behavior
      const mockHook = {
        isMockMode: true,
        mockUser: null,
        mockWallet: null,
        mockActions: {
          switchUser: jest.fn(),
          simulateTransaction: jest.fn(),
          triggerError: jest.fn(),
        }
      }

      // Test that provider exposes the correct interface
      expect(MockModeProvider).toBeDefined()
      expect(typeof useMockMode).toBe('function')
    })

    it('should switch users when switchUser is called', async () => {
      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      
      // This will fail until implementation exists
      const mockActions = useMockMode().mockActions
      
      await mockActions.switchUser('power-user')
      
      const currentUser = useMockMode().mockUser
      expect(currentUser?.persona).toBe('power-user')
      expect(currentUser?.username).toBe('PowerTester')
    })

    it('should persist user selection in localStorage', async () => {
      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      const mockSetItem = jest.fn()
      window.localStorage.setItem = mockSetItem

      const mockActions = useMockMode().mockActions
      await mockActions.switchUser('vip-user')

      expect(mockSetItem).toHaveBeenCalledWith(
        'raffletime_mock_session',
        expect.stringContaining('vip-user')
      )
    })

    it('should restore user selection from localStorage on init', async () => {
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify({
        currentUser: {
          id: 'mock-active-001',
          persona: 'active-user',
          username: 'ActiveTester'
        }
      }))
      window.localStorage.getItem = mockGetItem

      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      const currentUser = useMockMode().mockUser

      expect(currentUser?.persona).toBe('active-user')
      expect(currentUser?.username).toBe('ActiveTester')
    })
  })

  describe('Global Developer Console', () => {
    it('should expose user switching methods on window object', async () => {
      // This will fail until global setup is implemented
      await import('@/lib/mock/global-setup')

      expect(window.__MOCK_MODE__).toBeDefined()
      expect(typeof window.__MOCK_MODE__.switchUser).toBe('function')
      expect(typeof window.__MOCK_MODE__.getCurrentUser).toBe('function')
      expect(typeof window.__MOCK_MODE__.getAvailablePersonas).toBe('function')
    })

    it('should switch users via global console method', async () => {
      await import('@/lib/mock/global-setup')

      await window.__MOCK_MODE__.switchUser('power-user')
      const currentUser = window.__MOCK_MODE__.getCurrentUser()

      expect(currentUser.persona).toBe('power-user')
      expect(currentUser.username).toBe('PowerTester')
      expect(currentUser.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should list available personas', async () => {
      await import('@/lib/mock/global-setup')

      const personas = window.__MOCK_MODE__.getAvailablePersonas()

      expect(personas).toEqual([
        'new-user',
        'active-user',
        'power-user',
        'vip-user',
        'problem-user'
      ])
    })

    it('should validate persona before switching', async () => {
      await import('@/lib/mock/global-setup')

      // Should reject invalid persona
      await expect(
        window.__MOCK_MODE__.switchUser('invalid-persona')
      ).rejects.toThrow('Invalid persona: invalid-persona')
    })
  })

  describe('MiniKit Integration', () => {
    it('should update MiniKit user when persona switches', async () => {
      const { MockMiniKit } = await import('@/lib/mock/mock-minikit')
      
      const originalUser = MockMiniKit.user
      expect(originalUser.username).toBe('ActiveTester') // Default persona

      await window.__MOCK_MODE__.switchUser('power-user')

      const updatedUser = MockMiniKit.user
      expect(updatedUser.username).toBe('PowerTester')
      expect(updatedUser.walletAddress).not.toBe(originalUser.walletAddress)
    })

    it('should update wallet auth responses with new user data', async () => {
      const { MockMiniKit } = await import('@/lib/mock/mock-minikit')
      
      await window.__MOCK_MODE__.switchUser('vip-user')

      const authResult = await MockMiniKit.commandsAsync.walletAuth({
        nonce: 'test-nonce',
        requestId: '0',
        expirationTime: new Date(),
        notBefore: new Date(),
        statement: 'Test'
      })

      expect(authResult.finalPayload.address).toBe(MockMiniKit.user.walletAddress)
    })
  })

  describe('Session Management', () => {
    it('should track session statistics', async () => {
      const { MockModeState } = await import('@/lib/mock/session-storage')
      
      const sessionData = MockModeState.getSessionData()
      
      expect(sessionData.statistics.interactionsCount).toBeGreaterThanOrEqual(0)
      expect(sessionData.sessionStart).toBeDefined()
      expect(sessionData.preferences.defaultPersona).toBeDefined()
    })

    it('should reset session when requested', async () => {
      await import('@/lib/mock/global-setup')
      
      // Make some interactions first
      await window.__MOCK_MODE__.switchUser('power-user')
      await window.__MOCK_MODE__.switchUser('vip-user')

      window.__MOCK_MODE__.resetSession()

      const sessionData = window.__MOCK_MODE__.getSessionData()
      expect(sessionData.statistics.interactionsCount).toBe(0)
      expect(sessionData.currentUser).toBeNull()
    })

    it('should export session data for debugging', async () => {
      await import('@/lib/mock/global-setup')
      
      await window.__MOCK_MODE__.switchUser('power-user')
      
      const exportedData = window.__MOCK_MODE__.exportSession()
      
      expect(exportedData.version).toBeDefined()
      expect(exportedData.sessionId).toBeDefined()
      expect(exportedData.currentUser?.persona).toBe('power-user')
      expect(exportedData.sessionStats.interactions).toBeGreaterThan(0)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle invalid persona gracefully', async () => {
      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      
      const mockActions = useMockMode().mockActions
      
      await expect(mockActions.switchUser('nonexistent-user' as any))
        .rejects.toThrow('Invalid persona')
    })

    it('should fallback to default persona on localStorage corruption', async () => {
      // Corrupt localStorage data
      window.localStorage.getItem = jest.fn().mockReturnValue('invalid-json')

      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      const currentUser = useMockMode().mockUser

      // Should fallback to default (active-user)
      expect(currentUser?.persona).toBe('active-user')
    })

    it('should handle localStorage unavailable', async () => {
      // Simulate localStorage unavailable
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      })

      const { useMockMode } = await import('@/lib/hooks/useMockMode')
      const mockActions = useMockMode().mockActions

      // Should still work without localStorage
      await expect(mockActions.switchUser('power-user')).resolves.not.toThrow()
    })
  })
})