# Implementation Plan

- [x] 1. Set up testing infrastructure
  - Install Vitest and testing dependencies
  - Create workspace configuration for multi-project testing
  - Configure TypeScript for test files
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Install Vitest dependencies
  - Add vitest, @vitest/ui, and c8 to devDependencies
  - Add supertest and @types/supertest for API testing
  - Add jsdom for client-side testing environment
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Create Vitest workspace configuration
  - Create vitest.workspace.ts in goblin-gardens root
  - Define client and server test projects
  - Configure separate environments (jsdom vs node)
  - _Requirements: 1.1, 1.3_

- [x] 1.3 Create client Vitest configuration
  - Create src/client/vitest.config.ts
  - Configure jsdom environment
  - Set up coverage thresholds (80% lines, functions, statements; 75% branches)
  - Configure path aliases
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 1.4 Create server Vitest configuration
  - Create src/server/vitest.config.ts
  - Configure node environment
  - Set up coverage thresholds (85% lines, functions, statements; 80% branches)
  - Configure path aliases
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 1.5 Add test scripts to package.json
  - Add test:client script
  - Add test:server script
  - Add test:all script
  - Add test:coverage script
  - Add test:watch script for development
  - _Requirements: 1.5_

- [x] 2. Create test fixtures and mocks
  - Build reusable test data factories
  - Create mock implementations for adapters
  - Set up Express request/response mocks
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2.1 Create gem fixtures
  - Create __tests__/fixtures/gems.ts
  - Implement createTestGem factory function
  - Implement createTestGems for multiple gems
  - Support all gem types, shapes, and rarities
  - _Requirements: 8.1_

- [x] 2.2 Create player state fixtures
  - Create __tests__/fixtures/player-state.ts
  - Implement createTestPlayerState factory function
  - Support custom coin amounts and gem collections
  - _Requirements: 8.2_

- [x] 2.3 Create offer fixtures
  - Create __tests__/fixtures/offers.ts
  - Implement createTestOffer factory function
  - Support custom usernames, gems, and values
  - _Requirements: 8.2_

- [x] 2.4 Create Redis adapter mock
  - Create __tests__/mocks/redis.ts
  - Implement in-memory Map storage
  - Mock all Redis operations (get, set, del, incrBy, zAdd, zRange, zCard, zRem)
  - Use vi.fn() for tracking calls
  - _Requirements: 8.3_

- [x] 2.5 Create auth adapter mock
  - Create __tests__/mocks/auth.ts
  - Implement createMockAuthAdapter function
  - Support custom username configuration
  - Mock getUsername method
  - _Requirements: 8.5_

- [x] 2.6 Create Express mocks
  - Create __tests__/mocks/express.ts
  - Implement createMockRequest function
  - Implement createMockResponse function
  - Support headers, body, query, params
  - _Requirements: 8.4_

- [ ] 3. Implement API client tests
  - Test HTTP request construction
  - Test response handling
  - Test error scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 3.1 Create API client test file
  - Create src/client/utils/__tests__/api-client.test.ts
  - Set up test suite with beforeEach hooks
  - Mock global fetch function
  - _Requirements: 2.1, 2.2_

- [ ] 3.2 Test init endpoint
  - Test successful init request
  - Test correct URL and headers
  - Test response parsing
  - Test network error handling
  - Test HTTP error handling
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 3.3 Test savePlayerState endpoint
  - Test successful save request
  - Test correct headers including X-Username
  - Test request body serialization
  - Test error handling
  - _Requirements: 2.2, 2.3, 2.7_

- [ ] 3.4 Test loadPlayerState endpoint
  - Test successful load request
  - Test response deserialization
  - Test null state handling
  - Test error handling
  - _Requirements: 2.3, 2.8_

- [ ] 3.5 Test offers endpoints
  - Test getOffers with pagination
  - Test updateOffer request
  - Test removeOffer request
  - Test error handling for all offer operations
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 3.6 Test trade execution endpoint
  - Test executeTrade request
  - Test request payload structure
  - Test success response handling
  - Test error response handling
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Implement server adapter tests
  - Test Redis adapter operations
  - Test auth adapter username extraction
  - Test environment detection
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 4.1 Create Redis adapter test file
  - Create src/server/adapters/__tests__/redis-adapter.test.ts
  - Set up test suite for local environment
  - Initialize adapter before each test
  - _Requirements: 4.1_

