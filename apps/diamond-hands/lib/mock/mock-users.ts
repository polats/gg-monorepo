/**
 * Mock User Profiles and Personas
 * Predefined user profiles for different testing scenarios
 */

import { MockUser, MockWallet, MockPersona, MockTransaction } from './types'

// Predefined Mock User Profiles
export const mockUserProfiles: Record<MockPersona, MockUser> = {
  'new-user': {
    id: 'mock-new-001',
    walletAddress: '0x1234567890123456789012345678901234567890',
    username: 'NewTester',
    profilePictureUrl: null,
    isVerified: true,
    lastLogin: new Date(),
    persona: 'new-user',
    metadata: {
      createdAt: new Date(),
      isActive: true,
      testingNotes: 'Fresh user for onboarding flow testing'
    }
  },
  'active-user': {
    id: 'mock-active-001',
    walletAddress: '0x2345678901234567890123456789012345678901',
    username: 'ActiveTester',
    profilePictureUrl: '/mock-avatars/active-user.png',
    isVerified: true,
    lastLogin: new Date(),
    persona: 'active-user',
    metadata: {
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      isActive: true,
      testingNotes: 'Regular user for standard flow testing'
    }
  },
  'power-user': {
    id: 'mock-power-001',
    walletAddress: '0x3456789012345678901234567890123456789012',
    username: 'PowerTester',
    profilePictureUrl: '/mock-avatars/power-user.png',
    isVerified: true,
    lastLogin: new Date(),
    persona: 'power-user',
    metadata: {
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      isActive: true,
      testingNotes: 'High engagement user for advanced feature testing'
    }
  },
  'vip-user': {
    id: 'mock-vip-001',
    walletAddress: '0x4567890123456789012345678901234567890123',
    username: 'VIPTester',
    profilePictureUrl: '/mock-avatars/vip-user.png',
    isVerified: true,
    lastLogin: new Date(),
    persona: 'vip-user',
    metadata: {
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      isActive: true,
      testingNotes: 'Premium user for high-value feature testing'
    }
  },
  'problem-user': {
    id: 'mock-problem-001',
    walletAddress: '0x5678901234567890123456789012345678901234',
    username: 'ErrorTester',
    profilePictureUrl: null,
    isVerified: false, // Unverified for error testing
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    persona: 'problem-user',
    metadata: {
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      isActive: false,
      testingNotes: 'Problematic user for error condition testing'
    }
  }
}

// Mock Wallet Generator
export function getMockWallet(user: MockUser): MockWallet {
  const balances: Record<MockPersona, string> = {
    'new-user': '0',
    'active-user': '500',
    'power-user': '1000',
    'vip-user': '10000',
    'problem-user': '0.01'
  }

  const transactionCounts: Record<MockPersona, number> = {
    'new-user': 0,
    'active-user': 5,
    'power-user': 25,
    'vip-user': 100,
    'problem-user': 1
  }

  const transactions = generateMockTransactions(
    user.walletAddress, 
    transactionCounts[user.persona]
  )

  return {
    address: user.walletAddress,
    userId: user.id,
    balance: balances[user.persona],
    transactionHistory: transactions,
    isConnected: true,
    network: 'mainnet',
    capabilities: {
      canPay: user.persona !== 'problem-user' || parseFloat(balances[user.persona]) > 0,
      canReceive: true,
      canSign: user.isVerified
    }
  }
}

