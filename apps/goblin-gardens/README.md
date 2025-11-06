# Goblin Gardens

A physics-based gem collection and trading game built with React Three Fiber, running on Reddit via Devvit.

## What is Goblin Gardens?

Goblin Gardens is a cozy, chaotic game where you play as a goblin collecting "shinies" (gems and coins) in a 3D physics sandbox. Embrace the **Goblincore** aesthetic - hoarding treasures, growing your collection, and trading with other goblins.

### Core Gameplay

1. **Scrounge**: Visit different locations to collect falling gems and coins
   - Drag objects with physics-based controls
   - Different locations yield different treasures
   - Premium locations cost coins to access

2. **Garden**: Manage your collection
   - **Appraise**: View and organize your gems
   - **Grow**: Level up gems over time to increase their value
   - **Trade**: Create offers to sell gems to other players

3. **Trade**: Player-to-player marketplace
   - Browse offers from other goblins
   - Buy gems with your coins
   - Sell gems for 2× their appraised value

### Key Features

- **Physics-Based**: Real-time Rapier physics with drag-and-drop
- **Gem System**: 5 types × 3 shapes × 5 rarities = endless variety
- **Growth Mechanic**: Gems level up and grow in size over time
- **Trading**: Sell to other players for profit
- **Performance Optimized**: Runs smoothly on mobile and desktop
- **Persistent State**: Your collection is saved automatically

## Technology Stack

- **Frontend**: React 19 + React Three Fiber + Rapier Physics
- **Backend**: Devvit (Reddit platform) + Express + Redis
- **Build**: Vite + TypeScript
- **3D**: Three.js with instanced rendering

## Getting Started

### Prerequisites

- Node.js 22 or higher
- Reddit account (for Devvit authentication)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Login to Devvit:
   ```bash
   npm run login
   ```

### Development

**Full Devvit Testing** (with Reddit integration):
```bash
npm run dev
```
Opens a playtest URL with real Reddit authentication and Redis persistence.

**Local Development** (faster iteration):
```bash
npm run dev:local
```
Runs client and mock API server locally without Reddit dependency.

### Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Reddit:
   ```bash
   npm run deploy
   ```

3. Publish for review:
   ```bash
   npm run launch
   ```

## Commands

- `npm run dev` - Full Devvit development with Reddit integration
- `npm run dev:local` - Local development (faster, no Reddit)
- `npm run build` - Build for production
- `npm run deploy` - Upload to Reddit
- `npm run launch` - Publish for review
- `npm run check` - Type check, lint, and format
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code

## Project Structure

```
src/
├── client/              # React Three Fiber app
│   ├── components/      # 3D and UI components
│   ├── utils/          # Game logic and calculations
│   ├── constants/      # Game configuration
│   └── PileDemo.tsx    # Main game component
├── server/             # Express API server
│   ├── index.ts        # API routes and trading logic
│   └── core/           # Business logic
└── shared/             # Shared TypeScript types
    └── types/api.ts    # API contracts
```

## Game Mechanics

### Gem Value Formula

```
value = baseValue × shapeMultiplier × rarityMultiplier × (1 + level × 0.1) × (sizeInMm / 100)
```

- **Type**: Emerald (10) → Sapphire (25) → Amethyst (50) → Ruby (100) → Diamond (200)
- **Shape**: Tetrahedron (1.0×) → Octahedron (1.5×) → Dodecahedron (2.0×)
- **Rarity**: Common (1.0×) → Uncommon (1.5×) → Rare (2.0×) → Epic (3.0×) → Legendary (5.0×)
- **Level**: Each level adds +10% value
- **Size**: Measured in millimeters, grows over time

### Economy

- **Bronze**: Base currency
- **Silver**: 100 bronze
- **Gold**: 10,000 bronze

### Trading

- Sell gems for **2× their appraised value**
- Atomic transactions prevent exploits
- Marketplace shows all active offers

## Performance

The game automatically detects your device and optimizes physics:

- **Low Tier**: 30 fps physics, reduced solver iterations
- **Medium Tier**: 45 fps physics, balanced settings
- **High Tier**: 60 fps physics, maximum accuracy

Visual quality is always high (shadows, lighting, full object counts).

## Contributing

This is a personal project, but feedback and suggestions are welcome!

## License

BSD-3-Clause

## Cursor Integration

This project is optimized for Cursor IDE. [Download Cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted for enhanced development experience.
