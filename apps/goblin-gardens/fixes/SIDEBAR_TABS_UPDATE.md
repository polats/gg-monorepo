# Sidebar Game Mode Tabs Implementation

## 🎯 Changes Made

Transformed the sidebar to show **game mode tabs** by default, with debug controls hidden behind the `debug` flag.

## 📊 Before vs After

### Before
- Sidebar always showed debug controls (touch mode, faucet settings)
- No clear game UI for non-debug users
- Debug-focused interface

### After
- **Debug mode OFF**: Shows 4 game mode tabs (Scrounge, Garden, Hoard, Settings)
- **Debug mode ON**: Shows debug controls (touch mode, faucet settings)
- Clean game interface for players

## 🎮 Game Mode Tabs

### Tab Grid Layout (2x2)
```
┌─────────────────────┐
│   🔍      🌱       │
│ Scrounge  Garden   │
│                    │
│   💎      ⚙️       │
│  Hoard  Settings   │
└─────────────────────┘
```

### Tab Descriptions

#### 🔍 Scrounge (Brown theme)
- Primary game mode for collecting objects
- Theme colors: `#8b6f47` active, `#d4a574` border
- Currently shows placeholder text

#### 🌱 Garden (Green theme)
- Future garden management mode
- Theme colors: `#4a7c59` active, `#6fbf73` border
- Currently shows placeholder text

#### 💎 Hoard (Purple theme)
- Inventory/collection viewing mode
- Theme colors: `#7c4a6f` active, `#bf6fb3` border
- Currently shows placeholder text

#### ⚙️ Settings (Gray theme)
- Game settings and preferences
- Theme colors: `#5a5a5a` active, `#909090` border
- Currently shows placeholder text

## 🔧 Implementation Details

### State Management (Line 1476)
```typescript
const [gameTab, setGameTab] = useState<'scrounge' | 'garden' | 'hoard' | 'settings'>('scrounge');
```

### Debug Mode Toggle (Lines 2020-2469)
```typescript
{debug && (
  // Show debug controls (touch, faucet tabs)
)}

{!debug && (
  // Show game mode tabs (scrounge, garden, hoard, settings)
)}
```

### Tab Buttons (Lines 2508-2595)
All tabs use:
- `createMobileFriendlyHandlers()` for touch support
- `mobileFriendlyButtonStyles` for iOS compatibility
- 44x44px minimum touch targets
- Visual feedback on selection
- Themed colors per mode

### Button Structure
```typescript
<button
  {...createMobileFriendlyHandlers(() => setGameTab('scrounge'))}
  style={{
    background: gameTab === 'scrounge' ? '#8b6f47' : 'rgba(255, 255, 255, 0.15)',
    border: gameTab === 'scrounge' ? '2px solid #d4a574' : '2px solid transparent',
    // ... mobile-friendly styles
  }}
>
  <span>🔍</span>
  <span style={{ fontSize: 8 }}>Scrounge</span>
</button>
```

## 🎨 Visual Design

### Color Themes
Each tab has its own theme:
- **Scrounge**: Earth tones (brown/tan) - fits cave/gathering theme
- **Garden**: Nature greens - represents growing/nurturing
- **Hoard**: Royal purple - treasure/collection aesthetic
- **Settings**: Neutral gray - utility/function focused

### Typography
- Tab icons: 24px emoji
- Tab labels: 8px text
- Title: 12px bold "Goblin Gardens"

### Layout
- Grid: 2 columns, equal width
- Gap: 8px between buttons
- Padding: 12px vertical, 8px horizontal per button
- Border radius: 6px for modern look

## 📱 Mobile Optimization

All tab buttons include:
- ✅ `onClick` + `onTouchEnd` handlers
- ✅ `stopPropagation()` + `preventDefault()`
- ✅ Minimum 44x44px touch targets
- ✅ `touchAction: 'none'`
- ✅ iOS tap highlight feedback
- ✅ `pointerEvents: 'auto'`

## 🔍 Debug Mode

To see debug controls:
1. Set `debug={true}` when rendering `<PileDemo debug={true} />`
2. Sidebar shows original controls (touch mode, faucet, object count)
3. Debug tabs at bottom: 👆 Touch | 🚰 Faucet

## 🚀 Future Development

### Scrounge Tab Content
- Show current level/zone
- Display objectives/quests
- Show loot/rewards available
- Real-time object tracking

### Garden Tab Content
- Plant management UI
- Growth timers
- Resource allocation
- Harvest mechanics

### Hoard Tab Content
- Inventory grid
- Item details/stats
- Collection progress
- Sorting/filtering

### Settings Tab Content
- Graphics quality toggle
- Audio controls
- Account settings
- Tutorial/help

## 📝 Files Modified

- **src/client/PileDemo.tsx**:
  - Line 1476: Added `gameTab` state
  - Lines 2020-2469: Wrapped debug controls in `{debug && ...}`
  - Lines 2471-2598: Added game mode tabs with `{!debug && ...}`

## 🧪 Testing

### Test Game Mode (debug=false)
1. Open sidebar (☰ button)
2. Should see "Goblin Gardens" title
3. Should see 2x2 grid of tabs at bottom
4. Tapping each tab should change active state
5. Middle area shows placeholder for selected tab

### Test Debug Mode (debug=true)
1. Open sidebar
2. Should see "Controls" title
3. Should see debug controls (touch/faucet)
4. Original debug functionality intact

### Mobile Testing
1. All tabs should be tappable on first try
2. Active tab should show clear visual feedback
3. No interference with 3D scene interaction

## ✅ Success Criteria

- ✅ Debug controls hidden by default
- ✅ Game tabs shown in non-debug mode
- ✅ 2x2 grid layout implemented
- ✅ All tabs mobile-friendly
- ✅ Visual theming per tab
- ✅ Active state clearly indicated
- ✅ Placeholder content shows selected tab

---

**Status**: ✅ Complete
**Debug Mode**: Available via `debug={true}` prop
**Default Mode**: Game tabs (scrounge, garden, hoard, settings)
**Next Steps**: Implement actual content for each game mode tab
