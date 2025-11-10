# Product Overview: Goblin Gardens

**Goblin Gardens** is a physics-based gem collection and trading game built with React Three Fiber and Rapier physics, running on Reddit via Devvit.

## Game Concept

Players are goblins who collect "shinies" (gems and coins) in a chaotic, physics-driven 3D environment. The game embraces **Goblincore** aesthetics - celebrating the hoarding of small treasures, earthy tones, and the joy of collecting things others might consider "trash."

## Core Gameplay Loop

1. **Scrounge Mode**: Visit different locations (Rockfall, Bright Warrens, Crystal Caves) to collect falling objects
   - Physics-based collection with drag controls
   - Different locations yield different gem types and rarities
   - Costs coins to access premium locations

2. **Garden Mode**: Manage your collection in three ways
   - **Appraise**: View and organize your gems, see their values
   - **Grow**: Place gems in a growth zone to level them up over time
   - **Trade**: Create offers to sell gems to other players for 2x value

3. **Trading System**: Player-to-player marketplace
   - Browse active offers from other goblins
   - Purchase gems with your coins
   - Create your own offers to sell gems

## Key Features

### Physics-Based Interaction
- Real-time Rapier physics simulation
- Drag and drop gems with mouse/touch
- Objects bounce, collide, and stack naturally
- Performance-optimized for mobile and desktop

### Gem System
- **5 Gem Types**: Emerald, Sapphire, Amethyst, Ruby, Diamond (increasing value)
- **3 Shapes**: Tetrahedron, Octahedron, Dodecahedron (increasing complexity)
- **5 Rarities**: Common, Uncommon, Rare, Epic, Legendary (value multipliers)
- **Growth Mechanic**: Gems level up over time, increasing size and value
- **Value Calculation**: Complex formula based on type, shape, rarity, level, and size

### Economy
- **3 Coin Types**: Bronze, Silver (100 bronze), Gold (10,000 bronze)
- **Persistent State**: Player inventory saved to Redis
- **Trading**: Sell gems for 2x their appraised value
- **Location Costs**: Premium scrounge locations require payment

### Performance Optimization
- Automatic device detection (Low/Medium/High tier)
- Adaptive physics timestep and solver iterations
- Always maintains high visual quality
- Scales physics complexity based on device capability

## Design Philosophy

### Goblincore Aesthetic
- Earthy, chaotic, treasure-hoarding vibe
- Celebrates collecting "shinies" and small objects
- Warm, inviting colors for gems and UI
- Playful, non-competitive atmosphere

### Inspirations
- **Gameplay**: Idle games, physics sandboxes, collection mechanics
- **Aesthetic**: Goblincore, cozy games, treasure hunting
- **Social**: Trading card games, player marketplaces

## Platform Integration

- Runs as a Reddit post via Devvit
- Full-screen webview experience
- Reddit authentication (automatic)
- Per-user persistent state via Redis
- Moderator tools for post creation

## Target Audience

Reddit users who enjoy:
- Casual, relaxing games
- Collection and progression mechanics
- Physics-based interactions
- Trading and social features
- Goblincore aesthetic
