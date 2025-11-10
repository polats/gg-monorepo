# Goblin Gardens Splash Screens

A collection of 5 unique generative art splash screens created for the Goblin Gardens project, each embodying different aspects of goblin culture, Goblincore aesthetics, and the game's core themes.

## Overview

These splash screens were created using the **algorithmic art skill** with p5.js, combining computational aesthetics with the chaotic, playful nature of goblins. Each screen is a self-contained interactive HTML file with adjustable parameters and seeded randomness for reproducible variations.

---

## 🎨 The Collection

### 1. **Cascading Gravity**

**File:** `splash-1-cascading-gravity.html`
**Philosophy:** `philosophy-1-cascading-gravity.md`
**Seed:** 42

**Concept:** Particles falling through invisible gravitational wells, creating luminous trails that map the physics-based force fields.

**Visual:** Light background with colorful particle trails (green/blue/orange) flowing toward gravity wells.

**Parameters:**

- Particle Count (20-150)
- Gravity Wells (2-12)
- Well Strength (0.5-5.0)
- Trail Length (5-50)
- Spawn Rate (1-5)

**Connection to Game:** Represents the physics simulation at the heart of Goblin Gardens—objects falling, bouncing, and interacting in a playful environment.

---

### 2. **Shiny Hoarder's Delight**

**File:** `splash-2-shiny-hoarders-delight.html`
**Philosophy:** `philosophy-2-shiny-hoarders-delight.md`
**Seed:** 777

**Concept:** Metallic "shinies" (gold, silver, copper, bronze) gravitating toward hoard collection points, creating glittering piles of treasure.

**Visual:** Dark cave background with glowing metallic particles accumulating into golden piles.

**Parameters:**

- Hoard Piles (1-6)
- Shiny Spawn Rate (1-8)
- Shiny Size (3-12)
- Gravity Strength (0.1-0.8)
- Attraction Force (0.5-3.0)

**Connection to Game:** Embodies the Goblincore love of hoarding "shinies"—the satisfying "number go up" resource gathering mechanic.

---

### 3. **Swarm Intelligence**

**File:** `splash-3-swarm-intelligence.html`
**Philosophy:** `philosophy-3-swarm-intelligence.md`
**Seed:** 1337

**Concept:** Hundreds of goblin agents using boids flocking algorithms (separation, alignment, cohesion) to move as a coordinated swarm toward loot points.

**Visual:** Dark forest floor with green-yellow glowing creatures clustering and flowing, with golden loot points appearing and disappearing.

**Parameters:**

- Goblin Count (50-300)
- Cohesion (0.1-2.0)
- Separation (0.5-3.0)
- Alignment (0.1-2.0)
- Max Speed (1-6)
- Perception Radius (20-100)

**Connection to Game:** Captures the essence of goblins—weak individually but powerful as a swarm, representing community gameplay.

---

### 4. **Mycelium Network**

**File:** `splash-4-mycelium-network.html`
**Philosophy:** `philosophy-4-mycelium-network.md`
**Seed:** 420

**Concept:** Organic growth simulation of fungal mycelium threads branching and spreading through dark soil, with glowing new growth and drifting spores.

**Visual:** Dark soil background with pale green-white fungal threads growing recursively, brown older growth, floating spores.

**Parameters:**

- Growth Speed (1-10)
- Branch Probability (0.01-0.15)
- Branch Angle (10-60°)
- Thread Thickness (0.5-3.0)
- Spore Count (0-50)

**Connection to Game:** Represents Goblincore's love of mushrooms, decay, and interconnected ecosystems—the hidden beauty of nature's "ugly" processes.

---

### 5. **Chaotic Excavation**

**File:** `splash-5-chaotic-excavation.html`
**Philosophy:** `philosophy-5-chaotic-excavation.md`
**Seed:** 666

**Concept:** Multiple "digger" agents carving chaotic tunnel networks through stratified earth, creating chambers and discovering treasure in the depths.

