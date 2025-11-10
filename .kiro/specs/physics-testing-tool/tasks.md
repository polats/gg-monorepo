# Implementation Plan

- [x] 1. Create HTML structure and basic setup
  - Create `tools/physics-testing-tool.html` file with DOCTYPE and basic HTML structure
  - Add canvas element for Three.js rendering
  - Add container divs for stats overlay and control panel
  - Include CDN imports for Three.js (r178), Rapier (0.14+), and Leva (0.9+) via importmap and script tags
  - Add basic CSS for fullscreen canvas, dark theme, and UI positioning
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement core physics module
  - [x] 2.1 Create PhysicsWorld class with Rapier initialization
    - Write async initialization function for Rapier WASM
    - Create physics world with configurable gravity
    - Implement timestep and solver iteration configuration
    - Add error handling for Rapier initialization failures
    - _Requirements: 1.2, 4.2, 4.3_
  
  - [x] 2.2 Implement rigid body creation and management
    - Write `createRigidBody()` method supporting different object types
    - Create collider descriptors for tetrahedron, octahedron, dodecahedron, coin, and rock shapes
    - Implement body tracking with Map data structure
    - Add mass and restitution properties per object type
    - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 2.3 Implement physics update loop
    - Write `update()` method that steps the physics world
    - Implement delta time accumulation for fixed timestep
    - Add sleeping state tracking for bodies
    - Sync rigid body transforms to Three.js meshes
    - _Requirements: 2.2, 4.5_
  
  - [x] 2.4 Add body removal and reset functionality
    - Write `removeBody()` method to clean up physics bodies
    - Implement `reset()` method to clear all bodies from world
    - Add proper cleanup of Rapier resources
    - _Requirements: 8.2, 8.5_

- [x] 3. Implement rendering module
  - [x] 3.1 Create RenderingEngine class with Three.js setup
    - Initialize Three.js scene, camera, and WebGL renderer
    - Set up perspective camera at position (5, 5, 5)
    - Configure renderer with antialiasing and shadow support
    - Add window resize handler
    - _Requirements: 1.1, 10.1_
  
  - [x] 3.2 Create lighting and floor
    - Add ambient light and directional light to scene
    - Create floor plane mesh with grid helper
    - Add floor physics collider with friction and restitution
    - _Requirements: 2.3_
  
  - [x] 3.3 Implement object mesh creation
    - Write `createMesh()` method for each object type
    - Create Three.js geometries matching physics collider shapes
    - Apply materials with colors for emerald, sapphire, amethyst, ruby, diamond, bronze, silver, gold
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.4 Implement render loop
    - Write `render()` method called via requestAnimationFrame
    - Sync mesh transforms from physics bodies each frame
    - Update camera controls
    - _Requirements: 2.2_

- [x] 4. Implement interaction module
  - [x] 4.1 Create InteractionController class with raycasting
    - Initialize Three.js Raycaster for object picking
    - Write pointer position conversion (screen to normalized device coordinates)
    - Implement raycast intersection detection
    - _Requirements: 3.1_
  
  - [x] 4.2 Implement drag mechanics
    - Write `onPointerDown()` handler to detect object selection
    - Create invisible drag plane perpendicular to camera view
    - Switch selected rigid body to kinematic mode during drag
    - Write `onPointerMove()` handler to update body position following cursor
    - Write `onPointerUp()` handler to release object and restore dynamic mode
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x] 4.3 Add visual feedback for interactions
    - Implement object highlighting on hover (outline or color change)
    - Add visual indicator for selected/dragged objects
    - _Requirements: 3.1, 3.5_

