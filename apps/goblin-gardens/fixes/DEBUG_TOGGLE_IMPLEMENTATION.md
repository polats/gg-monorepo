# Debug Info Toggle in Settings

## 🎯 Changes Made

Added a debug info toggle in the Settings tab that controls visibility of FPS counter and device performance information.

## 📊 What Changed

### 1. New State Variable (Line 1481)
```typescript
const [showDebugInfo, setShowDebugInfo] = useState(false);
```

Controls whether debug information is displayed. Defaults to OFF.

### 2. Settings Tab Content (Lines 2538-2602)
Added a complete Settings interface with debug toggle:

```typescript
{gameTab === 'settings' && (
  <div>
    <div>⚙️ Settings</div>

    {/* Debug Info Toggle */}
    <div>
      <span>Show Debug Info</span>
      <button onClick={() => setShowDebugInfo(!showDebugInfo)}>
        {showDebugInfo ? 'ON' : 'OFF'}
      </button>
      <div>Display FPS counter and device performance info...</div>
    </div>
  </div>
)}
```

### 3. Device Info Moved to Top Right (Lines 1861-1867)
**Before**:
```typescript
position: 'absolute',
top: 20,
left: 20,  // Was on left
```

**After**:
```typescript
position: 'absolute',
top: 20,
right: 20,  // Now on right
```

### 4. Conditional Display (Lines 1862, 2620)

**Device Info**:
```typescript
// Before: Always visible
{performanceInfo && (

// After: Only when toggle is ON
{performanceInfo && showDebugInfo && (
```

**FPS Counter**:
```typescript
// Before: Only in debug mode
{debug && <Stats />}

// After: When debug info toggle is ON
{showDebugInfo && <Stats />}
```

## 🎨 Settings Tab Design

### Visual Layout
```
┌─────────────────────────┐
│   ⚙️ Settings          │
│   ─────────────────────  │
│                         │
│ ┌─────────────────────┐ │
│ │ Show Debug Info     │ │
│ │                 [ON]│ │
│ │                     │ │
│ │ Display FPS counter │ │
│ │ and device info...  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Styling Details
- **Container**: Semi-transparent background (`rgba(255, 255, 255, 0.05)`)
- **Toggle Button**:
  - ON: Green (#4caf50)
  - OFF: Gray (#666)
- **Label**: 9px font, white with 85% opacity
- **Description**: 7px font, white with 50% opacity
- **Mobile-friendly**: Touch handlers + 44px minimum touch target

## 📱 Device Info Display

### Position: Top Right
- `position: absolute`
- `top: 20px`
- `right: 20px`
- `z-index: 1001`

### Content
- **DEVICE INFO** header
- **Performance tier badge** (HIGH/MEDIUM/LOW)
  - Green for HIGH
  - Orange for MEDIUM
  - Red for LOW
- **GPU**: Tier number
- **CPU**: Core count
- **RAM**: Memory in GB
- **Physics**: FPS (30/45/60)
- **Mobile indicator**: Shows 📱 if on mobile device

### Visual Example
```
┌─────────────────┐
│   DEVICE INFO   │
│                 │
│   ┌─────────┐   │
│   │  HIGH   │   │ (Green badge)
│   └─────────┘   │
│                 │
│ GPU: Tier 2     │
│ CPU: 8 cores    │
│ RAM: 8GB        │
│ Physics: 60fps  │
│                 │
│   📱 Mobile      │
└─────────────────┘
```

## 🎮 User Experience

### Default State
- Debug info: **Hidden** (showDebugInfo = false)
- Clean gaming experience
- No performance overlay

### Enabling Debug Info
1. Open sidebar (☰ button)
2. Tap Settings tab (⚙️)
3. Tap "Show Debug Info" toggle
4. Button turns green, shows "ON"
5. **Immediately see**:
   - FPS counter (top-left via Stats component)
   - Device info panel (top-right)

### Disabling Debug Info
1. In Settings tab, tap toggle again
2. Button turns gray, shows "OFF"
3. Debug overlays disappear instantly

## 🔧 Technical Details

### State Management
- Single boolean state controls both displays
- No props needed (internal state)
- Independent of `debug` prop (which controls debug mode tabs)

### Separation of Concerns
- `debug` prop: Shows debug controls in sidebar (touch/faucet tabs)
- `showDebugInfo` state: Shows performance overlays
- These are independent toggles for different purposes

### Performance Impact
- **When OFF**: No rendering overhead
- **When ON**: Minimal overhead from Stats + device info panel
- No performance difference from previous "always on" state

## 📊 Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Device Info Position** | Top-left | Top-right ✅ |
| **Device Info Visibility** | Always visible | Toggle in Settings ✅ |
| **FPS Counter Control** | debug prop only | Settings toggle ✅ |
| **User Control** | None | Full control ✅ |
| **Default State** | Always showing | Hidden (cleaner) ✅ |
| **Settings Tab** | Empty | Functional UI ✅ |

## 🧪 Testing Checklist

### Settings Tab
- ✅ Open sidebar
- ✅ Navigate to Settings tab (⚙️)
- ✅ See "Show Debug Info" section
- ✅ Toggle button is tappable
- ✅ Button shows ON/OFF state
- ✅ Description text is readable

### Debug Info Display
- ✅ Initially hidden (default OFF)
- ✅ Toggle ON → Device info appears top-right
- ✅ Toggle ON → FPS counter appears
- ✅ Toggle OFF → Both disappear
- ✅ Device info doesn't overlap controls
- ✅ Readable on mobile screens

### Mobile Compatibility
- ✅ Toggle button responds to first tap
- ✅ No interference with 3D scene
- ✅ Device info readable at top-right
- ✅ FPS counter visible but not intrusive

## 🚀 Future Enhancements

### Additional Settings Options
```typescript
// Graphics Quality
<Toggle label="High Quality Graphics" />

// Audio
<Slider label="Music Volume" />
<Slider label="SFX Volume" />

// Gameplay
<Toggle label="Auto-collect Items" />
<Toggle label="Hints Enabled" />

// Account
<Button>Sign In</Button>
<Button>Tutorial</Button>
```

### Persistent Settings
```typescript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('showDebugInfo', JSON.stringify(showDebugInfo));
}, [showDebugInfo]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('showDebugInfo');
  if (saved) setShowDebugInfo(JSON.parse(saved));
}, []);
```

### More Debug Options
```typescript
{showDebugInfo && (
  <>
    <Toggle label="Show Collision Boxes" />
    <Toggle label="Show Physics Debug" />
    <Toggle label="Log Console Output" />
    <Slider label="Time Scale" min={0.1} max={2} />
  </>
)}
```

## 📝 Files Modified

- **src/client/PileDemo.tsx**:
  - Line 1481: Added `showDebugInfo` state
  - Lines 1862-1867: Updated device info position and visibility
  - Line 2620: Updated FPS counter visibility
  - Lines 2538-2602: Added Settings tab content with toggle

## ✅ Success Criteria

- ✅ Settings tab has functional content
- ✅ Debug toggle works on first tap
- ✅ Device info moved to top-right
- ✅ Device info hidden by default
- ✅ FPS counter controlled by toggle
- ✅ No visual overlap with other UI
- ✅ Mobile-friendly implementation

---

**Status**: ✅ Complete
**Default State**: Debug info hidden
**Toggle Location**: Settings tab (⚙️)
**Device Info Position**: Top-right corner
**User Control**: Full toggle control over debug overlays
