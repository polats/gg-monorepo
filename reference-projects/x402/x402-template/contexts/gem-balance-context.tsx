'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Transaction types for audit trail
interface GemTransaction {
  type: 'purchase' | 'spend'
  amount: number
  timestamp: number
  description: string
}

// Gem balance state structure
interface GemBalance {
  current: number
  lifetime: number  // Total gems ever purchased
  spent: number     // Total gems spent
}

// Context interface
interface GemBalanceContextType {
  balance: number
  addGems: (amount: number, description?: string) => Promise<boolean>
  spendGems: (amount: number, description?: string) => Promise<boolean>
  canAfford: (amount: number) => boolean
  lifetimeGems: number
  spentGems: number
  fetchBalance: () => Promise<void>
}

const GemBalanceContext = createContext<GemBalanceContextType | undefined>(undefined)

// SessionStorage keys
const STORAGE_KEY = 'gem-balance'
const TRANSACTIONS_KEY = 'gem-transactions'

// Load balance from sessionStorage
const loadBalance = (): GemBalance => {
  if (typeof window === 'undefined') {
    return { current: 0, lifetime: 0, spent: 0 }
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        current: parsed.current || 0,
        lifetime: parsed.lifetime || 0,
        spent: parsed.spent || 0
      }
    }
  } catch (error) {
    console.error('Failed to load gem balance from sessionStorage:', error)
  }

  return { current: 0, lifetime: 0, spent: 0 }
}

// Save balance to sessionStorage
const saveBalance = (balance: GemBalance): void => {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(balance))
  } catch (error) {
    console.error('Failed to save gem balance to sessionStorage:', error)
  }
}

// Load transactions from sessionStorage
const loadTransactions = (): GemTransaction[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = sessionStorage.getItem(TRANSACTIONS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load transactions from sessionStorage:', error)
  }

  return []
}

// Save transaction to sessionStorage
const saveTransaction = (transaction: GemTransaction): void => {
  if (typeof window === 'undefined') return

  try {
    const transactions = loadTransactions()
    transactions.push(transaction)
    // Keep only last 100 transactions to prevent storage quota issues
    const recentTransactions = transactions.slice(-100)
    sessionStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(recentTransactions))
  } catch (error) {
    console.error('Failed to save transaction to sessionStorage:', error)
  }
}

