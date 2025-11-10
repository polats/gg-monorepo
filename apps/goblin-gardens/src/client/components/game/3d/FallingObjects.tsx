// ============================================================================
// Falling Objects Component - Instanced physics objects
// ============================================================================

import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedRigidBodies, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import type { ObjectTypeConfig, FaucetConfig, SelectConfig } from '../../../types/game';
import type { PerformanceTier } from '../../../utils/performanceDetection';
import { ROCK_COLORS } from '../../../constants/game';

// ============================================================================
// Garden Spawn Positions - MUST MATCH PileDemo.tsx
// ============================================================================
// ⚠️ IMPORTANT: Keep these synchronized with the constants in PileDemo.tsx
// These control where objects initially spawn in the garden

const COIN_SPAWN_X = 0.9;
const COIN_SPAWN_Z = -0.85;
const COIN_SPAWN_RADIUS = 0.35;

const GEM_SPAWN_X = 0.3;
const GEM_SPAWN_Z = -0.3;
const GEM_SPAWN_RADIUS = 0.35;

const GROWING_GEM_SPAWN_X = -0.4;
const GROWING_GEM_SPAWN_Z = 0.4;
const GROWING_GEM_SPAWN_RADIUS = 0.25;

interface FallingObjectsProps {
  objectType: ObjectTypeConfig;
  faucetConfig: FaucetConfig;
  apiRef?: React.RefObject<RapierRigidBody[]>;
  meshRef?: React.RefObject<THREE.InstancedMesh | null>; // External mesh ref for MasterPhysicsLoop
  uniformScale?: boolean;
  meshId?: string;
  selectedInstances?: Set<string>; // Set of "meshId:instanceId" strings
  highlightConfig?: SelectConfig;
  draggedInstance?: string | null; // Currently dragged instance key
  collectingItems?: Map<string, { startTime: number; meshId: string; instanceId: number }>;
  performanceTier?: PerformanceTier | null;
  liveInstanceSpawnZones?: ('normal' | 'bottom' | 'far-bottom' | 'grow-zone')[]; // Live/reactive spawn zones (overrides objectType.instanceSpawnZones)
  isActive?: boolean; // Controls whether useFrame loops should run (prevents race conditions during unmounting)
  isTransitioningRef?: React.MutableRefObject<boolean>; // Synchronous transition blocker
}

