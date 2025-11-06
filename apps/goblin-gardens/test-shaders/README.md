# Gem Shaders for Goblin Gardens

This directory contains 5 interactive GLSL shaders designed specifically for the gem types in Goblin Gardens. Each shader captures the unique visual characteristics of its corresponding gem.

## 🎮 Unified Viewer

**`gem-viewer.html`** - All 5 gem shaders in one interactive viewer!

**Features**:
- Toggle between all 5 gem types
- Octahedral geometry (proper gem shape)
- Dynamic lighting with adjustable intensity
- Mouse-controlled rotation
- Auto-rotation option
- Dark theme optimized for gem viewing
- Download individual gem renders

**Quick Start**:
```bash
open test-shaders/gem-viewer.html
```

---

## Individual Shaders

For reference, each shader is also available as a standalone file:

## Shaders

### 1. Diamond Sparkle (`diamond-sparkle.html`)
**Visual Style**: Brilliant refractive sparkles with prismatic light dispersion

**Features**:
- Radial facets that rotate over time
- Sharp sparkle peaks at facet centers
- Chromatic dispersion (rainbow effects)
- Random sparkle variations
- Adjustable intensity and facet count

**Parameters**:
- Sparkle Intensity (0-2)
- Facet Count (4-16)
- Rotation Speed (0-2)
- Dispersion (0-1)
- Base Color & Sparkle Color

**Best For**: Diamond gems - captures the brilliant, refractive quality

---

### 2. Emerald Depth (`emerald-depth.html`)
**Visual Style**: Layered translucent green with organic inclusions

**Features**:
- Multiple depth layers using FBM noise
- Organic inclusions (darker spots)
- Flowing animation
- Translucency effect
- Subtle shimmer

**Parameters**:
- Depth Layers (2-8)
- Inclusion Density (0-1)
- Flow Speed (0-1)
- Clarity (0-1)
- Deep Green & Light Green colors

**Best For**: Emerald gems - captures the natural, organic depth

---

### 3. Ruby Fire (`ruby-fire.html`)
**Visual Style**: Intense inner glow with flickering fire-like energy

**Features**:
- Turbulent fire effect using layered FBM
- Pulsing core
- Hot spots with yellow-orange highlights
- Outer glow
- Dynamic flickering

**Parameters**:
- Fire Intensity (0-2)
- Flicker Speed (0-2)
- Turbulence (0-1)
- Glow Radius (0-1)
- Core Color & Edge Color

**Best For**: Ruby gems - captures the passionate, fiery warmth

---

### 4. Sapphire Ocean (`sapphire-ocean.html`)
**Visual Style**: Deep blue waves with liquid shimmer

**Features**:
- Flowing sine waves
- Organic noise patterns
- Shimmer highlights
- Caustic-like patterns (underwater light)
- Depth gradient

**Parameters**:
- Wave Amplitude (0-1)
- Wave Speed (0-2)
- Shimmer Intensity (0-1)
- Depth (0-1)
- Deep Blue & Light Blue colors

**Best For**: Sapphire gems - captures the serene, oceanic quality

---

### 5. Amethyst Crystal (`amethyst-crystal.html`)
**Visual Style**: Geometric crystalline structure with purple gradients

**Features**:
- Voronoi cells for crystal structure
- Rotating facets
- Internal reflections
- Edge highlights
- Refraction effects

**Parameters**:
- Crystal Complexity (2-8)
- Rotation Speed (0-1)
- Refraction (0-1)
- Brightness (0-2)
- Dark Purple & Light Purple colors

**Best For**: Amethyst gems - captures the geometric, crystalline beauty

---

## Usage

### Unified Viewer (Recommended)

Open the unified gem viewer:
```bash
open test-shaders/gem-viewer.html
```

**Controls**:
- **Gem Selection** - Click any gem button to switch shaders
- **Mouse** - Move mouse to rotate gem
- **Lighting** - Adjust light intensity and ambient light
- **Animation** - Control shader animation and rotation speed
- **Download** - Save current gem as PNG

### Individual Shaders

Each shader is also available standalone:
```bash
open test-shaders/diamond-sparkle.html
```

**Individual shader controls**:
- **Parameter sliders** - Adjust visual properties in real-time
- **Color pickers** - Customize gem colors
- **Reset button** - Restore default values
- **Download button** - Save current frame as PNG

### Integration with Goblin Gardens

The unified viewer demonstrates the recommended approach:

**Octahedral Geometry** (like the viewer):
```typescript
// In React Three Fiber
import { useFrame } from '@react-three/fiber';

function Gem({ type, level, rarity }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.1, 0]} />
      <shaderMaterial
        uniforms={{
          u_time: { value: 0 },
          u_intensity: { value: level * 0.1 },
          u_speed: { value: 0.5 },
        }}
        vertexShader={vertexShader}
        fragmentShader={gemShaders[type]}
      />
    </mesh>
  );
}
```

**Key Integration Points**:
1. Use `OctahedronGeometry` for proper gem shape
2. Pass `u_time` uniform for animation
3. Link `u_intensity` to gem level/rarity
4. Add proper lighting (point lights + ambient)
5. Consider adding `metalness` and `roughness` for PBR

## Technical Details

**Technology**:
- Three.js r128 (from CDN)
- GLSL ES 1.0 fragment shaders
- WebGL rendering
- Real-time 60fps performance

**Shader Techniques Used**:
- Voronoi cells (Amethyst)
- Fractional Brownian Motion / FBM (Emerald, Ruby)
- Sine wave interference (Diamond, Sapphire)
- Polar coordinates (Diamond)
- Noise functions (all shaders)
- Smooth interpolation (all shaders)

**Performance**:
- Optimized for real-time rendering
- No texture lookups (pure mathematical)
- Minimal branching
- GPU-accelerated

## Customization

Each shader can be customized by:

1. **Adjusting parameters** via UI controls
2. **Modifying colors** to match gem rarities
3. **Tweaking shader code** for different effects
4. **Combining techniques** from multiple shaders

## Gem Type Mapping

| Gem Type | Shader | Key Characteristic |
|----------|--------|-------------------|
| Diamond | Diamond Sparkle | Brilliant refraction |
| Emerald | Emerald Depth | Organic inclusions |
| Ruby | Ruby Fire | Inner glow |
| Sapphire | Sapphire Ocean | Liquid shimmer |
| Amethyst | Amethyst Crystal | Geometric structure |

## Next Steps

To use these in Goblin Gardens:

1. Extract the fragment shader code
2. Create Three.js ShaderMaterial
3. Apply to gem geometry
4. Connect uniforms to game parameters (level, rarity, etc.)
5. Animate u_time uniform in render loop

## Credits

Created using the shader-creator Claude skill.
Designed specifically for Goblin Gardens gem system.
