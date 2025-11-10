# Final Fix Attempt - The Real Bug

## The Smoking Gun

**Location:** `PointerForceField.tsx` lines 71-91 (now removed)

**The Bug:**

```typescript
useEffect(() => {
  return () => {
    if (pickedBodyRef.current) {
      const { body } = pickedBodyRef.current;
      body.setBodyType(0, true); // ← WRITES TO PHYSICS BODY
      body.setLinearDamping(...);  // ← WRITES TO PHYSICS BODY
      body.setAngularDamping(...); // ← WRITES TO PHYSICS BODY
      pickedBodyRef.current = null;
    }
  };
}, [activeScene]);
```

**Why It Crashed:**

1. User clicks "My Offer"
2. `isTransitioningRef.current = true`
3. React queues `setGardenAction('my-offer')`
4. Next frame: All useFrame loops check ref → blocked ✓
5. React reconciliation starts
6. PointerForceField key changes: `garden-grow` → `garden-my-offer`
7. Old component unmounts
8. **Cleanup effect runs** (NOT blocked by transition ref!)
9. Calls `body.setBodyType(0)` → **WRITES TO BODY**
10. At same time, FallingObjects useFrame tries to read body positions
11. **Rapier detects concurrent access → CRASH!**

## The Fix

**Removed lines 71-91** - the cleanup useEffect that was writing to physics bodies during unmount.

**Why It's Safe:**

- Transition handlers already clear `isDragging` and `draggedInstance` before switching
- When PointerForceField unmounts, `pickedBodyRef` is lost (component state)
- No useFrame loop holds a reference to the picked body anymore
- Body stays kinematic but nobody tries to move it
- No concurrent access = no crash

## useFrame Loop Count

Let me count them properly:

**PileDemo.tsx:**

1. MasterPhysicsLoop - 1 useFrame (drag zone counting)

**PointerForceField.tsx:** 2. Main loop - 1 useFrame (dragging, push forces)

**FallingObjects.tsx (per instance):** 3. Collection animation - 1 useFrame 4. Matrix sync - 1 useFrame

**How many FallingObjects instances?**

- With reduced test config: ~5 object types
- Scrounge mode: 5 instances × 2 loops = 10
- Garden mode: 3 coins + 5 gems = 8 instances × 2 loops = 16

**Total: 1 + 1 + 16 = 18 useFrame loops** (not 22, I miscounted earlier)

All 18 loops now check `isTransitioningRef` and are blocked during transitions.

## Testing

Try the crash sequence:

1. My Garden → Grow mode
2. Drag gem into grow zone
3. Click "My Offer"
4. **Should NOT crash!**

The key difference: No cleanup effect trying to write to physics bodies during unmount.
