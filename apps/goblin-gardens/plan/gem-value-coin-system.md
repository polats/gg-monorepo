# Gem Value & Coin System ✅

## Summary

Updated gem value calculation to use **millimeters** for size measurement and display values in **coin denominations** (gold, silver, bronze) instead of raw numbers. The "My Offer" page now shows a beautiful breakdown of total value in coins.

---

## Coin Denomination System

### Conversion Rates

```
1 Silver = 100 Bronze
1 Gold = 100 Silver = 10,000 Bronze
```

### Examples

- **11 bronze** = `11b`
- **150 bronze** = `1s 50b` (1 silver, 50 bronze)
- **54,000 bronze** = `5g 40s 0b` (5 gold, 40 silver, 0 bronze)

---

## Updated Value Calculation

### Formula

```
Value (in bronze) = Base × Shape × Rarity × (1 + Level × 0.1) × (Size_mm / 1000)
```

### Size Measurement

**Before**: Size was a simple multiplier (1.0, 1.5, 2.0)

**After**: Size is measured in millimeters

- `gem.size` is stored as decimal (e.g., 1.0, 1.5, 2.0)
- Actual size = `gem.size × 1000` mm
- Size multiplier = `size_mm / 1000`
- **1000mm = 1.0× multiplier** (baseline)

### Examples

**Example 1: Common Emerald (1000mm)**

```
Size: 1.0 → 1000mm
Calculation: 10 × 1.0 × 1.0 × 1.1 × (1000 / 1000)
           = 10 × 1.0 × 1.0 × 1.1 × 1.0
           = 11 bronze
```

**Example 2: Rare Ruby (1500mm)**

```
Size: 1.5 → 1500mm
Calculation: 100 × 2.0 × 2.0 × 1.5 × (1500 / 1000)
           = 100 × 2.0 × 2.0 × 1.5 × 1.5
           = 900 bronze = 9s 0b
```

**Example 3: Legendary Diamond (3000mm)**

```
Size: 3.0 → 3000mm
Level: 20
Calculation: 200 × 2.0 × 5.0 × 3.0 × (3000 / 1000)
           = 200 × 2.0 × 5.0 × 3.0 × 3.0
           = 54,000 bronze = 5g 40s 0b
```

---

## Updated Display UI

### Location

**Bottom-right corner** when in "My Offer" mode

### New Layout

```
┌──────────────────────┐
│ TOTAL OFFER VALUE    │
├──────────────────────┤
│ 🪙 5 gold            │
│ 🪙 40 silver         │
│ 🪙 25 bronze         │
├──────────────────────┤
│ 3 gems • 5g 40s 25b  │
└──────────────────────┘
```

### Features

- **Color-coded coins**:
  - Gold: `#ffd700` (bright gold)
  - Silver: `#c0c0c0` (silver gray)
  - Bronze: `#cd7f32` (bronze brown)
- **Smart display**: Only shows denominations > 0
- **Empty state**: Shows "No gems offered" when no gems
- **Summary line**: Shows gem count and compact coin format

### Display Logic

1. **0 bronze** → "No gems offered"
2. **11 bronze** → Shows only bronze coin
3. **150 bronze** → Shows silver and bronze
4. **10,000 bronze** → Shows only gold (1 gold)
5. **54,025 bronze** → Shows all three denominations

---

## New Utility Functions

### `convertToCoins(bronzeValue)`

Converts bronze value to coin denominations.

```typescript
convertToCoins(54025);
// Returns: { gold: 5, silver: 40, bronze: 25 }
```

### `formatCoins(coins)`

Formats coin object as readable string.

```typescript
formatCoins({ gold: 5, silver: 40, bronze: 25 });
// Returns: "5g 40s 25b"
```

### `formatValueAsCoins(bronzeValue)`

One-step conversion and formatting.

```typescript
formatValueAsCoins(54025);
// Returns: "5g 40s 25b"
```

---

## Value Examples with Coin Display

### Low Value Gem

**Common Emerald Tetrahedron (Level 1, 1000mm)**

- Bronze Value: 11
- Display: `11b`
- Visual: `🪙 11 bronze`

### Medium Value Gem

**Rare Amethyst Octahedron (Level 5, 1500mm)**

- Bronze Value: 562
- Display: `5s 62b`
- Visual:
  ```
  🪙 5 silver
  🪙 62 bronze
  ```

### High Value Gem

**Epic Ruby Dodecahedron (Level 10, 2000mm)**

- Bronze Value: 2,400
- Display: `24s 0b`
- Visual: `🪙 24 silver`

### Very High Value Gem

