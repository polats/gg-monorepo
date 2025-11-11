# Implementation Plan

- [x] 0. Setup storage persistence layer with in-memory/Redis shim
  - Install `ioredis` package for Redis client (only used when REDIS_URL is configured)
  - Create storage client shim at `lib/storage.ts` that abstracts storage operations (get, set, del, expire, etc.)
  - Implement in-memory storage backend using Map for local development (default, no installation required)
  - Implement Redis storage backend that connects using REDIS_URL environment variable
  - Add auto-detection: use in-memory if REDIS_URL is not set, otherwise use Redis
  - Add `.env.local.example` with commented `# REDIS_URL=redis://localhost:6379` to show optional Redis usage
  - For Vercel deployment: add Redis storage via Vercel dashboard (automatically sets REDIS_URL environment variable)
  - Document storage strategy in README: in-memory for local (zero setup), Redis for production (Vercel KV)
  - Add memory cleanup for in-memory storage (TTL expiration simulation using setTimeout)
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 0.5. Implement session management with storage layer
  - Create API routes for session management (/api/session/create, /api/session/get)
  - Generate unique session IDs using crypto.randomUUID() and store in httpOnly cookies
  - Implement session data structure in storage layer with TTL (time-to-live) of 7 days
  - Create session middleware to validate and refresh sessions on each request
  - Add session cleanup logic for expired sessions (automatic with Redis TTL, simulated with in-memory)
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 1. Create gem balance context and state management
  - Implement React Context for centralized gem balance management with methods for adding, spending, and checking gem availability
  - Replace sessionStorage with storage layer-backed API calls for persistence across devices and sessions
  - Create validation logic to prevent negative balances and invalid transactions
  - Add optimistic UI updates with server-side validation
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 7.1, 7.2, 7.4_

- [x] 2. Build gem balance header component
  - Create persistent header component that displays current gem balance with icon and numerical value
  - Integrate with gem balance context to show real-time updates when balance changes
  - Implement responsive layout that works on mobile and desktop viewports
  - Add "Purchase Gems" button that links to gem purchase options
  - _Requirements: 2.1, 2.2, 2.4, 8.3_

- [x] 2.5. Connect Purchase Gems button to payment flow
  - Update gem balance header "Purchase Gems" button to link to actual purchase routes (/purchase/starter, /purchase/value, or /purchase/premium)
  - Create gem purchase selection page that displays all three tier options with pricing and bonuses
  - Ensure clicking purchase buttons triggers X402 payment middleware and displays Coinbase Pay widget
  - Add proper navigation flow from header → purchase selection → payment → success page
  - _Requirements: 1.1, 1.2, 1.3, 2.4, 6.1, 6.3_

- [x] 3. Update X402 middleware for gem purchase tiers
  - Modify middleware.ts to define three gem purchase routes: starter ($1/100 gems), value ($5/550 gems), premium ($10/1200 gems)
  - Configure X402 payment middleware with appropriate prices and descriptions for each tier
  - Ensure payment verification flow works correctly for all three tiers
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.3, 6.4, 6.5_

- [x] 4. Create gem purchase success pages
  - Build dynamic route pages at /purchase/[tier] that handle starter, value, and premium tiers
  - Extract tier information from route parameters and credit appropriate gem amount to player balance via API
  - Display purchase confirmation with gem amount, bonus percentage, and transaction summary
  - Add navigation buttons to gacha system and homepage
  - Implement idempotency to prevent duplicate gem credits on page refresh
  - _Requirements: 1.4, 1.5, 8.1_

- [x] 4.5. Create gem balance API routes
  - Build API route /api/gems/balance to fetch current gem balance from storage layer
  - Build API route /api/gems/add to credit gems after successful purchase with transaction logging
  - Build API route /api/gems/spend to deduct gems for gacha pulls with validation
  - Implement rate limiting to prevent abuse (max 100 requests per minute per session)
  - Add transaction history tracking in storage layer for audit purposes
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 7.1, 7.2_

- [x] 4.6. Test gem balance updates through API integration
  - Verify gem balance header updates in real-time when gems are added via /api/gems/add
  - Test gem balance decreases correctly when gems are spent via /api/gems/spend
  - Confirm balance persists across page refreshes and browser sessions using storage layer
  - Test optimistic UI updates with server-side validation rollback on failure
  - Verify balance updates work correctly after successful purchase flow
  - Test concurrent balance updates to ensure no race conditions
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 7.1, 7.2_

