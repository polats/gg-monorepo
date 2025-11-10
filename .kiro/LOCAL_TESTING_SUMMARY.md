# Local Testing Setup - Quick Reference

## What Was Created

### Local Development Infrastructure

1. **Devvit Shim** (`src/client/devvit-shim.ts`)
   - Mocks `@devvit/client` functions for local development
   - Currently implements: `navigateTo(url)` → opens in new tab
   - Allows client to run without Devvit SDK

2. **Local Server** (`src/server/local.ts`)
   - Express server that mocks Devvit backend
   - In-memory Map storage (replaces Redis)
   - All production API endpoints available
   - CORS enabled for localhost requests
   - Supports X-Username header for multi-user testing

3. **Session-Based Usernames** (in `PileDemo.tsx`)
   - Each browser tab gets unique username
   - Format: `Player_ABC123` (random 6-char ID)
   - Stored in sessionStorage
   - Enables multi-user testing in single browser

### Documentation

4. **local-development.md** (Steering File)
   - Complete guide to local testing
   - Architecture diagrams
   - Multi-user testing workflows
   - Debugging tips
   - Best practices

### Agent Hooks

5. **devvit-shim-validator.kiro.hook**
   - Validates @devvit/client imports have shim fallbacks
   - Suggests mock implementations for missing functions
   - Ensures local development compatibility

6. **local-server-sync.kiro.hook**
   - Keeps local.ts in sync with index.ts
   - Validates API endpoints match
   - Checks critical logic (gem values) match
   - Prevents local/production divergence

7. **local-to-devvit-checklist.kiro.hook** (Manual)
   - Generates pre-flight checklist for Devvit testing
   - Disabled by default (enable when ready to test on Reddit)
   - Provides transition steps and common issues

8. **multi-user-test-helper.kiro.hook** (Manual)
   - Generates multi-user test scenarios
   - Disabled by default (enable when testing trading)
   - Provides step-by-step instructions for multiple tabs

## Quick Start

### Start Local Development

```bash
npm run dev:local
```

Opens:
- Client: `http://localhost:5173` (Vite dev server)
- API: `http://localhost:3000` (Express mock server)

### Test Multi-User Trading

1. Open Tab 1: `http://localhost:5173`
   - Username: `Player_ABC123` (auto-generated)
   - Collect gems, create offer

2. Open Tab 2: `http://localhost:5173`
   - Username: `Player_XYZ789` (different auto-generated)
   - Browse marketplace, buy from Tab 1

3. Verify trade completes in both tabs

### Switch to Devvit Mode

```bash
# Stop local mode (Ctrl+C)
npm run dev

# Wait for playtest URL
# Open in browser, authenticate with Reddit
```

## Key Features

### Local Mode Benefits

✅ **Instant Startup**: No Reddit auth, no network calls
✅ **Hot Module Reload**: Changes appear immediately
✅ **Multi-User Testing**: Multiple tabs = multiple users
✅ **Fast Iteration**: No build step for client changes
✅ **Offline Development**: Works without internet

### What Local Mode Can't Test

❌ Reddit authentication
❌ Real Reddit usernames
❌ Persistent Redis storage
❌ Subreddit integration
❌ Production network conditions

## Architecture

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

## Common Commands

```bash
# Local development (fast iteration)
npm run dev:local

# Devvit development (integration testing)
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Type check
npm run type-check

# Lint and format
npm run check
```

## Multi-User Testing

### Session Username System

Each browser tab automatically gets a unique username:

```typescript
// Generated on first load
Player_ABC123  // Tab 1
Player_XYZ789  // Tab 2
Player_DEF456  // Tab 3
```

### Reset Username

```javascript
// In browser console
sessionStorage.removeItem('localDevUsername');
location.reload();
```

### Manual Username

```javascript
// In browser console
sessionStorage.setItem('localDevUsername', 'TestUser1');
location.reload();
```

## Debugging

### Server Logs

Watch terminal for API calls:
```
[SAVE] Player state saved for Player_ABC123: { coins: {...}, gemCount: 15 }
[LOAD] Player state loaded for Player_ABC123
[OFFER UPDATE] Player_ABC123 created offer: { gemCount: 3, totalValue: 5000 }
[TRADE] Player_XYZ789 bought 3 gems from Player_ABC123 for 5000 bronze
```

### Client Console

Check browser console for:
- Username generation
- API fetch calls
- State updates
- Error messages

### Network Tab

Monitor API calls:
- Request/response payloads
- Status codes
- Response times

## Best Practices

### Development Workflow

1. **Start with local mode** for UI/UX work
2. **Test features** with multiple tabs
3. **Verify API integration** works correctly
4. **Switch to Devvit mode** for final validation
5. **Deploy** when everything works

### When to Use Each Mode

**Local Mode:**
- Building new features
- Styling components
- Debugging physics
- Testing game mechanics
- Rapid prototyping

**Devvit Mode:**
- Testing Reddit integration
- Validating persistence
- Multi-user with real users
- Pre-deployment checks

## Critical Sync Points

⚠️ **Keep these in sync:**

1. **Gem Value Calculation**
   - `src/client/utils/gemValue.ts::calculateGemValue()`
   - `src/server/index.ts::calculateGemValue()`
   - `src/server/local.ts::calculateGemValue()`

2. **API Endpoints**
   - `src/server/index.ts` (production)
   - `src/server/local.ts` (local mock)

3. **Devvit Functions**
   - `@devvit/client` imports
   - `src/client/devvit-shim.ts` mocks

## Troubleshooting

### Port Already in Use

```bash
lsof -ti:3000 | xargs kill -9
```

### CORS Errors

Local server has CORS enabled. If you see errors:
1. Verify server is running on port 3000
2. Check client is requesting `http://localhost:3000`
3. Disable browser extensions

### Data Not Persisting

Local mode uses in-memory storage:
- Data resets on server restart
- This is intentional for fast iteration
- Use Devvit mode for persistent testing

### Username Conflicts

Check username in console:
```javascript
sessionStorage.getItem('localDevUsername')
```

Clear and reload if needed:
```javascript
sessionStorage.removeItem('localDevUsername');
location.reload();
```

## Resources

- **Full Guide**: `.kiro/steering/local-development.md`
- **Tech Stack**: `.kiro/steering/tech.md`
- **Game Mechanics**: `.kiro/steering/game-mechanics.md`
- **Project Structure**: `.kiro/steering/structure.md`

## Agent Hooks

Enable manual hooks when needed:

```json
// .kiro/hooks/local-to-devvit-checklist.kiro.hook
"enabled": true  // Enable for Devvit transition checklist

// .kiro/hooks/multi-user-test-helper.kiro.hook
"enabled": true  // Enable for multi-user test scenarios
```

## Next Steps

1. Read `local-development.md` for complete guide
2. Try `npm run dev:local` to test local mode
3. Open multiple tabs to test trading
4. Enable manual hooks when needed
5. Switch to `npm run dev` for Reddit testing