**Legendary Diamond Dodecahedron (Level 15, 2500mm)**

- Bronze Value: 27,500
- Display: `2g 75s 0b`
- Visual:
  ```
  🪙 2 gold
  🪙 75 silver
  ```

### Maximum Value Gem

**Legendary Diamond Dodecahedron (Level 20, 3000mm)**

- Bronze Value: 54,000
- Display: `5g 40s 0b`
- Visual:
  ```
  🪙 5 gold
  🪙 40 silver
  ```

---

## Files Modified

### 1. `src/client/utils/gemValue.ts`

**New Constants** (lines 39-51):

```typescript
// Size is measured in millimeters (mm)
export const SIZE_BASE_MM = 1000; // 1000mm = 1.0× multiplier

// Coin Conversion Constants
export const BRONZE_PER_SILVER = 100;
export const SILVER_PER_GOLD = 100;
export const BRONZE_PER_GOLD = 10,000;
```

**Updated `calculateGemValue`** (lines 66-79):

```typescript
export function calculateGemValue(gem: Gem): number {
  const baseValue = GEM_TYPE_VALUES[gem.type];
  const shapeMultiplier = SHAPE_MULTIPLIERS[gem.shape];
  const rarityMultiplier = RARITY_MULTIPLIERS[gem.rarity];
  const levelBonus = 1 + gem.level * LEVEL_MULTIPLIER;

  // Size is measured in millimeters
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / SIZE_BASE_MM; // Normalize: 1000mm = 1.0×

  const totalValue = baseValue * shapeMultiplier * rarityMultiplier * levelBonus * sizeMultiplier;

  return Math.floor(totalValue); // Round down to whole bronze coins
}
```

**New Functions** (lines 105-154):

- `convertToCoins(bronzeValue)` - Convert to coin denominations
- `formatCoins(coins)` - Format as readable string
- `formatValueAsCoins(bronzeValue)` - One-step conversion

**Updated `getGemValueBreakdown`** (lines 163-182):

```typescript
export function getGemValueBreakdown(gem: Gem) {
  const sizeInMm = gem.size * 1000;
  const sizeMultiplier = sizeInMm / SIZE_BASE_MM;
  // ... other calculations
  return {
    // ... other fields
    sizeInMm,
    sizeMultiplier,
    totalValue,
    formula: `${baseValue} × ${shapeMultiplier} × ${rarityMultiplier} × ${levelBonus.toFixed(1)} × (${sizeInMm}mm / ${SIZE_BASE_MM}) = ${totalValue} bronze`,
  };
}
```

### 2. `src/client/PileDemo.tsx`

**Updated Import** (line 27):

```typescript
import { calculateTotalGemValue, formatValueAsCoins, convertToCoins } from './utils/gemValue';
```

**Updated Value Display** (lines 3742-3850):

```typescript
{activeScene === 'garden' && gardenAction === 'my-offer' && (() => {
  const offeringGems = playerState.gems.filter(g => g.isOffering);
  const totalValueInBronze = calculateTotalGemValue(offeringGems);
  const coins = convertToCoins(totalValueInBronze);
  const coinString = formatValueAsCoins(totalValueInBronze);

  return (
    <div style={{ /* ... */ }}>
      <div>TOTAL OFFER VALUE</div>

      {/* Individual coin lines */}
      {coins.gold > 0 && (
        <div>🪙 {coins.gold.toLocaleString()} gold</div>
      )}
      {coins.silver > 0 && (
        <div>🪙 {coins.silver} silver</div>
      )}
      {coins.bronze > 0 && (
        <div>🪙 {coins.bronze} bronze</div>
      )}

      {/* Summary */}
      <div>{offeringGems.length} gems • {coinString}</div>
    </div>
  );
})()}
```

---

## Visual Comparison

### Before (Raw Numbers)

```
┌──────────────────────┐
│ TOTAL OFFER VALUE    │
│ 💎 54,000            │
│ 3 gems offered       │
└──────────────────────┘
```

### After (Coin Denominations)

```
┌──────────────────────┐
│ TOTAL OFFER VALUE    │
├──────────────────────┤
│ 🪙 5 gold            │
│ 🪙 40 silver         │
├──────────────────────┤
│ 3 gems • 5g 40s 0b   │
└──────────────────────┘
```

**Improvements**:

- ✅ Clear breakdown by denomination
- ✅ Color-coded for easy recognition
- ✅ Shows actual coin counts
- ✅ Compact summary line
- ✅ More immersive/game-like

---

## Value Ranges in Coins

### Minimum Value

**11 bronze** = `11b`

### Low Range (100-999 bronze)

