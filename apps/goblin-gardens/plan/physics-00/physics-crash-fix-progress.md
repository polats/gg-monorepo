# Physics Crash Fix - Progress Documentation

## Problem Statement

**Error:** `Uncaught Error: recursive use of an object detected which would lead to unsafe aliasing in rust`

**Trigger:** Switching from Grow mode to My Offer mode after dragging a gem into the drag zone

**Root Cause:** Multiple independent useFrame loops accessing the same Rapier physics bodies concurrently

---

## Architecture Analysis

### Current System (Distributed Physics Access)

**Independent useFrame Loops (~22 total):**

1. **DragZoneCounter** (1 loop)
   - Location: `PileDemo.tsx:138-183`
   - Purpose: Reads `body.translation()` on ALL garden bodies every frame
   - Checks which objects are in drag zone
   - **Status:** Now integrated into MasterPhysicsLoop

2. **PointerForceField** (1 loop)
   - Location: `PointerForceField.tsx:352-454`
   - Purpose: Moves picked/dragged body using `setNextKinematicTranslation()`
   - Changes body type (kinematic ↔ dynamic)
   - Applies forces in push mode
   - **Status:** STILL RUNNING WITH OWN useFrame

3. **FallingObjects** (2 loops × ~10 instances = 20 loops)
   - Location: `FallingObjects.tsx:347-417` (collection animation)
   - Location: `FallingObjects.tsx:423-503` (matrix sync)
   - Purpose: Reads positions, moves bodies kinematically, syncs visual matrices
   - **Status:** STILL RUNNING WITH OWN useFrame

### The Timing Problem

```
User clicks "My Offer"
    ↓
handleOfferClick() executes:
    ↓
isTransitioningRef.current = true  [SYNCHRONOUS]
    ↓
React queues state updates        [ASYNC - batched]
    ↓
Next frame renders (60fps = ~16ms later):
    ↓
┌─────────────────────────────────────────────────────────────┐
│ ALL useFrame loops run in SAME frame:                      │
│                                                             │
│ 1. MasterPhysicsLoop checks ref → BLOCKED ✓                │
│ 2. PointerForceField → STILL RUNNING → writes to body ✗    │
│ 3. FallingObjects (×10) → STILL RUNNING → reads bodies ✗   │
│                                                             │
│ Result: Concurrent access detected by Rapier → CRASH       │
└─────────────────────────────────────────────────────────────┘
    ↓
9 frames later (~150ms):
    ↓
React reconciliation completes
    ↓
Components remount with new keys
    ↓
isTransitioningRef.current = false
```

---

## Attempted Solutions

### Attempt 1: Component Keys for Remounting
**Date:** Initial attempts
**Changes:**
- Added `key={`garden-${gardenAction}`}` to PointerForceField
- Added `key={`drag-zone-${gardenAction}`}` to DragZoneCounter

**Result:** ❌ FAILED
**Why:** React unmounting is async. useFrame loops continue running for several frames before unmount completes.

---

### Attempt 2: isActive Flags
**Date:** Initial attempts
**Changes:**
- Added `scroungeObjectsActive` and `gardenObjectsActive` state
- Passed to FallingObjects as `isActive` prop
- Checked in useFrame loops

**Result:** ❌ FAILED
**Why:** React state updates are async. Flag doesn't change until next render, but frames continue immediately.

---

### Attempt 3: Scene Guards
**Date:** Initial attempts
**Changes:**
- Added `activeScene` prop to components
- Checked `if (activeScene !== 'garden') return;` in useFrame

**Result:** ❌ FAILED (for garden action transitions)
**Why:** Both Grow and My Offer are in 'garden' scene. Scene check doesn't help for grow↔offer transitions.

---

### Attempt 4: Master Physics Loop (Partial)
**Date:** Current attempt
**Changes:**
- Created `MasterPhysicsLoop` component with single useFrame
- Added `isTransitioningRef` - synchronous blocker ref
- Set ref to true BEFORE state changes in handlers
- Moved drag zone counting logic into master loop
- Added 150ms timeout to clear ref after transition

**Files Modified:**
- `PileDemo.tsx:255-312` - MasterPhysicsLoop component
- `PileDemo.tsx:589` - isTransitioningRef declaration
- `PileDemo.tsx:1073-1121` - Updated handleGrowClick/handleOfferClick
- `PileDemo.tsx:3596` - Replaced DragZoneCounter with MasterPhysicsLoop

**Result:** ❌ STILL CRASHING
**Why:** Only moved ONE of the 22 useFrame loops to master loop. The other 21 loops are still running:
- PointerForceField's useFrame (moving kinematic body)
- FallingObjects' useFrame loops (×2 per instance, ×10 instances = 20 loops)

---

## Current Problem Analysis

### What's Happening During Crash

```
Frame N (transition triggered):
├─ MasterPhysicsLoop.useFrame()
│  └─ Checks isTransitioningRef → TRUE → returns early ✓
│
├─ PointerForceField.useFrame()
│  ├─ Has picked body in pickedBodyRef
│  ├─ Calls body.setNextKinematicTranslation() → WRITES ✗
│  └─ Rapier marks body as "in use"
│
└─ FallingObjects[0].useFrame() (matrix sync)
   ├─ Iterates all bodies
   ├─ Calls body.translation() → READS ✗
   └─ Rapier detects concurrent access → CRASH!
```

### The Core Issue

