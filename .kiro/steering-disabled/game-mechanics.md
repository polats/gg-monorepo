# Game Mechanics: Goblin Gardens

## Core Systems

### Gem System

#### Gem Properties
Every gem has these properties that determine its value:

1. **Type** (Base Value)
   - Emerald: 10 bronze (lowest)
   - Sapphire: 25 bronze
   - Amethyst: 50 bronze
   - Ruby: 100 bronze
   - Diamond: 200 bronze (highest)

2. **Shape** (Complexity Multiplier)
   - Tetrahedron: 1.0× (4 faces, basic)
   - Octahedron: 1.5× (8 faces, medium)
   - Dodecahedron: 2.0× (12 faces, complex)

3. **Rarity** (Value Multiplier)
   - Common: 1.0×
   - Uncommon: 1.5×
   - Rare: 2.0×
   - Epic: 3.0×
   - Legendary: 5.0×

4. **Level** (Growth Bonus)
   - Each level adds +10% value
   - Formula: `1 + (level × 0.1)`
   - Gems level up by spending time in the grow zone

5. **Size** (Physical Dimension)
   - Measured in millimeters (mm)
   - Stored as decimal (e.g., 0.063 = 63mm)
   - Size multiplier: `(size × 1000) / 100`
   - Typical range: 50-75mm
   - Grows over time when in grow zone

#### Value Calculation Formula

```typescript
value = baseValue × shapeMultiplier × rarityMultiplier × (1 + level × 0.1) × (sizeInMm / 100)
```

**CRITICAL**: This calculation exists in TWO places and MUST match exactly:
- `src/client/utils/gemValue.ts::calculateGemValue()`
- `src/server/index.ts::calculateGemValue()`

Any mismatch creates trading exploits where players can buy gems cheaper than they're worth.

#### Gem Generation
- Gems spawn with random rarity (weighted probabilities)
- Initial size: 50-75mm
- Initial level: 1
- Growth rate: Random 0.5-2.0 (affects leveling speed)
- Unique ID: Generated on creation

### Growth System

#### How Growth Works
1. Player drags gems into the "grow zone" (marked area in garden)
2. Gems in grow zone have `isGrowing: true`
3. Every second, growing gems:
   - Gain experience based on their `growthRate`
   - Level up when experience reaches threshold
   - Increase in size (visual and value)
4. Maximum size: 200mm (0.2 in stored value)

#### Growth Tick Logic
```typescript
// Runs every 1 second
gem.experience += gem.growthRate;
if (gem.experience >= 100) {
  gem.level++;
  gem.experience = 0;
  gem.size = Math.min(gem.size + 0.01, 0.2); // +10mm, max 200mm
}
```

#### Growth Zone Detection
- Zone position: `x: -0.39, z: 0.4, rotation: 5.5 rad`
- Zone dimensions: `1.5 × 0.75` (width × depth)
- Only counts objects above floor (`y > -0.5`)
- Checked every frame in `MasterPhysicsLoop`

### Trading System

#### Creating an Offer
1. Player selects gems to sell (must have `isOffering: true`)
2. Client calculates total value
3. Server applies 2× multiplier (selling price)
4. Offer stored in Redis with timestamp
5. Offer indexed in sorted set for pagination

#### Marketplace
- Shows all active offers from other players
- Sorted by timestamp (newest first)
- Paginated (10 offers per page)
- Displays: username, level, item count, gems, total price

#### Executing a Trade
**ATOMIC TRANSACTION** - All steps must succeed or none:

1. Validate buyer ≠ seller
2. Validate offer still exists
3. Validate seller still has all gems
4. Validate buyer has enough coins
5. Remove gems from seller's inventory
6. Add coins to seller (bronze total)
7. Remove coins from buyer (bronze total)
8. Add gems to buyer (mark as not offering)
9. Save both player states
10. Remove seller's offer from marketplace

If any step fails, entire transaction fails.

### Economy System

#### Coin Types
- **Bronze**: Base currency (1 bronze = 1 value)
- **Silver**: 100 bronze = 1 silver
- **Gold**: 10,000 bronze = 1 gold

#### Coin Conversion
```typescript
// Bronze to coins
gold = floor(bronze / 10000)
silver = floor((bronze % 10000) / 100)
bronze = bronze % 100

// Coins to bronze
bronze = (gold × 10000) + (silver × 100) + bronze
```

#### Earning Coins
- Scrounge mode: Collect falling coins
- Trading: Sell gems for 2× their value
- Different locations yield different coin types

