# Goblin Gardens - Art Direction Research

## Project Context

**Game:** Goblin Gardens
**Platform:** Mobile (Reddit Client)
**Theme:** Goblins scavenging trash from above to build their garden, unaware it comes from dwarves living one level above them
**Genre:** Garden building, scavenging mechanics, meta-fictional Dwarves vs. Goblins universe

---

## 1. Goblin Representation in Popular Media & Mythology

### Mythological Origins

**European Folklore Roots:**
- Small, grotesque, monstrous humanoid creatures appearing in multiple European cultures
- First attested in stories from the Middle Ages
- Traditionally reserved for "ugly fairies" that are mischievous or malevolent
- Primary purpose: cause trouble to humankind (vengeful, greedy, chaotic)
- Smaller population possess kinder temperaments
- Often rumored to hold magical abilities

**Physical Characteristics (Traditional):**
- Unruly hair and green-colored skin (most common)
- Long, grasping fingers ending in claws
- Decidedly inhuman eyes
- Long and pointed ears
- Small stature

**Cultural Variations:**
- **Germany (Kobolds):** Similar to goblins, sometimes caring domestic helpers, can become angry if offended
- **South Korea (Dokkaebi):** Capable of both good and evil

### Modern Pop Culture Representations

**Literary & Gaming:**

**J.R.R. Tolkien:**
- Goblins and orcs used synonymously
- Post-Tolkien fantasy: goblins typically smaller and trickier vs. orcs being larger and brutish

**Dungeons & Dragons:**
- Popularized in fantasy role-playing
- Staple of random encounters
- Portrayed as barbaric foes

**Harry Potter:**
- Strange but civilized humanoids
- Often serve as bankers or craftsmen
- More sophisticated portrayal

**Video Games:**
- **Clash of Clans:** Small, green-skinned with big pointy ears, constant grin, obsessed with LOOT, faster than Spring Trap
- **Deep Rock Galactic (lore):** Ship maintenance crew, smaller stature helps reach problem areas, love working with mechanical things
- **Warcraft, Final Fantasy, Magic: the Gathering, Runescape:** Recurring fantasy staple

**Comics/Film:**
- **Green Goblin (Spider-Man):** Well-known supervillain archetype

### Goblincore Aesthetic (2024-2025)

**Definition:** The "darker companion to cottagecore"

**Visual Elements:**
- Earth tones in darker shades
- Natural finds and foraged items
- Mushrooms, moss, stones, bones
- "Slightly less conventional things"
- Focus on treasures others might overlook (trash to treasure mentality)
- Celebration of the weird, imperfect, and earthy

**Cultural Zeitgeist:**
- Active TikTok trend (2024-2025)
- Connection to 90s Saturday morning cartoons
- Anti-perfectionist, pro-chaos energy
- "Shinies" obsession (shiny objects, treasures)

---

## 2. Design Principles Alignment

From `docs/design-principles.md`:

**Goblin Keywords/Vibes:**
- Greed, Sneaky, Swarms, Gold, Weak, Hive, Shadows, Dark, Thieves, Shinies, Dungeon, Scout, Chaos, Low Level, Trash, Goblincore

**Inspirations:**
- **Games:** Plants vs. Zombies, Orcs Must Die, Deep Rock Galactic, Vampire Survivor
- **Shows/Anime:** Isekai (Solo Leveling, Shield Hero, Slime), Delicious in Dungeon, Frieren
- **Idle/Strategy:** Zombie Idle Miner, Clash of Clans

**Feelings to Evoke:**
- Power Fantasy
- Number Go Up
- Community/Guilds
- Exploration/Discovery
- Going Deeper

---

## 3. Relevant Game Art Styles Analysis

### Plants vs. Zombies
- **Style:** Hand-painted with black outlines
- **Approach:** Dynamic vector illustration (licensing materials move beyond static 3/4 view)
- **Character Design:** Exaggerated, cartoonish, instantly recognizable silhouettes
- **Mobile Optimization:** Clean, readable at small sizes
- **Tone:** Lighthearted, accessible, comedic

### Deep Rock Galactic
- **Style:** Stylized/Simplistic 3D (not truly "low-poly" but efficient polygon use)
- **Visual Approach:** "Clay-with-grooves" aesthetic for characters
- **Texture Strategy:** Detail from textures and lighting rather than geometry
- **Environment:** Masks lower-poly design with density (flora, fauna, verticality)
- **Tone:** Cool, tough with a bit of silliness