export function GemBalanceProvider({ children }: { children: React.ReactNode }) {
  const [gemBalance, setGemBalance] = useState<GemBalance>(() => loadBalance())
  const [syncing, setSyncing] = useState(false)

  // Fetch initial balance from API on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('[GemBalance] Initializing session and fetching balance...')
        
        // First, try to fetch balance (this will work if session exists)
        let response = await fetch('/api/gems/balance')
        
        // If unauthorized, create a session first
        if (response.status === 401) {
          console.log('[GemBalance] No session found, creating new session...')
          const sessionResponse = await fetch('/api/session/create', {
            method: 'POST',
            credentials: 'include'
          })
          
          if (sessionResponse.ok) {
            console.log('[GemBalance] Session created, fetching balance...')
            // Try fetching balance again with new session
            response = await fetch('/api/gems/balance')
          } else {
            console.error('[GemBalance] Failed to create session')
            return
          }
        }
        
        if (response.ok) {
          const data = await response.json()
          console.log('[GemBalance] Received balance from API:', data)
          const serverBalance: GemBalance = {
            current: data.balance,
            lifetime: data.lifetime,
            spent: data.spent
          }
          setGemBalance(serverBalance)
          saveBalance(serverBalance)
        }
      } catch (error) {
        console.error('[GemBalance] Failed to initialize session or fetch balance:', error)
        // Fall back to sessionStorage balance
      }
    }

    initializeSession()
  }, [])

  // Persist balance to sessionStorage whenever it changes
  useEffect(() => {
    saveBalance(gemBalance)
  }, [gemBalance])

  // Sync balance across tabs using storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newBalance = JSON.parse(e.newValue)
          setGemBalance(newBalance)
        } catch (error) {
          console.error('Failed to sync balance from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Fetch current balance from server and sync with sessionStorage
  const fetchBalance = useCallback(async (): Promise<void> => {
    try {
      console.log('[GemBalance] Fetching balance from server...')
      
      let response = await fetch('/api/gems/balance', {
        credentials: 'include'
      })
      
      // Handle session expiration
      if (response.status === 401) {
        console.log('[GemBalance] Session expired, creating new session...')
        const sessionResponse = await fetch('/api/session/create', {
          method: 'POST',
          credentials: 'include'
        })
        
        if (sessionResponse.ok) {
          console.log('[GemBalance] Session created, retrying balance fetch...')
          response = await fetch('/api/gems/balance', {
            credentials: 'include'
          })
        } else {
          throw new Error('Failed to create session')
        }
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('[GemBalance] Fetched balance from server:', data)
        const serverBalance: GemBalance = {
          current: data.balance,
          lifetime: data.lifetime,
          spent: data.spent
        }
        setGemBalance(serverBalance)
        saveBalance(serverBalance)
      } else {
        throw new Error(`Failed to fetch balance: ${response.status}`)
      }
    } catch (error) {
      console.error('[GemBalance] Error fetching balance:', error)
      throw error
    }
  }, [])

  // Add gems to balance (for purchases) - Server-first approach
  const addGems = useCallback(async (amount: number, description: string = 'Gem purchase'): Promise<boolean> => {
    console.log('[GemBalance] addGems called:', { amount, description })
    
    // Validate amount
    if (amount <= 0 || !Number.isInteger(amount)) {
      console.error('[GemBalance] Invalid gem amount:', amount)
      return false
    }

    // Call API first and wait for response (no optimistic update)
    try {
      console.log('[GemBalance] Calling API /api/gems/add...')
      const startTime = Date.now()
      
      let response = await fetch('/api/gems/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, description })
      })

      // Handle session expiration
      if (response.status === 401) {
        console.log('[GemBalance] Session expired during addGems, creating new session...')
        const sessionResponse = await fetch('/api/session/create', {
          method: 'POST',
          credentials: 'include'
        })
        
        if (sessionResponse.ok) {
          console.log('[GemBalance] Session created, retrying addGems...')
          response = await fetch('/api/gems/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount, description })
          })
        } else {
          throw new Error('Failed to create session')
        }
      }

      const apiDuration = Date.now() - startTime
      console.log(`[GemBalance] API call completed in ${apiDuration}ms`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[GemBalance] Server rejected gem addition:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        return false
      }

      // Update state only after successful server response
      const data = await response.json()
      console.log('[GemBalance] Server response:', data)
      
      const serverBalance: GemBalance = {
        current: data.balance,
        lifetime: data.lifetime,
        spent: data.spent
      }
      
      // Update state with server data
      setGemBalance(serverBalance)
      
      // Ensure sessionStorage is updated with server data
      saveBalance(serverBalance)
      
      // Record transaction
      saveTransaction({
        type: 'purchase',
        amount,
        timestamp: Date.now(),
        description
      })
      
      console.log('[GemBalance] Balance successfully updated from server:', serverBalance)
      return true
      
    } catch (error) {
      console.error('[GemBalance] Failed to add gems:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        amount,
        description
      })
      // Do not update state on API failure
      return false
    }
  }, [])

  // Spend gems (for gacha pulls, etc.)
  const spendGems = useCallback(async (amount: number, description: string = 'Gem spent'): Promise<boolean> => {
    // Validate amount
    if (amount <= 0 || !Number.isInteger(amount)) {
      console.error('Invalid gem amount:', amount)
      return false
    }

    // Store previous balance and check affordability
    let previousBalance: GemBalance | null = null
    let canAffordAmount = false
    
    setGemBalance(prev => {
      previousBalance = prev
      canAffordAmount = prev.current >= amount
      return prev
    })

    // Check if player can afford
    if (!canAffordAmount) {
      console.warn('Insufficient gems:', { required: amount })
      return false
    }

    // Optimistic update
    setGemBalance(prev => {
      const newBalance = {
        current: prev.current - amount,
        lifetime: prev.lifetime,
        spent: prev.spent + amount
      }

      // Record transaction
      saveTransaction({
        type: 'spend',
        amount,
        timestamp: Date.now(),
        description
      })

      return newBalance
    })

    // Sync with server
    try {
      const response = await fetch('/api/gems/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, description })
      })

      if (!response.ok) {
        // Rollback on server error
        console.error('Server rejected gem spending, rolling back')
        if (previousBalance) {
          setGemBalance(previousBalance)
          saveBalance(previousBalance)
        }
        return false
      } else {
        // Sync with server response
        const data = await response.json()
        const serverBalance: GemBalance = {
          current: data.balance,
          lifetime: data.lifetime,
          spent: data.spent
        }
        setGemBalance(serverBalance)
        saveBalance(serverBalance)
        return true
      }
    } catch (error) {
      console.error('Failed to sync gem spending with server:', error)
      // Rollback on network error to be safe
      if (previousBalance) {
        setGemBalance(previousBalance)
        saveBalance(previousBalance)
      }
      return false
    }
  }, [])

  // Check if player can afford an amount
  const canAfford = useCallback((amount: number): boolean => {
    return gemBalance.current >= amount && amount > 0
  }, [gemBalance.current])

  const value: GemBalanceContextType = {
    balance: gemBalance.current,
    addGems,
    spendGems,
    canAfford,
    lifetimeGems: gemBalance.lifetime,
    spentGems: gemBalance.spent,
    fetchBalance
  }

  return (
    <GemBalanceContext.Provider value={value}>
      {children}
    </GemBalanceContext.Provider>
  )
}

// Hook to use gem balance context
export function useGemBalance() {
  const context = useContext(GemBalanceContext)
  if (context === undefined) {
    throw new Error('useGemBalance must be used within a GemBalanceProvider')
  }
  return context
}
