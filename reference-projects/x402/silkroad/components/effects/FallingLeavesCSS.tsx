'use client';

import { useMemo } from 'react';

export function FallingLeavesCSS() {
  // Generate only 10 leaves once on mount (memoized) - they fall once and stay visible
  const leaves = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 3, // Stagger starts over 3 seconds
    animationDuration: 5 + Math.random() * 5,
    size: 20 + Math.random() * 20,
    emoji: Math.random() > 0.5 ? '🍁' : '🍂',
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[15]">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="falling-leaf-once"
          style={{
            left: `${leaf.left}%`,
            top: '-50px',
            fontSize: `${leaf.size}px`,
            animationDelay: `${leaf.animationDelay}s`,
            animationDuration: `${leaf.animationDuration}s, ${leaf.animationDuration * 0.6}s, ${leaf.animationDuration * 0.8}s`,
            opacity: 0.9,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
}
