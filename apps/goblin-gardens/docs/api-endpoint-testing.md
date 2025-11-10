# API Endpoint Testing Guide

## Testing Endpoints on Vercel

Use these curl commands to test each endpoint after deployment:

### Health Check
```bash
curl https://goblin-gardens.vercel.app/api/health
```

Expected: `200 OK` with JSON response

### Init
```bash
curl -H "X-Username: testuser" https://goblin-gardens.vercel.app/api/init
```

Expected: `200 OK` with init response

### Player State - Save
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{"playerState":{"coins":{"gold":0,"silver":0,"bronze":100},"gems":[]}}' \
  https://goblin-gardens.vercel.app/api/player-state/save
```

Expected: `200 OK` with success response

### Player State - Load
```bash
curl -H "X-Username: testuser" \
  https://goblin-gardens.vercel.app/api/player-state/load
```

Expected: `200 OK` with player state or null

### Get Offers
```bash
curl -H "X-Username: testuser" \
  "https://goblin-gardens.vercel.app/api/offers?cursor=0&limit=10"
```

Expected: `200 OK` with offers array

### Update Offer
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: testuser" \
  -d '{"gems":[{"id":"test1","type":"emerald","rarity":"common","shape":"tetrahedron","color":"#00ff00","growthRate":1,"level":1,"experience":0,"dateAcquired":1699999999999,"size":0.06,"isGrowing":false,"isOffering":true}]}' \
  https://goblin-gardens.vercel.app/api/offers/update
```

Expected: `200 OK` with offer created

### Remove Offer
```bash
curl -X DELETE \
  -H "X-Username: testuser" \
  https://goblin-gardens.vercel.app/api/offers/remove
```

Expected: `200 OK` with success message

### Execute Trade
```bash
# First create an offer with user1
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: seller" \
  -d '{"playerState":{"coins":{"gold":0,"silver":0,"bronze":0},"gems":[{"id":"gem1","type":"emerald","rarity":"common","shape":"tetrahedron","color":"#00ff00","growthRate":1,"level":1,"experience":0,"dateAcquired":1699999999999,"size":0.06,"isGrowing":false,"isOffering":true}]}}' \
  https://goblin-gardens.vercel.app/api/player-state/save

curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: seller" \
  -d '{"gems":[{"id":"gem1","type":"emerald","rarity":"common","shape":"tetrahedron","color":"#00ff00","growthRate":1,"level":1,"experience":0,"dateAcquired":1699999999999,"size":0.06,"isGrowing":false,"isOffering":true}]}' \
  https://goblin-gardens.vercel.app/api/offers/update

# Then buy with user2
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: buyer" \
  -d '{"playerState":{"coins":{"gold":1,"silver":0,"bronze":0},"gems":[]}}' \
  https://goblin-gardens.vercel.app/api/player-state/save

curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Username: buyer" \
  -d '{"sellerUsername":"seller"}' \
  https://goblin-gardens.vercel.app/api/trade/execute
```

Expected: `200 OK` with trade transaction details

## Common Issues

### 404 Not Found
- Check that the path matches exactly (e.g., `/api/player-state/save` not `/api/player-state/save/`)
- Verify the HTTP method is correct (GET, POST, DELETE)
- Check Vercel logs for the actual path being requested

### 400 Bad Request
- Verify request body is valid JSON
- Check that required fields are present
- Ensure `X-Username` header is set

### 500 Internal Server Error
- Check Vercel function logs for error details
- Verify `REDIS_URL` environment variable is set
- Check Redis connection is working

## Debugging

View Vercel function logs:
```bash
vercel logs goblin-gardens --follow
```

Or check in Vercel dashboard:
https://vercel.com/your-team/goblin-gardens/logs

## Path Matching Logic

The handler uses `path.endsWith()` to match routes:
- `/api/health` → Health check
- `/api/init` → Initialize session
- `/api/player-state/save` → Save player state (POST)
- `/api/player-state/load` → Load player state (GET)
- `/api/offers` → Get offers (GET)
- `/api/offers/update` → Update offer (POST)
- `/api/offers/remove` → Remove offer (DELETE)
- `/api/trade/execute` → Execute trade (POST)

All paths are matched with exact endings to avoid conflicts.
