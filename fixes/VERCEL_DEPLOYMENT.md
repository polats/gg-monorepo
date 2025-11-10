# Goblin Gardens - Vercel Deployment Guide

## Vercel Dashboard Settings

When setting up your project on Vercel, use these settings:

### Framework Preset
- **Framework**: Other (Vite is configured via vercel.json)

### Root Directory
- **Root Directory**: `apps/goblin-gardens`
- ✅ Click "Include source files outside of the Root Directory in the Build Step"

### Build Settings
The `vercel.json` file handles these, but verify:
- **Build Command**: `cd ../.. && pnpm install && cd apps/goblin-gardens && pnpm run build:client`
- **Output Directory**: `dist/client`
- **Install Command**: `echo 'Skipping default install'`

### Environment Variables (if needed)
Add any required environment variables:
```
VITE_PLATFORM=world
VITE_API_URL=your-api-url
```

## Why the 404 Happened

Vite apps are Single Page Applications (SPAs). When you navigate to any route:
1. Vercel tries to find that exact file
2. It doesn't exist (only `/index.html` exists)
3. Returns 404

**Solution**: The `vercel.json` rewrites all routes to `/index.html`, letting React Router handle routing.

## Testing Locally Before Deploy

```bash
# Build the client
cd apps/goblin-gardens
pnpm run build:client

# The built files should be in dist/client/
# You can test with a static server:
npx serve dist/client
```

## Deployment Checklist

- [ ] `vercel.json` created in `apps/goblin-gardens/`
- [ ] Root Directory set to `apps/goblin-gardens` in Vercel dashboard
- [ ] "Include source files outside Root Directory" is CHECKED
- [ ] Build command references monorepo root for `pnpm install`
- [ ] Environment variables configured (if any)
- [ ] Re-deploy after these changes

## Redeploy

After adding `vercel.json`, trigger a new deployment:
- **Option 1**: Push a new commit to your git branch
- **Option 2**: In Vercel dashboard, click "Redeploy" on the latest deployment

The 404 should be fixed! 🎉

## Monorepo Considerations

This setup ensures:
- ✅ Shared packages (`@gg/*`) are installed from the monorepo root
- ✅ pnpm workspaces resolve correctly
- ✅ React 19 is properly isolated
- ✅ All routes work with client-side routing
