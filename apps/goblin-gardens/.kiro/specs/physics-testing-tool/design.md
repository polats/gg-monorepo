# Design Document: Physics Testing Tool

## Overview

The Physics Testing Tool is a standalone HTML file that provides an isolated environment for testing and debugging Rapier physics interactions from Goblin Gardens. It uses Three.js for rendering, Rapier for physics simulation, and Leva for real-time parameter controls. The tool is designed to be self-contained, requiring no build process or external dependencies beyond CDN imports.

## Architecture

### Technology Stack

- **Three.js (r178)**: 3D rendering engine
- **Rapier3D (0.14+)**: Physics engine (WASM)
- **Leva (0.9+)**: GUI controls for parameter tweaking
- **Vanilla JavaScript**: No framework overhead, direct DOM manipulation
- **ES Modules**: Modern JavaScript with CDN imports

### File Structure

Single HTML file with embedded:
- HTML structure (canvas, UI containers)
- CSS styling (layout, controls, debug overlays)
- JavaScript modules (physics, rendering, interaction, GUI)

### Module Organization

```
physics-testing-tool.html
├── HTML Structure
│   ├── Canvas element
│   ├── Stats overlay
│   └── Control panel container
├── CSS Styles
│   ├── Layout (fullscreen canvas)
│   ├── UI components (buttons, panels)
│   └── Debug overlays (wireframes, vectors)
└── JavaScript Modules
    ├── Main initialization
    ├── Physics module (Rapier integration)
    ├── Rendering module (Three.js scene)
    ├── Interaction module (drag controls)
    ├── GUI module (Leva controls)
    └── Debug module (visualization)
```

## Components and Interfaces

### 1. Physics Module

**Responsibilities:**
- Initialize Rapier physics world
- Create and manage rigid bodies
- Update physics simulation
- Handle collisions and sleeping

**Key Functions:**

```javascript
class PhysicsWorld {
  constructor(config) {
    this.world = new RAPIER.World(config.gravity);
    this.rigidBodies = new Map();
    this.config = config;
  }
  
  createRigidBody(type, position, shape) {
    // Create rigid body descriptor
    // Create collider descriptor
    // Add to world and tracking map
    return bodyHandle;
  }
  
  update(deltaTime) {
    // Step physics simulation
    // Update sleeping states
    // Sync with Three.js objects
  }
  
  removeBody(handle) {
    // Remove from world
    // Clean up references
  }
  
  reset() {
    // Remove all bodies
    // Reset world state
  }
}
```

**Configuration:**

```javascript
const physicsConfig = {
  gravity: { x: 0, y: -9.81, z: 0 },
  timestep: 1/60, // 60fps default
  velocityIterations: 8,
  stabilizationIterations: 4,
  sleepingEnabled: true,
  sleepingThreshold: 0.1
};
```

### 2. Rendering Module

**Responsibilities:**
- Initialize Three.js scene, camera, renderer
- Create visual meshes for physics objects
- Render debug visualizations
- Handle window resize

**Key Components:**

```javascript
class RenderingEngine {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.debugRenderer = new DebugRenderer();
  }
  
  createMesh(type, shape, color) {
    // Create geometry based on shape
    // Create material with color
    // Return mesh
  }
  
  updateMeshFromBody(mesh, rigidBody) {
    // Sync position and rotation
    // Update debug visualization
  }
  
  render() {
    // Render main scene
    // Render debug overlays if enabled
  }
}
```

**Scene Setup:**

- Camera: Positioned at (5, 5, 5), looking at origin
- Lighting: Ambient + directional lights
- Floor: Large plane mesh with grid helper
- Background: Gradient or solid color

### 3. Interaction Module

**Responsibilities:**
- Handle mouse/touch input
- Implement object picking (raycasting)
- Manage drag operations
- Switch body types (dynamic ↔ kinematic)

**Key Functions:**

```javascript
class InteractionController {
  constructor(camera, scene, physicsWorld) {
    this.raycaster = new THREE.Raycaster();
    this.draggedObject = null;
    this.dragPlane = new THREE.Plane();
  }
  
  onPointerDown(event) {
    // Raycast to find object
    // Store dragged object
    // Switch to kinematic mode
  }
  
  onPointerMove(event) {
    // Update drag plane intersection
    // Move kinematic body
  }
  
  onPointerUp(event) {
    // Release object
    // Switch back to dynamic mode
    // Apply release velocity
  }
  
  highlightObject(object) {
    // Add outline or color change
  }
}
```

