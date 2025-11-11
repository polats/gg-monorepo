# Design Document: Purchase Session Storage Bug Fix

## Overview

The current implementation has a critical architectural flaw where the gem balance is stored in two separate, non-synchronized locations:

1. **Client-side**: Browser sessionStorage (managed by React context)
2. **Server-side**: Redis/in-memory storage (managed by API routes)

When a purchase is made, the server correctly updates its storage, but the client-side sessionStorage is not properly synchronized with the server response. This causes the balance to appear incorrect or not update at all after purchase.

### Root Cause Analysis

The `addGems` function in `contexts/gem-balance-context.tsx` performs an optimistic update and then calls the API. However, there are several issues:

1. The optimistic update modifies local state but the subsequent server sync may fail silently
2. The sessionStorage save happens before server confirmation
3. The purchase page relies on the context's balance state, which may not reflect the server state
4. No explicit refresh or re-fetch after purchase completion

## Architecture

### Current Flow (Broken)
```
Purchase Page → addGems() → Optimistic Update → sessionStorage.set() → API Call → (Response ignored/not synced)
```

### Fixed Flow
```
Purchase Page → addGems() → API Call → Server Response → Update State → sessionStorage.set() → UI Update
```

## Components and Interfaces

### 1. Gem Balance Context (`contexts/gem-balance-context.tsx`)

**Changes Required:**
- Modify `addGems` to wait for server response before updating state
- Remove optimistic update for purchases (keep for spends if needed)
- Ensure sessionStorage is updated AFTER successful server response
- Add explicit balance refresh method

**Updated Flow:**
```typescript
async addGems(amount, description) {
  1. Call API /api/gems/add
  2. Wait for response
  3. If successful:
     - Update state with server response data
     - Save to sessionStorage
     - Return success
  4. If failed:
     - Log error
     - Do not update state
     - Return failure
}
```

### 2. Purchase Page (`app/purchase/[tier]/page.tsx`)

**Changes Required:**
- Ensure purchase crediting waits for complete API response
- Add error handling for failed credits
- Display loading state during credit operation
- Refresh balance explicitly after credit

**Updated Flow:**
```typescript
useEffect(() => {
  if (!credited && tierConfig) {
    creditGems()
      .then(() => {
        setCredited(true)
        // Balance is already updated by context
      })
      .catch(error => {
        // Show error to user
        setError(error.message)
      })
  }
}, [])
```

### 3. API Route (`app/api/gems/add/route.ts`)

**No changes required** - The API is working correctly and returning proper responses.

## Data Models

### GemBalance Interface
```typescript
interface GemBalance {
  current: number    // Current available gems
  lifetime: number   // Total gems ever purchased
  spent: number      // Total gems spent
}
```

### API Response Format
```typescript
{
  success: boolean
  balance: number      // Current balance
  lifetime: number     // Lifetime total
  spent: number        // Total spent
  added: number        // Amount just added
}
```

## Error Handling

### Scenario 1: API Call Fails
- **Action**: Do not update client state
- **User Feedback**: Display error message on purchase page
- **Recovery**: Allow user to retry or contact support

### Scenario 2: Session Expired
- **Action**: Create new session automatically
- **User Feedback**: Transparent to user
- **Recovery**: Retry purchase credit with new session

### Scenario 3: Network Timeout
- **Action**: Retry with exponential backoff (max 3 attempts)
- **User Feedback**: Show "Processing..." state
- **Recovery**: If all retries fail, show error with retry button

### Scenario 4: Partial Update
- **Action**: Always use server response as source of truth
- **User Feedback**: Display current balance from server
- **Recovery**: Fetch balance from server on page load

## Testing Strategy

### Unit Tests
- Test `addGems` function with successful API response
- Test `addGems` function with failed API response
- Test sessionStorage synchronization
- Test balance state updates

### Integration Tests
- Test complete purchase flow from purchase page to balance update
- Test session creation and gem crediting
- Test error recovery scenarios
- Test balance consistency across page navigation

### Manual Testing
1. Complete a purchase and verify balance updates immediately
2. Refresh page and verify balance persists
3. Navigate to different pages and verify balance consistency
4. Test with network throttling to simulate slow connections
5. Test with Redis disabled (in-memory storage)

## Implementation Notes

### Key Principles
1. **Server is source of truth**: Always trust server response over client state
2. **No optimistic updates for purchases**: Wait for server confirmation
3. **Explicit synchronization**: Always update sessionStorage after server response
4. **Error transparency**: Log all errors for debugging

### Performance Considerations
- API calls are fast (<100ms typically)
- Removing optimistic updates adds minimal latency
- User experience is better with correct data than fast incorrect data

### Backward Compatibility
- Changes are internal to context implementation
- No API changes required
- Existing components continue to work without modification