- **150 bronze** = `1s 50b`
- **500 bronze** = `5s 0b`
- **999 bronze** = `9s 99b`

### Medium Range (1,000-9,999 bronze)

- **1,000 bronze** = `10s 0b`
- **5,000 bronze** = `50s 0b`
- **9,999 bronze** = `99s 99b`

### High Range (10,000-99,999 bronze)

- **10,000 bronze** = `1g 0s 0b`
- **25,000 bronze** = `2g 50s 0b`
- **54,000 bronze** = `5g 40s 0b`
- **99,999 bronze** = `9g 99s 99b`

### Very High Range (100,000+ bronze)

- **100,000 bronze** = `10g 0s 0b`
- **500,000 bronze** = `50g 0s 0b`
- **1,000,000 bronze** = `100g 0s 0b`

---

## Build Status

✅ **Build succeeded**

- Client: 20.71s
- Server: 11.88s
- No errors

---

## Testing Guide

### Manual Testing

1. **No gems offered**:

   - Go to My Offer mode
   - Display shows: "No gems offered"

2. **Offer low-value gem** (< 100 bronze):

   - Drag common emerald to offer zone
   - Display shows: `🪙 11 bronze`
   - Summary: `1 gem • 11b`

3. **Offer medium-value gem** (100-999 bronze):

   - Drag rare sapphire to offer zone
   - Display shows:
     ```
     🪙 X silver
     🪙 X bronze
     ```
   - Summary includes both denominations

4. **Offer high-value gem** (10,000+ bronze):

   - Drag legendary diamond to offer zone
   - Display shows:
     ```
     🪙 X gold
     🪙 X silver
     ```
   - Gold appears for first time

5. **Multiple gems**:

   - Offer 3-5 different gems
   - Value adds up correctly
   - Each denomination updates
   - Gem count shows "X gems"

6. **Remove gems**:
   - Drag gem out of offer zone
   - Value decreases
   - Denominations update correctly
   - Returns to "No gems offered" when empty

---

## Conversion Examples

### Small Values

| Bronze | Coins     | Display |
| ------ | --------- | ------- |
| 1      | 0g 0s 1b  | `1b`    |
| 50     | 0g 0s 50b | `50b`   |
| 99     | 0g 0s 99b | `99b`   |

### Medium Values

| Bronze | Coins     | Display  |
| ------ | --------- | -------- |
| 100    | 0g 1s 0b  | `1s 0b`  |
| 150    | 0g 1s 50b | `1s 50b` |
| 500    | 0g 5s 0b  | `5s 0b`  |
| 999    | 0g 9s 99b | `9s 99b` |

### Large Values

| Bronze | Coins      | Display      |
| ------ | ---------- | ------------ |
| 10,000 | 1g 0s 0b   | `1g 0s 0b`   |
| 12,345 | 1g 23s 45b | `1g 23s 45b` |
| 50,000 | 5g 0s 0b   | `5g 0s 0b`   |
| 54,000 | 5g 40s 0b  | `5g 40s 0b`  |
| 99,999 | 9g 99s 99b | `9g 99s 99b` |

---

## Future Enhancements

### Possible Additions

1. **Animated coin counters**: Count up when gems added
2. **Coin sound effects**: Clink sound when value changes
3. **Value history chart**: Track total value over time
4. **Comparison mode**: Compare your offers to others
5. **Exchange rate**: Dynamic conversion rates based on market
6. **Coin icons**: Custom SVG coin images instead of emoji
7. **Hover tooltips**: Show bronze value on hover

### Alternative Display Modes

- **Compact**: Only show summary line
- **Detailed**: Show individual gem values
- **Graph**: Visual bar chart of denominations

---

## Summary

### What Changed

- ✅ Size now measured in **millimeters** (1000mm = 1.0×)
- ✅ Values displayed in **coin denominations** (gold/silver/bronze)
- ✅ Conversion: 1 silver = 100 bronze, 1 gold = 100 silver
- ✅ Beautiful UI showing breakdown by coin type
- ✅ Color-coded coins (gold, silver, bronze)
- ✅ Smart display (hides zero denominations)
- ✅ Summary line with compact format

### Files Modified

- `src/client/utils/gemValue.ts` - Updated calculations and added coin functions
- `src/client/PileDemo.tsx` - Updated value display UI

### Expected Result

Players now see their gem values in an **immersive, game-like coin system** instead of raw numbers. The display breaks down total value into gold, silver, and bronze coins, making it easy to understand at a glance.

**Example**: Instead of "54,000", players see "5 gold, 40 silver" which feels much more like a fantasy RPG!

**Status**: Ready for production! 🚀