### Orcs Must Die
- **Style:** Cartoonish, stylized 3D
- **Tone:** Lighthearted, doesn't take itself seriously
- **Visual Quality:** Larger-than-life with vibrant colors
- **Character Design:** Unique, whimsical (World of Warcraft-derived)
- **Age Resistance:** Stylized approach ages better than photorealism

### Vampire Survivors
- **Style:** Pixel art, minimalist
- **Gameplay Integration:** Retro aesthetic supports bullet hell mechanics
- **Mobile Optimization:** Works in landscape mode, 1-4 player couch co-op
- **Performance:** Lightweight, runs on any device

### Don't Starve
- **Style:** Dark gothic cartoon (Tim Burton/Edward Gorey/Addams Family inspired)
- **Technical:** Bone animation with Flash-created assets
- **Color Palette:** No vibrant/happy colors - grim, dark, cold world
- **Philosophy:** Simplistic beauty, memorable over graphically intensive
- **Tone:** Dark supernatural yet cartoonish

### Clash of Clans
- **Goblin Design:** Small, green-skinned, big pointy ears, constant grin, sparkly eyes
- **Character:** Obsessed with LOOT, fast, limitless hunger for resources
- **Style:** Bold, colorful, mobile-optimized cartoon 3D
- **Clarity:** High contrast, readable on small screens

---

## 4. Art Style Options for Goblin Gardens

### Option 1: Stylized Low-Poly 3D
**"Chunky Goblincore"**

**Visual Characteristics:**
- Simplified 3D models with efficient polygon counts
- "Clay-like" texture quality with painted detail
- Exaggerated proportions (big heads, small bodies)
- Soft edges and rounded forms
- Warm, earthy color palette with darker goblincore tones

**Inspirations:**
- Deep Rock Galactic (technical approach)
- Stylized goblin wizard models (cartoon proportions)
- Goblin Stone (character-focused 3D)

**Advantages for Mobile/Reddit Client:**
- Performance-efficient for mobile devices
- Scalable - looks good at various resolutions
- Allows for dynamic lighting and depth
- 3D assets can be reused from multiple angles
- Easier to animate (rigged models)

**Color Palette:**
- Forest greens, muddy browns, mossy tones
- Pops of "shinies" (gold, silver, colorful trash)
- Darker earth tones for shadows/depth
- Warm lighting to offset darker palette

**Technical Considerations:**
- Requires 3D modeling/rigging pipeline
- Good for future expansion (adding new items/characters)
- Can use normal maps for detail without high poly counts
- WebGL/Three.js implementation for browser

**Best For:**
- Premium feel with casual gameplay
- Players who want tactile, "toy-like" quality
- Long-term project with asset reusability

---

### Option 2: Cartoon-Casual Vector
**"Trash Treasure Tycoon"**

**Visual Characteristics:**
- Bold outlines (black or dark colored)
- Flat or subtle gradient shading
- Expressive, exaggerated character designs
- High saturation for "shinies" and treasures
- Clean, readable silhouettes

**Inspirations:**
- Plants vs. Zombies (dynamic vector style)
- Clash of Clans (bold mobile-friendly designs)
- Orcs Must Die (cartoonish, lighthearted tone)

**Advantages for Mobile/Reddit Client:**
- Extremely lightweight (vector graphics)
- Crystal clear on any screen size/resolution
- Fast to render, minimal performance impact
- Easy to create variations and new content
- Strong visual identity and brand recognition

**Color Palette:**
- Vibrant greens for goblins
- Rich, saturated colors for treasures/items
- Darker goblincore backgrounds (caves, shadows)
- High contrast for readability
- "Glow" effects for special items

**Technical Considerations:**
- Can be created in Illustrator/Figma
- Sprite-based or HTML5 Canvas rendering
- Small file sizes for fast loading
- Animation through sprite sheets or skeletal 2D animation
- Easy for UI/UX integration

**Best For:**
- Quick iteration and content updates
- Broad audience appeal (casual + core players)
- Strong branding potential
- Similar vibe to design inspirations (PvZ, Clash)

---

### Option 3: Hand-Drawn Dark Whimsy
**"Burton's Goblin Garden"**

**Visual Characteristics:**
- Hand-drawn line art with deliberate imperfections
- Tim Burton/Edward Gorey influenced aesthetic
- Scratchy textures and cross-hatching
- Muted, desaturated base colors with selective bright accents
- Asymmetrical, slightly unsettling designs

