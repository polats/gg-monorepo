# Session-Based Usernames

## Overview

Goblin Gardens uses session-based usernames to provide unique player identities across different deployment environments:

- **Reddit/Devvit**: Uses real Reddit usernames via authentication
- **Vercel**: Generates unique session-based usernames per browser tab
- **Local Dev**: Generates unique session-based usernames per browser tab

## How It Works

### Client-Side (PileDemo.tsx)

When the app initializes, it checks for a username:

```typescript
const [effectiveUsername] = useState(() => {
  // Check if we have a real Reddit username
  const hasRealUsername = username && username !== 'LocalDevUser' && username !== 'anonymous';

  if (hasRealUsername) {
    // Reddit/Devvit mode - use username from Reddit API
    setApiUsername(username);
    return username;
  }

  // Local dev or Vercel mode - generate or retrieve session-specific username
  const storedUsername = sessionStorage.getItem('sessionUsername');
  if (storedUsername) {
    setApiUsername(storedUsername);
    return storedUsername;
  }

  // Generate random username like "Player_ABC123"
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newUsername = `Player_${randomId}`;
  sessionStorage.setItem('sessionUsername', newUsername);
  setApiUsername(newUsername);
  return newUsername;
});
```

### Server-Side (auth-adapter.ts)

The server receives the username via the `X-Username` header:

```typescript
class VercelAuthAdapter implements AuthAdapter {
  async getUsername(req: Request): Promise<string> {
    const username = req.headers['x-username'] as string;
    
    if (!username) {
      console.warn('[Auth] No username provided, using anonymous');
      return 'anonymous';
    }
    
    return username;
  }
}
```

### API Client (api-client.ts)

The API client automatically injects the username into all requests:

```typescript
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  // Add X-Username header if username is set
  if (currentUsername) {
    headers['X-Username'] = currentUsername;
  }
  
  const response = await fetch(url, { ...options, headers });
  return response.json();
}
```

## Username Format

Generated usernames follow the pattern: `Player_XXXXXX`

Where `XXXXXX` is a random 6-character alphanumeric string (uppercase).

Examples:
- `Player_A3B7F2`
- `Player_9K2L5M`
- `Player_XYZ123`

## Session Storage

Usernames are stored in `sessionStorage` with the key `sessionUsername`.

### Session Storage Behavior

- **Per-tab isolation**: Each browser tab gets its own sessionStorage
- **Persistence**: Username persists across page refreshes within the same tab
- **Cleanup**: Username is cleared when the tab is closed
- **Multi-tab testing**: Opening multiple tabs creates multiple unique players

### Clearing Session Data

To reset a tab's username (for testing):

```javascript
// In browser console
sessionStorage.removeItem('sessionUsername');
location.reload();
```

## Multi-User Testing

### On Vercel

1. Open the Vercel deployment URL in a browser
2. Each tab automatically gets a unique username (e.g., `Player_ABC123`)
3. Open multiple tabs to test trading between different players
4. Each tab maintains its own player state (coins, gems, offers)

### On Local Dev

Same behavior as Vercel - each tab gets a unique username.

### On Reddit/Devvit

Uses real Reddit usernames, so multi-user testing requires multiple Reddit accounts.

## Player State Isolation

Each username has its own isolated player state in Redis:

```
playerState:Player_ABC123 -> { coins: {...}, gems: [...] }
playerState:Player_XYZ789 -> { coins: {...}, gems: [...] }
```

This ensures:
- No data conflicts between players
- Proper trading between different users
- Accurate marketplace offers
- Isolated inventory management

## Benefits

1. **No authentication required**: Players can start playing immediately on Vercel
2. **Multi-tab testing**: Easy to test trading and multiplayer features
3. **Consistent behavior**: Same username system works across local dev and Vercel
4. **Privacy**: No personal information required
5. **Simplicity**: No need for login forms or user registration

## Limitations

1. **No cross-device persistence**: Username is tied to a specific browser tab
2. **No account recovery**: Closing the tab loses the player identity
3. **No username customization**: Players can't choose their own usernames
4. **Session-only**: Data is lost when the tab is closed (unless saved to Redis)

## Future Enhancements

Potential improvements for production:

1. **localStorage persistence**: Store username in localStorage for cross-tab persistence
2. **Custom usernames**: Allow players to set their own display names
3. **Account linking**: Link session usernames to Reddit accounts
4. **Username validation**: Prevent duplicate or inappropriate usernames
5. **Session recovery**: Allow players to recover their session with a code
