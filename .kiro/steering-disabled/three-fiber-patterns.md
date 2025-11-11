---
inclusion: fileMatch
fileMatchPattern: 'src/client/**/*.tsx'
---

# React Three Fiber Patterns & Best Practices

This guide covers patterns specific to React Three Fiber (R3F) and Rapier physics used in Goblin Gardens.

## React Three Fiber Basics

### Component Structure

```tsx
// ✅ Good: Declarative 3D scene
<Canvas>
  <Physics>
    <ambientLight intensity={0.5} />
    <RigidBody type="dynamic">
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </RigidBody>
  </Physics>
</Canvas>

// ❌ Bad: Imperative Three.js code in React
useEffect(() => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 'hotpink' });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return () => scene.remove(mesh);
}, []);
```

### useFrame Hook

```tsx
// ✅ Good: Animation loop with cleanup
function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });
  
  return <mesh ref={meshRef}>...</mesh>;
}

// ❌ Bad: Creating objects in useFrame
useFrame(() => {
  // This creates a new object every frame!
  const newMesh = new THREE.Mesh(...);
});
```

### Refs and Imperative Access

```tsx
// ✅ Good: Use refs for imperative access
const meshRef = useRef<THREE.Mesh>(null);
const rigidBodyRef = useRef<RapierRigidBody>(null);

useEffect(() => {
  if (rigidBodyRef.current) {
    rigidBodyRef.current.applyImpulse({ x: 0, y: 10, z: 0 }, true);
  }
}, []);

// ❌ Bad: Trying to access Three.js objects directly
const mesh = scene.getObjectByName('myMesh'); // Don't do this in R3F
```

## Rapier Physics Integration

### RigidBody Types

```tsx
// Dynamic: Affected by forces and gravity
<RigidBody type="dynamic">
  <mesh>...</mesh>
</RigidBody>

// Fixed: Never moves (floor, walls)
<RigidBody type="fixed">
  <mesh>...</mesh>
</RigidBody>

// Kinematic: Controlled by code, not physics
<RigidBody type="kinematicPosition">
  <mesh>...</mesh>
</RigidBody>
```

### Instanced Rigid Bodies

```tsx
// ✅ Good: Hundreds of objects efficiently
const instances = useMemo(() => 
  Array.from({ length: 500 }, (_, i) => ({
    key: `instance-${i}`,
    position: [Math.random() * 10, i * 0.5, Math.random() * 10],
    rotation: [0, 0, 0],
  }))
, []);

<InstancedRigidBodies instances={instances}>
  <instancedMesh args={[null, null, 500]}>
    <sphereGeometry args={[0.1]} />
    <meshStandardMaterial color="gold" />
  </instancedMesh>
</InstancedRigidBodies>

// ❌ Bad: Individual RigidBody for each object
{Array.from({ length: 500 }).map((_, i) => (
  <RigidBody key={i}>
    <mesh>...</mesh>
  </RigidBody>
))}
```

### Accessing Physics Bodies

```tsx
// ✅ Good: Store refs in array
const apiRefs = useRef<RapierRigidBody[]>([]);

<InstancedRigidBodies
  instances={instances}
  ref={(refs) => { apiRefs.current = refs || []; }}
>
  ...
</InstancedRigidBodies>

// Access in useFrame
useFrame(() => {
  apiRefs.current.forEach((body, i) => {
    if (body) {
      const pos = body.translation();
      // Do something with position
    }
  });
});
```

## Performance Optimization

### Instanced Rendering

```tsx
// ✅ Good: Single draw call for many objects
<instancedMesh ref={meshRef} args={[null, null, count]}>
  <sphereGeometry args={[0.1]} />
  <meshStandardMaterial />
</instancedMesh>

// Update matrices manually for performance
useFrame(() => {
  for (let i = 0; i < count; i++) {
    matrix.setPosition(positions[i]);
    meshRef.current.setMatrixAt(i, matrix);
  }
  meshRef.current.instanceMatrix.needsUpdate = true;
});
```

### Sleeping Bodies Optimization

```tsx
// ✅ Good: Skip updates for sleeping bodies
useFrame(() => {
  apiRefs.current.forEach((body, i) => {
    if (body.isSleeping()) return; // Skip sleeping bodies
    
    const pos = body.translation();
    // Update visual representation
  });
});
```

### Throttled Updates

```tsx
// ✅ Good: Update expensive calculations less frequently
const frameCount = useRef(0);

useFrame(() => {
  frameCount.current++;
  
  // Only update every 10 frames
  if (frameCount.current % 10 === 0) {
    // Expensive calculation here
  }
});
```

### useMemo for Expensive Calculations

```tsx
// ✅ Good: Memoize geometry and materials
const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red' }), []);

// ❌ Bad: Creating new objects every render
return (
  <mesh>
    <sphereGeometry args={[1, 32, 32]} /> {/* New geometry every render! */}
    <meshStandardMaterial color="red" /> {/* New material every render! */}
  </mesh>
);
```

## Mobile Optimization

### Touch Controls