export function FallingObjects({
  objectType,
  faucetConfig,
  apiRef,
  meshRef: externalMeshRef,
  uniformScale = false,
  meshId,
  selectedInstances,
  highlightConfig,
  draggedInstance,
  collectingItems,
  performanceTier,
  liveInstanceSpawnZones,
  isActive = true,
  isTransitioningRef,
}: FallingObjectsProps) {
  const api = useRef<RapierRigidBody[]>(null);
  const internalMeshRef = useRef<THREE.InstancedMesh>(null);
  const instanceMatricesRef = useRef<
    Map<
      number,
      { position: THREE.Vector3; rotation: THREE.Quaternion; originalScale: THREE.Vector3 }
    >
  >(new Map());

  // Memoize instances to prevent regeneration on re-render
  const instances = useMemo(
    () =>
      Array.from({ length: objectType.count }, (_, i) => {
        let scale: [number, number, number];

        // Use instanceScales if provided, otherwise use scaleRange
        if (objectType.instanceScales && objectType.instanceScales[i] !== undefined) {
          // Use specific scale for this instance (gems use uniform scale)
          const instanceScale = objectType.instanceScales[i];
          scale = [instanceScale, instanceScale, instanceScale];
        } else {
          // Get scale range from config or use default
          const [minScale, maxScale] = objectType.scaleRange || [0.5, 1.5];
          const scaleRange = maxScale - minScale;

          if (uniformScale) {
            // Uniform scale for spheres and round objects
            const randomScale = minScale + Math.random() * scaleRange;
            scale = [randomScale, randomScale, randomScale];
          } else {
            // Non-uniform scale for boxes and irregular shapes (rock-like)
            const scaleX = minScale + Math.random() * scaleRange;
            const scaleY = minScale + Math.random() * scaleRange;
            const scaleZ = minScale + Math.random() * scaleRange;
            scale = [scaleX, scaleY, scaleZ];
          }
        }

        // Determine spawn position based on per-instance zone or global spawnHeight
        // Use liveInstanceSpawnZones if provided (for reactive updates), otherwise fall back to config
        const spawnZone =
          liveInstanceSpawnZones?.[i] ||
          objectType.instanceSpawnZones?.[i] ||
          objectType.spawnHeight ||
          'normal';
        let position: [number, number, number];

        if (spawnZone === 'far-bottom') {
          // Coins - diamond-shaped zone, elongated along X and Z
          let x, z;
          do {
            x = Math.random() * 2 - 1; // -1 to 1
            z = Math.random() * 2 - 1; // -1 to 1
          } while (Math.abs(x) / 1.5 + Math.abs(z) / 1.0 > 1); // Elongated diamond (wider in X)
          position = [
            COIN_SPAWN_X + x * COIN_SPAWN_RADIUS,
            Math.random() * 0.8 - 0.3,
            COIN_SPAWN_Z + z * COIN_SPAWN_RADIUS,
          ];
        } else if (spawnZone === 'bottom') {
          // Gems - diamond-shaped zone, elongated along X and Z
          let x, z;
          do {
            x = Math.random() * 2 - 1; // -1 to 1
            z = Math.random() * 2 - 1; // -1 to 1
          } while (Math.abs(x) / 1.0 + Math.abs(z) / 1.5 > 1); // Elongated diamond (wider in Z)
          position = [
            GEM_SPAWN_X + x * GEM_SPAWN_RADIUS,
            Math.random() * 0.8 - 0.3,
            GEM_SPAWN_Z + z * GEM_SPAWN_RADIUS,
          ];
        } else if (spawnZone === 'grow-zone') {
          // Growing gems - circular zone in the grow area
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random()) * GROWING_GEM_SPAWN_RADIUS;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          position = [GROWING_GEM_SPAWN_X + x, Math.random() * 0.8 - 0.3, GROWING_GEM_SPAWN_Z + z];
        } else {
          // Normal spawn (throughout the pile)
          position = [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5];
        }

        return {
          key: i,
          position,
          scale,
        };
      }),
    // NOTE: instanceSpawnZones is intentionally NOT in the dependency array
    // to prevent reinitializing physics bodies when zones change.
    // The faucet will handle respawning objects in the correct zones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      objectType.count,
      objectType.scaleRange,
      uniformScale,
      objectType.spawnHeight,
      objectType.instanceScales,
    ]
  );

  // Sync internal refs with external refs
  useEffect(() => {
    if (apiRef && api.current) {
      (apiRef as any).current = api.current;
    }
    if (externalMeshRef && internalMeshRef.current) {
      (externalMeshRef as any).current = internalMeshRef.current;
    }
  }, [apiRef, externalMeshRef]);

  // Store base colors for each instance
  const baseColors = useRef<THREE.Color[]>([]);

  useEffect(() => {
    if (internalMeshRef.current && objectType.count > 0) {
      // Store mesh ID in userData for pickup identification
      if (meshId) {
        internalMeshRef.current.userData.meshId = meshId;
      }

      // Choose color palette based on material type
      const colorPalette = ROCK_COLORS;

      // Assign colors to each instance and store them
      baseColors.current = [];
      for (let i = 0; i < objectType.count; i++) {
        let color: THREE.Color;

        if (objectType.materialType === 'coin' || objectType.materialType === 'gem') {
          // Coins and gems use their specific type color
          color = new THREE.Color(objectType.color);
        } else {
          // Rocks get random colors from palette
          const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          color = new THREE.Color(randomColor);
        }

        baseColors.current.push(color.clone());
        internalMeshRef.current.setColorAt(i, color);
      }
      if (internalMeshRef.current.instanceColor) {
        internalMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [objectType.count, objectType.materialType, objectType.color, meshId]);

  // Update colors when selection changes
  useEffect(() => {
    if (!internalMeshRef.current || objectType.count === 0) return;

    for (let i = 0; i < objectType.count; i++) {
      const instanceKey = `${meshId}:${i}`;
      const isSelected = selectedInstances?.has(instanceKey);

      if (baseColors.current[i]) {
        if (isSelected && highlightConfig) {
          // Yellow highlight for selected objects
          const highlightColor = new THREE.Color(highlightConfig.highlightColor);
          const blended = baseColors.current[i].clone().lerp(highlightColor, 0.6);
          internalMeshRef.current.setColorAt(i, blended);
        } else {
          // Restore base color
          internalMeshRef.current.setColorAt(i, baseColors.current[i]);
        }
      }
    }
    if (internalMeshRef.current.instanceColor) {
      internalMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [selectedInstances, highlightConfig, objectType.count, meshId]);

  useEffect(() => {
    if (!faucetConfig.enabled) return;

    // Spawn objects based on spawn rate
    const intervalMs = 1000 / faucetConfig.spawnRate;
    const interval = setInterval(() => {
      // CRITICAL: Check transition flag FIRST - blocks all physics access during transitions
      // This prevents concurrent access crashes when switching between Garden modes
      if (isTransitioningRef?.current) {
        return;
      }

      if (api.current) {
        // Find the object farthest from center that's also close to the ground
        // This prevents selecting newly spawned falling objects
        let farthestIndex = 0;
        let maxScore = -Infinity;
        const GROUND_THRESHOLD = 1.0; // Only consider objects below this Y position

        for (let i = 0; i < api.current.length; i++) {
          const body = api.current[i];
          if (body) {
            const pos = body.translation();

            // Only consider objects close to the ground
            if (pos.y < GROUND_THRESHOLD) {
              // Calculate horizontal distance from center (ignore Y)
              const horizontalDistance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

              // Prefer objects that are far horizontally AND low vertically
              // Lower Y = higher score
              const score = horizontalDistance - pos.y;

              if (score > maxScore) {
                maxScore = score;
                farthestIndex = i;
              }
            }
          }
        }

        const body = api.current[farthestIndex];
        if (body) {
          // Determine spawn zone for this specific instance
          // Use live spawn zones if provided (for reactive updates), otherwise fall back to config
          const spawnZone =
            liveInstanceSpawnZones?.[farthestIndex] ||
            objectType.instanceSpawnZones?.[farthestIndex] ||
            objectType.spawnHeight ||
            'normal';

          // Calculate spawn position based on the instance's spawn zone
          let spawnX, spawnY, spawnZ;
          const spreadRadius = faucetConfig.spawnRadius;

          if (spawnZone === 'far-bottom') {
            // Coins zone
            let x, z;
            do {
              x = Math.random() * 2 - 1;
              z = Math.random() * 2 - 1;
            } while (Math.abs(x) / 1.5 + Math.abs(z) / 1.0 > 1);
            spawnX = COIN_SPAWN_X + x * COIN_SPAWN_RADIUS;
            spawnY = faucetConfig.position[1];
            spawnZ = COIN_SPAWN_Z + z * COIN_SPAWN_RADIUS;
          } else if (spawnZone === 'grow-zone') {
            // Growing gems zone
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * GROWING_GEM_SPAWN_RADIUS;
            spawnX = GROWING_GEM_SPAWN_X + Math.cos(angle) * radius;
            spawnY = faucetConfig.position[1];
            spawnZ = GROWING_GEM_SPAWN_Z + Math.sin(angle) * radius;
          } else if (spawnZone === 'bottom') {
            // Regular gems zone
            let x, z;
            do {
              x = Math.random() * 2 - 1;
              z = Math.random() * 2 - 1;
            } while (Math.abs(x) / 1.0 + Math.abs(z) / 1.5 > 1);
            spawnX = GEM_SPAWN_X + x * GEM_SPAWN_RADIUS;
            spawnY = faucetConfig.position[1];
            spawnZ = GEM_SPAWN_Z + z * GEM_SPAWN_RADIUS;
          } else {
            // Normal spawn or use faucet position
            const spreadX = (Math.random() - 0.5) * spreadRadius * 2;
            const spreadZ = (Math.random() - 0.5) * spreadRadius * 2;
            spawnX = faucetConfig.position[0] + spreadX;
            spawnY = faucetConfig.position[1];
            spawnZ = faucetConfig.position[2] + spreadZ;
          }

          body.setTranslation(
            {
              x: spawnX,
              y: spawnY,
              z: spawnZ,
            },
            true
          );

          // Apply initial velocity if specified
          if (faucetConfig.initialVelocity) {
            body.setLinvel(
              {
                x: faucetConfig.initialVelocity[0],
                y: faucetConfig.initialVelocity[1],
                z: faucetConfig.initialVelocity[2],
              },
              true
            );
          }

          // IMMEDIATELY sync visual matrix with physics position
          if (internalMeshRef.current) {
            const position = body.translation();
            const rotation = body.rotation();
            const matrix = new THREE.Matrix4();

            // Get current scale from the instance (preserve it)
            const tempMatrix = new THREE.Matrix4();
            internalMeshRef.current.getMatrixAt(farthestIndex, tempMatrix);
            const scale = new THREE.Vector3();
            const tempPos = new THREE.Vector3();
            const tempRot = new THREE.Quaternion();
            tempMatrix.decompose(tempPos, tempRot, scale);

            // Compose new matrix with physics position/rotation + preserved scale
            matrix.compose(
              new THREE.Vector3(position.x, position.y, position.z),
              new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
              scale
            );

            internalMeshRef.current.setMatrixAt(farthestIndex, matrix);
            internalMeshRef.current.instanceMatrix.needsUpdate = true;
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [faucetConfig]);

  // NOTE: Collection animation has been moved to MasterPhysicsLoop in PileDemo.tsx (Phase 2)
  // NOTE: Matrix synchronization has been moved to MasterPhysicsLoop in PileDemo.tsx (Phase 1)
  // This eliminates separate useFrame loops and consolidates all physics access

  // Tier-based sleeping configuration for physics bodies
  const sleepingConfig = useMemo(() => {
    switch (performanceTier) {
      case 'high':
        // High tier: Tight thresholds - bodies sleep only when truly at rest
        return {
          linearThreshold: 0.01,
          angularThreshold: 0.01,
          canSleep: true,
        };
      case 'medium':
        // Medium tier: Moderate thresholds - balanced performance
        return {
          linearThreshold: 0.1,
          angularThreshold: 0.1,
          canSleep: true,
        };
      case 'low':
      default:
        // Low tier: Loose thresholds - bodies sleep quickly to save performance
        return {
          linearThreshold: 0.5,
          angularThreshold: 0.5,
          canSleep: true,
        };
    }
  }, [performanceTier]);

  return (
    <InstancedRigidBodies
      ref={api}
      instances={instances}
      colliders={objectType.collider}
      {...sleepingConfig}
    >
      <instancedMesh
        ref={internalMeshRef}
        args={[undefined, undefined, objectType.count]}
        castShadow
        receiveShadow
      >
        {objectType.geometry}
        {objectType.materialType === 'gem' ? (
          <meshPhysicalMaterial
            transparent
            opacity={0.85}
            roughness={0.1}
            metalness={0}
            transmission={0.9}
            ior={2.4}
            thickness={0.5}
          />
        ) : objectType.materialType === 'coin' ? (
          <meshStandardMaterial metalness={0.9} roughness={0.2} />
        ) : (
          <meshLambertMaterial />
        )}
      </instancedMesh>
    </InstancedRigidBodies>
  );
}