**Inspirations:**
- Don't Starve (gothic cartoon aesthetic)
- Goblincore aesthetic (dark companion to cottagecore)
- Edward Gorey illustrations
- Delicious in Dungeon (detailed food/item art)

**Advantages for Mobile/Reddit Client:**
- Unique, immediately distinctive visual identity
- Appeals to indie game aesthetic lovers
- Matches "trash to treasure" narrative perfectly
- Can use parallax 2D layers for depth
- Lower barrier to entry for hand-drawn assets

**Color Palette:**
- Desaturated earth tones (browns, grays, muted greens)
- Parchment/aged paper backgrounds
- Selective saturation on important items (treasures glow)
- Heavy use of shadows and darkness
- Warm candlelight/mushroom glow as light sources

**Technical Considerations:**
- Hand-drawn or digitally painted assets
- Can mix with Flash-style bone animation
- 2D sprite-based or layered composition
- Texture overlay for "paper/canvas" feel
- Particle effects for atmosphere (dust, spores, sparkles)

**Best For:**
- Story-rich, atmospheric experience
- Players who love indie/art-house games
- Differentiation in crowded mobile market
- Mature audience (Reddit demographic)

---

## 5. Recommendations

### Primary Recommendation: **Option 2 - Cartoon-Casual Vector**

**Rationale:**

1. **Platform Optimization:** Reddit mobile client requires lightweight, fast-loading assets. Vector graphics excel here.

2. **Design Inspiration Alignment:** Matches your stated inspirations (Plants vs. Zombies, Clash of Clans) most directly.

3. **Development Velocity:** Fastest to iterate and produce content for a growing game.

4. **Audience Fit:** Reddit's diverse user base responds well to accessible, colorful casual art styles.

5. **Scalability:** Easy to add new items, characters, and variations as game grows.

6. **Brand Potential:** Strong, memorable visual identity for community building (important for Reddit-based game).

### Secondary Recommendation: **Option 1 - Stylized Low-Poly 3D**

**If you have:**
- 3D pipeline/expertise available
- Longer development timeline
- Goal for premium positioning
- Plans for future 3D features (camera rotation, etc.)

### Tertiary Option: **Option 3 - Hand-Drawn Dark Whimsy**

**If you want:**
- Niche positioning in indie/art-game space
- Older/mature Reddit demographic targeting
- Story-heavy, atmospheric experience
- To stand out dramatically from other mobile games

---

## 6. Hybrid Approach Possibility

Consider combining elements:
- **Base:** Option 2 (Cartoon-Casual Vector) for characters and UI
- **Special Items:** Option 3 hand-drawn aesthetic for rare treasures
- **Effects:** Stylized 3D particles for "juice" and satisfaction

This creates visual hierarchy: common items are clean vectors, rare items have special hand-drawn treatment, making them feel more precious.

---

## 7. Next Steps

1. **Create mood boards** for chosen direction(s)
2. **Design goblin character variations** (3-5 goblin types)
3. **Develop item asset style** (trash items, garden items, treasures)
4. **UI/UX mockups** in chosen art style
5. **Motion tests** (idle animations, planting, scavenging)
6. **Color palette finalization** with accessibility testing
7. **Asset pipeline establishment** (tools, formats, naming conventions)

---

## 8. Reference Links & Resources

**Goblin Character Design:**
- Sketchfab: Stylized Goblin Wizard (blue, cartoon proportions, family-friendly)
- CGTrader: Collection of 8 stylized goblin characters
- Dribbble: 400+ goblin design inspiration boards

**Art Style References:**
- Deep Rock Galactic ArtStation portfolios
- Plants vs. Zombies Style Guide (Design Force)
- Don't Starve concept art (Klei Entertainment)
- Goblin Stone (2024 turn-based RPG with goblin protagonists)

**Goblincore Aesthetic:**
- Pinterest goblincore boards (2025 active)
- TikTok #goblincore and #goblindnd
- Aesthetics Wiki - Goblincore entry

**Similar Games (2024-2025):**
- Kamaeru: A Frog Refuge (cozy collecting)
- Smushi Come Home (mushroom foraging)
- Forest Doesn't Care (atmospheric mushroom picking)
- Goblin Stone (narrative goblin RPG)

---

*Document created: 2025-10-23*
*For: Goblin Gardens - Dwarves vs. Goblins Universe*
*Platform: Mobile (Reddit Client)*
