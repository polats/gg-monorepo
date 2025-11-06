# @gg/types

Shared TypeScript types for the Goblin Gardens monorepo.

## Overview

This package contains common type definitions used across both Diamond Hands and Goblin Gardens applications.

## Exports

- **Platform Types**: Enum and types for World, Reddit, and Local platforms
- **User Types**: Base user, WorldUser, RedditUser interfaces
- **Game Types**: GameType enum and GameSession interface
- **Auth Types**: Authentication state and token types
- **API Types**: Common API response and pagination types
- **Environment Types**: Configuration types for different environments
- **Error Types**: Standardized error codes and interfaces

## Usage

```typescript
import { Platform, User, GameType, ApiResponse } from '@gg/types';

// Platform detection
const currentPlatform: Platform = Platform.World;

// Type-safe user handling
const user: User = {
  id: '123',
  username: 'player1',
  platform: Platform.World,
  worldId: 'world_123',
  verified: true,
  createdAt: new Date(),
};

// API responses
const response: ApiResponse<User> = {
  success: true,
  data: user,
};
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
