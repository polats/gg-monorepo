# Requirements Document

## Introduction

A standalone physics testing and debugging tool for Goblin Gardens that allows developers to simulate, visualize, and tweak Rapier physics interactions in an isolated environment. This tool addresses the difficulty of debugging physics issues in the main game by providing a controlled testing environment with real-time parameter adjustment and visual debugging aids.

## Glossary

- **Physics Testing Tool**: A standalone HTML file that simulates Rapier physics interactions from Goblin Gardens
- **Rapier**: The WASM-based 3D physics engine used in Goblin Gardens
- **Three.js**: The 3D graphics library used for rendering
- **Instanced Rendering**: Technique for rendering multiple objects with a single draw call
- **Rigid Body**: A physics object that can move and collide with other objects
- **Collider**: The shape used for collision detection
- **Debug Renderer**: Visual representation of physics colliders and forces
- **Leva**: A GUI library for creating real-time parameter controls
- **Pile Simulation**: Testing scenario for objects falling and stacking
- **Drag Interaction**: Testing scenario for mouse/touch-based object manipulation

## Requirements

### Requirement 1

**User Story:** As a developer, I want a standalone testing environment, so that I can debug physics issues without running the full game.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL be a single self-contained HTML file with no external dependencies beyond CDN imports
2. THE Physics Testing Tool SHALL load Rapier physics engine from CDN
3. THE Physics Testing Tool SHALL load Three.js and React Three Fiber from CDN
4. THE Physics Testing Tool SHALL initialize within 5 seconds on a standard development machine
5. THE Physics Testing Tool SHALL run independently of the main Goblin Gardens codebase

### Requirement 2

**User Story:** As a developer, I want to simulate pile physics, so that I can test how objects fall and stack.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL spawn multiple physics objects (gems, coins, rocks) from configurable spawn points
2. THE Physics Testing Tool SHALL support instanced rendering for performance testing with 100+ objects
3. THE Physics Testing Tool SHALL include a floor collider with configurable friction and restitution
4. THE Physics Testing Tool SHALL allow spawning objects on demand via button click
5. THE Physics Testing Tool SHALL display the current object count in the UI

### Requirement 3

**User Story:** As a developer, I want to test drag interactions, so that I can debug object picking and manipulation issues.

#### Acceptance Criteria

1. WHEN the user clicks on an object, THE Physics Testing Tool SHALL highlight the selected object
2. WHEN the user drags a selected object, THE Physics Testing Tool SHALL move the object following the cursor
3. THE Physics Testing Tool SHALL switch dragged objects to kinematic mode during drag operations
4. WHEN the user releases a dragged object, THE Physics Testing Tool SHALL restore the object to dynamic mode
5. THE Physics Testing Tool SHALL display visual feedback for draggable objects on hover

### Requirement 4

**User Story:** As a developer, I want real-time parameter controls, so that I can tweak physics settings and see immediate results.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL provide GUI controls for gravity (x, y, z components)
2. THE Physics Testing Tool SHALL provide GUI controls for physics timestep (30fps, 45fps, 60fps)
3. THE Physics Testing Tool SHALL provide GUI controls for solver iterations (velocity and stabilization)
4. THE Physics Testing Tool SHALL provide GUI controls for object spawn rate and count
5. WHEN a parameter changes, THE Physics Testing Tool SHALL apply the change within one physics frame

### Requirement 5

**User Story:** As a developer, I want visual debugging aids, so that I can see what the physics engine is doing.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL render wireframe outlines of all physics colliders
2. THE Physics Testing Tool SHALL display velocity vectors for moving objects
3. THE Physics Testing Tool SHALL highlight sleeping bodies with a distinct color
4. THE Physics Testing Tool SHALL show collision contact points when objects collide
5. THE Physics Testing Tool SHALL provide a toggle to enable/disable debug visualization

### Requirement 6

**User Story:** As a developer, I want to test different object types, so that I can verify gem, coin, and rock physics separately.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL support spawning tetrahedron gems with accurate collider shapes
2. THE Physics Testing Tool SHALL support spawning octahedron gems with accurate collider shapes
3. THE Physics Testing Tool SHALL support spawning dodecahedron gems with accurate collider shapes
4. THE Physics Testing Tool SHALL support spawning cylindrical coins with accurate collider shapes
5. THE Physics Testing Tool SHALL allow selecting which object type to spawn via GUI controls

### Requirement 7

**User Story:** As a developer, I want to test performance tiers, so that I can verify low/medium/high tier physics settings.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL provide preset configurations for Low tier (30fps, 2 velocity iterations, 1 stabilization iteration)
2. THE Physics Testing Tool SHALL provide preset configurations for Medium tier (45fps, 4 velocity iterations, 2 stabilization iterations)
3. THE Physics Testing Tool SHALL provide preset configurations for High tier (60fps, 8 velocity iterations, 4 stabilization iterations)
4. THE Physics Testing Tool SHALL display current FPS and physics performance metrics
5. WHEN a tier preset is selected, THE Physics Testing Tool SHALL apply all tier-specific settings simultaneously

### Requirement 8

**User Story:** As a developer, I want to reset the simulation, so that I can start fresh without reloading the page.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL provide a "Reset" button that clears all spawned objects
2. WHEN reset is triggered, THE Physics Testing Tool SHALL remove all rigid bodies from the physics world
3. WHEN reset is triggered, THE Physics Testing Tool SHALL reset the camera to default position
4. WHEN reset is triggered, THE Physics Testing Tool SHALL preserve current parameter settings
5. THE Physics Testing Tool SHALL complete reset operations within 1 second

### Requirement 9

**User Story:** As a developer, I want to save and load configurations, so that I can reproduce specific test scenarios.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL provide an "Export Config" button that generates a JSON configuration
2. THE Physics Testing Tool SHALL copy exported configuration to clipboard
3. THE Physics Testing Tool SHALL provide an "Import Config" button that accepts JSON configuration
4. WHEN a configuration is imported, THE Physics Testing Tool SHALL apply all settings from the configuration
5. THE Physics Testing Tool SHALL validate imported configurations and display error messages for invalid data

### Requirement 10

**User Story:** As a developer, I want camera controls, so that I can view the simulation from different angles.

#### Acceptance Criteria

1. THE Physics Testing Tool SHALL provide orbit camera controls for mouse-based navigation
2. THE Physics Testing Tool SHALL support camera zoom via mouse wheel
3. THE Physics Testing Tool SHALL support camera pan via right-click drag
4. THE Physics Testing Tool SHALL provide a "Reset Camera" button to return to default view
5. THE Physics Testing Tool SHALL maintain smooth camera movement with damping