- [ ] 5. Implement gacha item generator utility
  - Create utility function that generates random items using weighted probability (Common: 60%, Rare: 30%, Epic: 8%, Legendary: 2%)
  - Define item pool with at least 3-5 items per rarity tier with names and placeholder images
  - Implement unique ID generation for each gacha pull
  - Create item data structure with name, rarity, image, and timestamp
  - _Requirements: 3.2, 5.3, 7.5_

- [ ] 6. Build gacha pull interface
  - Create gacha page with pull button that costs 10 gems
  - Integrate with gem balance context to validate sufficient gems before allowing pull
  - Implement pull button state management (idle, pulling, revealing, complete)
  - Add gem cost display and insufficient gems messaging
  - Deduct gems from balance via API when pull is initiated with server-side validation
  - Store gacha pull results in storage layer linked to user session
  - _Requirements: 3.1, 3.3, 3.4, 5.1, 8.2, 8.5_

- [ ] 6.5. Create gacha pull API routes
  - Build API route /api/gacha/pull to handle gacha pulls with gem deduction and item generation
  - Implement server-side validation to ensure sufficient gems before processing pull
  - Generate random item using weighted probability on server-side to prevent client manipulation
  - Store pull result in storage layer collection linked to session ID
  - Return pull result with item details and updated gem balance
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.3_

- [ ] 7. Create gacha pull animation and reveal
  - Implement animated loading state with minimum 1.5 second duration to build anticipation
  - Create item reveal animation that displays obtained item with rarity-appropriate effects
  - Use distinct color schemes for each rarity (Common: gray, Rare: blue, Epic: purple, Legendary: gold)
  - Add special visual effects for legendary item reveals
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Build gacha collection component
  - Create collection component that displays all items obtained from storage layer-backed collection
  - Implement responsive grid layout that adjusts from 1-4 columns based on viewport width
  - Add rarity-based color coding and visual distinction for each tier
  - Display item details including name, rarity, image, and acquisition timestamp
  - Handle empty state with message encouraging players to perform gacha pulls
  - Fetch collection data from storage layer via API route on component mount
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.4_

- [ ] 8.5. Create collection API routes
  - Build API route /api/collection/get to fetch all gacha items for current session from storage layer
  - Implement pagination support for large collections (50 items per page)
  - Add sorting options (newest first, rarity, alphabetical)
  - Store collection efficiently in storage layer (sorted set with timestamp scores in Redis, sorted array in-memory)
  - Return collection with total count and pagination metadata
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Update homepage with new navigation
  - Replace existing "cheap/expensive content" links with gem purchase tier options
  - Add "Play Gacha" button that navigates to gacha system
  - Include brief explanation of X402 protocol and how the payment flow works
  - Add visual indicators showing gem amounts and bonuses for each purchase tier
  - _Requirements: 6.2, 6.5_

- [ ] 10. Add comprehensive documentation
  - Update README.md with gacha system explanation and microtransaction flow
  - Document the complete user journey from gem purchase to gacha pull
  - Add code comments explaining X402 payment integration points
  - Include setup instructions for both devnet (testing) and mainnet (production)
  - Create visual flow diagram showing payment → gems → gacha → collection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Implement responsive design and mobile optimization
  - Ensure Coinbase Pay widget renders correctly on mobile browsers
  - Verify all touch targets meet 44x44 pixel minimum size requirement
  - Test and adjust layouts for common mobile viewport sizes (375px, 414px, 768px)
  - Optimize gacha animations for mobile performance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Add error handling and edge cases
  - Implement error handling for payment verification failures with user-friendly messages
  - Add insufficient gems validation and messaging throughout the application
  - Handle storage layer failures with graceful degradation (Redis connection failures auto-fallback to in-memory)
  - Add retry logic for failed gacha item generation and API calls
  - Display appropriate error states for network failures
  - Implement circuit breaker pattern for Redis operations to prevent cascading failures (graceful fallback to in-memory)
  - Add health check endpoint /api/health to monitor storage connectivity and report backend type (in-memory/Redis)
  - _Requirements: 3.4, 7.4_
