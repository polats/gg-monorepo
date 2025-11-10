# Dragging/Picking Bug Fixes - iOS/Mobile Reliability

## Problem Statement

The object picking/dragging functionality worked randomly - sometimes it worked, sometimes it didn't on each page refresh. The issue was particularly problematic on:
- ❌ iPad
- ❌ iPhone
- ❌ macOS Chrome
- ✅ Samsung S24 (worked more reliably)

Push mode worked flawlessly, but pickup/drag mode failed intermittently.

## Root Causes Identified

### 1. **Coordinate Normalization Bug** ⚠️
**Location**: `PileDemo.tsx:844-846` (before fix)

**Problem**:
```typescript
// WRONG - doesn't account for canvas position
const x = (e.clientX / size.width) * 2 - 1;
const y = -(e.clientY / size.height) * 2 + 1;
```

**Issue**:
- The code divided by total viewport width/height
- Didn't account for canvas offset position (`size.left`, `size.top`)
- On mobile/iOS, canvases are often not at position (0,0)
- This caused raycasting to aim at the wrong 3D coordinates

**Fix**:
```typescript
// CORRECT - accounts for canvas offset
const x = ((clientX - size.left) / size.width) * 2 - 1;
const y = -((clientY - size.top) / size.height) * 2 + 1;
```

### 2. **iOS Touch Event Support Missing** 🍎
**Location**: `PileDemo.tsx:1014-1024` (after fix)

**Problem**:
- Code only listened for `PointerEvent`
- iOS Safari has poor/inconsistent pointer event support
- Older iOS versions don't support pointer events at all
- Touch events (`TouchEvent`) are more reliable on iOS

**Evidence from Research**:
> "A lot of the demos rely on the super useful onPointerDown etc, however these events don't work in Safari or iOS Safari"
>
> "There is no support in safari / ios safari for pointer events in earlier versions"

**Fix**:
```typescript
// Add BOTH pointer and touch listeners
window.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('touchstart', handlePointerDown, { passive: false });

// Handle both event types
const getPointerCoords = (e: PointerEvent | TouchEvent) => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  } else {
    return { x: (e as PointerEvent).clientX, y: (e as PointerEvent).clientY };
  }
};
```

### 3. **InstancedMesh Raycasting Breaks After Movement** 🔨
**Location**: `PileDemo.tsx:497-501` (after fix)

**Problem**:
- When faucet moved instances to spawn new objects
- The `instanceMatrix` wasn't marked as needing update
- Three.js raycaster uses cached matrix data
- After instance movement, raycasting would fail or pick wrong instances

**Evidence from Research**:
> "When raycasting an InstancedMesh using raycaster.intersectObject(instancedMesh) and moving an instance it doesn't work anymore"
>
> "Raycasting on moving instances of InstancedMesh doesn't work anymore in version 168"

**Fix**:
```typescript
// After moving any instance
body.setTranslation({ x, y, z }, true);

// CRITICAL: Mark matrix as needing update
if (meshRef.current) {
  meshRef.current.instanceMatrix.needsUpdate = true;
}
```

### 4. **Event Propagation Conflicts** 🚫
**Location**: `PileDemo.tsx:873-876` (after fix)

**Problem**:
- No `stopPropagation()` meant events bubbled to parent handlers
- No `preventDefault()` on touch events caused mobile scrolling during drag
- Multiple event handlers could trigger simultaneously

**Fix**:
```typescript
const handlePointerDown = (e: PointerEvent | TouchEvent) => {
  e.stopPropagation(); // Stop event bubbling
  if ('touches' in e) {
    e.preventDefault(); // Prevent mobile scrolling
  }
  // ... rest of handler
};
```

## Implementation Details

### Complete Event Handling Flow

```typescript
// 1. Unified coordinate extraction
const getPointerCoords = (e: PointerEvent | TouchEvent) => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  } else {
    return { x: (e as PointerEvent).clientX, y: (e as PointerEvent).clientY };
  }
};

// 2. Proper coordinate normalization
const normalizeCoords = (clientX: number, clientY: number) => {
  const x = ((clientX - size.left) / size.width) * 2 - 1;
  const y = -((clientY - size.top) / size.height) * 2 + 1;
  return { x, y };
};

// 3. Dual event registration
window.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('touchstart', handlePointerDown, { passive: false });
```

## Testing Recommendations

### Test on Multiple Devices

1. **iOS Devices** (primary concern):
   - iPhone (various iOS versions)
   - iPad (various iOS versions)
   - Test in both Safari and Chrome

2. **Android Devices**:
   - Samsung S24 (was working before, verify still works)
   - Other Android phones

3. **Desktop Browsers**:
   - macOS Chrome (was failing before)
   - macOS Safari
   - Windows Chrome

### Test Scenarios

1. **Basic Pickup**:
   - Click/tap on object
   - Drag to new position
   - Release
   - Verify object follows pointer/finger

2. **Rapid Interactions**:
   - Quick consecutive picks and drops
   - Multi-touch gestures (should be prevented)
   - Fast swiping motions

3. **Edge Cases**:
   - Pick object while faucet is spawning
   - Pick multiple objects in quick succession
   - Scroll page while dragging (should be prevented)

### Success Criteria

- ✅ Dragging works consistently (100% success rate, not random)
- ✅ No "dead zones" where clicks don't register
- ✅ Smooth dragging motion without jitter
- ✅ No accidental page scrolling during drag
- ✅ Works immediately after page load (no warm-up needed)

## Performance Impact

All fixes have **minimal performance impact**:
- Coordinate normalization: 2 extra subtractions per event
- Touch event detection: Simple property check
- instanceMatrix update: Only when faucet spawns (infrequent)
- Event propagation: Native browser behavior

## Related Research Sources

Based on extensive research from:
- Three.js GitHub Issues #29349, #17906, #19161
- Three.js Forum discussions
- React Three Fiber GitHub discussions
- Stack Overflow questions about iOS raycasting
- Reference implementation: singularity project's `CustomDragControls.tsx`

## Key Takeaways

1. **Always account for canvas offset** when normalizing pointer coordinates
2. **iOS requires touch event fallbacks** - don't rely solely on pointer events
3. **InstancedMesh matrices must be updated** after any instance transformation
4. **Event propagation management is critical** for complex interactions

## Files Modified

- `src/client/PileDemo.tsx`:
  - Lines 497-501: Added instanceMatrix update
  - Lines 849-880: Fixed coordinate handling
  - Lines 872-1034: Complete event handler overhaul
  - Lines 809-831: Added documentation

## Future Improvements

1. Consider using `@use-gesture/react` library (like singularity reference)
   - Handles all these edge cases automatically
   - Better mobile gesture support
   - Built-in drag/pinch/zoom handling

2. Add collision groups to reduce physics overhead
   - Prevent background rocks from colliding with each other
   - Further improve performance on low-tier devices

3. Implement GPU-based picking for very large object counts
   - Use GPU picking pass for >10k objects
   - Would improve performance significantly