**Drag Mechanics:**

1. Raycast from camera through mouse position
2. Find intersected physics object
3. Create invisible drag plane perpendicular to camera
4. Switch rigid body to kinematic mode
5. Update body position to follow plane intersection
6. On release, switch back to dynamic and apply velocity

### 4. GUI Module

**Responsibilities:**
- Create Leva control panel
- Bind controls to physics parameters
- Handle preset loading
- Export/import configurations

**Control Schema:**

```javascript
const guiSchema = {
  // Physics Settings
  gravity: { value: { x: 0, y: -9.81, z: 0 }, step: 0.1 },
  timestep: { value: 60, options: [30, 45, 60, 120] },
  velocityIterations: { value: 8, min: 1, max: 16, step: 1 },
  stabilizationIterations: { value: 4, min: 1, max: 8, step: 1 },
  
  // Spawn Settings
  objectType: { 
    value: 'tetrahedron', 
    options: ['tetrahedron', 'octahedron', 'dodecahedron', 'coin', 'rock'] 
  },
  spawnCount: { value: 10, min: 1, max: 100, step: 1 },
  spawnRate: { value: 5, min: 1, max: 20, step: 1 }, // objects per second
  
  // Debug Settings
  showColliders: { value: true },
  showVelocities: { value: false },
  showSleeping: { value: true },
  showContactPoints: { value: false },
  
  // Performance Tier Presets
  tierPreset: { 
    value: 'high', 
    options: ['low', 'medium', 'high', 'custom'] 
  },
  
  // Actions
  spawnObjects: button(() => spawnBatch()),
  reset: button(() => resetSimulation()),
  exportConfig: button(() => exportToClipboard()),
  importConfig: button(() => importFromPrompt())
};
```

**Preset Configurations:**

```javascript
const tierPresets = {
  low: {
    timestep: 30,
    velocityIterations: 2,
    stabilizationIterations: 1,
    sleepingThreshold: 0.5
  },
  medium: {
    timestep: 45,
    velocityIterations: 4,
    stabilizationIterations: 2,
    sleepingThreshold: 0.1
  },
  high: {
    timestep: 60,
    velocityIterations: 8,
    stabilizationIterations: 4,
    sleepingThreshold: 0.05
  }
};
```

### 5. Debug Module

**Responsibilities:**
- Render physics collider wireframes
- Draw velocity vectors
- Highlight sleeping bodies
- Show collision contact points
- Display performance stats

**Visualization Components:**

```javascript
class DebugRenderer {
  constructor(scene) {
    this.scene = scene;
    this.colliderLines = new Map();
    this.velocityArrows = new Map();
    this.contactPoints = [];
  }
  
  updateColliderWireframes(rigidBodies) {
    // Create/update line geometry for each collider
    // Color: green (awake), blue (sleeping)
  }
  
  updateVelocityVectors(rigidBodies) {
    // Create arrows showing velocity direction
    // Scale arrow length by velocity magnitude
  }
  
  updateContactPoints(world) {
    // Query collision events
    // Draw spheres at contact points
  }
  
  clear() {
    // Remove all debug visualizations
  }
}
```

**Stats Display:**

- FPS counter (requestAnimationFrame timing)
- Physics step time (ms)
- Active bodies count
- Sleeping bodies count
- Total objects count

### 6. Object Factory

**Responsibilities:**
- Create physics bodies with correct shapes
- Generate Three.js meshes matching colliders
- Apply materials and colors
- Handle instanced vs individual objects

**Gem Shapes:**

```javascript
const gemShapes = {
  tetrahedron: {
    geometry: new THREE.TetrahedronGeometry(0.05),
    collider: RAPIER.ColliderDesc.convexHull(vertices),
    mass: 0.1
  },
  octahedron: {
    geometry: new THREE.OctahedronGeometry(0.05),
    collider: RAPIER.ColliderDesc.convexHull(vertices),
    mass: 0.15
  },
  dodecahedron: {
    geometry: new THREE.DodecahedronGeometry(0.05),
    collider: RAPIER.ColliderDesc.convexHull(vertices),
    mass: 0.2
  },
  coin: {
    geometry: new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16),
    collider: RAPIER.ColliderDesc.cylinder(0.005, 0.03),
    mass: 0.05
  },
  rock: {
    geometry: new THREE.SphereGeometry(0.04),
    collider: RAPIER.ColliderDesc.ball(0.04),
    mass: 0.2
  }
};
```

