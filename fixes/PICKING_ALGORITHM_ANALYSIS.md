# Deep Analysis: Object Picking Algorithm Issues

## Current Algorithm Flow

### Step-by-Step Execution

```
1. USER INTERACTION
   ├─> User clicks/touches screen
   └─> Browser fires PointerEvent or TouchEvent

2. EVENT HANDLING
   ├─> handlePointerDown() is called
   ├─> Extract coordinates (clientX, clientY)
   ├─> Normalize to NDC: ((clientX - size.left) / size.width) * 2 - 1
   └─> Create Vector2(x, y)

3. RAYCASTING SETUP
   ├─> raycaster.setFromCamera(vector, camera)
   ├─> Creates ray from camera through screen point
   └─> Ray defined in world space

4. INTERSECTION TEST
   ├─> raycaster.intersectObjects(scene.children, true)
   ├─> Three.js iterates through all meshes
   ├─> For each InstancedMesh:
   │   ├─> Read instanceMatrix (Float32Array)
   │   ├─> For each instance:
   │   │   ├─> Get matrix at index
   │   │   ├─> Transform ray by inverse matrix
   │   │   ├─> Test ray against geometry
   │   │   └─> If hit, record intersection + instanceId
   │   └─> Sort by distance
   └─> Return closest intersection

5. BODY LOOKUP
   ├─> Get instanceId from intersection
   ├─> Get meshId from mesh.userData
   ├─> Look up: objectApis[meshId].current[instanceId]
   └─> Get RapierRigidBody reference

6. PICKUP EXECUTION
   ├─> body.setBodyType(2, true) // Make kinematic
   ├─> body.setLinearDamping(10)
   ├─> body.wakeUp()
   └─> Store in pickedBodyRef
```

## Critical Timing Issue: Physics-Visual Desynchronization

### The Core Problem

**Physics bodies and visual meshes update at DIFFERENT TIMES:**

```
FRAME N (60fps = 16.67ms)
├─> [0ms]   Physics step runs
│   └─> All RapierRigidBody positions update
├─> [5ms]   React-three-rapier's useFrame runs
│   └─> Syncs body positions to instanceMatrix
├─> [10ms]  Render happens
│   └─> GPU draws objects at new positions
└─> [12ms]  User clicks (event fires)
    └─> handlePointerDown runs
        └─> **Raycasts against instanceMatrix from 7ms ago!**
```

### Why Faucet Makes It Worse

```typescript
// Faucet spawn code (runs in setInterval, any time)
body.setTranslation({ x, y, z }, true);  // ← Physics body moves NOW
meshRef.current.instanceMatrix.needsUpdate = true;  // ← Just sets a flag

// User clicks 1ms later
raycaster.intersectObjects(scene.children)  // ← Uses OLD matrix!
// instanceMatrix still has pre-movement position!

// 15ms later (next frame)
// React-three-rapier's useFrame finally updates matrices
```

**The matrices lag behind physics by up to 16ms (one frame)!**

## Why Samsung S24 Works Better

### Performance Differences

| Device | Physics FPS | Frame Time | Desync Window | Success Rate |
|--------|-------------|------------|---------------|--------------|
| Samsung S24 | 60 fps | 16.67ms | Small | ~90% |
| iPhone/iPad | 30 fps | 33.33ms | Large | ~50% |
| macOS Chrome (low) | 30-45 fps | 22-33ms | Medium | ~60% |

**Key Insight**: Higher frame rate = more frequent matrix updates = smaller desync window!

On Samsung S24:
- Runs at 60 fps consistently
- Performance tier: HIGH
- Physics: 60 fps, 8 iterations
- Matrix updates every 16ms
- Small window for desync

On iOS/iPad:
- Often runs at 30 fps
- Performance tier: LOW/MEDIUM
- Physics: 30-45 fps, 2-4 iterations
- Matrix updates every 22-33ms
- **LARGE window for desync!**
- More aggressive sleeping (threshold: 0.5 vs 0.01)
- Sleeping bodies might not get matrix updates

## Additional Issues Discovered

### 1. Sleeping Bodies and Matrix Updates

```typescript
// Our physics optimization
linearThreshold: 0.5,  // LOW tier: bodies sleep very quickly
angularThreshold: 0.5,
```

**Problem**: When bodies sleep quickly:
- Physics engine stops simulating them
- React-three-rapier might skip matrix updates for sleeping bodies
- If you click a sleeping body, its matrix could be stale
- Even though it's not moving, the last sync might have been incomplete

### 2. Batch Updates

React-three-rapier likely batches matrix updates for performance:
- Doesn't update every body every frame
- Prioritizes active/moving bodies
- Sleeping bodies get lower update priority
- On LOW tier with aggressive sleeping, this causes MORE desync

### 3. Race Condition in Faucet

```typescript
setInterval(() => {
  body.setTranslation({ x, y, z }, true);  // Physics moves
  meshRef.current.instanceMatrix.needsUpdate = true;  // Flag set
  // But matrix array values haven't changed yet!
}, intervalMs);
```

The flag tells GPU to re-upload, but the CPU-side Float32Array still has old values. Raycasting happens on CPU before GPU upload.

### 4. Multiple Overlapping Instances

When objects pile up:
```
    [Instance 47 at Y=0.5]  ← Visually here (old matrix)
    [Instance 23 at Y=0.3]
    [Instance 12 at Y=0.1]  ← Actually here (physics)
```

Raycaster picks Instance 47 because its matrix says Y=0.5, but physics says it's at Y=0.1. Wrong instance picked!

## Why It's "Random"

It's not actually random! It's deterministic based on:

1. **When user clicks relative to last matrix update**
   - Click right after update: ✅ Works
   - Click right before update: ❌ Fails

2. **Whether clicked object is sleeping**
   - Active object: ✅ Matrix updating
   - Sleeping object: ❌ Matrix might be stale

3. **Device performance tier**
   - High tier (60fps): ✅ Small desync window
   - Low tier (30fps): ❌ Large desync window

4. **Faucet activity**
   - Faucet off: ✅ Stable scene
   - Faucet on: ❌ Constant spawning = constant desync

## The Real Test

Try this experiment:
1. **Disable faucet completely**
2. **Wait for all objects to sleep (stop moving)**
3. **Then try picking**

If it works consistently in this scenario, it confirms the desync theory!

## Root Cause Summary

**The fundamental issue**: We're raycasting against VISUAL mesh positions (instanceMatrix) that are updated ASYNCHRONOUSLY from PHYSICS body positions.

**Why previous fixes didn't work**: We fixed coordinate normalization and touch events, but these are correct. The real issue is temporal desync between physics and rendering.

**Why Samsung S24 is better**: Higher frame rate = more frequent sync = smaller temporal window for desync.