**Rapier's safety guarantee:** Only ONE reference to a body can exist at a time (Rust's borrow checker rules).

**Current reality:** Multiple components hold references and access bodies in the SAME frame:
- PointerForceField: `pickedBodyRef.current.body.setNextKinematicTranslation()`
- FallingObjects: `api.current[i].translation()`
- MasterPhysicsLoop: `body.translation()` (now blocked, but others aren't)

---

## Solution Options

### Option A: Quick Fix - Add Transition Check to All Loops
**Effort:** Low (30 minutes)
**Risk:** Low
**Approach:**
1. Pass `isTransitioningRef` to PointerForceField
2. Pass `isTransitioningRef` to FallingObjects
3. Add check at start of each useFrame loop
4. All loops blocked synchronously during transition

**Pros:**
- Minimal code changes
- Can test quickly
- Preserves current architecture

**Cons:**
- Doesn't address root cause (multiple loops)
- Still have 22 useFrame loops
- Future bugs possible if we forget to add check

---

### Option B: Complete Master Loop Refactor
**Effort:** High (4-6 hours)
**Risk:** Medium
**Approach:**
1. Move ALL physics access to MasterPhysicsLoop
2. Phase 1: Dragged body movement (from PointerForceField)
3. Phase 2: Drag zone counting (✓ DONE)
4. Phase 3: Matrix sync (from FallingObjects)
5. Phase 4: Collection animations (from FallingObjects)
6. Remove all useFrame loops from child components

**Pros:**
- ✅ Solves root cause permanently
- ✅ Single source of truth for physics
- ✅ Easier to debug and maintain
- ✅ Guaranteed no concurrent access
- ✅ Better performance (no redundant iterations)

**Cons:**
- ❌ Large refactor
- ❌ More testing required
- ❌ Temporary complexity during migration

---

## Recommendation

### Immediate: Option A (Quick Fix)
Add transition blocker to remaining loops to stop the crash NOW.

### Long-term: Option B (Refactor)
Continue master loop refactor in phases:
1. ✓ Phase 2: Drag zone counting (DONE)
2. Phase 1: Dragged body movement
3. Phase 3: Matrix sync
4. Phase 4: Collection animations

---

## Next Steps

### Step 1: Quick Fix Implementation
1. Add `isTransitioningRef` prop to PointerForceField
2. Check ref at start of PointerForceField's useFrame
3. Add `isTransitioningRef` prop to FallingObjects
4. Check ref at start of both FallingObjects useFrame loops
5. Test transitions work without crashes

**Estimated time:** 30 minutes
**Success criteria:** No crash when switching Grow → My Offer after dragging gem

### Step 2: Continue Refactor (After Quick Fix Works)
1. Move dragged body movement to MasterPhysicsLoop (Phase 1)
2. Remove useFrame from PointerForceField
3. Test dragging still works
4. Move matrix sync to MasterPhysicsLoop (Phase 3)
5. Move collection animations to MasterPhysicsLoop (Phase 4)
6. Remove all useFrame loops from FallingObjects

**Estimated time:** 4 hours
**Success criteria:** All physics access in single loop, no component useFrame loops

---

## Lessons Learned

1. **React lifecycle ≠ useFrame timing**
   - State updates are async
   - useFrame runs synchronously at 60fps
   - Can't rely on state to coordinate between loops

2. **Refs are the answer for frame-level coordination**
   - `useRef` changes are synchronous
   - All useFrame loops can check the same ref
   - Provides immediate blocking mechanism

3. **Rapier's safety is non-negotiable**
   - Can't have multiple references to same body
   - Rust's borrow checker rules enforced at runtime
   - Must serialize all physics access

4. **Incremental migration is key**
   - Can't refactor all 22 loops at once
   - Add master loop alongside existing loops
   - Migrate one phase at a time
   - Remove old loops after testing

---

## Code Inventory

### Components with useFrame Loops

1. **PileDemo.tsx**
   - Line 138-183: DragZoneCounter → ✓ MIGRATED to MasterPhysicsLoop
   - Line 255-312: MasterPhysicsLoop → ✓ NEW MASTER LOOP

2. **PointerForceField.tsx**
   - Line 352-454: Main loop (dragging, push forces) → ❌ NEEDS MIGRATION

3. **FallingObjects.tsx**
   - Line 347-417: Collection animation → ❌ NEEDS MIGRATION
   - Line 423-503: Matrix sync → ❌ NEEDS MIGRATION
   - ×10 instances = 20 total loops

### Modified Files (Attempt 4)

- `PileDemo.tsx` (4 locations)
- `PointerForceField.tsx` (needs modification)
- `FallingObjects.tsx` (needs modification)

---

## Testing Checklist

### Quick Fix Tests
- [ ] Grow → My Offer (no drag) - should work
- [ ] Grow → My Offer (after drag) - should NOT crash
- [ ] My Offer → Grow - should work
- [ ] Rapid clicking between modes - should not crash
- [ ] Dragging during transition - should release cleanly

### Full Refactor Tests
- [ ] All above tests pass
- [ ] Dragging works in both modes
- [ ] Drag zone counting accurate
- [ ] Collection animations work
- [ ] Matrix sync keeps visuals smooth
- [ ] No performance regression
- [ ] Console has no useFrame errors

---

## Status

**Current:** Partial implementation (1 of 22 loops migrated)
**Crash:** Still occurring
**Next:** Implement Quick Fix (Option A)
**ETA:** 30 minutes to working state
