# Design Document: Wallet Login Integration for Bazaar-x402

## Overview

This design document outlines the implementation of wallet-based authentication for the bazaar-x402 example application. The solution integrates Solana wallet connectivity using the `@solana/wallet-adapter` ecosystem, providing a clean and simple authentication layer that replaces the current manual user selection dropdown.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Wallet Extension (Phantom/MetaMask)               │    │
│  │  - Manages private keys                            │    │
│  │  - Signs transactions                              │    │
│  │  - Provides public key                             │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Wallet Adapter Layer                              │    │
│  │  - @solana/wallet-adapter-react                    │    │
│  │  - @solana/wallet-adapter-wallets                  │    │
│  │  - Standardized wallet interface                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Bazaar Client Application                         │    │
│  │  - WalletButton component                          │    │
│  │  - useWallet hook                                  │    │
│  │  - Session management                              │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                   │
└──────────────────────────────────────────────────────────────┘
                           ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                  Express Server (API)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Bazaar Marketplace                                │    │
│  │  - Listings management                             │    │
│  │  - Purchase processing                             │    │
│  │  - Inventory tracking                              │    │
│  │  - Uses wallet address as user ID                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    index.html (Root)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  WalletProvider (Context)                          │    │
│  │  - ConnectionProvider                              │    │
│  │  - WalletProvider                                  │    │
│  │  - WalletModalProvider                             │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Header Component                        │     │    │
│  │  │  - WalletButton                          │     │    │
│  │  │  - Connection status                     │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Marketplace Components                  │     │    │
│  │  │  - Inventory (uses wallet address)       │     │    │
│  │  │  - Listings (uses wallet address)        │     │    │
│  │  │  - Create Listing (uses wallet address)  │     │    │
│  │  │  - Mystery Boxes (uses wallet address)   │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Wallet Provider Setup

**Purpose**: Initialize and configure the Solana wallet adapter ecosystem.

**Implementation**:
```typescript
// wallet-provider.js
import { 
  ConnectionProvider, 
  WalletProvider 
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  // MetaMask support via Solana adapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Configuration
const network = 'devnet'; // or 'mainnet-beta'
const endpoint = clusterApiUrl(network);

// Supported wallets
const wallets = [
  new PhantomWalletAdapter(),
];

// Provider component
export function SolanaWalletProvider({ children }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**Key Features**:
- Configurable network (devnet/mainnet)
- Auto-connect on page load
- Modal UI for wallet selection
- Support for multiple wallet providers

### 2. Wallet Button Component

**Purpose**: Provide UI for wallet connection/disconnection.

**Implementation**:
```typescript
// wallet-button.js
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const { publicKey, connected, connecting } = useWallet();
  
  return (
    <div className="wallet-button-container">
      {connected && publicKey ? (
        <div className="wallet-info">
          <span className="wallet-address" title={publicKey.toBase58()}>
            {formatAddress(publicKey.toBase58())}
          </span>
        </div>
      ) : null}
      <WalletMultiButton />
    </div>
  );
}

function formatAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
```

**Key Features**:
- Shows truncated wallet address when connected
- Displays full address on hover
- Loading state during connection
- Built-in wallet selection modal

### 3. Wallet Context Hook

**Purpose**: Provide wallet state and utilities throughout the application.

**Implementation**:
```typescript
// use-wallet-context.js
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export function useWalletContext() {
  const wallet = useWallet();
  const [username, setUsername] = useState(null);
  
  useEffect(() => {
    if (wallet.publicKey) {
      // Use wallet address as username
      setUsername(wallet.publicKey.toBase58());
      
      // Store in session storage for persistence
      sessionStorage.setItem('walletAddress', wallet.publicKey.toBase58());
    } else {
      setUsername(null);
      sessionStorage.removeItem('walletAddress');
    }
  }, [wallet.publicKey]);
  
  return {
    ...wallet,
    username,
    isConnected: wallet.connected,
    walletAddress: wallet.publicKey?.toBase58() || null,
  };
}
```

**Key Features**:
- Extends base wallet adapter functionality
- Provides username (wallet address)
- Session persistence
- Simplified connection state

### 4. Application Integration

**Purpose**: Integrate wallet functionality into existing bazaar UI.

**Changes to index.html**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... existing head content ... -->
  <link rel="stylesheet" href="https://unpkg.com/@solana/wallet-adapter-react-ui/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>
```

**Changes to app.js**:
```javascript
import { createRoot } from 'react-dom/client';
import { SolanaWalletProvider } from './wallet-provider.js';
import { BazaarApp } from './bazaar-app.js';

const root = createRoot(document.getElementById('app'));
root.render(
  <SolanaWalletProvider>
    <BazaarApp />
  </SolanaWalletProvider>
);
```

### 5. Marketplace Component Updates

**Purpose**: Use wallet address instead of manual user selection.

**Inventory Component**:
```javascript
function InventoryCard() {
  const { username, isConnected } = useWalletContext();
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    if (isConnected && username) {
      loadInventory(username);
    }
  }, [username, isConnected]);
  
  async function loadInventory(walletAddress) {
    const response = await fetch(`${API_BASE}/inventory/${walletAddress}`);
    const data = await response.json();
    setItems(data);
  }
  
  if (!isConnected) {
    return <div>Connect wallet to view inventory</div>;
  }
  
  return (
    <div className="card">
      <h2>🎒 My Inventory</h2>
      {/* ... render items ... */}
    </div>
  );
}
```

