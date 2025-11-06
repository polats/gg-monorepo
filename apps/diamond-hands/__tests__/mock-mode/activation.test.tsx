/**
 * Integration Tests: Mock Mode Activation
 * Tests environment detection and mock mode activation logic
 */

import { isMockModeEnabled, getEnvironmentConfig, validateProductionSafety } from '@/lib/mock/environment'

describe('Mock Mode Activation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Environment Detection', () => {
    it('should enable mock mode in development with flag', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      expect(isMockModeEnabled()).toBe(true)
    })

    it('should disable mock mode in development without flag', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'false'

      expect(isMockModeEnabled()).toBe(false)
    })

    it('should disable mock mode in production regardless of flag', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      expect(isMockModeEnabled()).toBe(false)
    })

    it('should disable mock mode in staging regardless of flag', () => {
      process.env.NODE_ENV = 'staging'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      expect(isMockModeEnabled()).toBe(false)
    })
  })

  describe('Configuration Loading', () => {
    it('should load correct configuration when mock mode enabled', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
      process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS = 'true'
      process.env.NEXT_PUBLIC_MOCK_DEBUG = 'true'
      process.env.NEXT_PUBLIC_MOCK_LEVEL = 'debug'

      const config = getEnvironmentConfig()

      expect(config).toEqual({
        isMockEnabled: true,
        showVisualIndicators: true,
        enableDebugLogging: true,
        currentEnvironment: 'development',
        mockLevel: 'debug',
        features: {
          allowUserSwitching: true,
          simulateNetworkDelay: false,
          enableErrorScenarios: true
        }
      })
    })

    it('should load default configuration when mock mode disabled', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'false'

      const config = getEnvironmentConfig()

      expect(config).toEqual({
        isMockEnabled: false,
        showVisualIndicators: false, // Corrected expectation
        enableDebugLogging: false,
        currentEnvironment: 'development',
        mockLevel: 'full',
        features: {
          allowUserSwitching: true,
          simulateNetworkDelay: false,
          enableErrorScenarios: false
        }
      })
    })

    it('should handle missing environment variables gracefully', () => {
      process.env.NODE_ENV = 'development'
      // All mock-related env vars undefined

      const config = getEnvironmentConfig()

      expect(config.isMockEnabled).toBe(false)
      expect(config.mockLevel).toBe('full')
      expect(config.currentEnvironment).toBe('development')
    })
  })

  describe('Production Safety', () => {
    it('should pass production safety check when no mock vars present', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_MOCK_MODE
      delete process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS
      delete process.env.NEXT_PUBLIC_MOCK_DEBUG

      expect(validateProductionSafety()).toBe(true)
    })

    it('should fail production safety check when mock vars present in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      // Mock console.warn to capture the warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      expect(validateProductionSafety()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Mock mode environment variables detected in production build')

      consoleSpy.mockRestore()
    })

    it('should pass production safety check in non-production environments', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      expect(validateProductionSafety()).toBe(true)
    })
  })

  describe('Mock Mode Context Provider', () => {
    it('should provide mock mode context when enabled', async () => {
      // This test will fail until MockModeProvider is implemented
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      // Mock the provider that doesn't exist yet
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      
      expect(MockModeProvider).toBeDefined()
      expect(typeof MockModeProvider).toBe('function')
    })

    it('should expose global mock mode utilities when active', () => {
      // This test will fail until global setup is implemented
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'

      // These global utilities don't exist yet
      expect(typeof window.__MOCK_MODE__).toBe('object')
      expect(typeof window.__MOCK_MODE__.switchUser).toBe('function')
      expect(typeof window.__MOCK_MODE__.simulateError).toBe('function')
      expect(typeof window.__MOCK_MODE__.getCurrentUser).toBe('function')
    })
  })

  describe('Visual Indicators', () => {
    it('should show visual indicators when mock mode active and configured', () => {
      // This test will fail until visual indicators are implemented
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
      process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS = 'true'

      const config = getEnvironmentConfig()
      expect(config.showVisualIndicators).toBe(true)

      // Mock indicators component doesn't exist yet
      expect(() => require('@/components/MockIndicators')).not.toThrow()
    })

    it('should hide visual indicators when configured off', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
      process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS = 'false'

      const config = getEnvironmentConfig()
      expect(config.showVisualIndicators).toBe(false)
    })
  })
})