- [ ] 4.2 Test Redis basic operations
  - Test set and get operations
  - Test null return for non-existent keys
  - Test delete operation
  - Test increment operation
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 4.3 Test Redis sorted set operations
  - Test zAdd for adding members
  - Test zRange for retrieving members
  - Test zCard for counting members
  - Test zRem for removing members
  - Test pagination with cursor and limit
  - Test reverse ordering
  - _Requirements: 4.6, 4.7, 4.8_

- [ ] 4.4 Create auth adapter test file
  - Create src/server/adapters/__tests__/auth-adapter.test.ts
  - Set up test suite for local environment
  - Create mock Express requests
  - _Requirements: 5.1_

- [ ] 4.5 Test auth adapter username extraction
  - Test extraction from X-Username header
  - Test default username when header is missing
  - Test username sanitization
  - Test different environments (local, Vercel)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.6 Create environment detection test file
  - Create src/server/adapters/__tests__/environment.test.ts
  - Set up test suite with environment variable manipulation
  - Save and restore original process.env
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 4.7 Test environment detection logic
  - Test local environment detection (default)
  - Test Vercel environment detection (VERCEL=1)
  - Test Devvit environment detection (DEVVIT_EXECUTION_ID)
  - Test priority when multiple environments are set
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.8 Test environment configuration
  - Test getEnvironmentConfig for local
  - Test getEnvironmentConfig for Vercel
  - Test error handling for invalid config
  - _Requirements: 6.4, 6.5, 6.7_

- [ ] 5. Implement server route tests
  - Test all API endpoints
  - Test request validation
  - Test response formatting
  - Test error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

- [ ] 5.1 Create routes test file
  - Create src/server/core/__tests__/routes.test.ts
  - Set up Express app with routes
  - Initialize mock Redis and auth adapters
  - Use supertest for HTTP testing
  - _Requirements: 3.1_

- [ ] 5.2 Test /api/init endpoint
  - Test successful init with postId and username
  - Test 400 error when postId is missing
  - Test Redis get operation is called
  - Test response structure
  - _Requirements: 3.1, 3.2_

- [ ] 5.3 Test /api/player-state/save endpoint
  - Test successful save with valid playerState
  - Test 400 error when playerState is missing
  - Test Redis set operation is called with correct key
  - Test response indicates success
  - _Requirements: 3.3, 3.4_

- [ ] 5.4 Test /api/player-state/load endpoint
  - Test loading existing player state
  - Test returning null for new user
  - Test Redis get operation is called with correct key
  - Test response structure
  - _Requirements: 3.5, 3.6_

- [ ] 5.5 Test /api/offers endpoint
  - Test returning paginated offers
  - Test cursor-based pagination
  - Test limit parameter
  - Test hasMore and nextCursor fields
  - Test Redis zRange operation
  - _Requirements: 3.7, 3.8_

- [ ] 5.6 Test /api/offers/update endpoint
  - Test creating offer with valid gems
  - Test 400 error with empty gems array
  - Test 400 error when gems don't have isOffering=true
  - Test Redis set and zAdd operations
  - Test 2x value multiplier is applied
  - _Requirements: 3.9, 3.10_

- [ ] 5.7 Test /api/offers/remove endpoint
  - Test removing existing offer
  - Test removing non-existent offer
  - Test Redis del and zRem operations
  - _Requirements: 3.11_

- [ ] 5.8 Test /api/trade/execute endpoint
  - Test successful trade execution
  - Test 400 error when buyer equals seller
  - Test 404 error when offer doesn't exist
  - Test 400 error when seller doesn't have gems
  - Test 400 error when buyer has insufficient coins
  - Test atomic transaction (all operations succeed or fail together)
  - Test gems transferred to buyer
  - Test coins transferred to seller
  - Test offer removed from marketplace
  - _Requirements: 3.12, 3.13, 3.14_

