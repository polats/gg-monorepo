# Vercel Deployment Guide

This guide explains how to deploy Goblin Gardens to Vercel with Vercel KV for Redis storage.

## Prerequisites

- Node.js 22.2.0 or higher
- Vercel account
- Vercel CLI installed: `npm i -g vercel`

## Quick Start

### 1. Install Vercel KV

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → **KV**
4. Vercel automatically sets these environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

No manual configuration needed!

### 2. Deploy to Vercel

```bash
cd apps/goblin-gardens

# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 3. Verify Deployment

Visit your deployment URL and check:
- Client loads correctly
- API health check: `https://your-app.vercel.app/api/health`
- Game functionality works

## Environment Variables

Vercel KV automatically configures these variables when you create a KV database:

| Variable | Description | Auto-configured |
|----------|-------------|-----------------|
| `KV_REST_API_URL` | Vercel KV REST API endpoint | ✅ Yes |
| `KV_REST_API_TOKEN` | Authentication token for KV | ✅ Yes |
| `VERCEL` | Set to `1` on Vercel | ✅ Yes |
| `NODE_ENV` | Set to `production` | ✅ Yes |

No manual environment variable setup required!

## Architecture

### Multi-Environment Support

Goblin Gardens runs in three environments:

1. **Vercel** (Production/Preview)
   - Serverless functions
   - Vercel KV for Redis
   - Header-based authentication

2. **Local Development**
   - Express server on port 3000
   - In-memory storage
   - Mock authentication

3. **Reddit Devvit**
   - Devvit platform
   - Devvit Redis
   - Reddit authentication

### Adapter Pattern

The backend uses adapters to abstract environment differences:

- **Environment Adapter**: Detects Vercel/Local/Reddit
- **Redis Adapter**: Abstracts Vercel KV, Devvit Redis, or in-memory storage
- **Auth Adapter**: Handles authentication per environment

## API Endpoints

All endpoints are available at `/api/*`:

- `GET /api/health` - Health check
- `GET /api/init` - Initialize session
- `POST /api/player-state/save` - Save player data
- `GET /api/player-state/load` - Load player data
- `GET /api/offers` - Get marketplace offers
- `POST /api/offers/update` - Create/update offer
- `DELETE /api/offers/remove` - Remove offer
- `POST /api/trade/execute` - Execute trade

## Deployment Configuration

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/client/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/client"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/client/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Build Scripts

```json
{
  "scripts": {
    "build:vercel": "npm run build:client && npm run build:server",
    "deploy:vercel": "vercel --prod",
    "preview:vercel": "vercel"
  }
}
```

## Troubleshooting

### Cold Start Times

Vercel serverless functions have cold starts (~1-2 seconds). This is normal and only affects the first request.

### KV Connection Errors

If you see "Database not configured":
1. Verify Vercel KV is created in your project
2. Check environment variables are set
3. Redeploy to pick up new variables

### CORS Issues

The Vercel backend includes CORS middleware. If you still see CORS errors:
1. Check the client is using relative paths (same domain)
2. Verify API calls use `/api/*` prefix
3. Check browser console for specific error

### Authentication Errors

Vercel uses `X-Username` header for authentication (demo purposes). For production:
- Implement JWT-based authentication
- Use Vercel's built-in authentication
- Or integrate with external auth provider

## Monitoring

### Vercel Dashboard

Monitor your deployment:
- **Functions**: View serverless function logs
- **Analytics**: Track usage and performance
- **Storage**: Monitor KV usage and costs

### Logs

View real-time logs:
```bash
vercel logs your-deployment-url
```

### Performance

Check API response times:
- Target: < 500ms for most endpoints
- Cold starts: 1-2 seconds (first request)
- Warm requests: < 200ms

## Scaling

Vercel automatically scales:
- Serverless functions scale with traffic
- Vercel KV scales with usage
- No manual configuration needed

### KV Limits

Free tier includes:
- 256 MB storage
- 100,000 commands/month

Upgrade if you exceed these limits.

## Security

### Current Implementation

- Header-based authentication (`X-Username`)
- Suitable for demo/testing
- **Not secure for production**

### Production Recommendations

1. **Implement JWT authentication**
   - Issue tokens on login
   - Verify tokens on each request
   - Store user sessions securely

2. **Use Vercel Authentication**
   - Built-in auth providers
   - OAuth integration
   - Session management

3. **Rate Limiting**
   - Prevent abuse
   - Use Vercel Edge Config
   - Implement per-user limits

## Next Steps

1. ✅ Deploy to Vercel preview
2. ✅ Set up Vercel KV
3. ✅ Test all API endpoints
4. ⏳ Implement production authentication
5. ⏳ Add monitoring and alerts
6. ⏳ Deploy to production

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel KV Docs: https://vercel.com/docs/storage/vercel-kv
- GitHub Issues: [Your repo]
