# Gem Value System ✅

## Summary

Implemented a comprehensive gem value calculation system with tiered gem types, shapes, rarities, levels, and sizes. Added a value display button in the "My Offer" mode that shows the total value of all offered gems.

---

## Value Calculation Formula

```
Total Value = Base Value × Shape Multiplier × Rarity Multiplier × Level Bonus × Size
```

Where:

- **Base Value**: Determined by gem type tier
- **Shape Multiplier**: Determined by geometric complexity
- **Rarity Multiplier**: Determined by gem rarity
- **Level Bonus**: `1 + (level × 0.1)` - increases 10% per level
- **Size**: Direct 1:1 multiplier with gem size

Final value is **rounded down** to a whole number.

---

## Gem Type Tiers (Base Values)

From **lowest to highest**:

| Tier | Gem Type | Base Value | Description              |
| ---- | -------- | ---------- | ------------------------ |
| 1    | Emerald  | 10         | Lowest tier, green gems  |
| 2    | Sapphire | 25         | Low-mid tier, blue gems  |
| 3    | Amethyst | 50         | Mid tier, purple gems    |
| 4    | Ruby     | 100        | High tier, red gems      |
| 5    | Diamond  | 200        | Highest tier, clear gems |

### Rationale

- **2.5× progression** between most tiers
- **2× jump** from emerald → sapphire
- **2× jump** from ruby → diamond
- Creates meaningful value differences

---

## Shape Tiers (Multipliers)

From **lowest to highest**:

| Tier | Shape        | Multiplier | Faces | Description         |
| ---- | ------------ | ---------- | ----- | ------------------- |
| 1    | Tetrahedron  | 1.0×       | 4     | Basic pyramid shape |
| 2    | Octahedron   | 1.5×       | 8     | Medium complexity   |
| 3    | Dodecahedron | 2.0×       | 12    | Highest complexity  |

### Rationale

- **Geometric complexity** = higher value
- More faces = more valuable
- Dodecahedron is **2× more valuable** than tetrahedron
- Gives players incentive to seek complex shapes

---

## Rarity Multipliers

From **lowest to highest**:

| Tier | Rarity    | Multiplier | Description  |
| ---- | --------- | ---------- | ------------ |
| 1    | Common    | 1.0×       | Base rarity  |
| 2    | Uncommon  | 1.5×       | 50% increase |
| 3    | Rare      | 2.0×       | 2× value     |
| 4    | Epic      | 3.0×       | 3× value     |
| 5    | Legendary | 5.0×       | 5× value     |

### Rationale

- **Exponential scaling** for higher rarities
- Legendary gems are **5× more valuable** than common
- Creates strong incentive to find rare gems

---

## Level Bonus

**Formula**: `1 + (level × 0.1)`

| Level | Bonus Multiplier | Increase   |
| ----- | ---------------- | ---------- |
| 1     | 1.1×             | +10%       |
| 2     | 1.2×             | +20%       |
| 3     | 1.3×             | +30%       |
| 5     | 1.5×             | +50%       |
| 10    | 2.0×             | +100% (2×) |

### Rationale

- **Linear scaling** - 10% per level
- Rewards players for growing gems
- Level 10 gem is **twice as valuable** as level 1
- Encourages long-term investment in gem growth

---

## Size Multiplier

**Direct 1:1 scaling**

- Size 0.5 → 0.5× value
- Size 1.0 → 1.0× value (default)
- Size 1.5 → 1.5× value
- Size 2.0 → 2.0× value

### Rationale

- **Simple linear scaling**
- Bigger gems = more valuable
- Visual size matches value increase

---

## Value Examples

### Example 1: Basic Common Emerald

```
Gem: Common Emerald Tetrahedron
- Level: 1
- Size: 1.0

Calculation:
10 (emerald) × 1.0 (tetra) × 1.0 (common) × 1.1 (level 1) × 1.0 (size)
= 11 value
```

### Example 2: Rare Ruby Dodecahedron

