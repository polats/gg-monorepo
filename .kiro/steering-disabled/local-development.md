# Local Development & Testing

This guide explains how to test Goblin Gardens locally without deploying to Reddit.

## Overview

Goblin Gardens supports two development modes:

1. **Full Devvit Mode** (`npm run dev`) - Tests with real Reddit integration
2. **Local Mode** (`npm run dev:local`) - Tests locally without Reddit dependency

Local mode is faster for iteration and doesn't require Reddit authentication or network calls.

## Local Development Architecture

### Components

**Client Shim** (`src/client/devvit-shim.ts`):
- Mocks `@devvit/client` functions
- `navigateTo()` opens URLs in new tab instead of Reddit navigation
- Allows client code to run without Devvit SDK

**Local Server** (`src/server/local.ts`):
- Express server that mocks Devvit backend
- Replaces Redis with in-memory Map storage
- Provides same API endpoints as production server
- Includes CORS for cross-origin requests

**Mock Data**:
- In-memory storage for player state
- Pre-populated marketplace offers
- Mock followed users for testing UI

### How It Works

```
┌─────────────────┐         ┌──────────────────┐
│  Vite Dev       │  HTTP   │  Local Express   │
│  Server         │ ◄─────► │  Server          │
│  (Port 5173)    │         │  (Port 3000)     │
│                 │         │                  │
│  - React App    │         │  - Mock Redis    │
│  - Hot Reload   │         │  - API Routes    │
│  - Devvit Shim  │         │  - CORS Enabled  │
└─────────────────┘         └──────────────────┘
```

## Starting Local Development

### 1. Start Local Mode

```bash
npm run dev:local
```

This runs two processes:
- **CLIENT**: Vite dev server on `http://localhost:5173`
- **API**: Express server on `http://localhost:3000`

### 2. Open Browser

Navigate to `http://localhost:5173`

The game will:
- Load instantly (no Reddit authentication)
- Use mock username "LocalDevUser"
- Store data in memory (resets on server restart)
- Support hot module reloading

## Local vs Devvit Mode Comparison

| Feature | Local Mode | Devvit Mode |
|---------|-----------|-------------|
| **Speed** | Instant startup | ~30s startup |
| **Hot Reload** | Yes (Vite HMR) | No (rebuild required) |
| **Authentication** | Mock user | Real Reddit auth |
| **Data Storage** | In-memory Map | Redis (persistent) |
| **Network** | Localhost only | Reddit servers |
| **Multi-user Testing** | Manual (multiple tabs) | Real users |
| **Best For** | UI/UX iteration | Integration testing |

## Local Server Features

### Mock Storage

```typescript
// In-memory Map replaces Redis
const mockStorage = new Map<string, string>();

// Player state keys
mockStorage.set('playerState:LocalDevUser', JSON.stringify(playerState));

// Active offers
const activeOffers = new Map<string, ActiveOffer>();
```

### Mock Context

```typescript
const mockContext = {
  postId: 'mock-post-123',
  subredditName: 'test',
  username: 'LocalDevUser',
};
```

### API Endpoints

All production endpoints are available:
- `GET /api/init` - Initialize session
- `POST /api/player-state/save` - Save player data
- `GET /api/player-state/load` - Load player data
- `GET /api/offers` - Get marketplace offers
- `POST /api/offers/update` - Create offer
- `DELETE /api/offers/remove` - Remove offer
- `POST /api/trade/execute` - Execute trade

### Username Header

Local server supports custom usernames via header:

```typescript
fetch('/api/player-state/save', {
  headers: {
    'X-Username': 'Player_ABC123',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ playerState }),
});
```

This enables multi-user testing in a single browser.

## Multi-User Testing

### Session-Based Usernames

The client generates unique usernames per browser tab:

```typescript
// In PileDemo.tsx
const [effectiveUsername] = useState(() => {
  const isLocalDev = username === 'LocalDevUser' || !username;
  
  if (!isLocalDev) {
    return username; // Production: use Reddit username
  }
  
  // Local dev: generate or retrieve session-specific username
  const storedUsername = sessionStorage.getItem('localDevUsername');
  if (storedUsername) return storedUsername;
  
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newUsername = `Player_${randomId}`;
  sessionStorage.setItem('localDevUsername', newUsername);
  return newUsername;
});
```

### Testing Trading Between Users

1. Open two browser tabs to `http://localhost:5173`
2. Each tab gets a unique username (e.g., `Player_ABC123`, `Player_XYZ789`)
3. In Tab 1: Create an offer with gems
4. In Tab 2: Browse marketplace and buy from Tab 1's user
5. Verify trade completes and both inventories update

### Clearing Session Data

