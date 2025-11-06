import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ParticleExplosion({
  position,
  onComplete,
}: {
  position: [number, number, number];
  color?: string;
  onComplete?: () => void;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<THREE.Vector3[]>([]);
  const lifetimeRef = useRef(0);
  const PARTICLE_COUNT = 20;
  const LIFETIME = 2.5; // seconds

  // Create circular texture for particles
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Initialize particles
  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    velocitiesRef.current = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Start at explosion position
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];

      // Circular pattern - particles spread outward in a disc
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3; // Slight variation
      const velocity = new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 0.3, // Small vertical component
        Math.sin(angle) * radius
      );
      velocitiesRef.current.push(velocity);
    }

    return { positions };
  }, [position]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;

    lifetimeRef.current += delta;

    if (lifetimeRef.current >= LIFETIME) {
      onComplete?.();
      return;
    }

    const positionAttr = particlesRef.current.geometry.attributes.position;
    if (!positionAttr) return;

    const positions = positionAttr.array as Float32Array;
    const progress = lifetimeRef.current / LIFETIME;

    // Update particle positions and fade out
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const velocity = velocitiesRef.current[i];
      if (!velocity) continue;

      const i3 = i * 3;
      const p0 = positions[i3];
      const p1 = positions[i3 + 1];
      const p2 = positions[i3 + 2];

      if (p0 !== undefined) positions[i3] = p0 + velocity.x * delta;
      if (p1 !== undefined) positions[i3 + 1] = p1 + velocity.y * delta - delta * 0.5; // Add slight gravity
      if (p2 !== undefined) positions[i3 + 2] = p2 + velocity.z * delta;
    }

    positionAttr.needsUpdate = true;

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFD700"
        map={particleTexture}
        transparent
        opacity={1}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