```tsx
// ✅ Good: Separate touch and mouse handlers
const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
  if (e.pointerType === 'touch') {
    // Touch-specific logic
  } else {
    // Mouse-specific logic
  }
};

<mesh onPointerDown={handlePointerDown}>...</mesh>
```

### Responsive Canvas

```tsx
// ✅ Good: Adjust quality based on device
const dpr = Math.min(window.devicePixelRatio, 2); // Cap at 2x

<Canvas dpr={dpr} shadows>
  ...
</Canvas>
```

### Performance Tiers

```tsx
// ✅ Good: Detect device and adjust physics
const [tier, setTier] = useState<'low' | 'medium' | 'high'>('medium');

useEffect(() => {
  detectPerformance().then(info => setTier(info.tier));
}, []);

<Physics
  timeStep={tier === 'low' ? 1/30 : tier === 'medium' ? 1/45 : 1/60}
  maxVelocityIterations={tier === 'low' ? 2 : tier === 'medium' ? 4 : 8}
>
  ...
</Physics>
```

## Common Pitfalls

### 1. Accessing Physics During Transitions

```tsx
// ❌ Bad: Can crash if bodies are being destroyed
useFrame(() => {
  const pos = rigidBodyRef.current.translation(); // Might be null!
});

// ✅ Good: Check for null and transition state
const isTransitioning = useRef(false);

useFrame(() => {
  if (isTransitioning.current) return;
  if (!rigidBodyRef.current) return;
  
  const pos = rigidBodyRef.current.translation();
});
```

### 2. Memory Leaks

```tsx
// ❌ Bad: Not cleaning up geometries/materials
useEffect(() => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  // No cleanup!
}, []);

// ✅ Good: Dispose in cleanup
useEffect(() => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```

### 3. Too Many Lights

```tsx
// ❌ Bad: Many point lights hurt mobile performance
{items.map((item, i) => (
  <pointLight key={i} position={item.position} />
))}

// ✅ Good: Use fewer lights, bake lighting, or use hemisphere light
<ambientLight intensity={0.5} />
<hemisphereLight color="#87CEEB" groundColor="#D2B48C" intensity={0.6} />
<directionalLight position={[10, 10, 10]} castShadow />
```

### 4. Complex Colliders

```tsx
// ❌ Bad: Mesh colliders are expensive
<RigidBody colliders="trimesh">
  <mesh geometry={complexGeometry} />
</RigidBody>

// ✅ Good: Use simple primitive colliders
<RigidBody colliders="cuboid">
  <mesh geometry={complexGeometry} />
</RigidBody>

// Or specify manually
<RigidBody>
  <CuboidCollider args={[0.5, 0.5, 0.5]} />
  <mesh geometry={complexGeometry} />
</RigidBody>
```

## Debugging

### Stats and Performance Monitoring

```tsx
import { Stats } from '@react-three/drei';
import { Perf } from 'r3f-perf';

<Canvas>
  <Stats /> {/* FPS counter */}
  <Perf position="top-left" /> {/* Detailed performance */}
  ...
</Canvas>
```

### Debug Physics

```tsx
<Physics debug> {/* Shows collider wireframes */}
  ...
</Physics>
```

### Leva Controls

```tsx
import { useControls } from 'leva';

function MyComponent() {
  const { gravity, damping } = useControls({
    gravity: { value: -9.81, min: -20, max: 0 },
    damping: { value: 0.5, min: 0, max: 1 },
  });
  
  return <Physics gravity={[0, gravity, 0]}>...</Physics>;
}
```

## Goblin Gardens Specific Patterns

### Master Physics Loop

```tsx
// Consolidate all physics access into one useFrame loop
// Prevents concurrent access crashes during transitions
function MasterPhysicsLoop({ apiRefs, isTransitioning }) {
  useFrame(() => {
    if (isTransitioning.current) return; // CRITICAL: Check first
    
    // Phase 1: Matrix sync
    // Phase 2: Collection animation
    // Phase 3: Drag zone counting
  });
  
  return null;
}
```

### Spawn Position Management

```tsx
// Centralize spawn positions in one file
// Keep faucet positions and spawn positions in sync
export const COIN_SPAWN_X = 0.9;
export const COIN_SPAWN_Z = -0.85;
export const COIN_FAUCET_X = 0.9; // Must match!
export const COIN_FAUCET_Z = -0.85; // Must match!
```

### Value Calculation Sync

```tsx
// CRITICAL: Client and server must match exactly
// src/client/utils/gemValue.ts
export function calculateGemValue(gem: Gem): number {
  const baseValue = GEM_TYPE_VALUES[gem.type];
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape];
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity];
  const levelBonus = 1 + (gem.level * 0.1);
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / 100;
  return Math.floor(baseValue * shapeMultiplier * rarityMultiplier * levelBonus * sizeMultiplier);
}

// src/server/index.ts - MUST BE IDENTICAL
```

## Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Rapier Physics Docs](https://rapier.rs/docs/)
- [Three.js Docs](https://threejs.org/docs/)
- [R3F Examples](https://docs.pmnd.rs/react-three-fiber/getting-started/examples)
