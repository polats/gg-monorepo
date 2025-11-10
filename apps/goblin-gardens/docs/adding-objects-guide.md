# Adding New Objects to PileDemo

This guide explains how to add new mushrooms and rare objects to the PileDemo scene.

## Quick Start

The refactored code makes it easy to add new objects. Here's how:

### Adding a New Mushroom

**Step 1: Import the GLB model**

```typescript
// In PileDemo.tsx, add to the imports section:
import ghostFungusUrl from './models/mush-02-ghostfungus.glb?url';
import morelUrl from './models/mush-03-morel.glb?url';
```

**Step 2: Add to the MUSHROOM_REGISTRY**

```typescript
const MUSHROOM_REGISTRY: Record<string, MushroomDefinition> = {
  'jack-o-lantern': {
    /* existing */
  },

  // Add new mushrooms here:
  'ghost-fungus': {
    id: 'ghost-fungus',
    name: 'Ghost Fungus',
    scientificName: 'Omphalotus nidiformis',
    modelUrl: ghostFungusUrl,
    rarity: 'epic',
    bioluminescent: true,
    description: 'Found in Australia, glows bright green in complete darkness.',
    scale: 1.2,
  },

  'morel': {
    id: 'morel',
    name: 'Yellow Morel',
    scientificName: 'Morchella americana',
    modelUrl: morelUrl,
    rarity: 'uncommon',
    bioluminescent: false,
    description: 'A highly prized spring mushroom with a distinctive honeycomb cap.',
    scale: 0.8,
  },
};
```

**Step 3: Add to the scene**

```typescript
// In the specialObjects array:
const specialObjects: ModelObject[] = [
  createMushroomObject('jack-o-lantern', [0, 25, 0]),
  createMushroomObject('ghost-fungus', [5, 25, 5]),
  createMushroomObject('morel', [-5, 25, -5]),
];
```

That's it! The mushroom will automatically:

- ✅ Drop from the sky with physics
- ✅ Be draggable and selectable
- ✅ Show proper details when double-clicked
- ✅ Display correct rarity colors
- ✅ Track if found (for rare/epic/legendary)

---

## Adding Rare Items (Non-Mushrooms)

You can also add other types of rare objects like treasures, artifacts, etc.

**Step 1: Create a Rare Item Registry (optional, or add inline)**

```typescript
interface RareItemDefinition {
  id: string;
  name: string;
  modelUrl: string;
  rarity: RarityTier;
  description: string;
  properties?: Record<string, string | boolean>;
  scale?: number;
}

const RARE_ITEM_REGISTRY: Record<string, RareItemDefinition> = {
  'golden-acorn': {
    id: 'golden-acorn',
    name: 'Golden Acorn',
    modelUrl: goldenAcornUrl,
    rarity: 'legendary',
    description: 'A mystical acorn that sparkles with golden light.',
    properties: {
      magical: true,
      value: 'priceless',
    },
    scale: 1.5,
  },
};
```

**Step 2: Create helper function (similar to createMushroomObject)**

```typescript
function createRareItemObject(itemId: string, position: [number, number, number]): ModelObject {
  const item = RARE_ITEM_REGISTRY[itemId];
  if (!item) {
    throw new Error(`Rare item ${itemId} not found in registry`);
  }

  return {
    id: `rare-${itemId}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'rare-item',
    position,
    rarity: item.rarity,
    modelUrl: item.modelUrl,
    name: item.name,
    description: item.description,
    scale: item.scale,
    properties: item.properties,
  };
}
```

**Step 3: Add to specialObjects**

```typescript
const specialObjects: ModelObject[] = [
  createMushroomObject('jack-o-lantern', [0, 25, 0]),
  createRareItemObject('golden-acorn', [10, 25, 10]),
];
```

---

## Rarity Tiers

The system supports 5 rarity levels with pre-defined colors:

| Rarity      | Color            | Usage            |
| ----------- | ---------------- | ---------------- |
| `common`    | Gray (#9e9e9e)   | Regular objects  |
| `uncommon`  | Green (#4caf50)  | Slightly special |
| `rare`      | Blue (#2196f3)   | Notable finds    |
| `epic`      | Purple (#9c27b0) | Very special     |
| `legendary` | Orange (#ff6d00) | Extremely rare   |

Objects with `rare`, `epic`, or `legendary` rarity are:

- Tracked in the "Rare Objects Found" counter
- Highlighted with "🎉 You found a rare object!" message
- More visually striking in the UI

---

## Object Properties

### For Mushrooms

All mushrooms support these properties:

```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  scientificName: string;  // Latin name (italicized in UI)
  modelUrl: string;        // Path to GLB model
  rarity: RarityTier;      // Rarity level
  bioluminescent: boolean; // Shows ✨ in UI
  description: string;     // Shown in details panel
  scale?: number;          // Optional size multiplier (default 1.0)
}
```

### For Rare Items

Rare items support these properties:

```typescript
{
  id: string;
  name: string;
  modelUrl: string;
  rarity: RarityTier;
  description: string;
  properties?: {           // Flexible key-value pairs
    magical?: boolean;
    value?: string;
    // ... any custom properties
  };
  scale?: number;
}
```

---

## File Structure

```
src/client/
├── PileDemo.tsx           # Main demo file
├── models/
│   ├── mush-01-jackolantern.glb
│   ├── mush-02-ghostfungus.glb    # Add new models here
│   ├── mush-03-morel.glb
│   └── rare-01-goldenacorn.glb
```

---

## Type System

The refactored code uses TypeScript discriminated unions for type safety:

```typescript
type DroppableObject = PolyhedronObject | ModelObject;

