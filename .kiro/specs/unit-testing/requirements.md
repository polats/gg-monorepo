# Requirements Document

## Introduction

This specification defines the requirements for implementing comprehensive unit tests for the Goblin Gardens application. The testing framework will focus on validating authentication mechanisms, API endpoints, data persistence, and core business logic in local and Vercel deployment environments. Tests will run automatically via GitHub Actions after every commit to ensure continuous validation. Devvit testing will be implemented in a future phase.

## Glossary

- **System**: The Goblin Gardens testing infrastructure
- **Test Suite**: A collection of related test cases organized by module or feature
- **Vitest**: The testing framework used for running unit tests
- **Client Code**: Frontend code in `src/client/` including utilities, hooks, and components
- **Server Code**: Backend code in `src/server/` including routes, adapters, and business logic
- **Shared Code**: Common types and interfaces in `src/shared/`
- **Local Environment**: Development environment using in-memory storage (Map)
- **Vercel Environment**: Production-like environment using Redis
- **Test Coverage**: Percentage of code executed by tests
- **Mock**: Simulated object or function used to isolate code under test
- **Gem Value Calculation**: Critical algorithm that must match exactly between client and server
- **Redis Adapter**: Interface for data persistence operations
- **Auth Adapter**: Interface for user authentication operations

## Requirements

### Requirement 1: Test Infrastructure Setup

**User Story:** As a developer, I want a properly configured testing infrastructure, so that I can write and run tests efficiently across all environments.

#### Acceptance Criteria

1. WHEN the project is initialized, THE System SHALL provide a Vitest configuration file for the client code
2. WHEN the project is initialized, THE System SHALL provide a Vitest configuration file for the server code
3. WHEN tests are executed, THE System SHALL support TypeScript without requiring compilation
4. WHEN tests are executed, THE System SHALL provide code coverage reporting with thresholds
5. WHERE test scripts are defined, THE System SHALL include commands for running client tests, server tests, and all tests together

### Requirement 2: API Client Testing

**User Story:** As a developer, I want comprehensive tests for the API client, so that I can ensure HTTP requests are constructed correctly and responses are handled properly.

#### Acceptance Criteria

1. WHEN API client is initialized, THE System SHALL configure the correct base URL for the environment
2. WHEN API requests are made, THE System SHALL include required headers including authentication
3. WHEN API responses are successful, THE System SHALL parse and return the response data
4. WHEN API responses fail with network errors, THE System SHALL throw appropriate error messages
5. WHEN API responses fail with HTTP errors, THE System SHALL throw appropriate error messages with status codes
6. WHEN authentication headers are missing, THE System SHALL handle the error gracefully
7. WHEN request payloads are serialized, THE System SHALL produce valid JSON
8. WHEN response data is deserialized, THE System SHALL validate against expected types

### Requirement 3: API Route Testing

**User Story:** As a developer, I want comprehensive tests for API routes, so that I can ensure endpoints handle requests correctly, validate inputs, and return appropriate responses.

#### Acceptance Criteria

1. WHEN /api/init is called, THE System SHALL return valid response with postId, count, and username
2. WHEN /api/init is called without postId in context, THE System SHALL return 400 error
3. WHEN /api/player-state/save is called with valid data, THE System SHALL persist data and return success
4. WHEN /api/player-state/save is called without playerState, THE System SHALL return 400 error with message
5. WHEN /api/player-state/load is called for existing user, THE System SHALL return saved state
6. WHEN /api/player-state/load is called for new user, THE System SHALL return null state
7. WHEN /api/offers is called, THE System SHALL return paginated list with correct structure
8. WHEN /api/offers is called with cursor parameter, THE System SHALL return correct page of results
9. WHEN /api/offers/update is called with valid gems, THE System SHALL create offer and update index
10. WHEN /api/offers/update is called with empty gems array, THE System SHALL return 400 error
11. WHEN /api/offers/remove is called, THE System SHALL delete offer and remove from index
12. WHEN /api/trade/execute is called with valid trade, THE System SHALL complete transaction atomically
13. WHEN /api/trade/execute is called with same buyer and seller, THE System SHALL return 400 error
14. WHEN /api/trade/execute is called for non-existent offer, THE System SHALL return 404 error
15. IF any route receives malformed JSON, THEN THE System SHALL return 400 error with descriptive message

### Requirement 4: Redis Adapter Testing

**User Story:** As a developer, I want tests for the Redis adapter, so that I can ensure data persistence operations work correctly in both local and Vercel environments.

#### Acceptance Criteria

1. WHEN the adapter is initialized for local environment, THE System SHALL use in-memory Map storage
2. WHEN the adapter is initialized for Vercel environment, THE System SHALL use Redis client
3. WHEN a key-value pair is stored, THE System SHALL retrieve the same value
4. WHEN a key is deleted, THE System SHALL return null on subsequent retrieval
5. WHEN a counter is incremented, THE System SHALL return the new value
6. WHEN sorted set operations are performed, THE System SHALL maintain correct ordering
7. WHEN sorted set members are retrieved, THE System SHALL support pagination with cursor and limit
8. WHEN sorted set cardinality is requested, THE System SHALL return the correct count

