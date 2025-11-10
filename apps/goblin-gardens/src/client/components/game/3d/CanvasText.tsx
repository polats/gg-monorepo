// ============================================================================
// Custom Text Component (Canvas-based, no drei dependency)
// ============================================================================

import { useMemo } from 'react';
import * as THREE from 'three';

interface CanvasTextProps {
  children: string;
  position: [number, number, number];
  rotation: [number, number, number];
  fontSize?: number;
  color?: string;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
}

export function CanvasText({
  children,
  position,
  rotation,
  fontSize = 0.1,
  color = '#ffffff',
  anchorX = 'center',
  anchorY = 'middle',
}: CanvasTextProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Calculate canvas size based on text - wider to prevent truncation
    const scaleFactor = 512; // Resolution
    canvas.width = scaleFactor * 4; // Wider canvas
    canvas.height = scaleFactor;

    // Configure text rendering with MedievalSharp
    context.fillStyle = color;
    context.font = `bold ${scaleFactor * 0.5}px MedievalSharp, Arial, sans-serif`;
    context.textAlign = anchorX;
    context.textBaseline = anchorY;

    // Draw text
    const x =
      anchorX === 'left'
        ? scaleFactor * 0.2
        : anchorX === 'right'
          ? canvas.width - scaleFactor * 0.2
          : canvas.width / 2;
    const y =
      anchorY === 'top'
        ? scaleFactor * 0.2
        : anchorY === 'bottom'
          ? canvas.height - scaleFactor * 0.2
          : canvas.height / 2;
    context.fillText(children, x, y);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [children, color, anchorX, anchorY]);

  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[fontSize * 8, fontSize * 2]} />
      <meshBasicMaterial map={texture} transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}
