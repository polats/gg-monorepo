/**
 * Mock Response Generator Utility
 * Generates realistic mock responses for MiniKit SDK commands
 */

import { 
  MockUser, 
  WalletAuthSuccessPayload, 
  WalletAuthErrorPayload,
  PayCommandSuccessPayload, 
  PayCommandErrorPayload,
  VerifyCommandSuccessPayload, 
  VerifyCommandErrorPayload 
} from './types'

export class MockResponseGenerator {
  private static instance: MockResponseGenerator
  private errorSimulation: string | null = null

  static getInstance(): MockResponseGenerator {
    if (!MockResponseGenerator.instance) {
      MockResponseGenerator.instance = new MockResponseGenerator()
    }
    return MockResponseGenerator.instance
  }

  // Error simulation control
  simulateError(errorType: string): void {
    this.errorSimulation = errorType
  }

  clearErrorSimulation(): void {
    this.errorSimulation = null
  }

  // Wallet Authentication Response Generation
  generateWalletAuthResponse(
    user: MockUser, 
    nonce: string,
    scenario: 'success' | 'error' = 'success'
  ): { finalPayload: WalletAuthSuccessPayload | WalletAuthErrorPayload } {
    // Check for forced error scenarios
    if (this.errorSimulation === 'user_cancelled' || scenario === 'error') {
      return {
        finalPayload: {
          status: 'error',
          error_code: 'user_cancelled',
          message: 'User cancelled the authentication request'
        }
      }
    }

    // Check for problem user scenarios
    if (user.persona === 'problem-user' && !user.isVerified) {
      return {
        finalPayload: {
          status: 'error',
          error_code: 'verification_required',
          message: 'User must complete WorldID verification'
        }
      }
    }

    // Success response
    return {
      finalPayload: {
        status: 'success',
        address: user.walletAddress,
        message: 'Mock wallet authentication successful',
        signature: this.generateMockSignature(),
        nonce
      }
    }
  }

  // Payment Response Generation
  generatePaymentResponse(
    amount: string, 
    scenario: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error' = 'success'
  ): { finalPayload: PayCommandSuccessPayload | PayCommandErrorPayload } {
    // Check for forced error scenarios
    if (this.errorSimulation) {
      switch (this.errorSimulation) {
        case 'insufficient_funds':
          return {
            finalPayload: {
              status: 'error',
              error_code: 'insufficient_funds',
              message: 'Insufficient WLD balance for this transaction'
            }
          }
        case 'user_cancelled':
          return {
            finalPayload: {
              status: 'error',
              error_code: 'user_cancelled',
              message: 'User cancelled the payment'
            }
          }
        case 'network_error':
          return {
            finalPayload: {
              status: 'error',
              error_code: 'network_error',
              message: 'Network error occurred during payment processing'
            }
          }
      }
    }

    // Scenario-based responses
    switch (scenario) {
      case 'insufficient_funds':
        return {
          finalPayload: {
            status: 'error',
            error_code: 'insufficient_funds',
            message: 'Insufficient WLD balance for this transaction'
          }
        }
      case 'user_cancelled':
        return {
          finalPayload: {
            status: 'error',
            error_code: 'user_cancelled',
            message: 'User cancelled the payment'
          }
        }
      case 'network_error':
        return {
          finalPayload: {
            status: 'error',
            error_code: 'network_error',
            message: 'Network error occurred during payment processing'
          }
        }
      default:
        // Success response
        return {
          finalPayload: {
            status: 'success',
            transaction_hash: this.generateTxHash(),
            amount: amount,
            timestamp: new Date().toISOString()
          }
        }
    }
  }

  // WorldID Verification Response Generation
  generateVerifyResponse(
    payload: { action: string; signal: string },
    scenario: 'success' | 'verification_failed' | 'already_verified' = 'success'
  ): { finalPayload: VerifyCommandSuccessPayload | VerifyCommandErrorPayload } {
    // Check for forced error scenarios
    if (this.errorSimulation) {
      switch (this.errorSimulation) {
        case 'verification_failed':
          return {
            finalPayload: {
              status: 'error',
              error_code: 'verification_failed',
              message: 'WorldID verification failed'
            }
          }
        case 'already_verified':
          return {
            finalPayload: {
              status: 'error',
              error_code: 'already_verified',
              message: 'Action has already been verified for this user'
            }
          }
      }
    }

    // Scenario-based responses
    switch (scenario) {
      case 'verification_failed':
        return {
          finalPayload: {
            status: 'error',
            error_code: 'verification_failed',
            message: 'WorldID verification failed'
          }
        }
      case 'already_verified':
        return {
          finalPayload: {
            status: 'error',
            error_code: 'already_verified',
            message: 'Action has already been verified for this user'
          }
        }
      default:
        // Success response
        return {
          finalPayload: {
            status: 'success',
            verification_level: 'device',
            nullifier_hash: this.generateNullifierHash(),
            proof: this.generateMockProof()
          }
        }
    }
  }