- [x] 5. Implement GUI module with Leva
  - [x] 5.1 Create control schema for physics parameters
    - Add gravity controls (x, y, z vector)
    - Add timestep selector (30fps, 45fps, 60fps, 120fps options)
    - Add velocity iterations slider (1-16 range)
    - Add stabilization iterations slider (1-8 range)
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 5.2 Create spawn controls
    - Add object type selector (tetrahedron, octahedron, dodecahedron, coin, rock)
    - Add spawn count slider (1-100 range)
    - Add spawn rate slider (1-20 objects per second)
    - Add "Spawn Objects" button
    - _Requirements: 2.4, 2.5, 4.4, 6.5_
  
  - [x] 5.3 Create debug visualization controls
    - Add toggle for collider wireframes
    - Add toggle for velocity vectors
    - Add toggle for sleeping body highlighting
    - Add toggle for collision contact points
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.4 Implement performance tier presets
    - Create preset configurations for Low tier (30fps, 2 velocity, 1 stabilization)
    - Create preset configurations for Medium tier (45fps, 4 velocity, 2 stabilization)
    - Create preset configurations for High tier (60fps, 8 velocity, 4 stabilization)
    - Add tier preset selector dropdown
    - Write preset application logic that updates all related parameters
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [x] 5.5 Add action buttons
    - Add "Reset" button that clears all objects
    - Add "Reset Camera" button that returns camera to default position
    - _Requirements: 8.1, 8.4, 10.4_
  
  - [x] 5.6 Implement config export/import
    - Add "Export Config" button that generates JSON configuration
    - Implement clipboard copy functionality for exported config
    - Add "Import Config" button that prompts for JSON input
    - Write config validation logic
    - Implement config application that updates all GUI controls and physics parameters
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Implement debug visualization module
  - [ ] 6.1 Create DebugRenderer class
    - Initialize debug visualization containers in Three.js scene
    - Create Maps for tracking debug objects (lines, arrows, spheres)
    - _Requirements: 5.5_
  
  - [ ] 6.2 Implement collider wireframe rendering
    - Write `updateColliderWireframes()` method that creates line geometry for each collider
    - Color awake bodies green and sleeping bodies blue
    - Update wireframes each frame to match body positions
    - _Requirements: 5.1, 5.3_
  
  - [ ] 6.3 Implement velocity vector rendering
    - Write `updateVelocityVectors()` method that creates arrow helpers
    - Scale arrow length by velocity magnitude
    - Point arrows in velocity direction
    - _Requirements: 5.2_
  
  - [ ] 6.4 Implement contact point visualization
    - Query Rapier collision events each frame
    - Draw small spheres at contact points
    - Color contact points red
    - _Requirements: 5.4_
  
  - [ ] 6.5 Add debug cleanup
    - Write `clear()` method to remove all debug visualizations
    - Implement selective clearing based on enabled toggles
    - _Requirements: 5.5_

- [ ] 7. Implement object factory and spawning
  - [ ] 7.1 Create object factory with shape definitions
    - Define Three.js geometries for all object types
    - Define Rapier collider descriptors matching geometries
    - Create material library with gem and coin colors
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 7.2 Implement spawn logic
    - Write `spawnObject()` function that creates physics body and mesh
    - Implement random spawn position generation above floor
    - Add spawned objects to tracking arrays
    - _Requirements: 2.1, 2.4_
  
  - [ ] 7.3 Implement batch spawning
    - Write `spawnBatch()` function that spawns multiple objects
    - Add spawn rate limiting (objects per second)
    - Implement spawn animation or effect
    - _Requirements: 2.4, 4.4_

- [ ] 8. Implement stats and performance monitoring
  - [ ] 8.1 Create stats overlay UI
    - Add HTML elements for FPS, object count, physics time display
    - Style stats overlay with semi-transparent background
    - Position in top-left corner
    - _Requirements: 7.4_
  
  - [ ] 8.2 Implement FPS counter
    - Track frame times using requestAnimationFrame timestamps
    - Calculate rolling average FPS
    - Update display every 500ms
    - _Requirements: 7.4_
  
  - [ ] 8.3 Implement physics performance tracking
    - Measure physics step time using performance.now()
    - Track active vs sleeping body counts
    - Display total object count
    - _Requirements: 7.4_

- [ ] 9. Implement camera controls
  - [ ] 9.1 Add OrbitControls from Three.js addons
    - Import OrbitControls from Three.js CDN
    - Initialize controls with camera and canvas
    - Configure damping and zoom limits
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ] 9.2 Implement camera pan support
    - Enable right-click drag for panning
    - Configure pan speed and limits
    - _Requirements: 10.3_
  
  - [ ] 9.3 Implement camera reset
    - Store default camera position and target
    - Write reset function that animates camera back to default
    - Wire up to "Reset Camera" button
    - _Requirements: 8.3, 10.4_

- [ ] 10. Add documentation and polish
  - [ ] 10.1 Add inline documentation
    - Write JSDoc comments for all classes and methods
    - Add code comments explaining complex physics logic
    - Document configuration schema
    - _Requirements: 1.1_
  
  - [ ] 10.2 Create usage instructions
    - Add README section at top of HTML file
    - Document all controls and their purposes
    - Provide example testing scenarios
    - Include troubleshooting tips
    - _Requirements: 1.1_
  
  - [ ] 10.3 Add error handling and user feedback
    - Implement toast notifications for errors and success messages
    - Add loading indicator during Rapier initialization
    - Display helpful error messages for common issues
    - _Requirements: 1.4_
  
  - [ ] 10.4 Final testing and refinement
    - Test all object types spawn correctly
    - Verify drag mechanics work smoothly
    - Test all performance tier presets
    - Verify config export/import works
    - Test on different browsers (Chrome, Firefox, Safari)
    - _Requirements: 1.5, 2.1, 3.1, 7.1, 9.1_
