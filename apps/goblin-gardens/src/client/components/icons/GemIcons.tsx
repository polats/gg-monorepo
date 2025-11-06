// ============================================================================
// Gem Shape Icons
// ============================================================================
// SVG icons representing different gem shapes used in the game

import type { GemShape } from '../../types/game';

interface GemIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Octahedron icon - Diamond/kite shape (two triangles)
 * Classic diamond appearance
 */
export function OctahedronIcon({ size = 12, color = '#ffffff', className }: GemIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Top triangle */}
      <path
        d="M12 2 L22 12 L12 12 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.9"
      />
      {/* Bottom triangle */}
      <path
        d="M12 12 L22 12 L12 22 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {/* Left top triangle */}
      <path
        d="M12 2 L12 12 L2 12 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.75"
      />
      {/* Left bottom triangle */}
      <path
        d="M12 12 L2 12 L12 22 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.5"
      />
      {/* Center highlight */}
      <circle cx="12" cy="10" r="2" fill="rgba(255, 255, 255, 0.4)" />
    </svg>
  );
}

/**
 * Dodecahedron icon - Pentagon shape
 * Twelve-sided polyhedron
 */
export function DodecahedronIcon({ size = 12, color = '#ffffff', className }: GemIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Pentagon shape */}
      <path
        d="M12 2 L22 9 L18 20 L6 20 L2 9 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
      />
      {/* Inner facets for depth */}
      <path
        d="M12 2 L12 12 L2 9 Z"
        fill="rgba(0, 0, 0, 0.15)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      <path
        d="M12 2 L22 9 L12 12 Z"
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      <path
        d="M12 12 L18 20 L6 20 Z"
        fill="rgba(0, 0, 0, 0.2)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      {/* Highlight */}
      <circle cx="12" cy="8" r="1.5" fill="rgba(255, 255, 255, 0.5)" />
    </svg>
  );
}

/**
 * Icosahedron icon - Triangle cluster
 * Twenty-sided polyhedron
 */
export function IcosahedronIcon({ size = 12, color = '#ffffff', className }: GemIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Multiple triangular facets */}
      {/* Center triangle */}
      <path
        d="M12 6 L18 18 L6 18 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
      />
      {/* Left facet */}
      <path
        d="M6 18 L12 6 L4 12 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.7"
      />
      {/* Right facet */}
      <path
        d="M12 6 L18 18 L20 12 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.8"
      />
      {/* Top left facet */}
      <path
        d="M12 6 L4 12 L8 3 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {/* Top right facet */}
      <path
        d="M12 6 L20 12 L16 3 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
        opacity="0.65"
      />
      {/* Highlight */}
      <circle cx="12" cy="10" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  );
}

/**
 * Tetrahedron icon - Single triangle (pyramid)
 * Four-sided polyhedron, simplest 3D shape
 */
export function TetrahedronIcon({ size = 12, color = '#ffffff', className }: GemIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Main triangle face */}
      <path
        d="M12 3 L21 19 L3 19 Z"
        fill={color}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
      />
      {/* Left edge facet for depth */}
      <path
        d="M3 19 L12 3 L7 16 Z"
        fill="rgba(0, 0, 0, 0.2)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      {/* Right edge facet for depth */}
      <path
        d="M21 19 L12 3 L17 16 Z"
        fill="rgba(255, 255, 255, 0.15)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      {/* Highlight */}
      <circle cx="12" cy="9" r="1.5" fill="rgba(255, 255, 255, 0.7)" />
    </svg>
  );
}

/**
 * Get the appropriate gem icon component for a given shape
 */
export function GemIcon({ shape, size = 12, color = '#ffffff', className }: GemIconProps & { shape: GemShape }) {
  const props = { size, color, ...(className ? { className } : {}) };

  switch (shape) {
    case 'tetrahedron':
      return <TetrahedronIcon {...props} />;
    case 'dodecahedron':
      return <DodecahedronIcon {...props} />;
    case 'octahedron':
    default:
      return <OctahedronIcon {...props} />;
  }
}

/**
 * Combined gems icon for the "My Garden" tab
 * Shows multiple gem shapes together
 */
export function CombinedGemsIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      {/* Octahedron (diamond) - top left */}
      <path
        d="M7 4 L11 8 L7 8 Z"
        fill="#88ccff"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />
      <path
        d="M7 8 L11 8 L7 12 Z"
        fill="#6699cc"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />
      <path
        d="M7 4 L7 8 L3 8 Z"
        fill="#99bbee"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />
      <path
        d="M7 8 L3 8 L7 12 Z"
        fill="#5588bb"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />

      {/* Pentagon (dodecahedron) - top right */}
      <path
        d="M17 3 L21 6 L20 10 L14 10 L13 6 Z"
        fill="#cc88ff"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />

      {/* Triangle (icosahedron) - bottom left */}
      <path
        d="M7 14 L11 20 L3 20 Z"
        fill="#ff88cc"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />

      {/* Small triangle (tetrahedron) - bottom right */}
      <path
        d="M17 14 L21 20 L13 20 Z"
        fill="#ffcc88"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="0.3"
      />

      {/* Sparkle effect */}
      <circle cx="12" cy="12" r="1" fill="rgba(255, 255, 255, 0.8)" />
      <path
        d="M12 9 L12 15 M9 12 L15 12"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