  // User-specific response generation
  generateUserContextualResponse<T>(
    user: MockUser, 
    command: string, 
    defaultResponse: T
  ): T {
    // Problem user always has issues
    if (user.persona === 'problem-user') {
      if (command === 'pay') {
        return this.generatePaymentResponse('0', 'insufficient_funds') as T
      }
      if (command === 'verify' && !user.isVerified) {
        return this.generateVerifyResponse({ action: 'test', signal: 'test' }, 'verification_failed') as T
      }
    }

    return defaultResponse
  }

  // Utility: Generate Mock Signature
  private generateMockSignature(): string {
    return '0x' + Array.from({ length: 130 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  // Utility: Generate Transaction Hash
  generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  // Utility: Generate Nonce
  generateNonce(): string {
    return 'mock-nonce-' + Math.random().toString(36).substr(2, 9)
  }

  // Utility: Generate Nullifier Hash
  private generateNullifierHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  // Utility: Generate Mock Proof
  private generateMockProof(): string {
    return 'mock_proof_' + Math.random().toString(36).substr(2, 20)
  }

  // Timing simulation
  async simulateNetworkDelay(): Promise<void> {
    const shouldSimulateDelay = process.env.NEXT_PUBLIC_MOCK_SIMULATE_DELAY === 'true'
    
    if (shouldSimulateDelay) {
      const delay = Math.random() * 200 + 100 // 100-300ms delay
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Custom response scenarios
  private customScenarios: Map<string, any> = new Map()

  addCustomScenario(command: string, response: any): void {
    this.customScenarios.set(command, response)
  }

  removeCustomScenario(command: string): void {
    this.customScenarios.delete(command)
  }

  getCustomResponse(command: string): any {
    return this.customScenarios.get(command)
  }

  // Available response types
  getAvailableResponses(command: string): string[] {
    switch (command) {
      case 'walletAuth':
        return ['success', 'user_cancelled', 'verification_required']
      case 'pay':
        return ['success', 'insufficient_funds', 'user_cancelled', 'network_error']
      case 'verify':
        return ['success', 'verification_failed', 'already_verified']
      default:
        return []
    }
  }

  // Test individual responses
  testResponse(command: string, scenario: string): any {
    const mockUser = {
      id: 'test-user',
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'TestUser',
      profilePictureUrl: null,
      isVerified: true,
      lastLogin: new Date(),
      persona: 'active-user' as const,
      metadata: {
        createdAt: new Date(),
        isActive: true
      }
    }

    switch (command) {
      case 'walletAuth':
        return this.generateWalletAuthResponse(mockUser, 'test-nonce', scenario as any)
      case 'pay':
        return this.generatePaymentResponse('5.0', scenario as any)
      case 'verify':
        return this.generateVerifyResponse({ action: 'test', signal: 'test' }, scenario as any)
      default:
        throw new Error(`Unknown command: ${command}`)
    }
  }

  // Response validation
  validateResponse(response: any, expectedType: string): boolean {
    if (!response || typeof response !== 'object') return false
    
    switch (expectedType) {
      case 'walletAuth':
        return response.finalPayload && 
               (['success', 'error'].includes(response.finalPayload.status))
      case 'pay':
        return response.finalPayload && 
               (['success', 'error'].includes(response.finalPayload.status))
      case 'verify':
        return response.finalPayload && 
               (['success', 'error'].includes(response.finalPayload.status))
      default:
        return false
    }
  }

  // Debug utilities
  getResponseStatistics(): {
    totalResponses: number
    successCount: number
    errorCount: number
    averageDelay: number
  } {
    // Mock implementation for debugging
    return {
      totalResponses: 0,
      successCount: 0,
      errorCount: 0,
      averageDelay: 0
    }
  }

  reset(): void {
    this.errorSimulation = null
    this.customScenarios.clear()
  }
}

// Export singleton instance
export const mockResponseGenerator = MockResponseGenerator.getInstance()

// Convenience exports
export { MockResponseGenerator as default }