**Material System:**

```javascript
const materials = {
  emerald: new THREE.MeshStandardMaterial({ color: 0x50C878, metalness: 0.3, roughness: 0.2 }),
  sapphire: new THREE.MeshStandardMaterial({ color: 0x0F52BA, metalness: 0.3, roughness: 0.2 }),
  amethyst: new THREE.MeshStandardMaterial({ color: 0x9966CC, metalness: 0.3, roughness: 0.2 }),
  ruby: new THREE.MeshStandardMaterial({ color: 0xE0115F, metalness: 0.3, roughness: 0.2 }),
  diamond: new THREE.MeshStandardMaterial({ color: 0xB9F2FF, metalness: 0.8, roughness: 0.1 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0xCD7F32, metalness: 0.6, roughness: 0.4 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.3 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.2 })
};
```

## Data Models

### Physics Object

```javascript
class PhysicsObject {
  constructor(type, shape, position) {
    this.id = generateUUID();
    this.type = type; // 'gem', 'coin', 'rock'
    this.shape = shape; // 'tetrahedron', 'octahedron', etc.
    this.rigidBodyHandle = null;
    this.mesh = null;
    this.isDragging = false;
    this.createdAt = Date.now();
  }
}
```

### Configuration State

```javascript
class ConfigState {
  constructor() {
    this.physics = {
      gravity: { x: 0, y: -9.81, z: 0 },
      timestep: 1/60,
      velocityIterations: 8,
      stabilizationIterations: 4
    };
    this.spawn = {
      objectType: 'tetrahedron',
      spawnCount: 10,
      spawnRate: 5
    };
    this.debug = {
      showColliders: true,
      showVelocities: false,
      showSleeping: true,
      showContactPoints: false
    };
    this.camera = {
      position: { x: 5, y: 5, z: 5 },
      target: { x: 0, y: 0, z: 0 }
    };
  }
  
  toJSON() {
    return JSON.stringify(this, null, 2);
  }
  
  fromJSON(json) {
    Object.assign(this, JSON.parse(json));
  }
}
```

## Error Handling

### Rapier Initialization

```javascript
async function initRapier() {
  try {
    await RAPIER.init();
    return new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  } catch (error) {
    console.error('Failed to initialize Rapier:', error);
    showError('Physics engine failed to load. Please refresh the page.');
    return null;
  }
}
```

### Object Creation

```javascript
function createPhysicsObject(type, position) {
  try {
    const body = createRigidBody(type, position);
    const mesh = createMesh(type);
    return { body, mesh };
  } catch (error) {
    console.error('Failed to create object:', error);
    return null;
  }
}
```

### Configuration Import

```javascript
function importConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    validateConfig(config);
    applyConfig(config);
    showSuccess('Configuration imported successfully');
  } catch (error) {
    console.error('Invalid configuration:', error);
    showError('Failed to import configuration. Please check the JSON format.');
  }
}
```

## Testing Strategy

### Manual Testing Scenarios

1. **Pile Physics Test**
   - Spawn 100 objects
   - Verify they fall and stack naturally
   - Check for physics explosions or tunneling
   - Verify sleeping optimization activates

2. **Drag Interaction Test**
   - Click and drag various object types
   - Verify smooth following of cursor
   - Test release with velocity
   - Check for picking accuracy issues

3. **Performance Tier Test**
   - Switch between Low/Medium/High presets
   - Spawn 200+ objects on each tier
   - Verify FPS matches expected performance
   - Check visual quality remains consistent

4. **Parameter Tweaking Test**
   - Adjust gravity in real-time
   - Change solver iterations
   - Modify timestep
   - Verify changes apply immediately

5. **Debug Visualization Test**
   - Enable all debug overlays
   - Verify colliders match visual meshes
   - Check velocity vectors point correctly
   - Confirm sleeping bodies highlighted

6. **Config Export/Import Test**
   - Export current configuration
   - Reset to defaults
   - Import saved configuration
   - Verify all settings restored

### Edge Cases

- **Zero gravity**: Objects should float
- **Negative gravity**: Objects should fall upward
- **Very high timestep**: Physics should remain stable
- **Very low iterations**: Physics may be unstable (expected)
- **Dragging sleeping objects**: Should wake up
- **Rapid spawning**: Should not crash or lag excessively

## Performance Considerations

### Optimization Strategies

1. **Instanced Rendering** (Future Enhancement)
   - Use THREE.InstancedMesh for identical objects
   - Reduce draw calls from N to 1 per object type
   - Update instance matrices from physics bodies