#### Spending Coins
- Scrounge locations have entry costs
- Trading: Buy gems from other players

### Scrounge System

#### Locations
1. **Rockfall** (Free)
   - Bronze, silver coins
   - Emerald (tetrahedron, octahedron)
   - Sapphire (tetrahedron)

2. **Bright Warrens** (50 bronze + 10 silver)
   - Silver coins (main yield)
   - Emerald (dodecahedron)
   - Sapphire (octahedron)
   - Ruby (tetrahedron)

3. **Crystal Caves** (50 silver + 10 gold)
   - Gold coins (main yield)
   - Sapphire (dodecahedron)
   - Ruby (dodecahedron)
   - Diamond (octahedron)

4. **Fire Fields** (Coming Soon)
   - Ruby-focused location

#### Collection Mechanics
- Objects fall from faucets with physics
- Player drags objects into collection zone
- Objects animate (grow + shrink) and disappear
- Added to player inventory
- Auto-saved to Redis

### Physics System

#### Performance Tiers
Automatically detected based on device GPU:

**Low Tier** (Mobile, integrated GPU):
- Physics: 30 fps timestep
- Velocity iterations: 2
- Stabilization iterations: 1
- No interpolation
- Fast sleeping (0.5 threshold)

**Medium Tier** (Mid-range GPU):
- Physics: 45 fps timestep
- Velocity iterations: 4
- Stabilization iterations: 2
- Interpolation enabled
- Normal sleeping (0.1 threshold)

**High Tier** (Dedicated GPU):
- Physics: 60 fps timestep
- Velocity iterations: 8
- Stabilization iterations: 4
- Interpolation enabled
- Precise sleeping (default)

**Visual quality is ALWAYS high** (shadows, lighting, full object counts).

#### Instanced Rendering
- Single mesh for all objects of same type
- Hundreds of objects in one draw call
- Manual matrix synchronization
- Sleeping bodies skip updates

#### Drag Controls
- Mouse: Click and drag objects
- Touch: Tap and drag (mobile-friendly)
- Physics-based: Objects maintain momentum
- Kinematic mode during drag

### Player State Persistence

#### What's Saved
```typescript
{
  coins: { gold, silver, bronze },
  gems: [
    {
      id, type, rarity, shape, color,
      growthRate, level, experience,
      dateAcquired, size,
      isGrowing, isOffering
    }
  ]
}
```

#### When State is Saved
- After collecting objects in scrounge mode
- After growing gems (periodic auto-save)
- After trading
- Before creating an offer
- Manual save button in garden

#### Redis Keys
- Player state: `playerState:{username}`
- Active offer: `activeOffer:{username}`
- Offer index: `activeOffersIndex` (sorted set)

### UI/UX Patterns

#### Mobile-First Design
- Large touch targets (44×44px minimum)
- Scroll detection (distinguish tap from scroll)
- Touch-friendly buttons with proper event handling
- Responsive layout for small screens

#### Toast Notifications
- Collection: "Collected X items worth Y coins"
- Trading: "Bought X gems for Y coins"
- Errors: "Not enough coins", "Trade failed"
- Auto-dismiss after 3 seconds

#### Visual Feedback
- Gems in grow zone: Highlighted outline
- Dragging: Object follows cursor/touch
- Collection: Grow + shrink animation
- Level up: Size increase visible

## Common Pitfalls

### Value Calculation Sync
❌ **DON'T**: Modify gem value formula in only one place
✅ **DO**: Update both client and server simultaneously

### Physics Access During Transitions
❌ **DON'T**: Access physics bodies during scene switches
✅ **DO**: Check `isTransitioningRef.current` before accessing

### Trading Race Conditions
❌ **DON'T**: Allow concurrent trades on same offer
✅ **DO**: Use atomic transactions, remove offer immediately

### Mobile Touch Events
❌ **DON'T**: Use only `onClick` handlers
✅ **DO**: Implement both touch and click with scroll detection

### Performance on Low-End Devices
❌ **DON'T**: Spawn unlimited objects
✅ **DO**: Use performance tier to limit object counts

## Testing Checklist

When implementing new features:

- [ ] Test on mobile (touch controls)
- [ ] Test on low-end device (performance)
- [ ] Verify value calculations match server
- [ ] Check Redis persistence
- [ ] Test with multiple users (trading)
- [ ] Verify no physics crashes during transitions
- [ ] Check for memory leaks (long sessions)
- [ ] Test with slow network (loading states)
