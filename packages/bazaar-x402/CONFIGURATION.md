# Bazaar x402 Configuration Guide

This guide explains how to configure the Bazaar x402 marketplace for different environments and payment modes.

## Overview

The Bazaar x402 marketplace supports two payment modes:

- **Mock Mode**: In-memory or Redis-based currency for development/testing
- **Production Mode**: Real Solana USDC payments via x402 protocol

Configuration is managed through environment variables and can be validated at startup to ensure correct setup.

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure for Your Environment

**Development (Mock Mode)**:
```bash
PAYMENT_MODE=mock
MOCK_DEFAULT_BALANCE=1000
```

**Testing (Devnet)**:
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=devnet
```

**Production (Mainnet)**:
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=mainnet
SOLANA_MAINNET_RPC=https://your-rpc-provider.com
```

### 3. Load Configuration in Your Application

```typescript
import { loadAndValidateConfig, createCurrencyAdapter } from '@bazaar-x402/core';

// Load and validate configuration
const config = loadAndValidateConfig(process.env);

// Create currency adapter
const currencyAdapter = createCurrencyAdapter({ config });
```

## Configuration Reference

### Payment Mode

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PAYMENT_MODE` | `mock`, `production` | `mock` | Payment processing mode |

### Solana Network

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `SOLANA_NETWORK` | `devnet`, `mainnet` | `devnet` | Solana network to use |

### RPC Endpoints

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SOLANA_DEVNET_RPC` | URL | `https://api.devnet.solana.com` | Devnet RPC endpoint |
| `SOLANA_MAINNET_RPC` | URL | `https://api.mainnet-beta.solana.com` | Mainnet RPC endpoint |

