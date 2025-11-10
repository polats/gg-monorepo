# Physics Performance Optimizations

## Overview
Based on research from the official Rapier physics engine documentation, we've implemented comprehensive performance optimizations that adapt to device capabilities.

## Key Optimizations Applied

### 1. **Adaptive Physics Timestep**
```typescript
timeStep: {
  low: 1/30    // 50% fewer physics calculations
  medium: 1/45 // 33% fewer physics calculations
  high: 1/60   // Full accuracy
}
```
**Impact**: Low-tier devices perform half as many physics calculations per second.

### 2. **Solver Iteration Reduction**
```typescript
maxVelocityIterations: {
  low: 2     // 75% reduction (default: 8)
  medium: 4  // 50% reduction
  high: 8    // Full accuracy
}

maxStabilizationIterations: {
  low: 1     // 75% reduction (default: 4)
  medium: 2  // 50% reduction
  high: 4    // Full accuracy
}
```
**Impact**: Low-tier devices perform 4x fewer solver iterations, significantly reducing CPU load.

### 3. **Interpolation Control**
```typescript
interpolation: {
  low: false    // Disabled - saves computation
  medium: true  // Enabled - smooth motion
  high: true    // Enabled - smooth motion
}
```
**Impact**: Low-tier devices skip interpolation calculations, reducing overhead.

### 4. **Aggressive Sleeping Thresholds**
```typescript
linearThreshold: {
  low: 0.5     // Bodies sleep 50x faster (default: 0.01)
  medium: 0.1  // Bodies sleep 10x faster
  high: 0.01   // Default behavior
}

angularThreshold: {
  low: 0.5     // Bodies sleep 50x faster (default: 0.01)
  medium: 0.1  // Bodies sleep 10x faster
  high: 0.01   // Default behavior
}
```
**Impact**: Low-tier devices put static objects to sleep much faster, removing them from physics calculations entirely.

### 5. **Object Count Scaling** (existing)
```typescript
Object counts: {
  low: 25% of base count
  medium: 50% of base count
  high: 100% of base count
}
```
**Impact**: Low-tier devices simulate 4x fewer objects.

## Combined Performance Gain

For a low-tier device compared to high-tier:
- **50%** fewer timesteps (30fps vs 60fps)
- **75%** fewer objects (25% vs 100%)
- **75%** fewer solver iterations (2 vs 8)
- **50x** faster sleeping (0.5 vs 0.01 threshold)
- **No interpolation overhead**

**Total estimated reduction**: **10-20x fewer physics calculations**

## Research Sources

Based on official Rapier documentation:
- https://rapier.rs/docs/user_guides/javascript/integration_parameters/
- https://pmndrs.github.io/react-three-rapier/
- Common optimization patterns from Rapier best practices

## Performance Monitoring

The device info display now shows:
- Performance tier (LOW/MEDIUM/HIGH)
- GPU tier
- CPU cores
- RAM
- **Physics FPS** (30/45/60)

This gives users immediate feedback about what optimizations are being applied.

## Future Optimization Opportunities

1. **Collision Groups**: Prevent background rocks from colliding with each other
2. **Contact Skin**: Increase contact skin for better performance
3. **Spatial Partitioning**: Further optimize broad-phase collision detection
4. **CCD Tuning**: Adjust Continuous Collision Detection for fast-moving objects only
