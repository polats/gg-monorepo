# @bazaar-x402/core

Core types, interfaces, and utilities for the Bazaar x402 marketplace library.

## Overview

This package provides the foundational types and interfaces used by both the server and client SDKs. It includes:

- **Types**: Listing, payment, mystery box, and transaction types
- **Adapters**: Storage and item adapter interfaces
- **Utilities**: Validation, conversion, and error handling utilities

## Installation

```bash
pnpm add @bazaar-x402/core
```

## Usage

```typescript
import { Listing, StorageAdapter, ItemAdapter } from '@bazaar-x402/core';
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

## Package Structure

```
src/
├── types/          # Type definitions
├── adapters/       # Adapter interfaces
└── utils/          # Utility functions
```
