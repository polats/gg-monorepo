import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { CircularCountdown } from './CircularCountdown';
import { AnimatedDiamond } from './AnimatedDiamond';
import { motion, AnimatePresence } from 'motion/react';
import sparkleImg from 'figma:asset/ff12fad9729fcbf831a224a35f170b22a2e3da05.png';
import smokeImg from 'figma:asset/857a5e5f1762cf5e45986d9435be437d58b86821.png';
import winImg from 'figma:asset/7e2d6239177f444e162a9f12e6035adfbd71cdf2.png';

interface GameScreenProps {
  originalDeposit: number;
  onGameEnd: (finalPrice: number) => void;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export function GameScreen({ originalDeposit, onGameEnd, onPlayAgain, onBackToHome }: GameScreenProps) {
  const [currentPrice, setCurrentPrice] = useState(originalDeposit);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [initialCountdown, setInitialCountdown] = useState(3);
  const [showTapPrompt, setShowTapPrompt] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [backgroundRed, setBackgroundRed] = useState(false);
  const [showingPriceUpdate, setShowingPriceUpdate] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);
  const [countdownReset, setCountdownReset] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [holdDuration, setHoldDuration] = useState<number>(0);

  // Initial 3-second countdown
  useEffect(() => {
    if (initialCountdown > 0) {
      const timer = setTimeout(() => {
        setInitialCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (initialCountdown === 0 && !gameStarted) {
      setGameStarted(true);
      setGameStartTime(Date.now());
      startPriceUpdates();
    }
  }, [initialCountdown, gameStarted]);

  // Price update system
  const startPriceUpdates = useCallback(() => {
    const updatePrice = () => {
      // Flash gray background first
      setShowingPriceUpdate(true);
      
      setCurrentPrice(prev => {
        const volatility = 0.015 + (Math.random() - 0.5) * 0.11; // -4% to +7%
        const newPrice = prev * (1 + volatility);
        return Math.max(0.0001, parseFloat(newPrice.toFixed(4)));
      });
      setShowTapPrompt(true);
      setIsCountingDown(true);
      setCountdownReset(prev => !prev);
      
      // After 300ms, transition to the appropriate color
      setTimeout(() => {
        setShowingPriceUpdate(false);
      }, 300);
    };

    updatePrice();
    const interval = setInterval(updatePrice, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle tap to hold
  const handleTap = () => {
    if (!showTapPrompt || gameEnded) return;
    
    setShowTapPrompt(false);
    setIsCountingDown(false);
    setBackgroundRed(false);
    setShowSparkles(true);
    
    setTimeout(() => setShowSparkles(false), 1000);
  };

  // Handle countdown complete (user didn't tap)
  const handleCountdownComplete = useCallback(() => {
    if (!gameEnded) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - gameStartTime) / 1000);
      setGameEnded(true);
      setFinalPrice(currentPrice);
      setHoldDuration(duration);
      setShowSmoke(true);
      setShowTapPrompt(false);
      setIsCountingDown(false);
      onGameEnd(currentPrice);
    }
  }, [currentPrice, gameEnded, gameStartTime, onGameEnd]);

  // Determine background color based on price performance
  const isGaining = currentPrice >= originalDeposit;
  const getBackgroundColorClass = () => {
    if (showingPriceUpdate) {
      return 'bg-gray-300';
    }
    return isGaining ? 'bg-[#418260]' : 'bg-[#db5656]';
  };

  if (gameEnded) {
    const soldAboveDeposit = finalPrice >= originalDeposit;
    const pillColor = soldAboveDeposit ? 'bg-[#418260] text-white' : 'bg-[#db5656] text-white';
    
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            {soldAboveDeposit && (
              <motion.img
                src={winImg}
                alt="Victory"
                className="w-32 h-32 mx-auto mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
              />
            )}
            <h2 className="text-8xl mb-4 text-gray-800" style={{ fontFamily: 'Aubrey, cursive' }}>SOLD!</h2>
            <p className="text-xl text-gray-800 mb-4">
              You sold your diamond for:
            </p>
            <div className={`inline-block rounded-full px-6 py-3 shadow-lg mb-4 ${pillColor}`}>
              <div className="text-2xl font-bold">{finalPrice.toFixed(4)} WLD</div>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              ⏱️ You held on for <strong>{holdDuration.toLocaleString()}</strong> seconds
            </p>
            
            {showSmoke && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                transition={{ duration: 2 }}
                className="mb-6"
              >
                <img 
                  src={smokeImg} 
                  alt="Smoke" 
                  className="w-32 h-32 mx-auto object-contain opacity-70" 
                />
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex flex-col items-center gap-4">
            <Button onClick={onPlayAgain} size="lg" className="px-8 py-4">
              PLAY AGAIN!
            </Button>
            <Button 
              onClick={onBackToHome} 
              variant="outline" 
              size="lg" 
              className="px-8 py-4"
            >
              BACK TO HOME
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={`min-h-screen flex flex-col transition-colors duration-300 ${getBackgroundColorClass()}`}
    >
      {/* Initial countdown overlay */}
      <AnimatePresence>
        {initialCountdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              key={initialCountdown}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-white text-8xl"
            >
              {initialCountdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price pills - moved to top */}
      <div className="w-full px-4 pt-4 pb-2">
        <div className="w-full max-w-sm mx-auto space-y-2">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg text-center">
            <div className="text-xs text-gray-600 mb-1">CURRENT</div>
            <div className="text-lg">{currentPrice.toFixed(4)} WLD</div>
          </div>
          <div className="bg-gray-100 rounded-full px-4 py-2 text-center">
            <div className="text-xs text-gray-600 mb-1">ORIGINAL</div>
            <div className="text-lg">{originalDeposit.toFixed(4)} WLD</div>
          </div>
        </div>
      </div>

      {/* Diamond area - optimized for mobile viewport */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 min-h-0" style={{ marginTop: '-100px' }}>
        <motion.div
          className="relative cursor-pointer flex-shrink-0"
          onClick={handleTap}
          whileTap={{ scale: 0.95 }}
          animate={gameEnded ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: gameEnded ? 0.5 : 0.1 }}
        >
          <AnimatedDiamond 
            className="w-96 h-96 sm:w-[26rem] sm:h-[26rem] object-contain"
            alt="Diamond"
            animationSpeed={800}
          />
          
          {/* Sparkles effect */}
          <AnimatePresence>
            {showSparkles && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.img
                    key={i}
                    src={sparkleImg}
                    alt="Sparkle"
                    className="absolute w-8 h-8"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                    }}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1.5, 0], 
                      rotate: 360,
                      x: Math.random() * 40 - 20,
                      y: Math.random() * 40 - 20
                    }}
                    transition={{ duration: 1 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Tap prompt and countdown - fixed to bottom of viewport */}
      <AnimatePresence>
        {showTapPrompt && !gameEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center z-40"
          >
            <div 
              className="bg-white rounded-lg px-3 py-2 shadow-lg mb-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleTap}
            >
              <span className="text-base">Tap to Hold!</span>
            </div>
            <CircularCountdown
              duration={5}
              onComplete={handleCountdownComplete}
              isActive={isCountingDown}
              reset={countdownReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game instructions - fixed to bottom when no tap prompt */}
      {gameStarted && !showTapPrompt && !gameEnded && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center z-40">
          <p className="text-sm text-black">Wait for the next price update...</p>
        </div>
      )}
    </motion.div>
  );
}