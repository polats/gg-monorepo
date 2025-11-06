# @gg/platform

Platform detection and unified interfaces for World and Reddit platforms.

## Overview

This package provides automatic platform detection and unified APIs for building applications that work across both World (Worldcoin) and Reddit (Devvit) platforms.

## Features

### Platform Detection
- Automatic detection of World, Reddit, or Local development environments
- Runtime platform checking
- Feature detection based on platform capabilities

### Environment Configuration
- Unified environment configuration
- Platform-specific API URLs
- Feature flags (mock mode, debug mode)

### Platform Initialization
- Async platform initialization with callbacks
- Platform-specific setup logic
- Error handling

### Feature Detection
- Wallet support detection
- WorldID verification support
- Reddit authentication support
- Payment capability detection
- 3D rendering support
- Storage availability

## Usage

### Basic Platform Detection

```typescript
import {
  getCurrentPlatform,
  isWorld,
  isReddit,
  isLocal,
  Platform
} from '@gg/platform';

// Get current platform
const platform = getCurrentPlatform();
console.log(`Running on: ${platform}`);

// Check specific platforms
if (isWorld()) {
  console.log('Running on World platform');
}

if (isReddit()) {
  console.log('Running on Reddit platform');
}

if (isLocal()) {
  console.log('Running in local development');
}
```

### Platform Initialization

```typescript
import { initializePlatform } from '@gg/platform';

// Initialize with callbacks
await initializePlatform({
  onPlatformDetected: (platform) => {
    console.log(`Detected platform: ${platform}`);
  },
  onInitialized: () => {
    console.log('Platform initialized successfully');
  },
  onError: (error) => {
    console.error('Platform initialization failed:', error);
  },
});
```

### Environment Configuration

```typescript
import { getEnvironmentConfig } from '@gg/platform';

const config = getEnvironmentConfig();

console.log(`Platform: ${config.platform}`);
console.log(`Development: ${config.isDevelopment}`);
console.log(`API URL: ${config.apiBaseUrl}`);
console.log(`Mock mode: ${config.features.mockMode}`);
console.log(`Debug mode: ${config.features.debugMode}`);
```

### Feature Detection

```typescript
import { platformFeatures } from '@gg/platform';

// Check available features
if (platformFeatures.supportsWallet()) {
  // Show wallet connection UI
}

if (platformFeatures.supportsWorldID()) {
  // Enable WorldID verification
}

if (platformFeatures.supportsRedditAuth()) {
  // Use Reddit authentication
}

if (platformFeatures.supports3D()) {
  // Render 3D content
}
```

### Conditional Rendering by Platform

```typescript
import { getCurrentPlatform, Platform } from '@gg/platform';

function App() {
  const platform = getCurrentPlatform();

  return (
    <div>
      {platform === Platform.World && <WorldSpecificUI />}
      {platform === Platform.Reddit && <RedditSpecificUI />}
      {platform === Platform.Local && <LocalDevUI />}
    </div>
  );
}
```

## Environment Variables

### Next.js (World apps)
- `NEXT_PUBLIC_PLATFORM` - Force platform detection (e.g., 'world')
- `NEXT_PUBLIC_MOCK_MODE` - Enable mock mode
- `NEXT_PUBLIC_DEBUG_MODE` - Enable debug mode
- `NEXT_PUBLIC_API_URL` - Override API base URL

### Vite (Reddit apps)
- `VITE_PLATFORM` - Force platform detection (e.g., 'reddit')
- `VITE_MOCK_MODE` - Enable mock mode
- `VITE_DEBUG_MODE` - Enable debug mode
- `VITE_API_URL` - Override API base URL

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean
```

## Platform Support Matrix

| Feature | World | Reddit | Local |
|---------|-------|--------|-------|
| Wallet Connection | ✅ | ❌ | ✅ |
| WorldID Verification | ✅ | ❌ | ✅ |
| Reddit Auth | ❌ | ✅ | ✅ |
| Payments | ✅ | ❌ | ✅ |
| 3D Rendering | ✅ | ✅ | ✅ |
| Persistent Storage | ✅ | ✅ | ✅ |
