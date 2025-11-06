# Research: World Wallet Login and Balance Display

## Executive Summary
The codebase already contains comprehensive WorldCoin MiniKit integration with sophisticated mock mode support. The existing patterns provide all necessary foundation for implementing wallet connection and balance display in the Diamond Hands minigame.

## Key Findings

### 1. Existing MiniKit Integration
- **Decision**: Use the unified MiniKit interface at `lib/minikit.ts`
- **Rationale**: Provides seamless switching between real and mock modes, already configured with type safety
- **Alternatives considered**: Direct SDK usage - rejected due to lack of mock support needed for development

### 2. Authentication Pattern
- **Decision**: Adapt Enhanced Login Component pattern from `components/Login/index.tsx`
- **Rationale**: Mature implementation with complete mock support, error handling, and user state management
- **Alternatives considered**: Basic WalletAuth component - rejected as it lacks mock mode integration

### 3. Balance Retrieval Strategy
- **Decision**: Use MiniKit.user data for balance display with on-demand refresh
- **Rationale**: User object contains wallet balance, avoiding unnecessary API calls
- **Alternatives considered**: Separate balance API - not needed as MiniKit provides this data

### 4. Integration Location
- **Decision**: Integrate within DepositWorkflow component at `components/minigame/DepositWorkflow.tsx`
- **Rationale**: Natural flow point where wallet balance is most relevant for deposit decisions
- **Alternatives considered**: HomeScreen integration - rejected as it would clutter the initial experience

### 5. State Management
- **Decision**: Use local component state with localStorage persistence
- **Rationale**: Simple, follows existing patterns, no need for global state management
- **Alternatives considered**: Context API - unnecessary complexity for single component

### 6. Mock Mode Support
- **Decision**: Leverage existing mock user personas with predefined balances
- **Rationale**: Comprehensive testing infrastructure already in place with realistic user scenarios
- **Alternatives considered**: Creating new mock system - redundant given existing infrastructure

## Technical Dependencies Resolved

### MiniKit SDK Capabilities
- **walletAuth**: Full authentication flow with nonce support
- **user object**: Contains address, balance, profile data
- **isInstalled**: Detection for MiniKit availability
- **Mock commands**: Complete simulation for all wallet operations

### Existing Components to Reuse
1. **MiniKitProvider**: Already wraps the application
2. **Enhanced Login pattern**: Provides template for wallet connection
3. **Mock utilities**: `useMockMode`, `useMockWallet`, `useMockUser`
4. **Environment configuration**: Mock mode controls via environment variables

### Integration Points
- **DepositWorkflow**: Lines 14-150 handle deposit amount selection
- **MinigameApp**: Screen navigation already supports wallet states
- **Mock users**: 5 personas with different balance levels for testing

## Implementation Approach

### Component Structure
```typescript
// New component: WalletConnection.tsx
- Connection button with loading states
- Balance display with formatting
- Disconnect functionality
- Error message handling
```

### State Flow
1. Check MiniKit installation
2. Initiate wallet authentication
3. Store connection in localStorage
4. Display balance from user object
5. Refresh balance on demand
6. Handle disconnection

### Mock Mode Behavior
- Auto-connect in development with NEXT_PUBLIC_MOCK_AUTO_LOGIN
- Use active-user persona (100 WLD) by default
- Support user switching for testing different balance scenarios

## Resolved Clarifications

1. **Balance refresh interval**: On-demand refresh via user interaction
2. **Display format**: 2 decimal places with WLD symbol (e.g., "100.00 WLD")
3. **Multiple wallets**: Single wallet only, using MiniKit SDK standard
4. **Session persistence**: Until explicit disconnect, using localStorage
5. **Error handling**: Follow existing Login component patterns with user-friendly messages

## Best Practices from Existing Code

### Security
- Never expose private keys in frontend
- Use nonce for authentication
- Validate all user inputs
- Handle MiniKit unavailability gracefully

### Performance
- Lazy load MiniKit to avoid SSR issues
- Cache user data to minimize API calls
- Use React.memo for balance display component
- Implement proper loading states

### User Experience
- Clear connection status indicators
- Smooth transitions between states
- Informative error messages
- Consistent with existing UI patterns

## Risks and Mitigations

### Risk: MiniKit Unavailable
- **Mitigation**: Graceful fallback with clear messaging, mock mode for development

### Risk: Balance Sync Issues
- **Mitigation**: Manual refresh button, clear last update timestamp

### Risk: Connection State Loss
- **Mitigation**: LocalStorage persistence, auto-reconnect attempt on page load

## Conclusion
The existing infrastructure provides excellent foundation for implementing wallet connection and balance display. No architectural changes needed - simply extend existing patterns with a new component integrated into the DepositWorkflow screen.