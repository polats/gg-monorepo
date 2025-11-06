/**
 * Environment Configuration Utility for Mock Mode
 * Handles detection and configuration of mock mode based on environment variables
 */

export interface EnvironmentConfig {
  isMockEnabled: boolean
  showVisualIndicators: boolean
  enableDebugLogging: boolean
  currentEnvironment: 'development' | 'staging' | 'production'
  mockLevel: MockLevel
  features: {
    allowUserSwitching: boolean
    simulateNetworkDelay: boolean
    enableErrorScenarios: boolean
  }
}

export type MockLevel = 
  | 'basic'       // Simple mock responses
  | 'full'        // Complete simulation with state
  | 'debug'       // Full simulation + detailed logging

/**
 * Detects if mock mode should be enabled based on environment variables
 */
export const isMockModeEnabled = (): boolean => {
  // Only enable in development environment with explicit flag
  return (
    process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  )
}

/**
 * Gets the current environment configuration for mock mode
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const isMockEnabled = isMockModeEnabled()
  
  return {
    isMockEnabled,
    showVisualIndicators: process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS !== 'false',
    enableDebugLogging: process.env.NEXT_PUBLIC_MOCK_DEBUG === 'true',
    currentEnvironment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    mockLevel: (process.env.NEXT_PUBLIC_MOCK_LEVEL as MockLevel) || 'full',
    features: {
      allowUserSwitching: process.env.NEXT_PUBLIC_MOCK_AUTO_LOGIN !== 'true',
      simulateNetworkDelay: process.env.NEXT_PUBLIC_MOCK_SIMULATE_DELAY === 'true',
      enableErrorScenarios: isMockEnabled && process.env.NEXT_PUBLIC_MOCK_LEVEL === 'debug'
    }
  }
}

/**
 * Production safety check - ensures mock mode is completely disabled in production
 */
export const validateProductionSafety = (): boolean => {
  if (process.env.NODE_ENV === 'production') {
    // In production, mock mode should never be enabled
    const hasModeMockVars = 
      process.env.NEXT_PUBLIC_MOCK_MODE ||
      process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS ||
      process.env.NEXT_PUBLIC_MOCK_DEBUG
    
    if (hasModeMockVars) {
      console.warn('⚠️  Mock mode environment variables detected in production build')
      return false
    }
  }
  
  return true
}

/**
 * Logs current environment configuration for debugging
 */
export const logEnvironmentConfig = (): void => {
  if (!isMockModeEnabled()) return
  
  const config = getEnvironmentConfig()
  console.log('🧪 Mock Mode Configuration:', {
    enabled: config.isMockEnabled,
    environment: config.currentEnvironment,
    level: config.mockLevel,
    visualIndicators: config.showVisualIndicators,
    debugging: config.enableDebugLogging,
    features: config.features
  })
}