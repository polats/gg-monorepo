// ============================================================================
// Gem List Item Component
// ============================================================================
// Individual gem item display for gem lists

import React from 'react';
import type { Gem } from '../../../types/game';
import { GemIcon } from '../../icons/GemIcons';
import { getRarityColor, GEM_TYPE_NAMES } from '../../../utils/gemGeneration';
import { calculateGemValue } from '../../../utils/gemValue';
import { CoinValueDisplay } from '../../../PileDemo'; // Temporarily import from PileDemo

interface GemListItemProps {
  gem: Gem;
  onClick?: () => void;
}

/**
 * Displays a single gem with its icon, rarity, type, and value
 * Used in all gem list sections (inventory, growing, offering)
 */
export const GemListItem: React.FC<GemListItemProps> = ({ gem, onClick }) => {
  // Calculate progress percentage for growing gems
  const growthPercentage = gem.isGrowing ? Math.min(gem.currentGrowth, 100) : 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 6px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 4,
        border: `1px solid ${gem.color}`,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 28, // Ensure enough height for all content
      }}
      onClick={onClick}
    >
      {/* Progress bar background for growing gems */}
      {gem.isGrowing && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            width: `${growthPercentage}%`,
            background: `linear-gradient(90deg, ${gem.color}15, ${gem.color}30)`,
            transition: 'width 0.3s ease-out',
            borderRadius: 4,
            zIndex: 0,
            overflow: 'hidden', // Clip progress bar only
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <GemIcon shape={gem.shape} size={12} color={gem.color} />
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: getRarityColor(gem.rarity) }}>
            {gem.rarity.charAt(0).toUpperCase() + gem.rarity.slice(1)}
          </span>{' '}
          <span style={{ color: 'white' }}>{GEM_TYPE_NAMES[gem.type]}</span>
        </span>
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 6,
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CoinValueDisplay bronzeValue={calculateGemValue(gem)} size={8} reverse={true} /> •{' '}
          {gem.growthRate}x • {(gem.size * 1000).toFixed(0)}mm
        </span>
      </div>
    </div>
  );
};
