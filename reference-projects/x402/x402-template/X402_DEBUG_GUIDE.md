# X402 Payment Debug Guide

This guide explains how to debug X402 payment gateway integration and track why gems aren't being incremented after purchase.

## New Debug Features

### 1. Session Token Endpoint (`/api/x402/session-token`)

This endpoint receives payment data from the X402 gateway after a successful purchase.

**What it does:**
- Logs all data received from X402 gateway to the console
- Stores the session token in a cookie (`x402_session_token`)
- Stores payment data in a cookie (`x402_payment_data`)
- Returns confirmation with timestamp

**Console Output:**
```
================================================================================
[X402 Session Token] Payment completed!
================================================================================
[X402 Session Token] Full request body: { ... }
[X402 Session Token] Session Token: abc123...
[X402 Session Token] Payment Data: { ... }
[X402 Session Token] Timestamp: 2025-11-08T...
================================================================================
```

### 2. Debug Endpoint (`/api/x402/debug`)

Retrieves all X402-related data stored in cookies.

**Returns:**
```json
{
  "x402SessionToken": "abc123...",
  "x402PaymentData": { ... },
  "appSessionId": "xyz789...",
  "allCookies": { ... },
  "timestamp": "2025-11-08T..."
}
```

### 3. Enhanced Purchase Page

The purchase success page (`/purchase/[tier]`) now includes:

- **X402 Debug Panel**: Shows session token, payment data, and app session ID
- **Visual Indicators**: Green checkmarks for success, red X for missing data
- **Auto-load**: Automatically fetches X402 debug info on page load
- **Console Logging**: Logs all cookies and X402 data to browser console

**Debug Button**: Click the "🐛 Debug" button to refresh debug information

### 4. Dedicated Debug Console (`/debug-x402`)

A comprehensive debug page with:

- **Real-time Monitoring**: Auto-refresh every 2 seconds (optional)
- **Session Token Status**: Visual indicator if token is present
- **Payment Data Display**: Full payment data in formatted JSON
- **App Session ID**: Shows the application session ID
- **All Cookies**: Complete cookie dump for debugging
- **Raw Debug Data**: Full JSON response from debug endpoint

**Access it at:** `http://localhost:3000/debug-x402`

## How to Debug Gem Increment Issues

### Step 1: Check if X402 is Enabled

```bash
# Check your .env.local file
cat .env.local | grep X402_GATEWAY
```

- If `X402_GATEWAY=true`: X402 is enabled (production mode)
- If `X402_GATEWAY=false` or not set: X402 is disabled (debug mode)

### Step 2: Complete a Purchase

1. Go to `/gems` and select a gem package
2. Complete the purchase flow
3. You'll be redirected to `/purchase/[tier]`

### Step 3: Check the Debug Panel

On the purchase success page, look for the **X402 Payment Debug Info** panel:

**If X402 Session Token is present:**
- ✅ Payment was processed through X402
- The session token should be displayed
- Payment data should be visible

**If X402 Session Token is missing:**
- ❌ Payment was NOT processed through X402
- This is expected if `X402_GATEWAY=false`
- Gems should still be credited in debug mode

### Step 4: Check Server Logs

Look for these log entries in your server console:

**When session token endpoint is called:**
```
[X402 Session Token] Payment completed!
[X402 Session Token] Session Token: ...
```

**When purchase page loads:**
```
[PurchasePage] X402 debug info loaded: { ... }
```

**When gems are credited:**
```
[PurchasePage] Starting credit process for X gems
[PurchasePage] addGems completed successfully
```

### Step 5: Use the Debug Console

Visit `/debug-x402` for a comprehensive view:

1. **Check Session Token**: Should be green if present
2. **Check Payment Data**: Should show transaction details
3. **Check App Session ID**: Should be present
4. **Enable Auto-refresh**: Toggle to monitor in real-time

### Step 6: Check Browser Console

Open browser DevTools (F12) and look for:

```javascript
[PurchasePage] All cookies: ...
[PurchasePage] X402 Session Token: ...
[PurchasePage] X402 Payment Data: ...
```

## Common Issues and Solutions

### Issue: No Session Token Found

**Possible Causes:**
1. X402 gateway is disabled (`X402_GATEWAY=false`)
2. Session token endpoint was not called
3. Cookies are being blocked

**Solutions:**
- Enable X402: Set `X402_GATEWAY=true` in `.env.local`
- Check that `/api/x402/session-token` endpoint exists
- Check browser cookie settings

### Issue: Gems Not Incrementing

**Possible Causes:**
1. Session mismatch between X402 and app
2. API call to `/api/gems/add` is failing
3. Session storage issue

**Debug Steps:**
1. Check if `appSessionId` matches between requests
2. Look for errors in `/api/gems/add` endpoint
3. Check browser console for API errors
4. Verify session storage is working

### Issue: Payment Data Missing

**Possible Causes:**
1. X402 gateway didn't send payment data
2. Cookie size limit exceeded
3. Cookie parsing error

**Debug Steps:**
1. Check server logs for session token endpoint
2. Check if `x402_payment_data` cookie exists
3. Try clearing cookies and retrying

## Testing Checklist

- [ ] X402 gateway enabled/disabled status is correct
- [ ] Session token endpoint receives data after payment
- [ ] Session token is stored in cookie
- [ ] Purchase page displays X402 debug panel
- [ ] Debug console shows all data correctly
- [ ] Server logs show payment completion
- [ ] Gems are credited to balance
- [ ] Balance updates in header

## Quick Commands

```bash
# Start development server
npm run dev

# Check environment variables
cat .env.local

# Clear all cookies (in browser console)
document.cookie.split(';').forEach(c => {
  document.cookie = c.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
})

# Watch server logs
# (logs appear in terminal where you ran npm run dev)
```

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/x402/session-token` | POST | Receives X402 payment data |
| `/api/x402/debug` | GET | Returns X402 debug information |
| `/api/x402/status` | GET | Returns X402 enabled status |
| `/api/gems/add` | POST | Credits gems to user balance |
| `/api/gems/balance` | GET | Returns current gem balance |

## Debug Pages Reference

| Page | Purpose |
|------|---------|
| `/purchase/[tier]` | Purchase success page with debug panel |
| `/debug-x402` | Comprehensive debug console |
| `/gems` | Gem purchase page |

## Support

If you're still experiencing issues:

1. Check all server logs for errors
2. Verify all environment variables are set correctly
3. Clear browser cookies and try again
4. Check that Redis/storage is working correctly
5. Review the session management code in `lib/session.ts`
