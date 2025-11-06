# Data Model: Pre-Launch Minigame Mode

## Overview
This document defines the data entities and their relationships for the pre-launch minigame feature. Since the minigame operates entirely client-side with no persistence, these models represent runtime state structures.

## Entities

### 1. LaunchConfiguration
**Purpose**: Determines which mode the application displays
**Source**: Environment variable

```typescript
interface LaunchConfiguration {
  isLaunched: boolean;           // True = main app, False = minigame
  configSource: 'env' | 'default'; // Where config was read from
  checkedAt: Date;               // When config was last checked
}
```

**Validation Rules**:
- `isLaunched` defaults to false if env var is missing
- `configSource` indicates reliability of configuration
- `checkedAt` used for cache invalidation if needed

**State Transitions**:
- Immutable after initial load (requires page refresh to change)

### 2. GameSession
**Purpose**: Tracks a single playthrough of the diamond-hands game
**Scope**: Client-side only, resets on page refresh

```typescript
interface GameSession {
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

type GameScreen = 'tutorial' | 'home' | 'deposit' | 'game' | 'result';
type GameStatus = 'initializing' | 'active' | 'countdown' | 'ended';

interface PricePoint {
  timestamp: Date;
  price: number;
  held: boolean;                // Did user hold during this period?
}
```

**Validation Rules**:
- `depositAmount` must be positive number
- `currentPrice` calculated from depositAmount + volatility
- `priceHistory` limited to last 20 points for memory efficiency
- `status` transitions are unidirectional

**State Transitions**:
```
initializing → active → countdown ↔ active → ended
```

### 3. GameState
**Purpose**: Manages active gameplay mechanics
**Scope**: Exists only during 'game' screen

```typescript
interface GameState {
  countdownActive: boolean;      // Is sell countdown running?
  countdownRemaining: number;    // Seconds until auto-sell
  lastPriceUpdate: Date;         // When price last changed
  nextPriceUpdate: Date;         // When price will change next
  sparkleEffects: SparkleEffect[]; // Active visual effects
  backgroundIntensity: number;   // Red background fade (0-1)
  totalHolds: number;            // Times user held successfully
  missedHolds: number;           // Times user failed to hold
}

interface SparkleEffect {
  id: string;
  x: number;                     // Position X
  y: number;                     // Position Y
  startTime: Date;
  duration: number;              // Animation duration in ms
}
```

**Validation Rules**:
- `countdownRemaining` between 0-5 seconds
- `backgroundIntensity` clamped between 0 and 1
- `sparkleEffects` array limited to 10 concurrent effects

**State Transitions**:
- Price updates every 5 seconds
- Countdown starts on each price update
- User tap cancels countdown, adds sparkle effect

### 4. TutorialProgress
**Purpose**: Tracks tutorial completion state
**Scope**: Could be persisted to localStorage for returning users

```typescript
interface TutorialProgress {
  completed: boolean;            // Has user seen full tutorial?
  currentStep: number;           // Current tutorial step (0-3)
  skipped: boolean;             // Did user skip tutorial?
  viewedAt?: Date;              // When tutorial was completed/skipped
}
```

**Validation Rules**:
- `currentStep` must be valid tutorial step index
- `completed` implies `currentStep` equals final step
- `skipped` and `completed` are mutually exclusive

## Relationships

```
LaunchConfiguration (1) ← determines → (1) ApplicationMode
                                              ↓
                                    [Minigame | Main App]
                                              ↓
                                        GameSession (1)
                                              ↓
                                    contains → (1) GameState
                                              ↓
                                    references → (0..1) TutorialProgress
```

## Data Flow

1. **Application Start**:
   - Read `NEXT_PUBLIC_APP_LAUNCHED` → Create LaunchConfiguration
   - If not launched → Initialize GameSession

2. **Game Flow**:
   - Tutorial → Update TutorialProgress
   - Deposit → Set GameSession.depositAmount
   - Game → Create/Update GameState continuously
   - End → Finalize GameSession with results

3. **State Updates**:
   - Price changes: Every 5 seconds via setTimeout
   - Countdown: Every 100ms during active countdown
   - Effects: On user interaction (tap to hold)

## Storage Requirements

**No Persistence Required**: All data is ephemeral and exists only in memory during the session.

**Optional Future Enhancement**:
- TutorialProgress could be saved to localStorage
- High scores could be tracked locally
- Session count could be stored for analytics

## Performance Considerations

1. **Memory Usage**:
   - PriceHistory limited to 20 points (~2KB)
   - SparkleEffects limited to 10 concurrent (~1KB)
   - Total memory footprint < 10KB per session

2. **Update Frequency**:
   - Price updates: Every 5 seconds (low frequency)
   - Countdown updates: 10fps during countdown only
   - React re-renders minimized via memo/useMemo

3. **Cleanup**:
   - Effects removed after animation completes
   - Old price points pruned from history
   - Session data garbage collected on navigation

## Security Considerations

1. **No Sensitive Data**: Game uses simulated WLD, no real value
2. **No External Communication**: Fully client-side operation
3. **No User Data Collection**: No PII or tracking
4. **Environment Variable**: Read-only, cannot be modified by user

## Migration Notes

When transitioning from minigame to launched app:
1. No data migration required (ephemeral data)
2. Components can be removed cleanly
3. Environment variable change triggers new behavior
4. No database cleanup needed