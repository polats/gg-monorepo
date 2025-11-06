'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { GameScreen as GameScreenType } from '@/types/minigame';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { WalletStatusHeader } from './WalletStatusHeader';
import { MockUserSwitcher } from './MockUserSwitcher';

// Static imports for immediate components
import { Tutorial } from './Tutorial';
import { HomeScreen } from './HomeScreen';
import { DepositWorkflow } from './DepositWorkflow';
import { HelpScreen } from './HelpScreen';
import { ErrorBoundary } from './ErrorBoundary';

// Dynamic import for GameScreen to avoid SSR issues with Framer Motion
const GameScreen = dynamic(
  () => import('./GameScreen').then(mod => ({ default: mod.GameScreen })),
  { ssr: false }
);

export function MinigameApp() {
  const [currentScreen, setCurrentScreen] = useState<GameScreenType>('tutorial');
  const [depositAmount, setDepositAmount] = useState(0);

  // Wallet connection state
  const { isConnected, disconnect } = useWalletConnection({
    autoConnect: true,
    onDisconnect: () => {
      // Return to home screen when wallet disconnects
      if (currentScreen === 'game' || currentScreen === 'deposit') {
        setCurrentScreen('home');
      }
    },
  });

  const handleTutorialComplete = () => {
    setCurrentScreen('home');
  };

  const handleStartDeposit = () => {
    setCurrentScreen('deposit');
  };

  const handleShowTutorial = () => {
    setCurrentScreen('tutorial');
  };

  const handleShowHelp = () => {
    setCurrentScreen('help');
  };

  const handleDepositComplete = (amount: number) => {
    setDepositAmount(amount);
    setCurrentScreen('game');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleGameEnd = (finalPrice: number) => {
    // Game ended logic - could add analytics here
    console.log('Game ended with final price:', finalPrice);
  };

  const handlePlayAgain = () => {
    setCurrentScreen('deposit');
  };

  return (
    <ErrorBoundary>
      <div className="size-full min-h-screen">
        {/* Global wallet status header for connected state - HIDDEN */}
        {/* {isConnected && currentScreen !== 'tutorial' && (
          <WalletStatusHeader
            position="top-right"
            showBalance={true}
            showStatus={true}
            onDisconnect={() => {
              // Return to home screen when wallet disconnects
              if (currentScreen === 'game' || currentScreen === 'deposit') {
                setCurrentScreen('home');
              }
            }}
          />
        )} */}

        {currentScreen === 'tutorial' && (
          <Tutorial onComplete={handleTutorialComplete} />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onStartDeposit={handleStartDeposit}
            onShowTutorial={handleShowTutorial}
            onShowHelp={handleShowHelp}
          />
        )}

        {currentScreen === 'help' && (
          <HelpScreen onBack={handleBackToHome} />
        )}

        {currentScreen === 'deposit' && (
          <DepositWorkflow
            onComplete={handleDepositComplete}
            onBack={handleBackToHome}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            originalDeposit={depositAmount}
            onGameEnd={handleGameEnd}
            onPlayAgain={handlePlayAgain}
          />
        )}

        {/* Mock User Switcher for development */}
        <MockUserSwitcher
          position="bottom-left"
          compact={false}
        />
      </div>
    </ErrorBoundary>
  );
}