// ============================================================================
// Coin Display Components
// ============================================================================
// Reusable components for displaying coins consistently across the UI

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Coins {
  gold: number;
  silver: number;
  bronze: number;
}

export type CoinType = 'gold' | 'silver' | 'bronze';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the color for a coin type
 */
export function getCoinColor(coinType: CoinType): string {
  switch (coinType) {
    case 'gold':
      return '#FFD700';
    case 'silver':
      return '#C0C0C0';
    case 'bronze':
      return '#CD7F32';
  }
}

/**
 * Format a number with locale string for large values
 */
function formatCoinAmount(amount: number): string {
  return amount >= 1000 ? amount.toLocaleString() : amount.toString();
}

// ============================================================================
// CoinIcon Component
// ============================================================================

export const CoinIcon = ({ color, size = 10 }: { color: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
      flexShrink: 0,
    }}
  />
);

// ============================================================================
// CoinAmount Component
// ============================================================================

interface CoinAmountProps {
  type: CoinType;
  amount: number;
  size?: number;
  showZero?: boolean;
  affordable?: boolean; // If false, text appears red
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
}

/**
 * Display a single coin type with icon and amount
 */
export const CoinAmount: React.FC<CoinAmountProps> = ({
  type,
  amount,
  size = 10,
  showZero = false,
  affordable = true,
  fontSize = 10,
  fontFamily = 'monospace',
  fontWeight = 'bold',
}) => {
  if (amount === 0 && !showZero) {
    return null;
  }

  const color = getCoinColor(type);
  const textColor = affordable ? 'white' : '#ff6b6b';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <CoinIcon color={color} size={size} />
      <span
        style={{
          color: textColor,
          fontSize,
          fontWeight,
          fontFamily,
        }}
      >
        {formatCoinAmount(amount)}
      </span>
    </div>
  );
};

// ============================================================================
// CoinBalance Component
// ============================================================================

interface CoinBalanceProps {
  coins: Coins;
  size?: number;
  vertical?: boolean;
  showEmpty?: boolean; // Show "None" if all coins are 0
  showZero?: boolean; // Show coins even when their value is 0
  fontSize?: number;
  fontFamily?: string;
  gap?: number;
  reverse?: boolean; // If true, shows gold → silver → bronze, otherwise bronze → silver → gold
}

/**
 * Display a full coin balance with all denominations
 */
export const CoinBalance: React.FC<CoinBalanceProps> = ({
  coins,
  size = 10,
  vertical = false,
  showEmpty = false,
  showZero = false,
  fontSize = 10,
  fontFamily = 'monospace',
  gap = 6,
  reverse = false,
}) => {
  const isEmpty = coins.gold === 0 && coins.silver === 0 && coins.bronze === 0;

  if (isEmpty && showEmpty) {
    return (
      <div
        style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize,
          fontStyle: 'italic',
        }}
      >
        None
      </div>
    );
  }

  const coinTypes: CoinType[] = reverse
    ? ['gold', 'silver', 'bronze']
    : ['bronze', 'silver', 'gold'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap,
        alignItems: 'center',
      }}
    >
      {coinTypes
        .map((type) => (
          <CoinAmount
            key={type}
            type={type}
            amount={coins[type]}
            size={size}
            fontSize={fontSize}
            fontFamily={fontFamily}
            showZero={showZero}
          />
        ))
        .filter(Boolean)}
    </div>
  );
};

// ============================================================================
// CoinCost Component
// ============================================================================

interface CoinCostProps {
  cost: Coins;
  playerCoins: Coins;
  size?: number;
  fontSize?: number;
  showFree?: boolean; // Show "Free" if cost is 0
}

/**
 * Display a cost with affordability checking
 */
export const CoinCost: React.FC<CoinCostProps> = ({
  cost,
  playerCoins,
  size = 8,
  fontSize = 7,
  showFree = true,
}) => {
  const isFree = cost.gold === 0 && cost.silver === 0 && cost.bronze === 0;

  if (isFree && showFree) {
    return (
      <span
        style={{
          color: '#50C878',
          fontSize,
          fontWeight: 'bold',
        }}
      >
        Free
      </span>
    );
  }

  const coinTypes: CoinType[] = ['bronze', 'silver', 'gold'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {coinTypes.map((type) => {
        const amount = cost[type];
        if (amount === 0) return null;

        const canAfford = playerCoins[type] >= amount;

        return (
          <CoinAmount
            key={type}
            type={type}
            amount={amount}
            size={size}
            affordable={canAfford}
            fontSize={fontSize}
            fontFamily="monospace"
            fontWeight="bold"
          />
        );
      })}
    </div>
  );
};