- [ ] 5.9 Test error handling for malformed requests
  - Test 400 error for malformed JSON
  - Test 400 error for missing required fields
  - Test error messages are descriptive
  - _Requirements: 3.15, 10.1, 10.2_

- [ ] 6. Implement error handling tests
  - Test various error scenarios
  - Test error message formatting
  - Test error status codes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [ ] 6.1 Test authentication errors
  - Test 401 error when authentication fails
  - Test missing X-Username header handling
  - Test invalid username format handling
  - _Requirements: 10.3_

- [ ] 6.2 Test resource not found errors
  - Test 404 error for non-existent offers
  - Test 404 error for non-existent player states
  - Test error messages identify missing resource
  - _Requirements: 10.4_

- [ ] 6.3 Test Redis connection errors
  - Mock Redis connection failure
  - Test graceful error handling
  - Test error logging
  - Test 500 error response
  - _Requirements: 10.5_

- [ ] 6.4 Test concurrent request handling
  - Test race condition prevention in trades
  - Test atomic transaction behavior
  - Test stale data detection
  - _Requirements: 10.6_

- [ ] 6.5 Test timeout errors
  - Mock slow Redis operations
  - Test timeout handling
  - Test 408 error response
  - _Requirements: 10.7_

- [ ] 6.6 Test unexpected server errors
  - Mock unexpected exceptions
  - Test 500 error response
  - Test error details are not exposed to client
  - Test error logging for debugging
  - _Requirements: 10.8_

- [ ] 7. Set up GitHub Actions CI/CD
  - Create workflow file
  - Configure test execution
  - Set up coverage reporting
  - Configure failure notifications
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [ ] 7.1 Create GitHub Actions workflow file
  - Create .github/workflows/test.yml
  - Configure triggers for push and pull_request
  - Set up Ubuntu runner
  - _Requirements: 9.1, 9.2_

- [ ] 7.2 Configure Node.js setup
  - Use actions/setup-node@v4
  - Set Node.js version to 20
  - Enable npm caching
  - _Requirements: 9.3_

- [ ] 7.3 Add dependency installation step
  - Run npm ci in goblin-gardens directory
  - Ensure clean install from package-lock.json
  - _Requirements: 9.3_

- [ ] 7.4 Add client test execution step
  - Run npm run test:client
  - Execute in goblin-gardens directory
  - _Requirements: 9.4_

- [ ] 7.5 Add server test execution step
  - Run npm run test:server
  - Execute in goblin-gardens directory
  - _Requirements: 9.5_

- [ ] 7.6 Add coverage report generation
  - Run npm run test:coverage
  - Generate HTML and LCOV reports
  - _Requirements: 9.8_

- [ ] 7.7 Configure coverage artifact upload
  - Use actions/upload-artifact@v4
  - Upload coverage directory
  - Name artifact "coverage-report"
  - _Requirements: 9.8_

- [ ] 7.8 Add coverage threshold check
  - Run coverage with JSON reporter
  - Fail workflow if thresholds not met
  - _Requirements: 9.9_

- [ ] 7.9 Configure workflow status reporting
  - Ensure failed tests mark workflow as failed
  - Ensure passed tests mark workflow as successful
  - Display test summary in Actions tab
  - _Requirements: 9.6, 9.7, 9.10_

- [ ] 8. Documentation and cleanup
  - Document testing patterns
  - Add README for test directory
  - Update main README with testing instructions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 8.1 Create test directory README
  - Create __tests__/README.md
  - Document fixture usage
  - Document mock usage
  - Provide examples of writing new tests
  - _Requirements: 7.5, 7.6_

- [ ] 8.2 Update main README
  - Add testing section to apps/goblin-gardens/README.md
  - Document how to run tests locally
  - Document how to view coverage reports
  - Document CI/CD integration
  - _Requirements: 7.5, 7.6_

- [ ] 8.3 Add JSDoc comments to test utilities
  - Document fixture factory functions
  - Document mock creation functions
  - Provide usage examples
  - _Requirements: 7.5, 7.6_

- [ ] 8.4 Verify test organization
  - Ensure all tests are in __tests__ directories
  - Ensure test files follow naming convention
  - Ensure describe blocks group related tests
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
