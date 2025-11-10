# Implementation Plan: Vercel Backend Deployment

- [x] 1. Set up project dependencies and configuration
  - Install @vercel/kv package for Vercel KV integration
  - Create vercel.json configuration file with routes and function settings
  - Update package.json with Vercel-specific build scripts
  - _Requirements: 2.1, 4.2, 8.1, 8.2_

- [ ] 2. Create adapter layer for environment abstraction
- [ ] 2.1 Implement environment detection adapter
  - Create src/server/adapters/environment.ts with Environment enum and detection logic
  - Implement detectEnvironment() function to identify Vercel, Local, or Reddit
  - Implement getEnvironmentConfig() to return environment-specific configuration
  - _Requirements: 1.1, 1.2, 5.4_

- [ ] 2.2 Implement Redis adapter for multi-environment support
  - Create src/server/adapters/redis-adapter.ts with RedisAdapter interface
  - Implement VercelKVAdapter using @vercel/kv SDK
  - Implement DevvitRedisAdapter wrapping @devvit/web/server redis
  - Implement InMemoryAdapter for local development
  - Create createRedisAdapter factory function
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 2.3 Implement authentication adapter for multi-environment support
  - Create src/server/adapters/auth-adapter.ts with AuthAdapter interface
  - Implement VercelAuthAdapter using X-Username header
  - Implement DevvitAuthAdapter using reddit.getCurrentUsername()
  - Implement LocalAuthAdapter with fallback to default username
  - Create createAuthAdapter factory function
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.4 Create adapter index file
  - Create src/server/adapters/index.ts to export all adapters
  - Export environment, redis, and auth adapters
  - _Requirements: 1.2_

- [ ] 3. Extract and centralize Express routes
- [ ] 3.1 Create centralized routes module
  - Create src/server/core/routes.ts with createRoutes function
  - Define RouteContext interface with redis, auth, and postId
  - Extract all API routes from index.ts to routes.ts
  - Update routes to use RedisAdapter and AuthAdapter instead of direct imports
  - _Requirements: 1.3, 7.3_

- [ ] 3.2 Extract helper functions to routes module
  - Move calculateGemValue function to routes.ts
  - Move formatLastActive function to routes.ts
  - Move getUserPlayerStateKey function to routes.ts
  - Ensure all helper functions are environment-agnostic
  - _Requirements: 7.4_

- [ ] 4. Create Vercel serverless entry point
- [ ] 4.1 Implement Vercel server entry
  - Create src/server/vercel.ts with Express app setup
  - Initialize environment detection and adapters
  - Use createRoutes with Vercel-specific context
  - Add health check endpoint at /api/health
  - Export app as default for Vercel
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.2 Create Vercel API catch-all route
  - Create api/[...path].ts to handle all /api/* requests
  - Import and use Express app from vercel.ts
  - Convert VercelRequest to Express-compatible format
  - Handle async request/response properly
  - _Requirements: 4.1, 8.3_

- [ ] 5. Update existing server files to use adapters
- [ ] 5.1 Refactor Reddit server (index.ts) to use adapters
  - Import adapters from adapters/index.ts
  - Replace direct redis usage with RedisAdapter
  - Replace reddit.getCurrentUsername() with AuthAdapter
  - Use createRoutes instead of inline route definitions
  - Maintain Devvit-specific functionality (createPost, internal routes)
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 5.2 Refactor local server (local.ts) to use adapters
  - Import adapters from adapters/index.ts
  - Replace in-memory Map with InMemoryAdapter
  - Use AuthAdapter for username extraction
  - Use createRoutes instead of inline route definitions
  - Maintain local-specific functionality (CORS, mock data)
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 6. Create client-side API client with environment detection
- [ ] 6.1 Implement API client utility
  - Create src/client/utils/api-client.ts with getApiBaseUrl function
  - Detect Vercel deployment by checking hostname
  - Detect local development by checking for localhost
  - Detect Reddit Devvit by checking for reddit.com domain
  - Return appropriate API base URL for each environment
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.2 Create typed API call helper
  - Implement apiCall<T> function with fetch wrapper
  - Automatically prepend base URL to endpoints
  - Add default Content-Type header
  - Handle error responses appropriately
  - Export for use throughout client code
  - _Requirements: 6.1, 6.5_

- [ ] 7. Update client code to use new API client
  - Find all fetch calls to /api/* endpoints in client code
  - Replace with apiCall helper from api-client.ts
  - Ensure proper TypeScript types are used
  - Test that all API calls work in all environments
  - _Requirements: 6.5, 7.5_

- [ ] 8. Add environment variable validation
- [ ] 8.1 Create environment validation utility
  - Create src/server/utils/env-validation.ts
  - Implement validateEnvironment function
  - Check for required Vercel KV variables when on Vercel
  - Log clear error messages for missing variables
  - Validate at server startup before accepting requests
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 8.2 Add validation to all server entry points
  - Call validateEnvironment in vercel.ts
  - Call validateEnvironment in index.ts (Reddit)
  - Call validateEnvironment in local.ts
  - Handle validation failures gracefully
  - _Requirements: 5.4_

- [ ] 9. Create Vercel deployment documentation
- [ ] 9.1 Document Vercel KV setup process
  - Create docs/vercel-deployment.md
  - Document how to create Vercel KV database
  - Document automatic environment variable configuration
  - Document how to verify KV connection
  - _Requirements: 8.4_

- [ ] 9.2 Document deployment process
  - Document Vercel CLI installation
  - Document deployment commands (preview and production)
  - Document how to view logs and monitor performance
  - Document rollback procedures
  - _Requirements: 8.5_

- [ ] 9.3 Document environment-specific behavior
  - Document differences between Vercel, Local, and Reddit modes
  - Document authentication mechanisms for each environment
  - Document Redis storage differences
  - Document troubleshooting common issues
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [ ]* 10. Testing and validation
- [ ]* 10.1 Test local development mode
  - Start local server with npm run dev:local
  - Verify in-memory storage works
  - Test all API endpoints with multiple users
  - Verify no regressions from refactoring
  - _Requirements: 7.1_

- [ ]* 10.2 Test Reddit Devvit mode
  - Deploy to Devvit with npm run dev:reddit
  - Verify Devvit Redis adapter works
  - Test Reddit authentication
  - Verify no regressions from refactoring
  - _Requirements: 7.2_

- [ ]* 10.3 Test Vercel deployment
  - Deploy to Vercel preview environment
  - Set up Vercel KV database
  - Test all API endpoints from deployed client
  - Verify serverless function performance
  - Test cold start times
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ]* 10.4 Test cross-environment compatibility
  - Verify API response formats are identical across environments
  - Test that client works with all three backends
  - Verify Redis key structure is consistent
  - Test error handling in all environments
  - _Requirements: 7.3, 7.4_
