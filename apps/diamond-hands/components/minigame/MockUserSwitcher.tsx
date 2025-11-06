'use client';

import { useState, useCallback } from 'react';
import { useMockMode } from '@/lib/hooks/useMockMode';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { MOCK_WALLET_CONFIGS } from '@/lib/mock/mock-wallet-data';

type MockPersona = keyof typeof MOCK_WALLET_CONFIGS;

interface MockUserSwitcherProps {
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Position of the switcher */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Custom CSS classes */
  className?: string;
}

export function MockUserSwitcher({
  compact = false,
  position = 'bottom-left',
  className = '',
}: MockUserSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isMockMode, mockUser } = useMockMode();
  const { disconnect, connect } = useWalletConnection();

  const handlePersonaSwitch = useCallback(async (persona: MockPersona) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // Store the selected persona
      localStorage.setItem('mockUserId', persona);

      // Disconnect current connection
      disconnect();

      // Wait a bit for disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Reconnect with new persona
      await connect();

      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to switch mock persona:', error);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect, connect, isLoading]);

  // Don't render in non-mock mode or production
  if (!isMockMode || process.env.NODE_ENV === 'production') {
    return null;
  }

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  const personas: Array<{
    id: MockPersona;
    label: string;
    description: string;
    balance: number;
    emoji: string;
  }> = [
    {
      id: 'new-user',
      label: 'New User',
      description: 'No balance, fresh start',
      balance: 0,
      emoji: '🆕',
    },
    {
      id: 'active-user',
      label: 'Active User',
      description: 'Standard balance',
      balance: 100,
      emoji: '👤',
    },
    {
      id: 'power-user',
      label: 'Power User',
      description: 'High balance',
      balance: 1000,
      emoji: '💪',
    },
    {
      id: 'vip-user',
      label: 'VIP User',
      description: 'Very high balance',
      balance: 10000,
      emoji: '⭐',
    },
    {
      id: 'problem-user',
      label: 'Problem User',
      description: 'Very low balance',
      balance: 0.01,
      emoji: '⚠️',
    },
  ];

  const currentPersona = personas.find(p => p.id === mockUser?.persona) || personas[1];

  if (compact) {
    return (
      <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
        <div className="bg-purple-500/90 backdrop-blur-sm border border-purple-300 rounded-lg shadow-lg">
          <select
            value={currentPersona.id}
            onChange={(e) => handlePersonaSwitch(e.target.value as MockPersona)}
            disabled={isLoading}
            className="bg-transparent text-white text-sm px-3 py-2 pr-8 appearance-none cursor-pointer hover:bg-purple-600/50 transition-colors rounded-lg"
          >
            {personas.map((persona) => (
              <option
                key={persona.id}
                value={persona.id}
                className="bg-purple-600 text-white"
              >
                {persona.emoji} {persona.label}
              </option>
            ))}
          </select>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-purple-500/50 rounded-lg">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      <div className="bg-purple-500/90 backdrop-blur-sm border border-purple-300 rounded-lg shadow-lg">
        {/* Compact trigger */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 text-white text-sm hover:bg-purple-600/50 transition-colors rounded-lg"
          disabled={isLoading}
        >
          <span>🧪</span>
          <span className="font-mono">{currentPersona.emoji} {currentPersona.label}</span>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Expanded options */}
        {isExpanded && (
          <div className="border-t border-purple-400 bg-purple-600/20">
            <div className="p-2 space-y-1">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSwitch(persona.id)}
                  disabled={isLoading || persona.id === currentPersona.id}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    persona.id === currentPersona.id
                      ? 'bg-purple-700 text-white cursor-default'
                      : 'text-purple-100 hover:bg-purple-600/50 hover:text-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{persona.emoji}</span>
                      <span>{persona.label}</span>
                    </div>
                    <span className="text-xs opacity-75">
                      {persona.balance === 0 ? '0' : persona.balance >= 1000 ? `${persona.balance/1000}K` : persona.balance} WLD
                    </span>
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {persona.description}
                  </div>
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-500/50 rounded-lg">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MockUserSwitcher;