```
Gem: Rare Ruby Dodecahedron
- Level: 5
- Size: 1.5

Calculation:
100 (ruby) × 2.0 (dodeca) × 2.0 (rare) × 1.5 (level 5) × 1.5 (size)
= 900 value
```

### Example 3: Legendary Diamond Dodecahedron

```
Gem: Legendary Diamond Dodecahedron
- Level: 10
- Size: 2.0

Calculation:
200 (diamond) × 2.0 (dodeca) × 5.0 (legendary) × 2.0 (level 10) × 2.0 (size)
= 8,000 value
```

### Example 4: Max Level Legendary Diamond

```
Gem: Legendary Diamond Dodecahedron
- Level: 20
- Size: 3.0

Calculation:
200 (diamond) × 2.0 (dodeca) × 5.0 (legendary) × 3.0 (level 20) × 3.0 (size)
= 54,000 value
```

---

## Value Display UI

### Location

**Bottom-right corner** of screen when in "My Offer" mode

### Appearance

- **Background**: Blue gradient (`rgba(0, 100, 200, 0.95)`)
- **Border**: Bright blue (`#4a9eff`)
- **Rounded corners**: 12px
- **Shadow**: Soft shadow with blur
- **Backdrop filter**: Blur effect

### Content

1. **Header**: "TOTAL OFFER VALUE" (small, uppercase)
2. **Value**: Large number with diamond emoji (💎)
3. **Count**: "X gems offered" (small, monospace)

### Behavior

- **Only visible** when:
  - In Garden scene (`activeScene === 'garden'`)
  - In My Offer mode (`gardenAction === 'my-offer'`)
- **Updates in real-time** when gems are added/removed from offers
- **Formatted** with thousand separators (1,234,567)

---

## Implementation Files

### 1. New File: `src/client/utils/gemValue.ts`

**Functions**:

- `calculateGemValue(gem)` - Calculate single gem value
- `calculateTotalGemValue(gems)` - Calculate total for array of gems
- `formatGemValue(value)` - Format with thousand separators
- `getGemValueBreakdown(gem)` - Get detailed breakdown for debugging
- `getGemTypeTier(type)` - Get tier name for gem type
- `getShapeTier(shape)` - Get tier name for gem shape

**Constants**:

- `GEM_TYPE_VALUES` - Base values for each gem type
- `SHAPE_MULTIPLIERS` - Multipliers for each shape
- `RARITY_MULTIPLIERS` - Multipliers for each rarity
- `LEVEL_MULTIPLIER` - 0.1 (10% per level)
- `SIZE_MULTIPLIER` - 1.0 (1:1 scaling)

### 2. Modified: `src/client/PileDemo.tsx`

**Changes**:

**Line 27**: Added import

```typescript
import { calculateTotalGemValue, formatGemValue } from './utils/gemValue';
```

**Lines 3742-3794**: Added value display UI

```typescript
{/* Gem Value Display - Shows total value of offered gems in My Offer mode */}
{activeScene === 'garden' && gardenAction === 'my-offer' && (() => {
  const offeringGems = playerState.gems.filter(g => g.isOffering);
  const totalValue = calculateTotalGemValue(offeringGems);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      // ... styling
    }}>
      <div>TOTAL OFFER VALUE</div>
      <div>💎 {formatGemValue(totalValue)}</div>
      <div>{offeringGems.length} gems offered</div>
    </div>
  );
})()}
```

---

## Value Range Examples

### Minimum Value

**Common Emerald Tetrahedron (Level 1, Size 1.0)**

```
10 × 1.0 × 1.0 × 1.1 × 1.0 = 11 value
```

### Low Value

**Uncommon Sapphire Octahedron (Level 2, Size 1.0)**

```
25 × 1.5 × 1.5 × 1.2 × 1.0 = 67 value
```

### Medium Value

**Rare Amethyst Dodecahedron (Level 5, Size 1.5)**

```
50 × 2.0 × 2.0 × 1.5 × 1.5 = 450 value
```

