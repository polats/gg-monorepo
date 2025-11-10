# Requirements Document: Vercel Backend Deployment

## Introduction

This feature enables the Goblin Gardens backend to be deployed on Vercel alongside the existing client deployment, allowing the game to run independently of Reddit's Devvit platform while maintaining compatibility with both local development and Reddit deployment modes.

## Glossary

- **Backend System**: The Express.js server that provides API endpoints for game state management, trading, and player persistence
- **Vercel Platform**: Serverless hosting platform that will host both the client and backend
- **Redis Service**: Vercel-integrated Redis database service from Vercel Marketplace (e.g., Vercel KV powered by Upstash) for persistent data storage
- **Devvit Context**: Reddit-specific authentication and context information provided by the Devvit platform
- **Environment Adapter**: Code layer that abstracts differences between Vercel, local, and Reddit deployment environments
- **API Client**: Frontend code that makes HTTP requests to backend endpoints

## Requirements

### Requirement 1: Multi-Environment Backend Support

**User Story:** As a developer, I want the backend to run on Vercel, locally, and on Reddit without code duplication, so that I can maintain a single codebase.

#### Acceptance Criteria

1. WHEN the Backend System is deployed to any environment, THE Backend System SHALL use environment-specific configuration to determine runtime behavior
2. WHEN the Backend System initializes, THE Backend System SHALL detect the current environment (Vercel, local, or Reddit) and load appropriate adapters
3. WHEN the Backend System receives an API request, THE Backend System SHALL use the Environment Adapter to handle authentication and context extraction
4. WHERE the Backend System runs on Vercel, THE Backend System SHALL connect to an external Redis Service for data persistence
5. WHERE the Backend System runs locally, THE Backend System SHALL use in-memory storage for data persistence

### Requirement 2: Vercel KV Integration

**User Story:** As a developer, I want to use Vercel KV (Redis) from the Vercel Marketplace, so that player data persists across serverless function invocations with native Vercel integration.

#### Acceptance Criteria

1. WHEN the Backend System runs on Vercel, THE Backend System SHALL connect to Vercel KV using the @vercel/kv SDK with automatic environment variable configuration
2. WHEN a Redis operation is requested, THE Backend System SHALL use a Redis adapter that works with both Devvit's Redis and Vercel KV clients
3. IF the Redis connection fails, THEN THE Backend System SHALL return an appropriate error response to the API Client
4. WHEN the Backend System performs Redis operations, THE Backend System SHALL use the same key structure across all environments
5. THE Backend System SHALL support Redis operations including get, set, delete, zAdd, zRem, zRange, and zCard

### Requirement 3: Authentication Abstraction

**User Story:** As a developer, I want authentication to work differently on Vercel vs Reddit, so that users can play the game on both platforms.

#### Acceptance Criteria

1. WHEN the Backend System runs on Reddit, THE Backend System SHALL use Devvit's reddit.getCurrentUsername() for authentication
2. WHEN the Backend System runs on Vercel, THE Backend System SHALL extract username from request headers or session tokens
3. WHEN the Backend System runs locally, THE Backend System SHALL accept username from X-Username header for testing
4. THE Backend System SHALL provide a consistent username string to all API endpoint handlers regardless of environment
5. IF authentication fails in any environment, THEN THE Backend System SHALL return a 401 unauthorized response

### Requirement 4: Vercel Serverless Function Compatibility

**User Story:** As a developer, I want the Express app to work as Vercel serverless functions, so that the backend can scale automatically.

#### Acceptance Criteria

1. THE Backend System SHALL export the Express app in a format compatible with Vercel's serverless function requirements
2. WHEN deployed to Vercel, THE Backend System SHALL handle requests through Vercel's function runtime
3. THE Backend System SHALL complete all API requests within Vercel's 10-second timeout limit
4. THE Backend System SHALL not maintain persistent connections or long-running processes
5. THE Backend System SHALL initialize Redis connections efficiently to minimize cold start latency

### Requirement 5: Environment Configuration Management

**User Story:** As a developer, I want environment-specific configuration through environment variables, so that I can deploy to different environments without code changes.

#### Acceptance Criteria

1. THE Backend System SHALL read configuration from environment variables with Vercel KV automatically configured through KV_REST_API_URL and KV_REST_API_TOKEN
2. WHEN required environment variables are missing, THE Backend System SHALL log clear error messages indicating which variables are needed
3. THE Backend System SHALL provide default values for optional configuration variables
4. THE Backend System SHALL validate environment variables at startup before accepting requests
5. THE Backend System SHALL not expose sensitive configuration values in error messages or logs

### Requirement 6: API Client Environment Detection

**User Story:** As a player, I want the game to automatically connect to the correct backend, so that I don't need to configure anything.

#### Acceptance Criteria

1. WHEN the API Client initializes, THE API Client SHALL detect whether it is running on Vercel, locally, or on Reddit
2. WHEN the API Client runs on Vercel, THE API Client SHALL make API requests to relative paths (same domain)
3. WHEN the API Client runs locally, THE API Client SHALL make API requests to http://localhost:3000
4. WHEN the API Client runs on Reddit, THE API Client SHALL make API requests to the Devvit webview domain
5. THE API Client SHALL not require manual configuration to determine the API base URL

### Requirement 7: Backward Compatibility

**User Story:** As a developer, I want existing local and Reddit deployments to continue working, so that I don't break current functionality.

#### Acceptance Criteria

1. WHEN the Backend System runs in local mode, THE Backend System SHALL function identically to the current local.ts implementation
2. WHEN the Backend System runs on Reddit, THE Backend System SHALL function identically to the current index.ts implementation
3. THE Backend System SHALL maintain the same API endpoint paths and request/response formats
4. THE Backend System SHALL maintain the same Redis key structure for player state and offers
5. THE Backend System SHALL not require changes to existing client code for local or Reddit modes

### Requirement 8: Vercel Deployment Configuration

**User Story:** As a developer, I want a simple deployment process to Vercel, so that I can deploy updates quickly.

#### Acceptance Criteria

1. THE Backend System SHALL include a vercel.json configuration file that defines serverless function routes
2. THE Backend System SHALL include a build script that prepares the backend for Vercel deployment
3. WHEN deployed to Vercel, THE Backend System SHALL serve API endpoints at /api/* paths
4. THE Backend System SHALL include documentation for setting up environment variables in Vercel
5. THE Backend System SHALL support deployment through Vercel CLI or GitHub integration
