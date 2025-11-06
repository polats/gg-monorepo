// ============================================================================
// Mobile-Friendly UI Utilities
// ============================================================================
// Utilities for creating responsive touch-friendly interactions

import type React from 'react';

/**
 * Create mobile-friendly event handlers for buttons/interactive elements
 * Handles both mouse and touch events with preventDefault to avoid double-firing
 *
 * @param action - The action to perform when the element is clicked/tapped
 * @returns Object with onClick and onTouchEnd handlers
 */
export function createMobileFriendlyHandlers(action: () => void) {
  return {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    },
  };
}

/**
 * Common styles for mobile-friendly buttons
 * Ensures proper touch handling and visual feedback
 */
export const mobileFriendlyButtonStyles: React.CSSProperties = {
  pointerEvents: 'auto',
  touchAction: 'manipulation', // Prevents delays and enables fast taps
  WebkitTapHighlightColor: 'transparent', // Removes default tap highlight
  userSelect: 'none', // Prevents text selection on long press
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

/**
 * Combine base styles with mobile-friendly button styles
 *
 * @param baseStyles - Base React CSS properties
 * @returns Merged styles with mobile-friendly additions
 */
export function withMobileFriendlyStyles(baseStyles: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyles,
    ...mobileFriendlyButtonStyles,
  };
}
