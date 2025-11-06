/**
 * Custom Hook for Mock Mode Functionality
 * Provides convenient access to mock mode features for components
 */

import { useCallback, useMemo } from 'react'
import { UseMockModeResult, MockPersona, TransactionType, MockTransaction } from '@/lib/mock/types'
import { useMockModeContext } from '@/components/providers/MockModeProvider'
import { getMockWallet } from '@/lib/mock/mock-users'
import { mockResponseGenerator } from '@/lib/mock/response-generator'

export function useMockMode(): UseMockModeResult {
  const context = useMockModeContext()
  
  // Memoized values
  const isMockMode = useMemo(() => context.isMockActive, [context.isMockActive])
  const mockUser = useMemo(() => context.currentUser, [context.currentUser])
  
  const mockWallet = useMemo(() => {
    if (!mockUser) return null
    try {
      return getMockWallet(mockUser)
    } catch (error) {
      console.warn('Failed to get mock wallet:', error)
      return null
    }
  }, [mockUser])

  // Actions
  const switchUser = useCallback(async (persona: MockPersona): Promise<void> => {
    try {
      await context.switchUser(persona)
      context.logMockInteraction('useMockMode.switchUser', { persona })
    } catch (error) {
      console.error('Failed to switch mock user:', error)
      throw new Error(`Failed to switch to persona: ${persona}`)
    }
  }, [context])

  const simulateTransaction = useCallback(async (
    type: TransactionType, 
    amount: string
  ): Promise<MockTransaction> => {
    if (!mockUser || !mockWallet) {
      throw new Error('No mock user or wallet available')
    }

    // Simulate realistic transaction processing
    await mockResponseGenerator.simulateNetworkDelay()
    
    const transaction: MockTransaction = {
      hash: mockResponseGenerator.generateTxHash(),
      fromAddress: type === 'claim' || type === 'refund' 
        ? '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : mockWallet.address,
      toAddress: type === 'payment' || type === 'deposit'
        ? '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : mockWallet.address,
      amount,
      type,
      timestamp: new Date(),
      status: 'success',
      metadata: {
        gasUsed: (Math.random() * 50000 + 21000).toFixed(0),
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        confirmations: Math.floor(Math.random() * 50) + 12
      }
    }

    context.logMockInteraction('useMockMode.simulateTransaction', {
      type,
      amount,
      user: mockUser.username,
      transactionHash: transaction.hash
    })

    return transaction
  }, [mockUser, mockWallet, context])

  const triggerError = useCallback((scenario: string): void => {
    context.simulateError(scenario)
    context.logMockInteraction('useMockMode.triggerError', { scenario })
  }, [context])

  // Mock actions object
  const mockActions = useMemo(() => ({
    switchUser,
    simulateTransaction,
    triggerError
  }), [switchUser, simulateTransaction, triggerError])

  return {
    isMockMode,
    mockUser,
    mockWallet,
    mockActions
  }
}

// Additional utility hooks

/**
 * Hook for mock user management
 */
export function useMockUser() {
  const { mockUser, mockActions } = useMockMode()
  
  return {
    user: mockUser,
    switchUser: mockActions.switchUser,
    isNewUser: mockUser?.persona === 'new-user',
    isActiveUser: mockUser?.persona === 'active-user',
    isPowerUser: mockUser?.persona === 'power-user',
    isVipUser: mockUser?.persona === 'vip-user',
    isProblemUser: mockUser?.persona === 'problem-user',
  }
}

/**
 * Hook for mock wallet operations
 */
export function useMockWallet() {
  const { mockWallet, mockActions, isMockMode } = useMockMode()
  
  const canPay = useCallback((amount: string): boolean => {
    if (!mockWallet) return false
    return parseFloat(mockWallet.balance) >= parseFloat(amount)
  }, [mockWallet])

  const simulatePayment = useCallback(async (amount: string) => {
    if (!canPay(amount)) {
      throw new Error('Insufficient funds for payment')
    }
    return mockActions.simulateTransaction('payment', amount)
  }, [canPay, mockActions])

  const simulateClaim = useCallback(async (amount: string) => {
    return mockActions.simulateTransaction('claim', amount)
  }, [mockActions])

  const simulateRefund = useCallback(async (amount: string) => {
    return mockActions.simulateTransaction('refund', amount)
  }, [mockActions])

  return {
    wallet: mockWallet,
    balance: mockWallet?.balance || '0',
    canPay,
    simulatePayment,
    simulateClaim,
    simulateRefund,
    isConnected: mockWallet?.isConnected || false,
    isMockMode
  }
}

/**
 * Hook for mock error simulation
 */
export function useMockErrors() {
  const { mockActions, isMockMode } = useMockMode()
  
  const simulateInsufficientFunds = useCallback(() => {
    mockActions.triggerError('insufficient_funds')
  }, [mockActions])

  const simulateUserCancellation = useCallback(() => {
    mockActions.triggerError('user_cancelled')
  }, [mockActions])

  const simulateNetworkError = useCallback(() => {
    mockActions.triggerError('network_error')
  }, [mockActions])

  const simulateVerificationFailure = useCallback(() => {
    mockActions.triggerError('verification_failed')
  }, [mockActions])

  const clearAllErrors = useCallback(() => {
    mockResponseGenerator.clearErrorSimulation()
  }, [])

  return {
    isMockMode,
    simulateInsufficientFunds,
    simulateUserCancellation,
    simulateNetworkError,
    simulateVerificationFailure,
    clearAllErrors
  }
}

/**
 * Hook for mock session management
 */
export function useMockSession() {
  const context = useMockModeContext()
  
  const sessionStats = useMemo(() => ({
    interactions: context.state.statistics.interactionsCount,
    errors: context.state.statistics.errorsTriggered,
    duration: Date.now() - context.state.sessionStart.getTime(),
    startTime: context.state.sessionStart
  }), [context.state])

  return {
    isMockMode: context.isMockActive,
    sessionStats,
    availablePersonas: context.state.availablePersonas,
    preferences: context.state.preferences,
    resetSession: context.resetSession,
    activateMockMode: context.activateMockMode,
    deactivateMockMode: context.deactivateMockMode
  }
}

/**
 * Hook for development debugging
 */
export function useMockDebug() {
  const context = useMockModeContext()
  const { mockUser, mockWallet } = useMockMode()
  
  const debugInfo = useMemo(() => ({
    isMockActive: context.isMockActive,
    currentUser: mockUser,
    currentWallet: mockWallet,
    config: context.config,
    state: context.state,
    sessionDuration: Date.now() - context.state.sessionStart.getTime()
  }), [context, mockUser, mockWallet])

  const logDebugInfo = useCallback(() => {
    console.group('🧪 Mock Mode Debug Info')
    console.log('Configuration:', debugInfo.config)
    console.log('Current State:', debugInfo.state)
    console.log('Current User:', debugInfo.currentUser)
    console.log('Current Wallet:', debugInfo.currentWallet)
    console.log('Session Duration:', debugInfo.sessionDuration + 'ms')
    console.groupEnd()
  }, [debugInfo])

  return {
    debugInfo,
    logDebugInfo,
    getMockResponse: context.getMockResponse,
    logMockInteraction: context.logMockInteraction
  }
}

export default useMockMode