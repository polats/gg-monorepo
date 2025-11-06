'use client';

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { WalletConnection } from '@/components/WalletConnection';
import { MiniKitDebugger } from '@/components/WalletConnection/MiniKitDebugger';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useMockMode } from '@/lib/hooks/useMockMode';
import { simulateMinigameDeposit } from '@/lib/mock/mock-wallet-operations';
import type { DepositWorkflowProps } from '@/types/minigame';
import { GAME_CONSTANTS } from '@/types/minigame';

// Using WalletConnection directly without balance display

export function DepositWorkflow({ onComplete, onBack }: DepositWorkflowProps) {
  const [depositAmount, setDepositAmount] = useState('1.0');
  const [isProcessing, setIsProcessing] = useState(false);

  // Wallet integration
  const { isConnected, user, connect, error: walletError } = useWalletConnection({
    autoConnect: true,
  });
  const { isMockMode, mockUser } = useMockMode();


  // Track wallet state changes to detect unwanted changes
  const prevWalletState = useRef({ isConnected, user });
  useEffect(() => {
    const prev = prevWalletState.current;
    if (prev.isConnected !== isConnected || prev.user !== user) {
      console.log('🔍 [DepositWorkflow] Wallet state changed:', {
        previous: prev,
        current: { isConnected, user },
        changes: {
          connectionChanged: prev.isConnected !== isConnected,
          userChanged: prev.user !== user
        }
      });
      prevWalletState.current = { isConnected, user };
    }
  }, [isConnected, user]);

  // Removed balance cache clearing and refresh logic - no longer needed

  // Debug wallet connection status (only when wallet state changes)
  useEffect(() => {
    console.log('🔍 [DepositWorkflow] Wallet status:', {
      isConnected,
      user: user ? {
        address: user.address,
        username: user.username,
        profilePicture: user.profilePicture
      } : null,
      walletError: walletError ? {
        code: walletError.code,
        message: walletError.message
      } : null,
      // Additional debugging for comparison with WalletConnection component
      hookCallComparison: 'DepositWorkflow vs WalletConnection - same useWalletConnection hook'
    });

  }, [isConnected, user, walletError]);

  const handleAmountInput = useCallback((value: string) => {
    console.log('🔍 [DepositWorkflow] Amount input changed:', value);
    setDepositAmount(value);
  }, []);

  // Stable callback functions to prevent WalletConnection re-renders
  const handleWalletConnect = useCallback(() => {}, []);
  const handleWalletDisconnect = useCallback(() => {}, []);
  const handleWalletError = useCallback((error: any) => {
    console.error('Wallet error:', error);
  }, []);

  // Simplified validation logic - only check wallet connection and amount
  const validation = useMemo(() => {
    const amount = parseFloat(depositAmount);

    console.log('🔍 [DepositWorkflow] validateDeposit called with:', {
      amount,
      depositAmount,
      isConnected
    });

    if (isNaN(amount) || amount <= 0) {
      console.log('🔍 [DepositWorkflow] Validation failed: invalid amount');
      return { isValid: false, error: 'Please enter a valid amount' };
    }

    if (amount < GAME_CONSTANTS.MIN_PRICE) {
      console.log('🔍 [DepositWorkflow] Validation failed: amount too low');
      return { isValid: false, error: `Minimum amount is ${GAME_CONSTANTS.MIN_PRICE} WLD` };
    }

    console.log('🔍 [DepositWorkflow] Validation passed!');
    return { isValid: true, error: null };
  }, [depositAmount, isConnected]);

  const handleComplete = async () => {
    console.log('🔍 [DepositWorkflow] handleComplete called');
    console.log('🔍 [DepositWorkflow] depositAmount:', depositAmount);
    console.log('🔍 [DepositWorkflow] isConnected:', isConnected);
    console.log('🔍 [DepositWorkflow] user:', user);

    console.log('🔍 [DepositWorkflow] validation result:', validation);

    if (!validation.isValid || isProcessing) {
      console.log('🔍 [DepositWorkflow] Validation failed or already processing, returning');
      return;
    }

    const amount = parseFloat(depositAmount);
    console.log('🔍 [DepositWorkflow] Parsed amount:', amount);

    try {
      console.log('🔍 [DepositWorkflow] Setting isProcessing to true');
      setIsProcessing(true);

      if (isMockMode && mockUser) {
        // Simulate mock transaction
        console.log(`Simulating ${amount} WLD deposit for ${mockUser.persona}`);

        const result = await simulateMinigameDeposit(mockUser.persona, amount);

        if (result.success) {
          console.log('Mock deposit successful:', result);
          // Balance refresh removed - no longer needed
          // Complete the workflow
          onComplete(amount);
        } else {
          console.error('Mock deposit failed:', result.error);
          // In a real app, you'd show the error to the user
          // For now, we'll still proceed to keep the demo flowing
          onComplete(amount);
        }
      } else {
        // Real wallet transaction would go here
        // For now, just proceed with the game
        onComplete(amount);
      }
    } catch (error) {
      console.error('Deposit failed:', error);
      // In a real app, show error to user
      // For demo purposes, proceed anyway
      onComplete(amount);
    } finally {
      setIsProcessing(false);
    }
  };

  // Computed values for button state
  const computedValues = useMemo(() => {
    const currentAmount = parseFloat(depositAmount);
    const isValidAmount = currentAmount >= GAME_CONSTANTS.MIN_PRICE && !isNaN(currentAmount);
    const canProceed = validation.isValid && !isProcessing;

    return {
      currentAmount,
      isValidAmount,
      canProceed,
      buttonDisabled: !canProceed
    };
  }, [depositAmount, validation.isValid, isProcessing]);

  // Debug the computed values (only when they change)
  useEffect(() => {
    console.log('🔍 [DepositWorkflow] Computed values:', {
      ...computedValues,
      validation,
      isProcessing,
      // Simplified debug info for button state
      buttonDisabledReason: {
        canProceedFalse: !computedValues.canProceed,
        validationInvalid: !validation.isValid,
        isProcessingTrue: isProcessing
      }
    });
  }, [computedValues, validation, isProcessing]);

  // Get validation message for display
  const getValidationMessage = () => {
    if (!validation.error) return null;

    // Determine message type
    const isWarning = validation.error.includes('Minimum') || validation.error.includes('valid amount');
    const isError = !isConnected || validation.error.includes('Insufficient') || validation.error.includes('Error');

    return {
      text: validation.error,
      type: isError ? 'error' : isWarning ? 'warning' : 'info'
    };
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col p-6">
      {/* Header */}
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <span className="text-sm text-gray-600">Choose Amount</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Your Deposit</h2>
            <p className="text-gray-600 mb-6">
              Select how much WLD you want to start with.
            </p>

            {/* Deposit amount */}
            <div className="text-left mb-8">
              <Label htmlFor="deposit-amount" className="mb-2 block text-gray-700">
                Enter deposit amount (WLD)
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => handleAmountInput(e.target.value)}
                min={GAME_CONSTANTS.MIN_PRICE}
                step="0.0001"
                className="text-center text-lg py-3 text-black"
                placeholder="Enter amount"
              />
              <p className="text-sm text-gray-500 mt-2">
                Minimum: {GAME_CONSTANTS.MIN_PRICE} WLD
              </p>
            </div>

            {/* Wallet Connection */}
            <div className="mb-6">
              <WalletConnection
                showBalance={false}
                compact={false}
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                onError={handleWalletError}
                className="mb-4"
              />

              {/* Mock mode indicator */}
              {(!user || user.address?.startsWith('0xmock')) && isConnected && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🧪</span>
                    <span>Demo Mode: Playing with mock wallet for demonstration</span>
                  </div>
                </div>
              )}


              {/* Enhanced validation messages */}
              {validationMessage && (
                <div className={`p-3 border rounded-lg text-sm ${
                  validationMessage.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : validationMessage.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">
                      {validationMessage.type === 'error' ? '❌' :
                       validationMessage.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>{validationMessage.text}</span>
                  </div>
                </div>
              )}

              {/* Wallet connection error */}
              {walletError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">🔗</span>
                    <span>Wallet Error: {walletError.message}</span>
                  </div>
                </div>
              )}


              {/* MiniKit Debugger for development */}
              {process.env.NODE_ENV === 'development' && !isMockMode && walletError && (
                <MiniKitDebugger className="mb-4" />
              )}
            </div>

            {/* Warning */}
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-yellow-800 mb-2">
                <strong>Remember:</strong>
              </p>
              <p className="text-yellow-700 text-sm">
                Your diamond's price will change every 5 seconds. Tap the screen to hold on - if you don't tap in time, you'll sell automatically!
              </p>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full py-3 text-lg"
              disabled={computedValues.buttonDisabled}
            >
              {(() => {
                console.log('🔍 [DepositWorkflow] Button render logic - SIMPLIFIED:', {
                  isProcessing,
                  isConnected,
                  validationMessage,
                  canProceed: computedValues.canProceed,
                  currentAmount: computedValues.currentAmount,
                  isMockMode,
                  validation,
                  // Simplified breakdown
                  checks: {
                    '1_isProcessing': isProcessing,
                    '2_isConnected': isConnected,
                    '3_validationMessageType': validationMessage?.type,
                    '4_canProceed': computedValues.canProceed,
                    '5_validationIsValid': validation.isValid,
                    '6_validationError': validation.error
                  }
                });

                if (isProcessing) {
                  console.log('🔍 [DepositWorkflow] → Branch: isProcessing');
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isMockMode ? 'Processing Mock Transaction...' : 'Processing...'}
                    </div>
                  );
                }

                // Remove balance loading check - we don't need it anymore

                if (!isConnected) {
                  console.log('🔍 [DepositWorkflow] → Branch: !isConnected');
                  return 'Connect Wallet First';
                }

                if (validationMessage?.type === 'error') {
                  console.log('🔍 [DepositWorkflow] → Branch: validation error:', validationMessage.text);
                  return validationMessage.text.includes('Insufficient') ? 'Insufficient Balance' :
                         validationMessage.text.includes('Minimum') ? 'Amount Too Low' :
                         validationMessage.text.includes('valid') ? 'Invalid Amount' :
                         'Cannot Proceed';
                }

                if (computedValues.canProceed) {
                  console.log('🔍 [DepositWorkflow] → Branch: canProceed - SUCCESS!');
                  return isMockMode ? `🧪 Mock Deposit ${computedValues.currentAmount} WLD` : `Start Game with ${computedValues.currentAmount} WLD`;
                }

                console.log('🔍 [DepositWorkflow] → Branch: default "Enter Amount"');
                console.log('🔍 [DepositWorkflow] → WHY: canProceed =', computedValues.canProceed, 'validation.isValid =', validation.isValid, 'isProcessing =', isProcessing);
                return 'Enter Amount';
              })()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}