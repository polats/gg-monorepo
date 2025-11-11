# X402 Gateway Debug Mode

## Overview

This application supports a debug mode that bypasses the X402 payment gateway, allowing you to test the gem purchase and crediting flow without requiring actual blockchain payments.

## Configuration

### Enable Debug Mode (Default)

In your `.env.local` file, set:

```bash
X402_GATEWAY=false
```

Or simply leave it undefined/commented out:

```bash
# X402_GATEWAY=false
```

### Enable Production Mode (Real Payments)

To enable actual X402 payment verification:

```bash
X402_GATEWAY=true
```

## How It Works

### Debug Mode (X402_GATEWAY=false or undefined)

1. The middleware bypasses X402 payment verification
2. Users can click "Purchase Now" on any gem package
3. They are taken directly to the purchase success page (`/purchase/[tier]`)
4. Gems are credited immediately without payment
5. A yellow debug banner appears on the gems page indicating debug mode is active

### Production Mode (X402_GATEWAY=true)

1. The middleware enforces X402 payment verification
2. Users must complete blockchain payment via Coinbase Pay
3. Payment is verified on-chain before granting access
4. Only after successful payment verification are gems credited
5. No debug banner is shown

## Testing the Flow

### In Debug Mode

1. Start the development server: `npm run dev`
2. Navigate to `/gems` to see available gem packages
3. Notice the yellow debug banner at the top
4. Click "Purchase Now" on any package
5. You'll be taken to `/purchase/[tier]` immediately
6. Gems will be credited to your balance automatically
7. Check the browser console for detailed logging

### Debugging Purchase Issues

If gems aren't being credited in debug mode:

1. Open browser DevTools (F12)
2. Check the Console tab for error messages
3. Look for logs prefixed with `[PurchasePage]` and `[GemBalance]`
4. Verify the session is being created properly
5. Check Network tab for failed API calls to `/api/gems/add`

## API Endpoints

### Check X402 Status

```bash
GET /api/x402/status
```

Returns:
```json
{
  "enabled": false,
  "mode": "debug"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `X402_GATEWAY` | No | `false` | Enable/disable X402 payment gateway |
| `NEXT_PUBLIC_RECEIVER_ADDRESS` | Yes* | - | Solana wallet address for payments |
| `NEXT_PUBLIC_NETWORK` | Yes* | - | Solana network (devnet/mainnet) |
| `NEXT_PUBLIC_FACILITATOR_URL` | Yes* | - | X402 facilitator service URL |
| `NEXT_PUBLIC_CDP_CLIENT_KEY` | Yes* | - | Coinbase Developer Platform key |

*Only required when `X402_GATEWAY=true`

## Troubleshooting

### Gems not crediting in debug mode

- Check that `X402_GATEWAY` is set to `false` or undefined
- Restart the dev server after changing `.env.local`
- Clear browser cookies and session storage
- Check browser console for errors

### Still seeing payment gateway in debug mode

- Verify `.env.local` has `X402_GATEWAY=false`
- Restart the Next.js dev server completely
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

### Session issues

- The app uses session storage for gem balance
- Clear session storage in DevTools > Application > Session Storage
- Create a new session by visiting `/api/session/create`