**Recommended RPC Providers**:
- [Helius](https://helius.dev) - High performance, generous free tier
- [QuickNode](https://quicknode.com) - Reliable, global infrastructure
- [Alchemy](https://alchemy.com) - Developer-friendly, good analytics

### USDC Token Mints

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `USDC_MINT_DEVNET` | Address | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | USDC mint on devnet |
| `USDC_MINT_MAINNET` | Address | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | USDC mint on mainnet |

### Mock Mode Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MOCK_DEFAULT_BALANCE` | Number | `1000` | Starting balance for new users (USDC) |
| `MOCK_USE_REDIS` | Boolean | `false` | Use Redis for persistent storage |
| `MOCK_REDIS_URL` | URL | - | Redis connection URL |
| `MOCK_TX_ID_PREFIX` | String | `MOCK` | Prefix for mock transaction IDs |

### Transaction Polling

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TX_POLL_MAX_ATTEMPTS` | Number | `10` | Maximum polling attempts |
| `TX_POLL_INTERVAL_MS` | Number | `2000` | Interval between attempts (ms) |

### Balance Caching

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BALANCE_CACHE_DURATION` | Number | `30` | Cache duration (seconds) |

## Usage Examples

### Basic Configuration Loading

```typescript
import { loadConfig } from '@bazaar-x402/core';

const config = loadConfig(process.env);
console.log(`Payment mode: ${config.mode}`);
```

### Configuration with Validation

```typescript
import { loadAndValidateConfig, ConfigValidationError } from '@bazaar-x402/core';

try {
  const config = loadAndValidateConfig(process.env);
  console.log('Configuration valid!');
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error('Invalid configuration:', error.message);
    process.exit(1);
  }
}
```

### Creating Currency Adapter

```typescript
import { createCurrencyAdapter } from '@bazaar-x402/core';

const config = loadAndValidateConfig(process.env);
const currencyAdapter = createCurrencyAdapter({
  config,
  verbose: true, // Log initialization details
});
```

### Creating Currency Adapter from Environment

```typescript
import { createCurrencyAdapterFromEnv } from '@bazaar-x402/core';

// Convenience function that loads config and creates adapter
const currencyAdapter = createCurrencyAdapterFromEnv(
  process.env,
  undefined, // Optional Redis client
  true // Verbose logging
);
```

### Configuration Summary

```typescript
import { getConfigSummary } from '@bazaar-x402/core';

const config = loadAndValidateConfig(process.env);
console.log(getConfigSummary(config));
```

Output:
```
=== Bazaar x402 Configuration ===
Payment Mode: production
Solana Network: solana-devnet
RPC URL: https://api.devnet.solana.com
USDC Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Transaction Polling: 10 attempts @ 2000ms
Balance Cache: 30s
================================
```

## Environment-Specific Configurations

### Development Environment

```bash
# .env.development
PAYMENT_MODE=mock
MOCK_DEFAULT_BALANCE=10000
MOCK_USE_REDIS=false
```

Use mock mode for fast iteration without blockchain dependency.

### Staging Environment

```bash
# .env.staging
PAYMENT_MODE=production
SOLANA_NETWORK=devnet
SOLANA_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
TX_POLL_MAX_ATTEMPTS=15
TX_POLL_INTERVAL_MS=1500
```

Use devnet for testing with real blockchain but test USDC.

### Production Environment

```bash
# .env.production
PAYMENT_MODE=production
SOLANA_NETWORK=mainnet
SOLANA_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
USDC_MINT_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
TX_POLL_MAX_ATTEMPTS=20
TX_POLL_INTERVAL_MS=1000
BALANCE_CACHE_DURATION=60
```

Use mainnet with dedicated RPC provider for production.

## Validation Rules

The configuration system validates:

### Payment Mode
- Must be `mock` or `production`
- Mock mode requires `mockConfig`
- Production mode requires `x402Config`

### Solana Network
- Must be `solana-devnet` or `solana-mainnet`
- Accepts aliases: `devnet`, `mainnet`, `mainnet-beta`

### RPC URLs
- Must be valid HTTP/HTTPS URLs
- Validated using URL constructor

### USDC Mint Addresses
- Must be valid Solana public keys
- Base58 encoded, 32-44 characters

### Polling Parameters
- `maxPollAttempts` must be >= 1
- `pollIntervalMs` must be >= 100ms

### Balance Cache
- `balanceCacheDuration` must be >= 0 seconds

### Mock Mode
- `defaultBalance` must be >= 0
- Redis mode requires `redisUrl`
- `redisUrl` must be valid URL if provided

## Error Handling

### Configuration Validation Error

```typescript
import { ConfigValidationError } from '@bazaar-x402/core';

try {
  const config = loadAndValidateConfig(process.env);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    // Configuration is invalid
    console.error(error.message);
    // Example: "Configuration validation failed:
    //   - Invalid payment mode: "invalid"
    //   - Invalid devnet RPC URL: not-a-url"
  }
}
```

### Fail Fast on Startup

```typescript
// Validate configuration on startup
let config;
try {
  config = loadAndValidateConfig(process.env);
  console.log(getConfigSummary(config));
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1); // Exit immediately if config is invalid
}
```

## Testing Configuration

### Test Configuration Loading

```bash
# Test with default configuration
npx tsx test-config.ts

# Test with production mode
PAYMENT_MODE=production SOLANA_NETWORK=devnet npx tsx test-config.ts

# Test with invalid configuration
PAYMENT_MODE=production SOLANA_DEVNET_RPC=invalid npx tsx test-config.ts
```

### Unit Tests

```typescript
import { loadConfig, validateConfig } from '@bazaar-x402/core';

describe('Configuration', () => {
  it('should load mock mode', () => {
    const config = loadConfig({ PAYMENT_MODE: 'mock' });
    expect(config.mode).toBe('mock');
  });
  
  it('should validate production mode', () => {
    const config = loadConfig({ PAYMENT_MODE: 'production' });
    expect(() => validateConfig(config)).not.toThrow();
  });
});
```

## Migration Guide

### From Hardcoded Config to Environment Variables

**Before**:
```typescript
const currencyAdapter = new MockCurrencyAdapter({
  defaultBalance: 1000,
  useRedis: false,
});
```

**After**:
```typescript
const config = loadAndValidateConfig(process.env);
const currencyAdapter = createCurrencyAdapter({ config });
```

### From Mock to Production

1. Update environment variables:
```bash
PAYMENT_MODE=production
SOLANA_NETWORK=devnet
```

2. No code changes needed - adapter factory handles the switch

3. Test thoroughly on devnet before mainnet

## Best Practices

### 1. Validate on Startup

Always validate configuration when your application starts:

```typescript
const config = loadAndValidateConfig(process.env);
console.log(getConfigSummary(config));
```

### 2. Use Environment-Specific Files

Create separate `.env` files for each environment:
- `.env.development`
- `.env.staging`
- `.env.production`

### 3. Never Commit Secrets

Add `.env` to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 4. Document Required Variables

Maintain an up-to-date `.env.example` with all variables documented.

### 5. Use Dedicated RPC Providers

For production, use dedicated RPC providers (Helius, QuickNode) instead of public endpoints.

### 6. Monitor Configuration

Log configuration summary on startup to verify correct settings:

```typescript
console.log(getConfigSummary(config));
```

### 7. Test Configuration Changes

Always test configuration changes in staging before production.

## Troubleshooting

### Configuration Not Loading

**Problem**: Environment variables not being read

**Solution**:
- Verify `.env` file exists
- Check file is in correct directory
- Use `dotenv` package if needed:
  ```typescript
  import 'dotenv/config';
  ```

### Validation Errors

**Problem**: Configuration validation fails

**Solution**:
- Check error message for specific issues
- Verify all required variables are set
- Validate URLs and addresses are correct format

### RPC Connection Issues

**Problem**: Cannot connect to Solana RPC

**Solution**:
- Verify RPC URL is correct
- Check network connectivity
- Try alternative RPC provider
- Increase polling attempts/interval

### Transaction Not Confirming

**Problem**: Transactions not confirming on-chain

**Solution**:
- Increase `TX_POLL_MAX_ATTEMPTS`
- Increase `TX_POLL_INTERVAL_MS`
- Check Solana network status
- Verify transaction was broadcast

## Support

For issues or questions:
- Check [Example README](./example/README.md)
- Review [API Documentation](./API_ENDPOINTS.md)
- See [x402 Protocol Docs](https://x402.org)