### High Value

**Epic Ruby Dodecahedron (Level 10, Size 2.0)**

```
100 × 2.0 × 3.0 × 2.0 × 2.0 = 2,400 value
```

### Maximum Realistic Value

**Legendary Diamond Dodecahedron (Level 20, Size 3.0)**

```
200 × 2.0 × 5.0 × 3.0 × 3.0 = 54,000 value
```

---

## Value Progression

### By Gem Type (all other factors equal)

- Emerald: 10 value
- Sapphire: 25 value (2.5× emerald)
- Amethyst: 50 value (2× sapphire)
- Ruby: 100 value (2× amethyst)
- Diamond: 200 value (2× ruby)

**Range**: 10 → 200 (20× increase)

### By Shape (all other factors equal)

- Tetrahedron: 1× value
- Octahedron: 1.5× value
- Dodecahedron: 2× value

**Range**: 1× → 2× (2× increase)

### By Rarity (all other factors equal)

- Common: 1× value
- Uncommon: 1.5× value
- Rare: 2× value
- Epic: 3× value
- Legendary: 5× value

**Range**: 1× → 5× (5× increase)

### By Level (all other factors equal)

- Level 1: 1.1× value
- Level 5: 1.5× value
- Level 10: 2.0× value
- Level 20: 3.0× value

**Range**: 1.1× → 3.0× (2.7× increase at level 20)

---

## Build Status

✅ **Build succeeded**

- Client: 19.56s
- Server: 12.01s
- No errors

---

## Testing Guide

### Manual Testing Steps

1. **Start with no gems**:

   - Value display should not appear

2. **Collect a gem**:

   - Go to Garden → My Offer
   - Value display appears in bottom-right
   - Shows "0" value, "0 gems offered"

3. **Drag gem to offer zone**:

   - Drag any gem into the offer zone
   - Value display updates immediately
   - Shows calculated value based on gem properties

4. **Add multiple gems**:

   - Add 5 different gems to offers
   - Value display shows sum of all gem values
   - Count shows "5 gems offered"

5. **Remove gem from offers**:

   - Drag gem out of offer zone
   - Value display decreases
   - Count decreases

6. **Switch modes**:

   - Switch to "Grow" mode
   - Value display disappears
   - Switch back to "My Offer"
   - Value display reappears with correct values

7. **Test different gem types**:
   - Offer a common emerald tetrahedron → low value
   - Offer a legendary diamond dodecahedron → high value
   - Verify values match expected calculations

---

## Future Enhancements

### Possible Additions

1. **Detailed Breakdown**: Click value display to see breakdown by gem
2. **Value History**: Track total value over time
3. **Comparison**: Compare your offerings to other players
4. **Leaderboard**: Top players by total gem value
5. **Value Animations**: Animate value changes when adding/removing gems
6. **Currency**: Use gem values as currency for trades
7. **Tooltips**: Hover over gems to see individual values
8. **Filters**: Sort gems by value in inventory

### Balance Adjustments

If values feel too high/low, easy to adjust:

- Reduce base values (emerald: 10 → 5)
- Adjust multipliers (legendary: 5× → 3×)
- Change level bonus (10% → 5% per level)
- All changes centralized in `gemValue.ts`

---

## Summary

### What Changed

- ✅ Created gem value calculation system
- ✅ Defined tier hierarchy (emerald → diamond)
- ✅ Implemented shape complexity scaling
- ✅ Added rarity, level, and size multipliers
- ✅ Created value display UI in My Offer mode
- ✅ Real-time value updates

### Files Created

- `src/client/utils/gemValue.ts` - Value calculation utilities

### Files Modified

- `src/client/PileDemo.tsx` - Added value display UI

### Expected Result

Players can now see the **total value of their offered gems** in a clean, informative display at the bottom-right of the screen when in "My Offer" mode. Values update in real-time as gems are added or removed from offers.

**Status**: Ready for production! 🚀