### Requirement 5: Authentication Adapter Testing

**User Story:** As a developer, I want tests for the authentication adapter, so that I can ensure user identification works correctly across environments.

#### Acceptance Criteria

1. WHEN username is requested in local environment, THE System SHALL extract username from X-Username header
2. WHEN username is requested in Vercel environment, THE System SHALL extract username from X-Username header
3. WHEN username header is missing in local environment, THE System SHALL return a default username
4. WHEN username header is missing in Vercel environment, THE System SHALL return a default username
5. WHEN username is extracted, THE System SHALL sanitize the value to prevent injection attacks

### Requirement 6: Environment Adapter Testing

**User Story:** As a developer, I want tests for environment detection and configuration, so that I can ensure the application behaves correctly in local, Vercel, and Devvit environments.

#### Acceptance Criteria

1. WHEN environment is detected in local mode, THE System SHALL return Environment.LOCAL
2. WHEN environment is detected in Vercel mode, THE System SHALL return Environment.VERCEL
3. WHEN environment is detected in Devvit mode, THE System SHALL return Environment.DEVVIT
4. WHEN environment configuration is requested for local, THE System SHALL provide in-memory storage config
5. WHEN environment configuration is requested for Vercel, THE System SHALL provide Redis connection config
6. WHEN environment variables are missing, THE System SHALL fall back to local environment
7. WHEN environment configuration is invalid, THE System SHALL throw descriptive error

### Requirement 7: Test Organization and Maintainability

**User Story:** As a developer, I want well-organized test files, so that I can easily find and maintain tests as the codebase evolves.

#### Acceptance Criteria

1. WHEN tests are created for client utilities, THE System SHALL place them in `src/client/utils/__tests__/` directory
2. WHEN tests are created for server routes, THE System SHALL place them in `src/server/core/__tests__/` directory
3. WHEN tests are created for server adapters, THE System SHALL place them in `src/server/adapters/__tests__/` directory
4. WHEN test files are named, THE System SHALL use the pattern `[module-name].test.ts`
5. WHEN test suites are organized, THE System SHALL group related tests using describe blocks
6. WHEN test cases are written, THE System SHALL use descriptive names that explain the scenario and expected outcome

### Requirement 8: Mock and Test Utilities

**User Story:** As a developer, I want reusable test utilities and mocks, so that I can write tests more efficiently and consistently.

#### Acceptance Criteria

1. WHEN gem fixtures are needed, THE System SHALL provide factory functions for creating test gems
2. WHEN player state fixtures are needed, THE System SHALL provide factory functions for creating test player states
3. WHEN Redis operations are tested, THE System SHALL provide mock Redis adapter implementations
4. WHEN HTTP requests are tested, THE System SHALL provide mock request and response objects
5. WHEN authentication is tested, THE System SHALL provide mock auth adapter implementations

### Requirement 9: GitHub Actions CI/CD Integration

**User Story:** As a developer, I want tests to run automatically via GitHub Actions after every commit, so that I can catch issues immediately and prevent broken code from being merged.

#### Acceptance Criteria

1. WHEN code is pushed to any branch, THE System SHALL trigger GitHub Actions workflow
2. WHEN pull request is created, THE System SHALL run tests and report status
3. WHEN tests are executed in GitHub Actions, THE System SHALL install dependencies automatically
4. WHEN tests are executed in GitHub Actions, THE System SHALL run client tests
5. WHEN tests are executed in GitHub Actions, THE System SHALL run server tests
6. WHEN tests fail in GitHub Actions, THE System SHALL mark the workflow as failed
7. WHEN tests pass in GitHub Actions, THE System SHALL mark the workflow as successful
8. WHEN coverage reports are generated, THE System SHALL upload them as workflow artifacts
9. WHERE coverage thresholds are not met, THE System SHALL fail the workflow
10. WHEN workflow completes, THE System SHALL display test results summary in the Actions tab

### Requirement 10: Error Handling and Edge Cases

**User Story:** As a developer, I want tests that validate error handling and edge cases, so that I can ensure the application behaves predictably under unexpected conditions.

#### Acceptance Criteria

1. WHEN API receives malformed JSON, THE System SHALL return 400 error with descriptive message
2. WHEN API receives missing required fields, THE System SHALL return 400 error identifying the missing field
3. WHEN authentication fails, THE System SHALL return 401 error
4. WHEN resource is not found, THE System SHALL return 404 error
5. WHEN Redis connection fails, THE System SHALL handle the error gracefully and log appropriately
6. WHEN concurrent requests modify the same data, THE System SHALL prevent race conditions
7. WHEN request timeout occurs, THE System SHALL return 408 error
8. WHEN server encounters unexpected error, THE System SHALL return 500 error without exposing internal details
