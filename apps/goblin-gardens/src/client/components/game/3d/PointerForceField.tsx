import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RigidBody as RapierRigidBodyType } from '@dimforge/rapier3d-compat';
import type { TouchConfig } from '../../../types/game';

// Pointer force field - pushes objects or picks them up
//
// CRITICAL FIXES FOR iOS/MOBILE RELIABILITY:
// ------------------------------------------
// 1. Coordinate Normalization: Account for canvas offset (size.left, size.top)
//    - iOS/mobile browsers have different coordinate systems
//    - Without offset correction, raycasting is inaccurate
//
// 2. Touch Event Support: Dual pointer + touch listeners
//    - iOS Safari doesn't reliably support pointer events
//    - Must handle both TouchEvent and PointerEvent
//    - Use touches[0] for touchstart/touchmove, changedTouches[0] for touchend
//
// 3. Event Propagation: stopPropagation() + preventDefault()
//    - Prevents conflicts with other event handlers
//    - preventDefault() stops mobile scrolling during drag
//
// 4. InstancedMesh Matrix Updates: Call instanceMatrix.needsUpdate = true
//    - After moving instances (faucet spawn), raycasting breaks
//    - Three.js raycaster needs updated matrices to work correctly
//
// These fixes resolve random/intermittent dragging failures on iOS/iPad/mobile

