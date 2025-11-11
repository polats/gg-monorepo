# Debugging Guide - Payment Mode Issues

## Problem

The application shows "Mock Mode" even after setting `PAYMENT_MODE=production` in the `.env` file.

## Debugging Steps

### Step 1: Verify .env File

Check that your `.env` file exists and has the correct settings:

```bash
cd packages/bazaar-x402/example
cat .env
```

Expected content:
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=devnet
```

### Step 2: Test Configuration Loading

Run the configuration test script:

```bash
cd packages/bazaar-x402/example
pnpm test:config
```

This will:
1. Load the `.env` file
2. Show all environment variables
3. Test configuration parsing
4. Test currency adapter creation
5. Show detailed debug information

**Expected output for production mode:**
```
📁 Loading .env file from: /path/to/.env
✅ .env file loaded successfully

🔍 Environment Variables:
  PAYMENT_MODE = production
  SOLANA_NETWORK = devnet
  ...

✅ Configuration parsed successfully

📊 Summary:
  Payment Mode: production
  Currency Adapter: X402CurrencyAdapter
  Network: solana-devnet
```

**If you see `Payment Mode: mock`**, the `.env` file is not being loaded correctly.

### Step 3: Check Server Logs

Start the server and look for debug output:

```bash
cd packages/bazaar-x402/example
pnpm dev:server
```

Look for these debug lines:
```
🔍 DEBUG: Loading configuration...
🔍 DEBUG: process.env.PAYMENT_MODE = production
🔍 DEBUG: process.env.SOLANA_NETWORK = devnet

🔍 DEBUG: Configuration loaded successfully
🔍 DEBUG: config.mode = production
🔍 DEBUG: config.x402Config?.network = solana-devnet

🔍 DEBUG: Creating currency adapter...
🔍 DEBUG: Currency adapter type: X402CurrencyAdapter

🔍 DEBUG: Creating marketplace...
🔍 DEBUG: Setting mockMode to: false
```

### Step 4: Check API Endpoint

With the server running, test the config endpoint:

```bash
curl http://localhost:3001/api/config
```

Expected response for production mode:
```json
{
  "mode": "production",
  "network": "solana-devnet"
}
```

Expected response for mock mode:
```json
{
  "mode": "mock"
}
```

### Step 5: Check Browser Console

Open the browser console (F12) and look for:
```
Config loaded: {mode: "production", network: "solana-devnet"}
```

## Common Issues

### Issue 1: .env File Not Found

**Symptom**: `test:config` shows `PAYMENT_MODE = undefined`

**Solution**:
```bash
cd packages/bazaar-x402/example
cp .env.example .env
# Edit .env and set PAYMENT_MODE=production
```

### Issue 2: .env File Not Loaded by Server

**Symptom**: Server logs show `process.env.PAYMENT_MODE = undefined`

**Cause**: The server doesn't automatically load `.env` files. You need to use a tool like `dotenv`.

**Solution**: Update `server.ts` to load `.env`:

```typescript
import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // Add this at the top of server.ts
```

Or run with dotenv:
```bash
tsx --env-file=.env server.ts
```

### Issue 3: Server Not Restarted

**Symptom**: Changes to `.env` don't take effect

**Solution**: Always restart the server after changing `.env`:
```bash
# Stop server (Ctrl+C)
pnpm dev:server
```

### Issue 4: Wrong .env File

**Symptom**: Configuration doesn't match what's in `.env`

**Solution**: Make sure you're editing the right file:
```bash
# Check which .env file exists
ls -la packages/bazaar-x402/example/.env*

# Make sure you're editing the right one
cd packages/bazaar-x402/example
nano .env  # or your preferred editor
```

### Issue 5: Cached Build

**Symptom**: Changes don't take effect even after restart

**Solution**: Clear build cache and restart:
```bash
cd packages/bazaar-x402/example
rm -rf node_modules/.vite
pnpm dev
```

## Debug Checklist

Use this checklist to systematically debug the issue:

- [ ] `.env` file exists in `packages/bazaar-x402/example/`
- [ ] `.env` file contains `PAYMENT_MODE=production`
- [ ] `.env` file contains `SOLANA_NETWORK=devnet`
- [ ] `pnpm test:config` shows `Payment Mode: production`
- [ ] Server logs show `process.env.PAYMENT_MODE = production`
- [ ] Server logs show `config.mode = production`
- [ ] Server logs show `Currency adapter type: X402CurrencyAdapter`
- [ ] Server logs show `Setting mockMode to: false`
- [ ] `curl http://localhost:3001/api/config` returns `"mode": "production"`
- [ ] Browser shows "⚡ Production Mode - Devnet" in header

## Still Not Working?

If you've gone through all the steps and it's still not working:

1. **Share the output** of `pnpm test:config`
2. **Share the server logs** (first 50 lines after starting)
3. **Share the output** of `curl http://localhost:3001/api/config`
4. **Share your .env file** (remove any sensitive values)

## Quick Fix Script

Run this script to automatically check everything:

```bash
#!/bin/bash
echo "🔍 Checking Bazaar x402 Configuration..."
echo ""

cd packages/bazaar-x402/example

echo "1. Checking .env file..."
if [ -f .env ]; then
  echo "✅ .env file exists"
  echo "   PAYMENT_MODE=$(grep PAYMENT_MODE .env | cut -d '=' -f2)"
  echo "   SOLANA_NETWORK=$(grep SOLANA_NETWORK .env | cut -d '=' -f2)"
else
  echo "❌ .env file not found"
  echo "   Run: cp .env.example .env"
fi
echo ""

echo "2. Testing configuration loading..."
pnpm test:config
echo ""

echo "3. Testing API endpoint (server must be running)..."
curl -s http://localhost:3001/api/config | jq '.' || echo "❌ Server not running or endpoint not responding"
echo ""

echo "Done!"
```

Save this as `check-config.sh` and run:
```bash
chmod +x check-config.sh
./check-config.sh
```
