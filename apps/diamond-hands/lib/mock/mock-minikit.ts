/**
 * Mock MiniKit SDK Simulation
 * Provides a complete mock implementation of the WorldCoin MiniKit SDK
 */

import { WalletAuthInput } from '@worldcoin/minikit-js'
import { MockUser } from './types'
import { mockUserProfiles, getDefaultPersona } from './mock-users'
import { mockResponseGenerator } from './response-generator'

// Track current mock user state
let currentMockUser: MockUser = mockUserProfiles[getDefaultPersona()]

export class MockMiniKit {
  private static _instance: MockMiniKit

  static getInstance(): MockMiniKit {
    if (!MockMiniKit._instance) {
      MockMiniKit._instance = new MockMiniKit()
    }
    return MockMiniKit._instance
  }

  // MiniKit SDK Interface Compliance
  isInstalled = (): boolean => {
    // In mock mode, always return true
    return true
  }

  get user(): MockUser {
    return currentMockUser
  }

  set user(user: MockUser) {
    currentMockUser = user
  }

  install = (): void => {
    // Mock installation - always succeeds
    console.log('🧪 Mock MiniKit installed successfully')
  }

  // Commands Interface
  commandsAsync = {
    walletAuth: async (input: WalletAuthInput) => {
      await mockResponseGenerator.simulateNetworkDelay()
      
      const response = mockResponseGenerator.generateWalletAuthResponse(
        currentMockUser,
        input.nonce
      )

      // Log mock interaction
      this.logMockInteraction('walletAuth', {
        input,
        response: response.finalPayload,
        user: currentMockUser.username
      })

      return response
    },

    pay: async (payload: {
      to: string
      tokens: Array<{
        symbol: string
        token_amount: string
      }>
      description: string
    }) => {
      await mockResponseGenerator.simulateNetworkDelay()
      
      const amount = payload.tokens[0]?.token_amount || '0'
      
      // Check if user has sufficient balance (for realistic simulation)
      const userWallet = await import('./mock-users').then(m => m.getMockWallet(currentMockUser))
      const hasInsufficientFunds = parseFloat(userWallet.balance) < parseFloat(amount)
      
      let scenario: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error' = 'success'
      
      if (hasInsufficientFunds) {
        scenario = 'insufficient_funds'
      }

      const response = mockResponseGenerator.generatePaymentResponse(amount, scenario)

      // Log mock interaction
      this.logMockInteraction('pay', {
        payload,
        response: response.finalPayload,
        user: currentMockUser.username,
        userBalance: userWallet.balance
      })

      return response
    },

    verify: async (payload: {
      action: string
      signal: string
    }) => {
      await mockResponseGenerator.simulateNetworkDelay()
      
      // Problem users (unverified) should fail verification
      let scenario: 'success' | 'verification_failed' | 'already_verified' = 'success'
      
      if (currentMockUser.persona === 'problem-user' && !currentMockUser.isVerified) {
        scenario = 'verification_failed'
      }

      const response = mockResponseGenerator.generateVerifyResponse(payload, scenario)

      // Log mock interaction
      this.logMockInteraction('verify', {
        payload,
        response: response.finalPayload,
        user: currentMockUser.username,
        userVerified: currentMockUser.isVerified
      })

      return response
    }
  }

  // Mock-specific methods
  switchUser = (persona: string): void => {
    const { validatePersona, getUserByPersona } = require('./mock-users')
    
    if (!validatePersona(persona)) {
      throw new Error(`Invalid persona: ${persona}`)
    }
    
    const newUser = getUserByPersona(persona)
    currentMockUser = newUser
    
    this.logMockInteraction('switchUser', {
      fromPersona: currentMockUser.persona,
      toPersona: persona,
      newUser: newUser.username
    })
  }

  getCurrentUser = (): MockUser => {
    return currentMockUser
  }

  simulateError = (errorType: string): void => {
    mockResponseGenerator.simulateError(errorType)
    
    this.logMockInteraction('simulateError', {
      errorType,
      user: currentMockUser.username
    })
  }

  clearErrorSimulation = (): void => {
    mockResponseGenerator.clearErrorSimulation()
  }

  // Mock interaction logging
  private interactionLog: Array<{
    timestamp: Date
    action: string
    data: any
  }> = []

  private logMockInteraction = (action: string, data: any): void => {
    this.interactionLog.push({
      timestamp: new Date(),
      action,
      data
    })

    // Keep only last 100 interactions
    if (this.interactionLog.length > 100) {
      this.interactionLog = this.interactionLog.slice(-100)
    }

    // Debug logging if enabled
    if (process.env.NEXT_PUBLIC_MOCK_DEBUG === 'true') {
      console.log(`🧪 Mock MiniKit [${action}]:`, data)
    }
  }

  getInteractionLog = (): Array<{ timestamp: Date; action: string; data: any }> => {
    return [...this.interactionLog]
  }

  clearInteractionLog = (): void => {
    this.interactionLog = []
  }

  // Testing utilities
  testCommand = async (command: string, params: any): Promise<any> => {
    switch (command) {
      case 'walletAuth':
        return await this.commandsAsync.walletAuth(params)
      case 'pay':
        return await this.commandsAsync.pay(params)
      case 'verify':
        return await this.commandsAsync.verify(params)
      default:
        throw new Error(`Unknown command: ${command}`)
    }
  }

  // State inspection
  inspectState = (): {
    currentUser: MockUser
    interactionCount: number
    errorSimulation: boolean
    lastInteraction: Date | null
  } => {
    return {
      currentUser: currentMockUser,
      interactionCount: this.interactionLog.length,
      errorSimulation: mockResponseGenerator['errorSimulation'] !== null,
      lastInteraction: this.interactionLog.length > 0 
        ? this.interactionLog[this.interactionLog.length - 1].timestamp 
        : null
    }
  }

  // Reset mock state
  reset = (): void => {
    currentMockUser = mockUserProfiles[getDefaultPersona()]
    mockResponseGenerator.reset()
    this.interactionLog = []
    
    this.logMockInteraction('reset', {
      resetToPersona: currentMockUser.persona
    })
  }
}

// Create singleton instance
export const MockMiniKitInstance = MockMiniKit.getInstance()

// User management utilities
export const switchMockUser = (persona: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      MockMiniKitInstance.switchUser(persona)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

export const getCurrentMockUser = (): MockUser => {
  return MockMiniKitInstance.getCurrentUser()
}

// Error simulation utilities
export const simulateMockError = (errorType: string): void => {
  MockMiniKitInstance.simulateError(errorType)
}

export const clearMockErrorSimulation = (): void => {
  MockMiniKitInstance.clearErrorSimulation()
}

// Testing utilities
export const getMockMiniKitState = () => {
  return MockMiniKitInstance.inspectState()
}

export const resetMockMiniKit = (): void => {
  MockMiniKitInstance.reset()
}

// Export for global usage
if (typeof window !== 'undefined') {
  // Attach to window for development console access
  (window as any).__MOCK_MINIKIT__ = MockMiniKitInstance
}

export default MockMiniKit