// TypeScript automatically narrows types:
if (obj.type === 'polyhedron') {
  // obj.vertices is available
  // obj.color is available
  // obj.layer is available
}

if (obj.type === 'mushroom') {
  // obj.modelUrl is available
  // obj.scientificName is available
  // obj.properties?.bioluminescent is available
}
```

---

## Adding Multiple Objects at Once

You can easily spawn multiple instances:

```typescript
const specialObjects: ModelObject[] = [
  // Spawn 5 jack-o'-lanterns in a row
  ...Array.from({ length: 5 }, (_, i) => createMushroomObject('jack-o-lantern', [i * 3, 25, 0])),

  // Spawn morels in a circle
  ...Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 15;
    return createMushroomObject('morel', [Math.cos(angle) * radius, 25, Math.sin(angle) * radius]);
  }),
];
```

---

## Customizing Details Panel

The details panel automatically adjusts based on object type. To add custom information:

**For mushrooms:**

- Edit the `MUSHROOM_REGISTRY` entry
- Add properties to the `properties` object
- They'll automatically show if they have special handling (like `bioluminescent`)

**For rare items:**

- All properties in the `properties` object are displayed
- Format: `<strong>PropertyName:</strong> value`

**To add custom UI:**

Edit `PileDemo.tsx` around line 536:

```typescript
{selectedObject.type === 'rare-item' && (
  <>
    {/* Existing code */}

    {/* Add custom rendering */}
    {selectedObject.properties?.magical && (
      <div>
        ✨ This item radiates magical energy!
      </div>
    )}
  </>
)}
```

---

## Example: Complete Mushroom Database

Here's how you might add all mushrooms from the research database:

```typescript
import jackOLanternUrl from './models/mush-01-jackolantern.glb?url';
import ghostFungusUrl from './models/mush-02-ghostfungus.glb?url';
import morelUrl from './models/mush-03-morel.glb?url';
import lionsManeUrl from './models/mush-04-lionsmane.glb?url';
import reishiUrl from './models/mush-05-reishi.glb?url';
import turkeyTailUrl from './models/mush-06-turkeytail.glb?url';

const MUSHROOM_REGISTRY: Record<string, MushroomDefinition> = {
  'jack-o-lantern': {
    id: 'jack-o-lantern',
    name: "Jack-o'-Lantern",
    scientificName: 'Omphalotus olearius',
    modelUrl: jackOLanternUrl,
    rarity: 'legendary',
    bioluminescent: true,
    description: 'Gills emit greenish-white light. Poisonous!',
  },
  'ghost-fungus': {
    id: 'ghost-fungus',
    name: 'Ghost Fungus',
    scientificName: 'Omphalotus nidiformis',
    modelUrl: ghostFungusUrl,
    rarity: 'epic',
    bioluminescent: true,
    description: 'Glows bright green in darkness. Found in Australia.',
  },
  'morel': {
    id: 'morel',
    name: 'Yellow Morel',
    scientificName: 'Morchella americana',
    modelUrl: morelUrl,
    rarity: 'uncommon',
    bioluminescent: false,
    description: 'Highly prized spring delicacy with honeycomb cap.',
  },
  'lions-mane': {
    id: 'lions-mane',
    name: "Lion's Mane",
    scientificName: 'Hericium erinaceus',
    modelUrl: lionsManeUrl,
    rarity: 'rare',
    bioluminescent: false,
    description: 'Boosts intelligence and memory. Cascading white spines.',
  },
  'reishi': {
    id: 'reishi',
    name: 'Reishi',
    scientificName: 'Ganoderma lucidum',
    modelUrl: reishiUrl,
    rarity: 'epic',
    bioluminescent: false,
    description: 'Mushroom of Immortality. Shiny, lacquered appearance.',
  },
  'turkey-tail': {
    id: 'turkey-tail',
    name: 'Turkey Tail',
    scientificName: 'Trametes versicolor',
    modelUrl: turkeyTailUrl,
    rarity: 'common',
    bioluminescent: false,
    description: 'Most common decomposer. Colorful concentric zones.',
  },
};
```

---

## Tips & Best Practices

1. **Model Optimization:** Keep GLB files under 5MB for better performance
2. **Naming Convention:** Use `mush-##-name.glb` for mushrooms, `rare-##-name.glb` for items
3. **Positioning:** Higher Y values = drops from higher up
4. **Scale:** 1.0 = normal size, 0.5 = half size, 2.0 = double size
5. **Rarity Balance:**

   - Common: 60-70%
   - Uncommon: 20-30%
   - Rare: 5-10%
   - Epic: 2-5%
   - Legendary: <2%

6. **Testing:** Add one object at a time to verify physics and collisions work correctly

---

## Troubleshooting

**Mushroom not appearing:**

- Check model path is correct
- Verify GLB file exists
- Check browser console for errors
- Ensure position isn't underground (Y should be > 0)

**Physics issues:**

- Try adjusting scale (smaller = more stable)
- Check model has proper geometry (no zero-area faces)
- Verify convex hull is being generated

**Selection not working:**

- Double-click to select (not single click)
- Make sure `onSelect` callback is passed
- Check selectedObjectId state is updating

---

## Next Steps

With this system, you can easily:

- ✅ Add all mushrooms from the research database
- ✅ Create rare treasure items
- ✅ Build a complete collection system
- ✅ Implement rarity-based gameplay mechanics
- ✅ Create themed object sets (Halloween, Spring, etc.)

The code is now fully extensible and type-safe! 🍄✨
