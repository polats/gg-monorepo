# Vercel Backend - Next Steps

## What's Been Completed ✅

The backend refactoring is complete! The adapter pattern is fully implemented and ready for testing.

**Completed Components:**
- ✅ Environment detection (Vercel/Local/Reddit)
- ✅ Redis adapters (Vercel KV, Devvit Redis, In-memory)
- ✅ Auth adapters (Header-based, Reddit, Mock)
- ✅ Centralized routes (environment-agnostic)
- ✅ Vercel serverless entry point
- ✅ Client API client with environment detection
- ✅ Session-based usernames for Vercel/Local
- ✅ Deployment documentation

## Testing the Implementation

### 1. Test Local Mode (Fastest)

```bash
# Start local development
npm run dev:local

# Open browser to http://localhost:5173
# Verify game works with in-memory storage
```

**What to test:**
- Game loads and runs
- Each browser tab gets unique username (check console)
- Can collect gems and coins
- Player state persists during session
- Trading works between browser tabs (different usernames)

### 2. Test Reddit Mode (Current Production)

```bash
# Start Devvit playtest
npm run dev:reddit

# Open the playtest URL provided
# Authenticate with Reddit
```

**What to test:**
- Game loads in Reddit post
- Reddit authentication works
- Player state persists in Redis
- Trading works between users

### 3. Test Vercel Mode (New Deployment)

```bash
# Deploy to Vercel preview
cd apps/goblin-gardens
vercel

# Follow prompts to deploy
# Set up Vercel KV in dashboard
```

**What to test:**
- Client loads from Vercel
- Each browser tab gets unique username (e.g., `Player_ABC123`)
- API endpoints respond correctly
- Health check: `/api/health`
- Player state persists in Vercel KV
- Trading works between different tabs/users

## Remaining Tasks

### Task 7: Update Client Code (Optional)

The current client code uses direct `fetch` calls. You can optionally update it to use the new `apiClient` utility:

**Before:**
```typescript
const response = await fetch('/api/player-state/load');
const data = await response.json();
```

**After:**
```typescript
import { apiGet } from '../utils/api-client';
const data = await apiGet<LoadPlayerStateResponse>('/api/player-state/load');
```

**Benefits:**
- Automatic environment detection
- Type safety
- Better error handling
- Cleaner code

**Note:** This is optional - the current code will work fine in all environments.

### Task 8: Environment Variable Validation (Optional)

Add startup validation to check for required environment variables:

```typescript
// src/server/utils/env-validation.ts
export function validateEnvironment(env: Environment) {
  if (env === Environment.VERCEL) {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error('Vercel KV not configured. Please set up KV in Vercel dashboard.');
    }
  }
}
```

Call this in each server entry point before starting.

## Quick Deployment to Vercel

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Deploy Preview

```bash
cd apps/goblin-gardens
vercel
```

Follow the prompts:
- Link to existing project or create new
- Accept default settings
- Wait for deployment

### Step 3: Set Up Vercel KV

1. Go to Vercel dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **KV**
5. Vercel automatically configures environment variables

### Step 4: Redeploy

```bash
vercel --prod
```

Your app is now live on Vercel!

## Verifying the Deployment

### Health Check

Visit: `https://your-app.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "environment": "vercel",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test API Endpoints

```bash
# Initialize session
curl https://your-app.vercel.app/api/init

# Load player state (requires X-Username header)
curl -H "X-Username: TestUser" https://your-app.vercel.app/api/player-state/load
```

### Test Client

Open `https://your-app.vercel.app` in browser and play the game!

## Troubleshooting

### "Database not configured"

**Solution:** Set up Vercel KV in the dashboard and redeploy.

### Cold start is slow

**Expected:** First request takes 1-2 seconds. Subsequent requests are fast.

### CORS errors

**Check:** Client should use relative paths (same domain). Verify API calls use `/api/*` prefix.

### Authentication errors

**Note:** Vercel uses session-based usernames (e.g., `Player_ABC123`) for demo purposes. Each browser tab gets a unique username stored in sessionStorage. For production, consider implementing proper authentication or linking to Reddit accounts.

### All players share same inventory

**Solution:** This was fixed! Each browser tab now gets a unique session username. Open multiple tabs to test multi-user features. See `docs/session-usernames.md` for details.

## Documentation

- **Deployment Guide:** `docs/vercel-deployment.md`
- **Implementation Summary:** `docs/vercel-backend-implementation-summary.md`
- **Session Usernames:** `docs/session-usernames.md`
- **Username Fix:** `docs/vercel-session-usernames-fix.md`
- **Testing Guide:** `docs/vercel-username-testing.md`
- **Design Document:** `.kiro/specs/vercel-backend-deployment/design.md`
- **Requirements:** `.kiro/specs/vercel-backend-deployment/requirements.md`

## Support

If you encounter issues:
1. Check the deployment guide
2. Review Vercel logs: `vercel logs`
3. Check browser console for client errors
4. Verify environment variables are set

## Success! 🎉

Once testing is complete, you'll have a fully functional multi-environment backend that runs on:
- ✅ Vercel (production hosting)
- ✅ Local development (fast iteration)
- ✅ Reddit Devvit (Reddit integration)

All from a single codebase with no duplication!