**Visual:** Cross-section view of brown earth being carved into black voids by colorful goblin diggers, with golden treasure in deep chambers.

**Parameters:**

- Digger Count (2-12)
- Chaos Level (0.1-0.9)
- Dig Speed (1-10)
- Chamber Probability (0.01-0.1)
- Treasure Count (0-20)

**Connection to Game:** Visualizes the "dig deeper" theme—goblins excavating chaotically versus structured dwarven engineering, exploration and discovery.

---

## 🎮 How to Use

Each splash screen is a **self-contained HTML file** that can be:

1. **Opened directly in a browser** - Just double-click any `.html` file
2. **Embedded in the game** - Use as loading screens or menu backgrounds
3. **Customized via parameters** - All sliders adjust the generative algorithm in real-time
4. **Explored via seed navigation** - Previous/Next/Random buttons create infinite variations

### Seed Navigation

Every splash screen uses **seeded randomness** (like Art Blocks):

- Same seed = identical output every time
- Use Prev/Next to explore sequential variations
- Use Random to discover new patterns
- Type a specific seed number to jump to it

---

## 🛠 Technical Details

**Framework:** p5.js (loaded from CDN)
**Design:** Anthropic brand styling (Poppins/Lora fonts, signature colors)
**Canvas Size:** 1200x1200px (responsive)
**Browser Compatibility:** Modern browsers with HTML5 Canvas support

All artwork is generated **live in the browser**—no pre-rendered images, just pure algorithmic beauty.

---

## 🎨 Design Philosophy

These splash screens follow the **algorithmic art philosophy**:

1. **Algorithmic Expression** - Beauty emerges from computational processes, not static composition
2. **Emergent Behavior** - Complex patterns arise from simple rules
3. **Parametric Variation** - Adjustable parameters reveal different facets of the same system
4. **Seeded Reproducibility** - Each seed creates a unique but repeatable artwork
5. **Master Craftsmanship** - Every parameter meticulously tuned for maximum expressiveness

Each piece represents **hours of refinement** to achieve the perfect balance of chaos and order, making it feel effortless while being deeply optimized.

---

## 📁 File Structure

```
splash-screens/
├── README.md
├── philosophy-1-cascading-gravity.md
├── philosophy-2-shiny-hoarders-delight.md
├── philosophy-3-swarm-intelligence.md
├── philosophy-4-mycelium-network.md
├── philosophy-5-chaotic-excavation.md
├── splash-1-cascading-gravity.html
├── splash-2-shiny-hoarders-delight.html
├── splash-3-swarm-intelligence.html
├── splash-4-mycelium-network.html
└── splash-5-chaotic-excavation.html
```

---

## 🎯 Thematic Connections

| Splash Screen           | Goblin Trait | Goblincore Element | Game Mechanic            |
| ----------------------- | ------------ | ------------------ | ------------------------ |
| Cascading Gravity       | Chaos        | Physics play       | Core physics engine      |
| Shiny Hoarder's Delight | Greed        | Collecting shinies | Resource gathering       |
| Swarm Intelligence      | Swarms       | Community          | Multiplayer coordination |
| Mycelium Network        | Nature       | Mushrooms, decay   | Interconnected systems   |
| Chaotic Excavation      | Digging      | Dark, dungeons     | Exploration, discovery   |

---

## 🌟 Credits

Created using the **/algorithmic-art** skill for Goblin Gardens, a Dwarves vs. Goblins community game built on Reddit's Devvit platform.

**Techniques Used:**

- Particle systems & physics simulation
- Boids flocking algorithms
- L-system branching
- Cellular automata
- Procedural generation

**Inspired by:**

- Goblincore aesthetic movement
- Art Blocks generative NFTs
- Classic generative artists (Craig Reynolds, Karl Sims)
- The chaotic beauty of goblin culture

---

_Each splash screen is a love letter to computational art and goblin mischief._ 🧙‍♂️✨
