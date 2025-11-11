# Viewing Test Results in GitHub Actions

This document explains how to view test results from the GitHub Actions CI/CD pipeline.

## Quick Access

1. Go to the **Actions** tab in the GitHub repository
2. Click on the latest workflow run (or any specific run)
3. View the test summary directly on the workflow page

## Test Summary

The workflow automatically generates a comprehensive test summary that includes:

### 📊 Summary View

At the top of each workflow run, you'll see:

- **🧪 Client Tests**: Summary of client-side test results
- **🔧 Server Tests**: Summary of server-side test results  
- **📊 Coverage Report**: Code coverage statistics
- **✅ Test Execution Summary**: Overall pass/fail status

### 📋 Detailed Results

Each test section includes:

1. **Quick Summary**: Test file count, total tests, and duration
2. **Expandable Details**: Click "View full [client/server] test output" to see complete logs
3. **Test Breakdown**: Individual test results with pass/fail status

## Example Summary

```
## 🧪 Client Tests

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  234ms

<details><summary>📋 View full client test output</summary>
[Full test output here...]
</details>

## 🔧 Server Tests

 Test Files  4 passed (4)
      Tests  84 passed (84)
   Duration  788ms

<details><summary>📋 View full server test output</summary>
[Full test output here...]
</details>

## ✅ Test Execution Summary

✅ **Client Tests**: Passed
✅ **Server Tests**: Passed
✅ **Coverage Report**: Generated

📦 **Artifacts**: Test results and coverage reports are available in the workflow artifacts.
```

## Downloading Test Artifacts

For detailed analysis, you can download test artifacts:

1. Scroll to the bottom of the workflow run page
2. Find the **Artifacts** section
3. Download available artifacts:
   - **test-results**: Contains text and JSON output files
   - **coverage-report**: Contains HTML coverage reports

### Available Files

**test-results artifact:**
- `client-test-output.txt` - Full client test output
- `server-test-output.txt` - Full server test output
- `client-test-results.json` - Machine-readable client test results
- `server-test-results.json` - Machine-readable server test results
- `coverage-output.txt` - Coverage generation output

**coverage-report artifact:**
- `coverage/` - HTML coverage reports (open `index.html` in browser)

## Viewing Coverage Reports

To view the HTML coverage report:

1. Download the `coverage-report` artifact
2. Extract the ZIP file
3. Open `coverage/index.html` in your web browser
4. Navigate through files to see line-by-line coverage

## Test Result Retention

- Test artifacts are retained for **30 days**
- Coverage reports are retained for **30 days**
- After this period, artifacts are automatically deleted

## Understanding Test Status

### ✅ Success
All tests passed successfully.

### ❌ Failed
One or more tests failed. Check the detailed output for failure reasons.

### ⚠️ Skipped
Tests were skipped or not run (usually server tests during early development).

## Troubleshooting

### No Test Results Visible

If you don't see test results:
1. Check that the workflow completed
2. Look for error messages in the workflow logs
3. Verify that tests are properly configured in `package.json`

### Tests Failing in CI but Passing Locally

Common causes:
1. **Environment differences**: CI uses Ubuntu, you might use macOS/Windows
2. **Node version**: CI uses Node 20, check your local version
3. **Dependencies**: CI does a clean install, try `rm -rf node_modules && npm install`
4. **Timing issues**: CI might be slower, check for race conditions

### Coverage Not Generated

Coverage generation may be skipped if:
1. Not all tests are implemented yet
2. Coverage thresholds are not met
3. Test execution failed before coverage could run

## Running Tests Locally

To run the same tests locally:

```bash
# Client tests
npm run test:client

# Server tests  
npm run test:server

# All tests
npm run test

# With coverage
npm run test:coverage
```

## CI/CD Workflow Triggers

Tests run automatically on:
- **Push** to any branch
- **Pull Request** to `main` or `develop` branches

## Related Documentation

- [Testing Guide](../README.md) - Overview of testing strategy
- [Test Mocks](../__tests__/README.md) - Mock utilities documentation
- [GitHub Actions Workflow](../../.github/workflows/test.yml) - Workflow configuration
