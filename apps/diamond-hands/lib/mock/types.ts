/**
 * TypeScript Type Definitions for Mock Mode
 * Core interfaces and types for mock user data and functionality
 */

export interface MockUser {
  id: string
  walletAddress: string
  username: string | null
  profilePictureUrl: string | null
  isVerified: boolean
  lastLogin: Date
  persona: MockPersona
  metadata: {
    createdAt: Date
    isActive: boolean
    testingNotes?: string
  }
}

export type MockPersona = 
  | 'new-user'      // Recently joined, minimal activity
  | 'active-user'   // Regular platform usage
  | 'power-user'    // High engagement, multiple raffles
  | 'vip-user'      // Premium features, high balance
  | 'problem-user'  // Edge cases, error scenarios

export interface MockWallet {
  address: string
  userId: string
  balance: string // Decimal string for precision
  transactionHistory: MockTransaction[]
  isConnected: boolean
  network: 'mainnet' | 'testnet' | 'local'
  capabilities: {
    canPay: boolean
    canReceive: boolean
    canSign: boolean
  }
}

export interface MockTransaction {
  hash: string
  fromAddress: string
  toAddress: string
  amount: string // Decimal string
  type: TransactionType
  timestamp: Date
  status: TransactionStatus
  metadata: {
    gasUsed?: string
    blockNumber?: number
    confirmations?: number
  }
}

export type TransactionType = 
  | 'payment'     // Ticket purchases
  | 'claim'       // Prize claims
  | 'refund'      // Refund processing
  | 'deposit'     // Operator deposits

export type TransactionStatus = 'success' | 'pending' | 'failed'

export interface MockModeState {
  currentUserId: string | null
  isActive: boolean
  availablePersonas: MockPersona[]
  sessionStart: Date
  preferences: MockPreferences
  statistics: {
    interactionsCount: number
    errorsTriggered: number
    sessionDuration: number
  }
}

export interface MockPreferences {
  defaultPersona: MockPersona
  autoLogin: boolean
  preserveSession: boolean
  simulateDelay: boolean
  showTransactionDetails: boolean
}

export interface MockModeStorageData {
  version: string
  sessionId: string
  preferences: MockPreferences
  currentUser: MockUser | null
  sessionStats: {
    startTime: string
    interactions: number
    lastActive: string
  }
}

// MiniKit SDK Response Types
export interface WalletAuthSuccessPayload {
  status: 'success'
  address: string
  message: string
  signature: string
  nonce: string
}

export interface WalletAuthErrorPayload {
  status: 'error'
  error_code: string
  message?: string
}

export interface PayCommandSuccessPayload {
  status: 'success'
  transaction_hash: string
  amount: string
  timestamp?: string
}

export interface PayCommandErrorPayload {
  status: 'error'
  error_code: 'insufficient_funds' | 'user_cancelled' | 'network_error'
  message: string
}

export interface VerifyCommandSuccessPayload {
  status: 'success'
  verification_level: 'device' | 'orb'
  nullifier_hash: string
  proof: string
}

export interface VerifyCommandErrorPayload {
  status: 'error'
  error_code: 'verification_failed' | 'already_verified'
  message: string
}

export interface MockMiniKitResponses {
  walletAuth: {
    success: WalletAuthSuccessPayload
    error: WalletAuthErrorPayload
  }
  payment: {
    success: PayCommandSuccessPayload
    insufficient_funds: PayCommandErrorPayload
    user_cancelled: PayCommandErrorPayload
    network_error: PayCommandErrorPayload
  }
  verify: {
    success: VerifyCommandSuccessPayload
    verification_failed: VerifyCommandErrorPayload
    already_verified: VerifyCommandErrorPayload
  }
}

// React Context Types
export interface MockModeContextValue {
  // State
  config: import('./environment').EnvironmentConfig
  state: MockModeState
  currentUser: MockUser | null
  
  // Actions
  activateMockMode: () => void
  deactivateMockMode: () => void
  switchUser: (persona: MockPersona) => Promise<void>
  simulateError: (errorType: string) => void
  resetSession: () => void
  
  // Utilities
  isMockActive: boolean
  getMockResponse: <T>(command: string, scenario?: string) => T
  logMockInteraction: (action: string, data?: any) => void
}

// Hook Return Types
export interface UseMockModeResult {
  isMockMode: boolean
  mockUser: MockUser | null
  mockWallet: MockWallet | null
  mockActions: {
    switchUser: (persona: MockPersona) => Promise<void>
    simulateTransaction: (type: TransactionType, amount: string) => Promise<MockTransaction>
    triggerError: (scenario: string) => void
  }
}

// Global Mock Mode Interface
declare global {
  interface Window {
    __MOCK_MODE__: {
      // Core functionality
      switchUser: (persona: MockPersona) => Promise<void>
      getCurrentUser: () => MockUser | null
      getAvailablePersonas: () => MockPersona[]
      
      // Error simulation
      simulateError: (errorType: string) => void
      testResponse: (command: string, scenario: string) => any
      
      // Session management
      resetSession: () => void
      getSessionData: () => MockModeStorageData
      exportSession: () => MockModeStorageData
      
      // Developer utilities
      setDebugLevel: (level: 'verbose' | 'normal' | 'silent') => void
      getInteractionLog: () => any[]
      inspectState: () => MockModeState
      getAvailableResponses: (command: string) => string[]
      addCustomScenario: (command: string, response: any) => void
      setPreference: (key: string, value: any) => void
      
      // Status
      isActive: () => boolean
      getRegisteredResponses: () => string[]
    }
  }
}

// Component Props Extensions
export interface MockAwareComponentProps {
  mockConfig?: {
    autoLogin?: boolean
    simulateDelay?: number
    forceError?: boolean
    simulateNetworkDelay?: boolean
    forceFailure?: boolean
    customTxHash?: string
  }
}

export interface LoginComponentProps extends MockAwareComponentProps {
  onLogin?: (user: MockUser) => void
  onError?: (error: Error) => void
}

export interface PayComponentProps extends MockAwareComponentProps {
  amount: string
  recipient: string
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export interface VerifyComponentProps extends MockAwareComponentProps {
  action: string
  signal: string
  onSuccess?: (result: VerifyCommandSuccessPayload) => void
  onError?: (error: Error) => void
}

// Storage Keys
export const STORAGE_KEYS = {
  MOCK_MODE: 'raffletime_mock_mode',
  USER_PREFERENCES: 'raffletime_mock_preferences',
  SESSION_DATA: 'raffletime_mock_session'
} as const