To reset a tab's username:
```javascript
// In browser console
sessionStorage.removeItem('localDevUsername');
location.reload();
```

## Testing Workflows

### UI/UX Iteration

```bash
# Start local mode
npm run dev:local

# Make changes to client code
# Browser auto-reloads with changes
# No build step needed
```

**Best for:**
- Component styling
- Layout adjustments
- Animation tweaks
- Touch controls
- Performance optimization

### API Integration Testing

```bash
# Start local mode
npm run dev:local

# Test API calls in browser console
fetch('http://localhost:3000/api/init')
  .then(r => r.json())
  .then(console.log);
```

**Best for:**
- API request/response validation
- Error handling
- State persistence
- Trading logic

### Multi-User Trading

```bash
# Start local mode
npm run dev:local

# Open multiple tabs
# Each tab = different user
# Test trading between tabs
```

**Best for:**
- Marketplace functionality
- Trade execution
- Offer creation/removal
- Race condition testing

### Full Integration Testing

```bash
# Start Devvit mode
npm run dev

# Open playtest URL
# Test with real Reddit auth and Redis
```

**Best for:**
- Reddit authentication
- Persistent storage
- Production-like environment
- Final validation before deploy

## Debugging Local Mode

### Server Logs

The local server logs all API calls:

```
[SAVE] Player state saved for Player_ABC123: { coins: {...}, gemCount: 15 }
[LOAD] Player state loaded for Player_ABC123: { coins: {...}, gemCount: 15 }
[OFFER UPDATE] Player_ABC123 created offer: { gemCount: 3, totalValue: 5000 }
[TRADE] Player_XYZ789 bought 3 gems from Player_ABC123 for 5000 bronze
```

### Client Console

Check browser console for:
- API fetch calls
- Username generation
- State updates
- Error messages

### Network Tab

Monitor API calls in browser DevTools:
- Request/response payloads
- Status codes
- Response times
- CORS headers

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev:server:local
```

### CORS Errors

Local server has CORS enabled by default:

```typescript
app.use(cors()); // Allows all origins in local mode
```

If you still see CORS errors, check that:
1. Client is requesting `http://localhost:3000` (not `localhost:5173`)
2. Server is running on port 3000
3. No browser extensions blocking requests

### Data Not Persisting

Local mode uses in-memory storage:
- Data resets when server restarts
- Each tab has separate session username
- No persistence between sessions

This is intentional for fast iteration.

### Username Conflicts

If testing with multiple tabs and seeing wrong data:
1. Check `sessionStorage.getItem('localDevUsername')` in console
2. Verify each tab has unique username
3. Clear session storage and reload if needed

## Transitioning to Devvit Mode

When ready to test with Reddit:

```bash
# Stop local mode (Ctrl+C)

# Start Devvit mode
npm run dev

# Wait for playtest URL
# Open URL in browser
# Authenticate with Reddit
```

Changes to test in Devvit mode:
- Reddit authentication flow
- Real usernames from Reddit API
- Redis persistence (data survives restarts)
- Subreddit integration
- Post creation

## Best Practices

### Development Workflow

1. **Start with local mode** for rapid iteration
2. **Test UI/UX changes** with hot reload
3. **Verify API integration** with multiple tabs
4. **Switch to Devvit mode** for final validation
5. **Deploy** when everything works

### When to Use Each Mode

**Use Local Mode:**
- Building new features
- Styling components
- Debugging physics
- Testing game mechanics
- Rapid prototyping

**Use Devvit Mode:**
- Testing Reddit integration
- Validating persistence
- Multi-user testing with real users
- Pre-deployment checks
- Debugging production issues

### Code Compatibility

Write code that works in both modes:

```typescript
// ✅ Good: Works in both modes
const username = await reddit.getCurrentUsername() ?? 'anonymous';

// ✅ Good: Conditional imports
import { navigateTo } from '@devvit/client';
// Falls back to devvit-shim.ts in local mode

// ❌ Bad: Assumes Devvit context always exists
const { postId } = context; // Crashes in local mode without mock
```

## Performance Testing

Local mode is ideal for performance testing:

```typescript
// Enable performance monitoring
<Canvas>
  <Stats /> {/* FPS counter */}
  <Perf position="top-left" /> {/* Detailed stats */}
  ...
</Canvas>
```

Test scenarios:
- Spawn 500+ objects and monitor FPS
- Test on different performance tiers
- Verify sleeping body optimization
- Check memory usage over time
- Test mobile device performance

## Limitations

Local mode cannot test:
- Reddit authentication
- Subreddit-specific features
- Post creation
- Reddit API calls
- Production Redis behavior
- Network latency
- Real user interactions

For these, use Devvit mode (`npm run dev`).
