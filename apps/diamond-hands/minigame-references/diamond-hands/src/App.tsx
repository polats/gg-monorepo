import { useState } from 'react';
import { Tutorial } from './components/Tutorial';
import { HomeScreen } from './components/HomeScreen';
import { DepositWorkflow } from './components/DepositWorkflow';
import { GameScreen } from './components/GameScreen';
import { HelpScreen } from './components/HelpScreen';

type AppScreen = 'tutorial' | 'home' | 'deposit' | 'game' | 'help';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('tutorial');
  const [depositAmount, setDepositAmount] = useState(0);

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
    // Game ended logic handled in GameScreen
    console.log('Game ended with final price:', finalPrice);
  };

  const handlePlayAgain = () => {
    setCurrentScreen('deposit');
  };

  return (
    <div className="size-full">
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
          onBackToHome={handleBackToHome}
        />
      )}
      
      {currentScreen === 'help' && (
        <HelpScreen onBack={handleBackToHome} />
      )}
    </div>
  );
}