2. **Object Pooling**
   - Reuse physics bodies and meshes
   - Avoid creating/destroying on every spawn
   - Reset position instead of recreate

3. **Sleeping Optimization**
   - Skip matrix updates for sleeping bodies
   - Disable debug rendering for sleeping bodies
   - Wake only when necessary

4. **Debug Rendering**
   - Only update debug visuals when enabled
   - Use simpler geometries for debug shapes
   - Limit contact point history

5. **Frame Budget**
   - Target 60fps on high-end devices
   - Degrade gracefully on low-end devices
   - Monitor frame time and warn if exceeded

### Memory Management

- Remove physics bodies when object limit reached
- Clear debug visualization buffers periodically
- Dispose Three.js geometries and materials on reset
- Limit maximum object count (configurable, default 500)

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────┐
│  Stats (FPS, Objects, Physics Time)    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           3D Canvas                     │
│         (Physics Simulation)            │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  Leva Control Panel (Right Side)       │
│  - Physics Settings                     │
│  - Spawn Settings                       │
│  - Debug Settings                       │
│  - Tier Presets                         │
│  - Actions (Spawn, Reset, Export)      │
└─────────────────────────────────────────┘
```

### Color Scheme

- Background: Dark gray (#1a1a1a)
- Canvas: Black (#000000)
- UI panels: Semi-transparent dark (#2a2a2a, 90% opacity)
- Text: White (#ffffff)
- Accents: Cyan (#00ffff) for highlights
- Debug colors:
  - Awake bodies: Green (#00ff00)
  - Sleeping bodies: Blue (#0000ff)
  - Contact points: Red (#ff0000)
  - Velocity vectors: Yellow (#ffff00)

### Responsive Design

- Fullscreen canvas by default
- Control panel collapses on small screens
- Touch-friendly button sizes (44x44px minimum)
- Mobile: Single-finger drag, two-finger camera control

## Integration with Goblin Gardens

### Reusable Patterns

The tool demonstrates patterns that can be applied back to the main game:

1. **Debug Visualization**: Add similar wireframe/vector rendering
2. **Parameter Tweaking**: Use Leva for development builds
3. **Performance Monitoring**: Integrate stats display
4. **Drag Mechanics**: Refine based on testing results

### Testing Workflow

1. Reproduce physics issue in testing tool
2. Isolate problem with minimal setup
3. Tweak parameters to find solution
4. Export working configuration
5. Apply solution to main game
6. Verify fix in full game context

### Configuration Sharing

Export configurations from testing tool and import into game:

```javascript
// In testing tool
const config = exportConfig();

// In main game
import { applyPhysicsConfig } from './utils/physicsConfig';
applyPhysicsConfig(config);
```

## Future Enhancements

### Phase 2 Features (Not in Initial Implementation)

- **Recording/Playback**: Record physics simulation and replay
- **Scenario Presets**: Pre-configured test scenarios (pile, drag, collision)
- **Comparison Mode**: Side-by-side comparison of different settings
- **Performance Profiling**: Detailed breakdown of physics step time
- **Network Simulation**: Test with artificial latency/jitter
- **Multi-object Selection**: Drag multiple objects simultaneously
- **Force Application**: Apply impulses/forces via GUI
- **Joint Testing**: Test physics joints and constraints

## Dependencies

### CDN Imports

```html
<!-- Three.js -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/"
  }
}
</script>

<!-- Rapier Physics -->
<script src="https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.min.js"></script>

<!-- Leva GUI -->
<script src="https://cdn.jsdelivr.net/npm/leva@0.9.35/dist/leva.min.js"></script>
```

### Version Compatibility

- Three.js: r178 (matches Goblin Gardens)
- Rapier: 0.14+ (WASM compatible)
- Leva: 0.9+ (latest stable)
- Browser: Modern browsers with ES modules support

## Deployment

### Distribution

- Single HTML file, no build process required
- Can be opened directly in browser (file:// protocol)
- Can be hosted on any static file server
- Can be committed to repository in `tools/` directory

### Usage

```bash
# Open directly
open tools/physics-testing-tool.html

# Or serve locally
python -m http.server 8000
# Navigate to http://localhost:8000/tools/physics-testing-tool.html
```

### Documentation

Include inline comments and a README section at the top of the HTML file explaining:
- Purpose and use cases
- How to use controls
- How to export/import configurations
- Common testing scenarios
- Troubleshooting tips
