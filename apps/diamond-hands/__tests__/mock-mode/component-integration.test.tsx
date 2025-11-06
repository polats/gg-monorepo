/**
 * Integration Tests: Component Behavior with Mock Data
 * Tests that existing components work correctly with mock mode enabled
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Component imports will exist
import { Login } from '@/components/Login'
// These components will be tested once they're enhanced with mock support

describe('Component Integration with Mock Data', () => {
  const originalEnv = process.env
  const user = userEvent.setup()

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    process.env.NEXT_PUBLIC_MOCK_MODE = 'true'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Login Component', () => {
    it('should render login button when user not authenticated', async () => {
      render(<Login />)
      
      const loginButton = screen.getByText('Login')
      expect(loginButton).toBeInTheDocument()
    })

    it('should authenticate immediately with mock user when clicked', async () => {
      // This will fail until Login component is enhanced with mock mode
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      
      render(
        <MockModeProvider>
          <Login />
        </MockModeProvider>
      )
      
      const loginButton = screen.getByText('Login')
      await user.click(loginButton)

      // Should show authenticated state immediately (no WorldCoin app prompt)
      await waitFor(() => {
        expect(screen.getByText('✓ Connected')).toBeInTheDocument()
      })

      // Should show mock user profile
      expect(screen.getByText('ActiveTester')).toBeInTheDocument() // Default persona
    })

    it('should work with different mock personas', async () => {
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      
      render(
        <MockModeProvider>
          <Login />
        </MockModeProvider>
      )

      // Switch to power user persona
      await window.__MOCK_MODE__.switchUser('power-user')
      
      const loginButton = screen.getByText('Login')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('PowerTester')).toBeInTheDocument()
      })
    })

    it('should handle logout correctly in mock mode', async () => {
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      
      render(
        <MockModeProvider>
          <Login />
        </MockModeProvider>
      )

      // Login first
      const loginButton = screen.getByText('Login')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('✓ Connected')).toBeInTheDocument()
      })

      // Then logout
      const logoutButton = screen.getByText('Sign Out')
      await user.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument()
      })
    })
  })

  describe('Pay Component', () => {
    it('should render payment interface', async () => {
      // This will fail until Pay component exists and is enhanced
      const { Pay } = await import('@/components/Pay')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      render(
        <MockModeProvider>
          <Pay amount="5.0" recipient="0x1234567890123456789012345678901234567890" />
        </MockModeProvider>
      )

      expect(screen.getByText(/pay/i)).toBeInTheDocument()
    })

    it('should process mock payments immediately', async () => {
      const { Pay } = await import('@/components/Pay')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      const mockOnSuccess = jest.fn()

      render(
        <MockModeProvider>
          <Pay 
            amount="5.0" 
            recipient="0x1234567890123456789012345678901234567890"
            onSuccess={mockOnSuccess}
          />
        </MockModeProvider>
      )

      const payButton = screen.getByText(/pay/i)
      await user.click(payButton)

      // Should complete immediately in mock mode
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.stringMatching(/^0x[a-fA-F0-9]{64}$/) // Transaction hash
        )
      })
    })

    it('should simulate payment errors when configured', async () => {
      const { Pay } = await import('@/components/Pay')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      const mockOnError = jest.fn()

      // Configure error scenario
      await window.__MOCK_MODE__.simulateError('insufficient_funds')

      render(
        <MockModeProvider>
          <Pay 
            amount="1000000.0" 
            recipient="0x1234567890123456789012345678901234567890"
            onError={mockOnError}
          />
        </MockModeProvider>
      )

      const payButton = screen.getByText(/pay/i)
      await user.click(payButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Insufficient')
          })
        )
      })
    })

    it('should respect user persona balances', async () => {
      const { Pay } = await import('@/components/Pay')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      // Switch to problem user (low balance)
      await window.__MOCK_MODE__.switchUser('problem-user')

      render(
        <MockModeProvider>
          <Pay amount="100.0" recipient="0x1234567890123456789012345678901234567890" />
        </MockModeProvider>
      )

      const payButton = screen.getByText(/pay/i)
      await user.click(payButton)

      // Should show insufficient funds error for problem user
      await waitFor(() => {
        expect(screen.getByText(/insufficient/i)).toBeInTheDocument()
      })
    })
  })

  describe('Verify Component', () => {
    it('should render verification interface', async () => {
      const { Verify } = await import('@/components/Verify')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      render(
        <MockModeProvider>
          <Verify action="test-action" signal="test-signal" />
        </MockModeProvider>
      )

      expect(screen.getByText(/verify/i)).toBeInTheDocument()
    })

    it('should complete verification immediately in mock mode', async () => {
      const { Verify } = await import('@/components/Verify')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')
      const mockOnSuccess = jest.fn()

      render(
        <MockModeProvider>
          <Verify 
            action="test-action" 
            signal="test-signal"
            onSuccess={mockOnSuccess}
          />
        </MockModeProvider>
      )

      const verifyButton = screen.getByText(/verify/i)
      await user.click(verifyButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            verification_level: 'device',
            nullifier_hash: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
            proof: expect.any(String)
          })
        )
      })
    })

    it('should handle unverified users correctly', async () => {
      const { Verify } = await import('@/components/Verify')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      // Switch to problem user (unverified)
      await window.__MOCK_MODE__.switchUser('problem-user')

      render(
        <MockModeProvider>
          <Verify action="test-action" signal="test-signal" />
        </MockModeProvider>
      )

      const verifyButton = screen.getByText(/verify/i)
      await user.click(verifyButton)

      // Should show verification error for unverified user
      await waitFor(() => {
        expect(screen.getByText(/verification.*failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('MiniKit Provider Integration', () => {
    it('should initialize mock MiniKit when mock mode enabled', async () => {
      const { default: MiniKitProvider } = await import('@/components/minikit-provider')
      
      // Mock console.log to capture MiniKit.install calls
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      render(
        <MiniKitProvider>
          <div>Test Child</div>
        </MiniKitProvider>
      )

      // Should install mock MiniKit instead of real one
      expect(consoleSpy).toHaveBeenCalledWith(true) // MiniKit.isInstalled() returns true

      consoleSpy.mockRestore()
    })

    it('should provide mock MiniKit instance to child components', async () => {
      const { default: MiniKitProvider } = await import('@/components/minikit-provider')
      const { MockMiniKit } = await import('@/lib/mock/mock-minikit')

      const TestComponent = () => {
        const { MiniKit } = require('@worldcoin/minikit-js')
        return <div>{MiniKit.user?.username || 'No User'}</div>
      }

      render(
        <MiniKitProvider>
          <TestComponent />
        </MiniKitProvider>
      )

      // Should show mock user data
      expect(screen.getByText('ActiveTester')).toBeInTheDocument() // Default persona
    })
  })

  describe('Visual Mock Indicators', () => {
    it('should display mock mode banner when enabled', async () => {
      const { MockIndicators } = await import('@/components/MockIndicators')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      render(
        <MockModeProvider>
          <MockIndicators />
          <div>App Content</div>
        </MockModeProvider>
      )

      expect(screen.getByText(/🧪 Mock Mode Active/)).toBeInTheDocument()
      expect(screen.getByText(/Development Testing Only/)).toBeInTheDocument()
    })

    it('should hide mock indicators when configured off', async () => {
      process.env.NEXT_PUBLIC_SHOW_MOCK_INDICATORS = 'false'
      
      const { MockIndicators } = await import('@/components/MockIndicators')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      render(
        <MockModeProvider>
          <MockIndicators />
          <div>App Content</div>
        </MockModeProvider>
      )

      expect(screen.queryByText(/🧪 Mock Mode Active/)).not.toBeInTheDocument()
    })

    it('should show current mock user info in indicators', async () => {
      const { MockIndicators } = await import('@/components/MockIndicators')
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      await window.__MOCK_MODE__.switchUser('power-user')

      render(
        <MockModeProvider>
          <MockIndicators />
        </MockModeProvider>
      )

      expect(screen.getByText(/PowerTester/)).toBeInTheDocument()
      expect(screen.getByText(/power-user/)).toBeInTheDocument()
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle mock mode errors gracefully', async () => {
      // Mock an error in mock mode initialization
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      // Should not crash even if mock initialization fails
      expect(() => {
        render(
          <MockModeProvider>
            <div>Test Content</div>
          </MockModeProvider>
        )
      }).not.toThrow()

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should fallback to real MiniKit if mock fails', async () => {
      // Simulate mock failure
      jest.doMock('@/lib/mock/mock-minikit', () => {
        throw new Error('Mock initialization failed')
      })

      const { default: MiniKitProvider } = await import('@/components/minikit-provider')

      // Should still render without crashing
      expect(() => {
        render(
          <MiniKitProvider>
            <div>Fallback Content</div>
          </MiniKitProvider>
        )
      }).not.toThrow()
    })
  })

  describe('Performance Impact', () => {
    it('should not significantly impact component render times', async () => {
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      const startTime = performance.now()
      
      render(
        <MockModeProvider>
          <Login />
        </MockModeProvider>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Mock mode should not add significant overhead
      expect(renderTime).toBeLessThan(100) // 100ms threshold
    })

    it('should handle rapid user switching without performance degradation', async () => {
      const { MockModeProvider } = await import('@/components/providers/MockModeProvider')

      render(
        <MockModeProvider>
          <Login />
        </MockModeProvider>
      )

      const startTime = performance.now()

      // Rapidly switch between users
      for (let i = 0; i < 10; i++) {
        const personas = ['new-user', 'active-user', 'power-user', 'vip-user', 'problem-user']
        await window.__MOCK_MODE__.switchUser(personas[i % personas.length])
      }

      const endTime = performance.now()
      const switchTime = endTime - startTime

      // Should complete all switches quickly
      expect(switchTime).toBeLessThan(500) // 500ms for 10 switches
    })
  })
})