export function PointerForceField({
  objectApis,
  onDraggingChange,
  config,
  setSelectedInstances,
  onDraggedObjectChange,
  onCollectItem,
  activeScene,
  isTransitioningRef,
}: {
  objectApis: React.RefObject<RapierRigidBodyType[]>[];
  onDraggingChange?: (dragging: boolean) => void;
  config: TouchConfig;
  selectedInstances?: Set<string>;
  setSelectedInstances?: React.Dispatch<React.SetStateAction<Set<string>>>;
  onDraggedObjectChange?: (draggedInstance: string | null) => void;
  onCollectItem?: (meshId: string, instanceId: number) => void;
  activeScene: 'scrounge' | 'garden';
  isTransitioningRef?: React.MutableRefObject<boolean>;
}) {
  const { camera, size, raycaster } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const pointerPos = useRef(new THREE.Vector3());
  const prevPointerPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 50, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  const indicatorRef = useRef<THREE.Mesh>(null);

  // Pickup mode state
  const pickedBodyRef = useRef<{ body: RapierRigidBodyType; offset: THREE.Vector3; instanceKey: string; initialY: number } | null>(null);
  const originalDamping = useRef({ linear: 0, angular: 0 });

  // Use config values based on mode
  const isPushMode = config.mode === 'push';
  const isPickupMode = config.mode === 'pickup';
  const isSelectMode = config.mode === 'select';
  const FORCE_RADIUS = isPushMode ? config.push.radius : 0.5;
  const FORCE_STRENGTH = isPushMode ? config.push.strength : 0;
  const MAX_FORCE = isPushMode ? config.push.maxForce : 0;

  // NOTE: Cleanup is handled by transition handlers (handleGrowClick/handleOfferClick)
  // that clear pickedBodyRef and call setIsDragging(false) BEFORE switching modes.
  // Removed the cleanup useEffect that was causing concurrent physics access during unmount.

  useEffect(() => {
    // Get pointer coordinates from either pointer or touch event
    const getPointerCoords = (e: PointerEvent | TouchEvent): { x: number; y: number } => {
      if ('touches' in e && e.touches.length > 0 && e.touches[0]) {
        // Touch event
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if ('changedTouches' in e && e.changedTouches.length > 0 && e.changedTouches[0]) {
        // Touch end event
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      } else {
        // Pointer/Mouse event
        return { x: (e as PointerEvent).clientX, y: (e as PointerEvent).clientY };
      }
    };

    // Normalize coordinates accounting for canvas offset
    const normalizeCoords = (clientX: number, clientY: number): { x: number; y: number } => {
      // Account for canvas position offset (critical for iOS/mobile)
      const x = ((clientX - size.left) / size.width) * 2 - 1;
      const y = -((clientY - size.top) / size.height) * 2 + 1;
      return { x, y };
    };

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      // Check if event is inside sidebar - if so, ignore it to allow scrolling
      const target = e.target as HTMLElement;
      if (target.closest('[data-sidebar]')) {
        return;
      }

      e.stopPropagation(); // Prevent event bubbling
      if ('touches' in e) {
        e.preventDefault(); // Prevent touch scrolling on mobile
      }

      const coords = getPointerCoords(e);
      const normalized = normalizeCoords(coords.x, coords.y);
      raycaster.setFromCamera(new THREE.Vector2(normalized.x, normalized.y), camera);

      // In select mode, try to select/deselect an object
      if (isSelectMode) {
        // FIX #3: Use physics-based picking for select mode too
        raycaster.setFromCamera(new THREE.Vector2(normalized.x, normalized.y), camera);
        const ray = raycaster.ray;

        type SelectHit = {
          meshId: string;
          instanceId: number;
          distance: number;
        };
        let closestHit: SelectHit | null = null;

        // Manually test ray against all physics bodies
        objectApis.forEach((apiRef, meshIndex) => {
          if (!apiRef.current) return;

          apiRef.current.forEach((body, instanceId) => {
            if (!body) return;

            const pos = body.translation();
            if (pos.y < -100) return;

            const bodyPos = new THREE.Vector3(pos.x, pos.y, pos.z);
            const radius = 0.08;

            const toCenter = bodyPos.clone().sub(ray.origin);
            const projection = toCenter.dot(ray.direction);
            if (projection < 0) return;

            const closestPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(projection));
            const distanceToCenter = closestPoint.distanceTo(bodyPos);

            if (distanceToCenter < radius) {
              const hitDistance = projection - Math.sqrt(radius * radius - distanceToCenter * distanceToCenter);

              if (!closestHit || hitDistance < closestHit.distance) {
                closestHit = {
                  meshId: meshIndex.toString(),
                  instanceId,
                  distance: hitDistance
                };
              }
            }
          });
        });

        if (closestHit !== null && setSelectedInstances) {
          const hit: SelectHit = closestHit;
          const instanceKey = `${hit.meshId}:${hit.instanceId}`;

          // Toggle selection
          setSelectedInstances(prev => {
            const newSet = new Set(prev);
            if (newSet.has(instanceKey)) {
              newSet.delete(instanceKey);
            } else {
              newSet.add(instanceKey);
            }
            return newSet;
          });

          console.log('[SELECT] Physics-based selection:', instanceKey);
        }

        return; // Don't set dragging in select mode
      }

      // In pickup mode, try to pick an object
      if (isPickupMode) {
        // FIX #3: PHYSICS-BASED PICKING
        // Bypass Three.js raycasting entirely and use physics body positions directly
        // This eliminates all visual/physics desync issues and iOS raycasting bugs

        // Setup ray from camera through click point
        raycaster.setFromCamera(new THREE.Vector2(normalized.x, normalized.y), camera);
        const ray = raycaster.ray;

        console.log('[PICK] Physics-based picking:', {
          clickCoords: { x: normalized.x.toFixed(3), y: normalized.y.toFixed(3) },
          rayOrigin: { x: ray.origin.x.toFixed(3), y: ray.origin.y.toFixed(3), z: ray.origin.z.toFixed(3) },
          rayDirection: { x: ray.direction.x.toFixed(3), y: ray.direction.y.toFixed(3), z: ray.direction.z.toFixed(3) }
        });

        type PickupHit = {
          meshId: string;
          instanceId: number;
          distance: number;
          body: RapierRigidBodyType;
          hitPoint: THREE.Vector3;
        };
        let closestHit: PickupHit | null = null;

        // Manually test ray against all physics bodies
        // Performance optimization: only test bodies within reasonable distance
        const maxPickDistance = 10; // Max distance to consider for picking
        let bodiesTestedCount = 0;

        objectApis.forEach((apiRef, meshIndex) => {
          if (!apiRef.current) return;

          apiRef.current.forEach((body, instanceId) => {
            if (!body) return;

            const pos = body.translation();

            // Skip teleported bodies
            if (pos.y < -100) return;

            const bodyPos = new THREE.Vector3(pos.x, pos.y, pos.z);

            // Quick distance check: skip bodies far from camera
            const distFromCamera = bodyPos.distanceTo(ray.origin);
            if (distFromCamera > maxPickDistance) return;

            bodiesTestedCount++;

            // Ray-sphere intersection test
            // Approximate each object as a sphere with radius based on object type
            const radius = 0.08; // Approximate radius for all objects

            // Vector from ray origin to sphere center
            const toCenter = bodyPos.clone().sub(ray.origin);

            // Project onto ray direction to find closest point on ray
            const projection = toCenter.dot(ray.direction);

            // If projection is negative, sphere is behind camera
            if (projection < 0) return;

            // Find closest point on ray to sphere center
            const closestPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(projection));

            // Distance from closest point to sphere center
            const distanceToCenter = closestPoint.distanceTo(bodyPos);

            // Check if ray intersects sphere
            if (distanceToCenter < radius) {
              // Calculate actual hit distance (entry point of sphere)
              const hitDistance = projection - Math.sqrt(radius * radius - distanceToCenter * distanceToCenter);

              // Keep closest hit
              if (!closestHit || hitDistance < closestHit.distance) {
                const hitPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(hitDistance));
                closestHit = {
                  meshId: meshIndex.toString(),
                  instanceId,
                  distance: hitDistance,
                  body,
                  hitPoint
                };
              }
            }
          });
        });

        console.log('[PICK] Tested', bodiesTestedCount, 'bodies');

        if (closestHit !== null) {
          // Type assertion to help TypeScript understand the type
          const hit: PickupHit = closestHit;
          const { meshId, instanceId, body, hitPoint } = hit;

          console.log('[PICK] ✅ Physics-based hit found:', {
            meshId,
            instanceId,
            distance: hit.distance.toFixed(3),
            bodyPos: { x: body.translation().x.toFixed(3), y: body.translation().y.toFixed(3), z: body.translation().z.toFixed(3) },
            isSleeping: body.isSleeping()
          });

          // Store original damping
          originalDamping.current.linear = body.linearDamping();
          originalDamping.current.angular = body.angularDamping();

          // Set to kinematic and increase damping
          body.setBodyType(2, true); // Kinematic
          body.setLinearDamping(config.pickup.damping);
          body.setAngularDamping(config.pickup.damping);
          body.wakeUp();

          // Calculate offset from body to hit point
          const bodyPos = body.translation();
          const offset = new THREE.Vector3(
            hitPoint.x - bodyPos.x,
            hitPoint.y - bodyPos.y,
            hitPoint.z - bodyPos.z
          );

          // BUGFIX: Initialize pointerPos to current click position on ground plane
          // This prevents the object from jumping to the last drag position for a few frames
          const groundIntersection = new THREE.Vector3();
          if (ray.intersectPlane(groundPlane.current, groundIntersection)) {
            pointerPos.current.copy(groundIntersection);
            prevPointerPos.current.copy(groundIntersection);
          }

          const instanceKey = `${meshId}:${instanceId}`;
          // Store initial Y position to maintain height during drag
          pickedBodyRef.current = { body, offset, instanceKey, initialY: bodyPos.y };

          // Notify parent about dragged object
          onDraggedObjectChange?.(instanceKey);

          console.log('[PICK] ✅ Pickup successful! Body is now kinematic and following pointer');
        } else {
          console.log('[PICK] ❌ No physics bodies hit by ray');
        }
      }

      setIsDragging(true);
      onDraggingChange?.(true);
    };

    const handlePointerUp = () => {
      // Release picked object
      if (isPickupMode && pickedBodyRef.current) {
        const { body, instanceKey } = pickedBodyRef.current;

        // Check if this is a special item (gem or coin)
        const parts = instanceKey.split(':');
        const meshId = parts[0];
        const instanceIdStr = parts[1];

        if (meshId && instanceIdStr && onCollectItem) {
          const meshIndex = parseInt(meshId);
          const instanceId = parseInt(instanceIdStr);

          if (!isNaN(meshIndex) && !isNaN(instanceId)) {
            // Call collect callback (parent will check if it's special)
            onCollectItem(meshId, instanceId);
          }
        }

        body.setBodyType(0, true); // Dynamic
        body.setLinearDamping(originalDamping.current.linear);
        body.setAngularDamping(originalDamping.current.angular);
        pickedBodyRef.current = null;

        // Clear dragged object notification
        onDraggedObjectChange?.(null);
      }

      setIsDragging(false);
      onDraggingChange?.(false);
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      // Check if event is inside sidebar - if so, ignore it to allow scrolling
      const target = e.target as HTMLElement;
      if (target.closest('[data-sidebar]')) {
        return;
      }

      const coords = getPointerCoords(e);
      const normalized = normalizeCoords(coords.x, coords.y);

      // Raycast to ground plane
      raycaster.setFromCamera(new THREE.Vector2(normalized.x, normalized.y), camera);
      if (raycaster.ray.intersectPlane(groundPlane.current, intersectionPoint.current)) {
        prevPointerPos.current.copy(pointerPos.current);
        pointerPos.current.copy(intersectionPoint.current);

        // Calculate velocity
        velocity.current.subVectors(pointerPos.current, prevPointerPos.current);
      }
    };

    // Add both pointer and touch listeners for cross-browser compatibility
    // iOS Safari may not support pointer events properly, so we need touch fallbacks
    window.addEventListener('pointerdown', handlePointerDown as any);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove as any);

    // Touch event fallbacks for iOS/mobile browsers
    window.addEventListener('touchstart', handlePointerDown as any, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove as any, { passive: false });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown as any);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove as any);

      window.removeEventListener('touchstart', handlePointerDown as any);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove as any);
    };
  }, [camera, raycaster, size, onDraggingChange, isPickupMode, isSelectMode, isPushMode, objectApis, config.pickup.damping, setSelectedInstances, onDraggedObjectChange, onCollectItem]);

  useFrame(() => {
    // CRITICAL: Check transition flag FIRST - blocks all physics access during transitions
    if (isTransitioningRef?.current) {
      return;
    }

    // Handle pickup mode dragging
    if (isPickupMode && pickedBodyRef.current && isDragging) {
      const { body, offset, initialY } = pickedBodyRef.current;

      try {
        // Lift the object up when dragging (add vertical offset)
        const DRAG_LIFT_HEIGHT = 0.05; // How high to lift the object

        // Move picked object to follow mouse horizontally, maintain lifted Y position
        body.setNextKinematicTranslation({
          x: pointerPos.current.x - offset.x,
          y: initialY + DRAG_LIFT_HEIGHT, // Use stored initial Y + lift
          z: pointerPos.current.z - offset.z,
        });

        // Show indicator at object position
        if (indicatorRef.current) {
          indicatorRef.current.visible = true;
          const bodyPos = body.translation();
          indicatorRef.current.position.set(bodyPos.x, bodyPos.y, bodyPos.z);
        }
      } catch (error) {
        console.error('[POINTER FORCE FIELD] Error accessing picked body:', error);
        // Release the body if there's an error
        pickedBodyRef.current = null;
        setIsDragging(false);
        onDraggingChange?.(false);
        onDraggedObjectChange?.(null);
      }
      return;
    }

    if (!isDragging) {
      // Hide indicator when not dragging
      if (indicatorRef.current) {
        indicatorRef.current.visible = false;
      }
      return;
    }

    // Update indicator position for push mode (on ground)
    if (indicatorRef.current && isPushMode) {
      indicatorRef.current.visible = true;
      indicatorRef.current.position.copy(pointerPos.current);
      indicatorRef.current.position.y = 0.1;
    }

    // Only apply manual forces in PUSH mode
    if (!isPushMode) return;

    const pos = pointerPos.current;
    const vel = velocity.current;

    // Apply push forces to all objects
    objectApis.forEach((apiRef, apiIndex) => {
      if (!apiRef.current) return;

      // CRITICAL: Check if ref has been cleared (scene switching)
      if (Array.isArray(apiRef.current) && apiRef.current.length === 0) {
        return;
      }

      apiRef.current.forEach((body, bodyIndex) => {
        if (!body) return;

        try {
          const bodyPos = body.translation();
          const distance = Math.sqrt(
            Math.pow(bodyPos.x - pos.x, 2) +
            Math.pow(bodyPos.z - pos.z, 2)
          );

          if (distance < FORCE_RADIUS) {
            // PUSH MODE: Calculate direction away from pointer (radial push)
            const dirX = bodyPos.x - pos.x;
            const dirZ = bodyPos.z - pos.z;
            const dirLength = Math.sqrt(dirX * dirX + dirZ * dirZ) || 0.001;

            // Normalize direction
            const normX = dirX / dirLength;
            const normZ = dirZ / dirLength;

            // Falloff based on distance (closer = stronger)
            const falloff = 1 - (distance / FORCE_RADIUS);

            // Combine radial push with drag direction
            const forceX = (normX * FORCE_STRENGTH + vel.x * 10) * falloff;
            const forceZ = (normZ * FORCE_STRENGTH + vel.z * 10) * falloff;

            // Clamp force
            const forceMag = Math.sqrt(forceX * forceX + forceZ * forceZ);
            const clampedForceX = forceMag > MAX_FORCE ? (forceX / forceMag) * MAX_FORCE : forceX;
            const clampedForceZ = forceMag > MAX_FORCE ? (forceZ / forceMag) * MAX_FORCE : forceZ;

            body.applyImpulse({ x: clampedForceX, y: 0, z: clampedForceZ }, true);
          }
        } catch (error) {
          console.error('[POINTER FORCE FIELD] Error accessing body in push mode:', error, { apiIndex, bodyIndex });
        }
      });
    });
  });

  return (
    <>
      {/* Visual indicator sphere at object/pointer position */}
      <mesh ref={indicatorRef} renderOrder={999}>
        <sphereGeometry args={[isPushMode ? FORCE_RADIUS * 0.5 : 0.1, 16, 16]} />
        <meshBasicMaterial
          color={isPushMode ? "#4caf50" : isPickupMode ? "#ffffff" : "#00bcd4"}
          transparent
          opacity={0.2}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </>
  );
}
