"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { MockModeContextValue, MockUser, MockPersona, MockModeState, MockPreferences } from '@/lib/mock/types'
import { getEnvironmentConfig, logEnvironmentConfig } from '@/lib/mock/environment'
import { mockUserProfiles, getDefaultPersona, validatePersona, getUserByPersona } from '@/lib/mock/mock-users'
import { mockResponseGenerator } from '@/lib/mock/response-generator'
import { MockMiniKitInstance, switchMockUser } from '@/lib/mock/mock-minikit'

// Create the context
const MockModeContext = createContext<MockModeContextValue | null>(null)

// Storage utilities
const STORAGE_KEY = 'raffletime_mock_session'

const loadSessionData = (): {
  currentUser: MockUser | null
  preferences: MockPreferences
} => {
  if (typeof window === 'undefined') {
    return {
      currentUser: mockUserProfiles[getDefaultPersona()],
      preferences: {
        defaultPersona: getDefaultPersona(),
        autoLogin: false,
        preserveSession: true,
        simulateDelay: process.env.NEXT_PUBLIC_MOCK_SIMULATE_DELAY === 'true',
        showTransactionDetails: true
      }
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        currentUser: data.currentUser || mockUserProfiles[getDefaultPersona()],
        preferences: {
          defaultPersona: getDefaultPersona(),
          autoLogin: false,
          preserveSession: true,
          simulateDelay: process.env.NEXT_PUBLIC_MOCK_SIMULATE_DELAY === 'true',
          showTransactionDetails: true,
          ...data.preferences
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load mock mode session data:', error)
  }

  return {
    currentUser: mockUserProfiles[getDefaultPersona()],
    preferences: {
      defaultPersona: getDefaultPersona(),
      autoLogin: false,
      preserveSession: true,
      simulateDelay: process.env.NEXT_PUBLIC_MOCK_SIMULATE_DELAY === 'true',
      showTransactionDetails: true
    }
  }
}

const saveSessionData = (currentUser: MockUser | null, preferences: MockPreferences): void => {
  if (typeof window === 'undefined') return

  try {
    const data = {
      version: '1.0.0',
      sessionId: 'mock-session-' + Date.now(),
      currentUser,
      preferences,
      sessionStats: {
        startTime: new Date().toISOString(),
        interactions: 0,
        lastActive: new Date().toISOString()
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save mock mode session data:', error)
  }
}

// Provider component
interface MockModeProviderProps {
  children: ReactNode
}

export function MockModeProvider({ children }: MockModeProviderProps) {
  const config = getEnvironmentConfig()
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null)
  const [preferences, setPreferences] = useState<MockPreferences>({
    defaultPersona: getDefaultPersona(),
    autoLogin: false,
    preserveSession: true,
    simulateDelay: false,
    showTransactionDetails: true
  })
  
  const [state, setState] = useState<MockModeState>({
    currentUserId: null,
    isActive: config.isMockEnabled,
    availablePersonas: ['new-user', 'active-user', 'power-user', 'vip-user', 'problem-user'],
    sessionStart: new Date(),
    preferences,
    statistics: {
      interactionsCount: 0,
      errorsTriggered: 0,
      sessionDuration: 0
    }
  })

  // Initialize mock mode
  useEffect(() => {
    if (!config.isMockEnabled) return

    // Load session data
    const sessionData = loadSessionData()
    setCurrentUser(sessionData.currentUser)
    setPreferences(sessionData.preferences)
    
    // Update state
    setState(prev => ({
      ...prev,
      currentUserId: sessionData.currentUser?.id || null,
      preferences: sessionData.preferences
    }))

    // Set MiniKit user
    if (sessionData.currentUser) {
      MockMiniKitInstance.user = sessionData.currentUser
    }

    // Log configuration
    logEnvironmentConfig()

    console.log('🧪 Mock Mode Provider initialized:', {
      user: sessionData.currentUser?.username,
      persona: sessionData.currentUser?.persona
    })
  }, [config.isMockEnabled])

  // Context value
  const contextValue: MockModeContextValue = {
    // State
    config,
    state,
    currentUser,

    // Actions
    activateMockMode: () => {
      setState(prev => ({ ...prev, isActive: true }))
      console.log('🧪 Mock mode activated')
    },

    deactivateMockMode: () => {
      setState(prev => ({ ...prev, isActive: false }))
      setCurrentUser(null)
      MockMiniKitInstance.reset()
      console.log('🧪 Mock mode deactivated')
    },

    switchUser: async (persona: MockPersona) => {
      if (!validatePersona(persona)) {
        throw new Error(`Invalid persona: ${persona}`)
      }

      const newUser = getUserByPersona(persona)
      setCurrentUser(newUser)
      
      // Update mock MiniKit
      await switchMockUser(persona)
      
      // Update state
      setState(prev => ({
        ...prev,
        currentUserId: newUser.id,
        statistics: {
          ...prev.statistics,
          interactionsCount: prev.statistics.interactionsCount + 1
        }
      }))

      // Save session
      saveSessionData(newUser, preferences)

      console.log(`🧪 Switched to ${persona}: ${newUser.username}`)
    },

    simulateError: (errorType: string) => {
      mockResponseGenerator.simulateError(errorType)
      
      setState(prev => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          errorsTriggered: prev.statistics.errorsTriggered + 1
        }
      }))

      console.log(`🧪 Simulating error: ${errorType}`)
    },

    resetSession: () => {
      const defaultUser = mockUserProfiles[getDefaultPersona()]
      setCurrentUser(defaultUser)
      MockMiniKitInstance.reset()
      
      setState(prev => ({
        ...prev,
        currentUserId: defaultUser.id,
        statistics: {
          interactionsCount: 0,
          errorsTriggered: 0,
          sessionDuration: 0
        }
      }))

      // Clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }

      console.log('🧪 Mock mode session reset')
    },

    // Utilities
    isMockActive: config.isMockEnabled,
    
    getMockResponse: <T extends any>(command: string, scenario?: string): T => {
      return mockResponseGenerator.testResponse(command, scenario || 'success') as T
    },

    logMockInteraction: (action: string, data?: any) => {
      setState(prev => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          interactionsCount: prev.statistics.interactionsCount + 1
        }
      }))

      if (config.enableDebugLogging) {
        console.log(`🧪 Mock interaction [${action}]:`, data)
      }
    }
  }

  // Only provide context if mock mode is enabled
  if (!config.isMockEnabled) {
    return <>{children}</>
  }

  return (
    <MockModeContext.Provider value={contextValue}>
      {children}
    </MockModeContext.Provider>
  )
}

// Hook to use mock mode context
export function useMockModeContext(): MockModeContextValue {
  const context = useContext(MockModeContext)
  
  if (!context) {
    // If no context available, return a disabled mock mode
    const config = getEnvironmentConfig()
    return {
      config,
      state: {
        currentUserId: null,
        isActive: false,
        availablePersonas: [],
        sessionStart: new Date(),
        preferences: {
          defaultPersona: 'active-user',
          autoLogin: false,
          preserveSession: false,
          simulateDelay: false,
          showTransactionDetails: false
        },
        statistics: {
          interactionsCount: 0,
          errorsTriggered: 0,
          sessionDuration: 0
        }
      },
      currentUser: null,
      activateMockMode: () => {},
      deactivateMockMode: () => {},
      switchUser: async () => {},
      simulateError: () => {},
      resetSession: () => {},
      isMockActive: false,
      getMockResponse: () => ({}),
      logMockInteraction: () => {}
    } as MockModeContextValue
  }

  return context
}

export default MockModeProvider