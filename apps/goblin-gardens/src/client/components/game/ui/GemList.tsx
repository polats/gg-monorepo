// ============================================================================
// Gem List Component
// ============================================================================
// Reusable gem list that eliminates 3x duplication in PileDemo

import React from 'react';
import type { Gem } from '../../../types/game';
import { GemListItem } from './GemListItem';
import { filterAndSortGems } from '../../../utils/gemSorting';

interface GemListProps {
  gems: Gem[];
  filter?: (gem: Gem) => boolean;
  emptyMessage?: string;
  maxHeight?: number;
  onGemClick?: (gem: Gem) => void;
}

/**
 * Displays a scrollable list of gems with consistent filtering, sorting, and styling
 * Eliminates duplication across regular/growing/offering gem lists
 *
 * @param gems - All gems to potentially display
 * @param filter - Optional filter function (default: show all)
 * @param emptyMessage - Message to show when list is empty (default: "No gems yet")
 * @param maxHeight - Maximum height in pixels before scrolling (default: 90)
 * @param onGemClick - Optional click handler for gem items
 */
export const GemList: React.FC<GemListProps> = ({
  gems,
  filter = () => true,
  emptyMessage = 'No gems yet',
  maxHeight = 90,
  onGemClick,
}) => {
  // Filter and sort gems using centralized utility
  const displayGems = filterAndSortGems(gems, filter);

  return (
    <div
      className="hide-scrollbar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '6px',
        borderRadius: 6,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {displayGems.length === 0 ? (
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: 7,
            textAlign: 'center',
            padding: '10px 0',
            fontStyle: 'italic',
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        displayGems.map((gem) => (
          <GemListItem
            key={gem.id}
            gem={gem}
            onClick={onGemClick ? () => onGemClick(gem) : undefined}
          />
        ))
      )}
    </div>
  );
};
