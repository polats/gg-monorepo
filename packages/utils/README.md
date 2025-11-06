# @gg/utils

Shared utility functions for the Goblin Gardens monorepo.

## Overview

This package contains common utility functions used across both Diamond Hands and Goblin Gardens applications.

## Features

### String Utilities
- `truncateAddress()` - Shorten Ethereum addresses
- `capitalize()` - Capitalize first letter
- `slugify()` - Convert strings to URL-friendly slugs

### Number Utilities
- `formatNumber()` - Format numbers with decimals
- `formatCurrency()` - Format currency values
- `clamp()` - Constrain values within range
- `randomInt()` - Generate random integers
- `randomFloat()` - Generate random floats

### Date Utilities
- `formatDate()` - Format dates
- `formatDateTime()` - Format dates with time
- `timeAgo()` - Relative time formatting ("2 hours ago")

### Validation
- `isValidEmail()` - Email validation
- `isValidUrl()` - URL validation
- `isValidEthereumAddress()` - Ethereum address validation

### Array Utilities
- `chunk()` - Split arrays into chunks
- `shuffle()` - Randomize array order
- `unique()` - Remove duplicates
- `groupBy()` - Group by key

### Async Utilities
- `sleep()` - Promise-based delay
- `retry()` - Retry failed promises
- `timeout()` - Add timeout to promises

### Object Utilities
- `pick()` - Select specific keys
- `omit()` - Exclude specific keys
- `isEmpty()` - Check if empty

### Storage
- `storage.get()` - Type-safe localStorage get
- `storage.set()` - Type-safe localStorage set
- `storage.remove()` - Remove from localStorage
- `storage.clear()` - Clear localStorage

### Performance
- `debounce()` - Debounce function calls
- `throttle()` - Throttle function calls

## Usage

```typescript
import {
  truncateAddress,
  formatNumber,
  timeAgo,
  sleep,
  storage
} from '@gg/utils';

// Truncate Ethereum address
const short = truncateAddress('0x1234567890abcdef1234567890abcdef12345678');
// "0x1234...5678"

// Format numbers
const formatted = formatNumber(1234567.89, 2);
// "1,234,567.89"

// Relative time
const relative = timeAgo(new Date(Date.now() - 3600000));
// "1 hour ago"

// Async utilities
await sleep(1000); // Wait 1 second

// Type-safe storage
storage.set('user', { id: '123', name: 'Player' });
const user = storage.get('user', { id: '', name: '' });
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean
```