**Create Listing Component**:
```javascript
function CreateListingCard() {
  const { username, walletAddress, isConnected } = useWalletContext();
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const listing = {
      itemId: formData.itemId,
      itemType: formData.itemType,
      itemData: { description: formData.description },
      sellerUsername: username,
      sellerWallet: walletAddress,
      priceUSDC: formData.price,
    };
    
    await fetch(`${API_BASE}/bazaar/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    });
  }
  
  if (!isConnected) {
    return <div>Connect wallet to create listings</div>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
    </form>
  );
}
```

## Data Models

### Wallet State

```typescript
interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: Wallet | null;
  wallets: Wallet[];
  select: (walletName: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}
```

### Extended Wallet Context

```typescript
interface WalletContext extends WalletState {
  username: string | null;
  walletAddress: string | null;
  isConnected: boolean;
}
```

### Session Storage

```typescript
interface SessionData {
  walletAddress: string;
  connectedAt: number;
  lastActivity: number;
}
```

## Error Handling

### Connection Errors

```javascript
function handleWalletError(error) {
  if (error.name === 'WalletNotReadyError') {
    return 'Wallet is not ready. Please unlock your wallet.';
  }
  if (error.name === 'WalletConnectionError') {
    return 'Failed to connect to wallet. Please try again.';
  }
  if (error.name === 'WalletDisconnectedError') {
    return 'Wallet disconnected. Please reconnect.';
  }
  if (error.name === 'WalletNotFoundError') {
    return 'Phantom wallet not detected. Please install Phantom.';
  }
  return 'An unexpected error occurred. Please try again.';
}
```

### Error Display Component

```javascript
function ErrorMessage({ error }) {
  if (!error) return null;
  
  return (
    <div className="message error">
      ⚠️ {handleWalletError(error)}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

1. **Wallet Provider Tests**
   - Verify provider initialization
   - Test wallet selection
   - Test connection/disconnection

2. **Wallet Button Tests**
   - Test button rendering states
   - Test address formatting
   - Test click handlers

3. **Context Hook Tests**
   - Test username derivation
   - Test session persistence
   - Test state updates

### Integration Tests

1. **Wallet Connection Flow**
   - User clicks connect button
   - Wallet modal appears
   - User selects wallet
   - Connection succeeds
   - Address displays correctly

2. **Multi-User Testing**
   - Open multiple browser tabs
   - Connect different wallets in each tab
   - Verify independent sessions
   - Test marketplace interactions between users

3. **Session Persistence**
   - Connect wallet
   - Reload page
   - Verify auto-reconnect
   - Verify state restoration

### Manual Testing Scenarios

1. **No Wallet Installed**
   - Verify error message displays
   - Verify installation instructions

2. **Wallet Locked**
   - Verify unlock prompt
   - Verify error handling

3. **Connection Rejection**
   - User rejects connection
   - Verify error message
   - Verify app remains functional

4. **Wallet Switching**
   - Connect wallet A
   - Switch to wallet B in extension
   - Verify app updates correctly

## Migration Strategy

### Phase 1: Add Wallet Infrastructure
- Install wallet adapter dependencies
- Create wallet provider component
- Create wallet button component
- Add wallet context hook

### Phase 2: Update UI
- Replace user dropdown with wallet button
- Update header layout
- Add connection status indicators
- Style wallet components

### Phase 3: Update Application Logic
- Replace manual user selection with wallet context
- Update API calls to use wallet address
- Update form components
- Update inventory/listing components

### Phase 4: Testing & Refinement
- Test with real wallets
- Test multi-user scenarios
- Refine error handling
- Optimize UX

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@solana/web3.js": "^1.95.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### Build Configuration

Since the example currently uses vanilla JavaScript, we'll need to add a build step:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## Security Considerations

### 1. Wallet Address Validation
- Validate wallet addresses on server side
- Verify address format matches Solana public key format
- Sanitize addresses before database operations

### 2. Session Security
- Use secure session tokens
- Implement session expiration
- Clear sessions on disconnect

### 3. Transaction Verification
- Never trust client-side wallet state
- Verify all transactions on server
- Implement rate limiting

### 4. XSS Protection
- Sanitize all user inputs
- Escape wallet addresses in UI
- Use Content Security Policy headers

## Performance Considerations

### 1. Connection Optimization
- Use auto-connect for returning users
- Cache wallet adapter instances
- Minimize re-renders on wallet state changes

### 2. Session Management
- Use session storage for persistence
- Implement efficient state updates
- Debounce wallet state changes

### 3. Bundle Size
- Use tree-shaking for wallet adapters
- Lazy load wallet modal
- Minimize CSS bundle

## Accessibility

### 1. Keyboard Navigation
- Wallet button accessible via keyboard
- Modal navigation with Tab/Shift+Tab
- Close modal with Escape key

### 2. Screen Readers
- Add ARIA labels to wallet button
- Announce connection status changes
- Provide text alternatives for icons

### 3. Visual Indicators
- Clear connection status
- Loading states
- Error messages with sufficient contrast

## Future Enhancements

### 1. Additional Wallet Support
- Add Solflare wallet adapter
- Add Backpack wallet adapter
- Support hardware wallets (Ledger)
- Add mobile wallet support

### 2. Enhanced Session Management
- Implement JWT tokens
- Add session expiration warnings
- Support multiple concurrent sessions

### 3. Transaction Signing
- Add transaction signing for purchases
- Implement signature verification
- Support multi-signature transactions

### 4. User Profiles
- Associate metadata with wallet addresses
- Support custom usernames
- Add avatar/profile pictures
