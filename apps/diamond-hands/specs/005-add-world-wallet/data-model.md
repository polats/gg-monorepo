# Data Model: World Wallet Login and Balance Display

## Entities

### WalletConnection
Represents the authenticated connection between user's World Wallet and the minigame.

**Fields:**
- `address: string` - The wallet address/identifier from MiniKit
- `isConnected: boolean` - Current connection status
- `connectionTimestamp: number` - Unix timestamp of connection establishment
- `lastRefreshTimestamp: number` - Unix timestamp of last balance refresh

**Validation Rules:**
- address must be a valid WorldID wallet address format
- isConnected must be boolean
- timestamps must be valid Unix timestamps

**State Transitions:**
- `disconnected` → `connecting` (user initiates connection)
- `connecting` → `connected` (authentication successful)
- `connecting` → `disconnected` (authentication failed/cancelled)
- `connected` → `disconnected` (user disconnects)

### WalletBalance
The current WLD token balance and display information.

**Fields:**
- `amount: number` - Raw balance amount in WLD
- `formatted: string` - Formatted display string (e.g., "100.00 WLD")
- `lastUpdated: Date` - Timestamp of last balance fetch
- `isLoading: boolean` - Balance fetch in progress
- `error: string | null` - Error message if balance fetch failed

**Validation Rules:**
- amount must be non-negative number
- formatted must include 2 decimal places
- lastUpdated must be valid Date object
- isLoading must be boolean

**State Transitions:**
- `idle` → `loading` (balance fetch initiated)
- `loading` → `loaded` (balance fetch successful)
- `loading` → `error` (balance fetch failed)
- `error` → `loading` (retry initiated)

### UserSession
The persisted session information for wallet connection.

**Fields:**
- `walletAddress: string | null` - Stored wallet address for reconnection
- `sessionId: string` - Unique session identifier
- `autoConnect: boolean` - Whether to attempt auto-reconnection
- `mockUserId: string | null` - Selected mock user ID (dev only)

**Validation Rules:**
- walletAddress must be valid format or null
- sessionId must be non-empty string
- autoConnect must be boolean
- mockUserId only valid in development mode

**Persistence:**
- Stored in localStorage under key `worldWalletSession`
- Cleared on explicit disconnect
- Validated on page load for reconnection

## Component State Model

### WalletConnectionComponent State
```typescript
interface WalletConnectionState {
  // Connection state
  connection: WalletConnection;

  // Balance state
  balance: WalletBalance;

  // UI state
  showConnectModal: boolean;
  showDisconnectConfirm: boolean;

  // Session state
  session: UserSession;
}
```

## Data Flow

### Connection Flow
1. User clicks "Connect Wallet" button
2. Component validates MiniKit availability
3. Initiates walletAuth with nonce
4. On success: Updates connection state, stores session
5. Fetches initial balance
6. Displays connected state with balance

### Balance Refresh Flow
1. User clicks refresh button or triggers update
2. Component sets loading state
3. Fetches latest user data from MiniKit
4. Updates balance amount and formatted string
5. Updates lastUpdated timestamp
6. Clears loading state

### Disconnection Flow
1. User clicks disconnect button
2. Shows confirmation dialog (optional)
3. Clears connection state
4. Removes localStorage session
5. Returns to disconnected UI state

## Mock Mode Data

### Mock User Balances
```typescript
const mockBalances = {
  'new-user': 0,
  'active-user': 100,
  'power-user': 1000,
  'vip-user': 10000,
  'problem-user': 0.01
};
```

### Mock State Transitions
- Instant connection in auto-login mode
- Configurable delay for realistic testing
- Error simulation for problem-user persona

## Integration Points

### With DepositWorkflow
- Provides balance for deposit validation
- Updates after successful deposit
- Blocks deposits if insufficient balance

### With MinigameApp
- Connection state affects navigation
- Balance displayed in game header
- Disconnect returns to home screen

### With MiniKit Provider
- Uses existing provider context
- Leverages mock/real mode detection
- Inherits error handling patterns

## Error Scenarios

### Connection Errors
- MiniKit not installed: "World App required"
- Authentication failed: "Connection failed, please try again"
- Network error: "Network error, check connection"

### Balance Errors
- Fetch failed: "Unable to load balance"
- Invalid response: "Balance data unavailable"
- Timeout: "Request timed out, please refresh"

## Performance Considerations

### Caching Strategy
- Balance cached for 30 seconds
- Connection state persisted indefinitely
- Mock data served instantly

### Update Frequency
- On-demand refresh only
- No automatic polling
- Update after game actions that affect balance

## Security Considerations

### Data Validation
- Sanitize wallet address before display
- Validate balance amounts are numeric
- Prevent XSS in error messages

### Session Security
- No sensitive data in localStorage
- Session ID for tracking only
- Clear session on security events