// Generate Mock Transactions
function generateMockTransactions(walletAddress: string, count: number): MockTransaction[] {
  const transactions: MockTransaction[] = []
  
  for (let i = 0; i < count; i++) {
    const isIncoming = Math.random() > 0.5
    const amount = (Math.random() * 50 + 1).toFixed(2) // Random amount between 1-51
    const daysAgo = Math.floor(Math.random() * 30) // Random days in past month
    
    transactions.push({
      hash: generateTxHash(),
      fromAddress: isIncoming ? generateRandomAddress() : walletAddress,
      toAddress: isIncoming ? walletAddress : generateRandomAddress(),
      amount: amount,
      type: getRandomTransactionType(),
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      status: 'success',
      metadata: {
        gasUsed: (Math.random() * 50000 + 21000).toFixed(0),
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        confirmations: Math.floor(Math.random() * 50) + 12
      }
    })
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Utility Functions
function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function generateRandomAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function getRandomTransactionType(): MockTransaction['type'] {
  const types: MockTransaction['type'][] = ['payment', 'claim', 'refund', 'deposit']
  return types[Math.floor(Math.random() * types.length)]
}

// Persona Utilities
export function getAvailablePersonas(): MockPersona[] {
  return ['new-user', 'active-user', 'power-user', 'vip-user', 'problem-user']
}

export function validatePersona(persona: string): persona is MockPersona {
  return getAvailablePersonas().includes(persona as MockPersona)
}

export function getDefaultPersona(): MockPersona {
  return 'active-user'
}

export function getUserByPersona(persona: MockPersona): MockUser {
  const user = mockUserProfiles[persona]
  if (!user) {
    throw new Error(`Invalid persona: ${persona}`)
  }
  return { ...user } // Return copy to prevent mutation
}

export function getUserById(id: string): MockUser | null {
  const persona = Object.values(mockUserProfiles).find(user => user.id === id)?.persona
  return persona ? getUserByPersona(persona) : null
}

// Persona Testing Characteristics
export const personaCharacteristics = {
  'new-user': {
    balance: 0,
    verificationStatus: 'verified',
    activityLevel: 'minimal',
    transactionHistory: 'empty',
    testingFocus: 'onboarding flows, first-time user experience'
  },
  'active-user': {
    balance: 500,
    verificationStatus: 'verified',
    activityLevel: 'moderate',
    transactionHistory: 'some transactions',
    testingFocus: 'regular usage patterns, standard features'
  },
  'power-user': {
    balance: 1000,
    verificationStatus: 'verified',
    activityLevel: 'high',
    transactionHistory: 'extensive',
    testingFocus: 'advanced features, heavy usage scenarios'
  },
  'vip-user': {
    balance: 10000,
    verificationStatus: 'verified',
    activityLevel: 'premium',
    transactionHistory: 'very extensive',
    testingFocus: 'premium features, high-value operations'
  },
  'problem-user': {
    balance: 0.01,
    verificationStatus: 'unverified',
    activityLevel: 'problematic',
    transactionHistory: 'minimal',
    testingFocus: 'error conditions, edge cases, insufficient funds'
  }
} as const

// Mock User Factory
export class MockUserFactory {
  static createUser(
    persona: MockPersona,
    overrides: Partial<MockUser> = {}
  ): MockUser {
    const baseUser = getUserByPersona(persona)
    return {
      ...baseUser,
      ...overrides,
      metadata: {
        ...baseUser.metadata,
        ...overrides.metadata
      }
    }
  }

  static createCustomUser(
    id: string,
    walletAddress: string,
    persona: MockPersona,
    options: {
      username?: string
      isVerified?: boolean
      profilePictureUrl?: string
      testingNotes?: string
    } = {}
  ): MockUser {
    return {
      id,
      walletAddress,
      username: options.username || `${persona}-${id}`,
      profilePictureUrl: options.profilePictureUrl || null,
      isVerified: options.isVerified ?? true,
      lastLogin: new Date(),
      persona,
      metadata: {
        createdAt: new Date(),
        isActive: true,
        testingNotes: options.testingNotes
      }
    }
  }

  static getPersonaDescription(persona: MockPersona): string {
    const characteristics = personaCharacteristics[persona]
    return `${persona}: Balance ${characteristics.balance} WLD, ${characteristics.verificationStatus}, ${characteristics.activityLevel} activity. Focus: ${characteristics.testingFocus}`
  }
}