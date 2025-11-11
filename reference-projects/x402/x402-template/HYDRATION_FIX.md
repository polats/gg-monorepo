# React Hydration Error Fix

## Problem

When users had gems in their balance and refreshed the page, React threw a hydration error:

```
Uncaught Error: Hydration failed because the server rendered text didn't match the client.
```

## Root Cause

The gem balance is stored in `sessionStorage`, which is only available on the client side. During server-side rendering (SSR):

1. **Server**: Renders the component with `balance = 0` (default value, since `sessionStorage` doesn't exist)
2. **Client**: Hydrates with `balance = X` (loaded from `sessionStorage`)
3. **Mismatch**: React detects the difference and throws a hydration error

## Solution

Use a `mounted` state to prevent rendering the actual balance until after the component has mounted on the client side. This ensures the server and client render the same initial content.

### Implementation

Added to all components that display the balance:

```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

// In JSX:
{mounted ? balance.toLocaleString() : '0'}
```

## Files Updated

1. **`components/gem-balance-header.tsx`**
   - Added `mounted` state
   - Shows `'0'` during SSR, actual balance after mount

2. **`app/gems/page.tsx`**
   - Added `mounted` state
   - Balance display waits for client-side mount

3. **`app/purchase/[tier]/page.tsx`**
   - Added `mounted` state
   - Current balance display waits for mount

## How It Works

### Before Fix (Hydration Mismatch)

```
Server renders: <span>0 gems</span>
Client hydrates: <span>1,200 gems</span>
❌ Mismatch! Hydration error
```

### After Fix (No Mismatch)

```
Server renders: <span>0 gems</span>
Client hydrates: <span>0 gems</span>
✅ Match! No error

After mount: <span>1,200 gems</span>
✅ Updates smoothly via React state
```

## Testing

1. Add some gems to your balance
2. Refresh the page
3. Check browser console - no hydration errors
4. Balance should display correctly after a brief moment

## Technical Details

### Why This Works

- **SSR Phase**: Both server and client render `'0'`
- **Hydration Phase**: React successfully matches the HTML
- **Post-Hydration**: `useEffect` runs, sets `mounted = true`, triggers re-render with actual balance
- **Result**: Smooth transition without hydration errors

### Alternative Approaches Considered

1. **Suppress hydration warning**: Not recommended, hides the real issue
2. **Use `suppressHydrationWarning`**: Only masks the problem
3. **Server-side session storage**: Not possible, sessionStorage is client-only
4. **Cookies**: Overkill for client-only data
5. **Mounted state (chosen)**: Clean, simple, follows React best practices

## Related Issues

This is a common pattern when dealing with:
- `localStorage` / `sessionStorage`
- `window` object
- Browser-only APIs
- User-specific client-side data
- Date/time formatting with user locale

## References

- [React Hydration Docs](https://react.dev/link/hydration-mismatch)
- [Next.js SSR Considerations](https://nextjs.org/docs/messages/react-hydration-error)
