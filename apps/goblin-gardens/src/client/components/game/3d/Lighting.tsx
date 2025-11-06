import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AnimatedFireLight({ enableShadows = true }: { enableShadows?: boolean }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;

    const time = clock.getElapsedTime();

    // Combine multiple sine waves at different frequencies for natural flicker
    const flicker1 = Math.sin(time * 2.5) * 0.15;
    const flicker2 = Math.sin(time * 5.7) * 0.1;
    const flicker3 = Math.sin(time * 11.3) * 0.08;
    const pulse = Math.sin(time * 0.8) * 0.2; // Slow breathing pulse

    // Base intensity + flickering
    const baseIntensity = 3.0;
    lightRef.current.intensity = baseIntensity + flicker1 + flicker2 + flicker3 + pulse;
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[0, 8, 0]}
      intensity={1}
      color="#ffedd9"
      castShadow={enableShadows}
      shadow-camera-zoom={2}
    />
  );
}
