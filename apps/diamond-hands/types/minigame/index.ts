// Types for the pre-launch minigame feature

export interface LaunchConfiguration {
  isLaunched: boolean;           // True = main app, False = minigame
  configSource: 'env' | 'default'; // Where config was read from
  checkedAt: Date;               // When config was last checked
}

export type GameScreen = 'tutorial' | 'home' | 'deposit' | 'game' | 'result' | 'help';
export type GameStatus = 'initializing' | 'active' | 'countdown' | 'ended';

export interface PricePoint {
  timestamp: Date;
  price: number;
  held: boolean;                // Did user hold during this period?
}

export interface GameSession {
  id: string;                    // Unique session identifier
  startedAt: Date;               // When game session began
  currentScreen: GameScreen;     // Active screen in game flow
  depositAmount: number;         // Initial WLD deposit (simulated)
  currentPrice: number;          // Current diamond price
  priceHistory: PricePoint[];    // Historical prices for this session
  status: GameStatus;            // Current game state
  endedAt?: Date;                // When game ended (if applicable)
  finalPrice?: number;           // Final sale price (if sold)
}

export interface SparkleEffect {
  id: string;
  x: number;                     // Position X
  y: number;                     // Position Y
  startTime: Date;
  duration: number;              // Animation duration in ms
}

export interface GameState {
  countdownActive: boolean;      // Is sell countdown running?
  countdownRemaining: number;    // Seconds until auto-sell
  lastPriceUpdate: Date;         // When price last changed
  nextPriceUpdate: Date;         // When price will change next
  sparkleEffects: SparkleEffect[]; // Active visual effects
  backgroundIntensity: number;   // Red background fade (0-1)
  totalHolds: number;            // Times user held successfully
  missedHolds: number;           // Times user failed to hold
}

export interface TutorialProgress {
  completed: boolean;            // Has user seen full tutorial?
  currentStep: number;           // Current tutorial step (0-3)
  skipped: boolean;             // Did user skip tutorial?
  viewedAt?: Date;              // When tutorial was completed/skipped
}

// Component Props Types
export interface TutorialProps {
  onComplete: () => void;
}

export interface HomeScreenProps {
  onStartDeposit: () => void;
  onShowTutorial: () => void;
  onShowHelp: () => void;
}

export interface DepositWorkflowProps {
  onComplete: (amount: number) => void;
  onBack: () => void;
}

export interface GameScreenProps {
  originalDeposit: number;
  onGameEnd: (finalPrice: number) => void;
  onPlayAgain: () => void;
}

export interface CircularCountdownProps {
  duration: number;              // Duration in seconds
  isActive: boolean;             // Whether countdown is running
  onComplete: () => void;        // Called when countdown finishes
  size?: number;                 // Size of the circle
  resetKey?: string;             // For resetting the countdown
}

export interface MinigameAppProps {
  // No props needed - manages its own state
}

// Price Engine Types
export interface PriceStatistics {
  highestPrice: number;
  lowestPrice: number;
  totalHolds: number;
  totalMisses: number;
  averagePrice: number;
}

// Launch Mode Context Types
export interface LaunchModeContextType {
  isLaunched: boolean;
  configuration: LaunchConfiguration;
  refreshConfiguration: () => void;
}

// Asset paths (for consistency)
export const MINIGAME_ASSETS = {
  diamond: '/images/minigame/diamond.png',
  sparkle: '/images/minigame/sparkle.png',
  smoke: '/images/minigame/smoke.png',
  background: '/images/minigame/background.png',
} as const;

// Game constants
export const GAME_CONSTANTS = {
  PRICE_UPDATE_INTERVAL: 5000,    // 5 seconds
  COUNTDOWN_DURATION: 5,          // 5 seconds
  INITIAL_COUNTDOWN: 3,           // 3 seconds
  MIN_PRICE: 0.0001,              // Minimum price floor
  MAX_HISTORY_POINTS: 20,         // Maximum price history to keep
  MAX_SPARKLE_EFFECTS: 10,        // Maximum concurrent sparkle effects
  VOLATILITY_RANGE: {
    MIN: -0.04,                   // -4%
    MAX: 0.07,                    // +7%
  },
  PRESET_DEPOSITS: [10, 50, 100, 500], // Preset deposit amounts
} as const;