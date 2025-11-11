# Test Setup Guide

## Installation

Install the test dependencies:

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `@types/jest` - TypeScript definitions
- `jest-environment-node` - Node.js test environment

## Available Test Commands

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Open Browser Tests
```bash
npm run test:browser
```

### Verify Implementation
```bash
npm run verify
```

## Test Structure

```
__tests__/
├── gem-balance-integration.test.ts  # Automated integration tests
├── browser-integration-test.html    # Browser-based interactive tests
├── MANUAL_TESTING_GUIDE.md         # Manual testing instructions
├── README.md                        # Test documentation
├── QUICK_START.md                   # Quick start guide
├── SETUP.md                         # This file
└── verify-implementation.sh         # Verification script
```

## Running Tests

### 1. Automated Tests (Jest)

**Prerequisites:**
- Dev server must be running on `http://localhost:3000`
- Valid session must exist

**Run:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm test
```

**Expected Output:**
```
PASS  __tests__/gem-balance-integration.test.ts
  Gem Balance API Integration
    Add Gems API
      ✓ should add gems and return updated balance
      ✓ should accumulate gems across multiple purchases
      ✓ should reject invalid amounts
      ✓ should enforce rate limiting
    Spend Gems API
      ✓ should spend gems and return updated balance
      ✓ should reject spending more gems than available
      ✓ should track total spent gems
    ...

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

### 2. Browser Tests (Interactive)

**Prerequisites:**
- Dev server must be running

**Run:**
```bash
# Start dev server
npm run dev

# Open browser tests (macOS)
npm run test:browser

# Or manually open
open __tests__/browser-integration-test.html
```

**Usage:**
1. Click individual test buttons to run specific tests
2. Click "Run All Tests" to run all tests sequentially
3. View results in the colored result boxes
4. Check the balance display at the top

### 3. Manual Tests

Follow the comprehensive guide in `MANUAL_TESTING_GUIDE.md`

### 4. Verification Script

Check that all implementation files are in place:

```bash
npm run verify
```

**Expected Output:**
```
✓ All checks passed! Implementation is complete.
Passed: 25
Failed: 0
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/api/gems/**/*.ts',
    'contexts/gem-balance-context.tsx',
  ],
}
```

### Coverage Reports

After running `npm run test:coverage`, view the coverage report:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html
```

**Coverage Targets:**
- API routes: `app/api/gems/**/*.ts`
- Context: `contexts/gem-balance-context.tsx`

## Environment Variables

For testing, you may need to set:

```bash
# .env.test (optional)
TEST_BASE_URL=http://localhost:3000
NEXT_PUBLIC_NETWORK=solana-devnet
```

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Tests fail with "Connection refused"
```bash
# Make sure dev server is running
npm run dev
```

### Tests fail with "Unauthorized"
```bash
# Clear browser storage and create new session
# Or restart dev server
```

### Jest not found
```bash
# Install dependencies
npm install

# Or install Jest globally
npm install -g jest
```

### TypeScript errors in tests
```bash
# Make sure TypeScript is installed
npm install --save-dev typescript @types/jest ts-jest

# Check tsconfig.json includes __tests__
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npm run dev &
      - run: sleep 5
      - run: npm test
      - run: npm run verify
```

## Best Practices

1. **Always run tests before committing**
   ```bash
   npm test && npm run verify
   ```

2. **Check coverage regularly**
   ```bash
   npm run test:coverage
   ```

3. **Use watch mode during development**
   ```bash
   npm run test:watch
   ```

4. **Run browser tests for visual verification**
   ```bash
   npm run test:browser
   ```

5. **Follow manual testing guide for comprehensive testing**
   - See `MANUAL_TESTING_GUIDE.md`

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Run tests: `npm test`
4. ✅ Open browser tests: `npm run test:browser`
5. ✅ Verify implementation: `npm run verify`
6. ✅ Check coverage: `npm run test:coverage`

## Support

For issues or questions:
1. Check `MANUAL_TESTING_GUIDE.md` for troubleshooting
2. Review `README.md` for test documentation
3. Check `IMPLEMENTATION_SUMMARY.md` for implementation details
4. Review test output for specific error messages

## Summary

You now have a complete test suite with:
- ✅ Automated integration tests (Jest)
- ✅ Browser-based interactive tests
- ✅ Manual testing guide
- ✅ Verification script
- ✅ Coverage reporting
- ✅ Easy-to-use npm scripts

Run `npm test` to get started!
