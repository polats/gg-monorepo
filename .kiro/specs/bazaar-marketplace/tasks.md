# Implementation Plan

- [x] 1. Set up Bazaar package structure
  - Create monorepo structure under `packages/bazaar-x402/`
  - Set up three packages: `core`, `server`, and `client`
  - Configure TypeScript with project references
  - Set up package.json files with dependencies
  - Configure build scripts for all packages
  - _Requirements: 1.1, 1.4_

- [x] 2. Implement core types and interfaces
- [x] 2.1 Create listing and payment types
  - Define `Listing` interface with all properties
  - Define `PaymentRequirements` and `PaymentPayload` types
  - Define `MysteryBoxTier` and `MysteryBoxPurchase` types
  - Define `Transaction` type for purchase records
  - Export all types from `@bazaar-x402/core`
  - _Requirements: 1.4, 2.1, 4.1_

- [x] 2.2 Create adapter interfaces
  - Define `StorageAdapter` interface with all methods
  - Define `ItemAdapter` interface with generic type support
  - Define `PaymentAdapter` interface for mock/real payment handling
  - Add JSDoc comments for all interface methods
  - _Requirements: 1.3, 5.1, 6.1_

- [x] 2.3 Create utility functions
  - Implement USDC decimal conversion utilities
  - Implement validation helpers for listings and payments
  - Implement error classes with error codes
  - Add unit tests for all utilities
  - _Requirements: 1.4, 7.2_

- [x] 3. Implement server SDK with mock payment support
- [x] 3.1 Create mock payment adapter
  - Implement `MockPaymentAdapter` class
  - Add payment verification bypass logic
  - Add mock transaction hash generation
  - Add console logging for debugging
  - Write unit tests for mock adapter
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Create memory storage adapter
  - Implement `MemoryStorageAdapter` for testing
  - Use Map/Set for in-memory storage
  - Implement all `StorageAdapter` methods
  - Add pagination support
  - Write unit tests for memory adapter
  - _Requirements: 5.3_

- [x] 3.3 Implement listing manager
  - Create `ListingManager` class
  - Implement `createListing` with item validation and locking
  - Implement `cancelListing` with item unlocking
  - Implement `getActiveListings` with pagination
  - Implement `getListingsByUser` method
  - Add error handling for all operations
  - Write unit tests with mock adapters
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.4 Implement mystery box manager
  - Create `MysteryBoxManager` class
  - Implement tier configuration loading
  - Implement random item generation with weighted rarities
  - Implement purchase recording
  - Add error handling for invalid tiers
  - Write unit tests with mock item adapter
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.5 Create main marketplace class
  - Implement `BazaarMarketplace` class with constructor
  - Integrate `ListingManager` and `MysteryBoxManager`
  - Implement `handlePurchaseRequest` (returns 200 in mock mode)
  - Implement `verifyAndCompletePurchase` with mock payment adapter
  - Implement `handleMysteryBoxRequest` and `verifyAndCompleteMysteryBox`
  - Add configuration for mock vs real mode
  - Write integration tests
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.6 Create Express middleware integration
  - Implement `createBazaarRoutes` function
  - Add GET `/api/bazaar/listings` endpoint
  - Add POST `/api/bazaar/listings` endpoint
  - Add DELETE `/api/bazaar/listings/:id` endpoint
  - Add GET `/api/bazaar/purchase/:listingId` endpoint (no 402 in mock mode)
  - Add GET `/api/bazaar/mystery-box/:tierId` endpoint
  - Add error handling middleware
  - Write integration tests for all routes
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Implement client SDK with mock wallet support
- [x] 4.1 Create mock wallet adapter
  - Implement `MockWalletAdapter` class
  - Add mock public key generation
  - Add mock transaction signing
  - Add console logging for debugging
  - Write unit tests for mock wallet
  - _Requirements: 8.4_

- [x] 4.2 Create BazaarClient class
  - Implement constructor with configuration
  - Implement `getActiveListings` method
  - Implement `createListing` method
  - Implement `cancelListing` method
  - Implement `getMyListings` method
  - Add mock mode flag to skip x402 flow
  - Write unit tests with mock fetch
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4.3 Implement mock purchase flow
  - Implement `purchaseItem` with mock mode check
  - In mock mode: simple GET request without payment
  - Add error handling and retry logic
  - Implement `purchaseMysteryBox` with mock mode
  - Write integration tests
  - _Requirements: 3.1, 3.2, 8.4_

- [x] 4.4 Implement mystery box client methods
  - Implement `getMysteryBoxTiers` method
  - Integrate with purchase flow
  - Add UI-friendly error messages
  - Write unit tests
  - _Requirements: 4.1, 4.2, 8.4_

- [x] 4.5 Create standalone example application
  - Create `packages/bazaar-x402/example` directory
  - Set up simple Express server with bazaar routes
  - Create HTML/JS client demo page
  - Demonstrate listing creation and browsing
  - Demonstrate item purchase flow (mock mode)
  - Demonstrate mystery box purchase
  - Add README with setup instructions
  - _Requirements: 8.4, 10.2, 10.3_

- [ ] 5. Create Goblin Gardens integration example
- [ ] 5.1 Implement GemItemAdapter
  - Create `GemItemAdapter` class implementing `ItemAdapter<Gem>`
  - Implement `validateItemOwnership` using player state
  - Implement `lockItem` by setting `isOffering` flag
  - Implement `unlockItem` by clearing `isOffering` flag
  - Implement `transferItem` between player inventories
  - Implement `generateRandomItem` using existing gem generation
  - Implement `grantItemToUser` by adding to player gems
  - Write unit tests with mock Redis
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.3, 9.4_

- [ ] 5.2 Integrate Bazaar server into Goblin Gardens
  - Create `bazaar-integration.ts` in server folder
  - Set up `BazaarMarketplace` with GemItemAdapter
  - Use existing Redis adapter for storage
  - Configure mock mode via environment variable
  - Add bazaar routes to main Express app
  - Test all endpoints in local dev mode
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 5.3 Integrate Bazaar client into Goblin Gardens
  - Create `useBazaar` hook for React integration
  - Add mock wallet adapter for development
  - Create gem listing UI component
  - Create marketplace browse UI component
  - Create mystery box purchase UI component
  - Add mock mode indicator badge
  - Test all UI flows in local dev mode
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1_

- [ ] 5.4 Configure mystery box tiers for gems
  - Define starter, value, and premium mystery box tiers
  - Configure rarity weights for each tier
  - Add tier configuration to server setup
  - Create UI for displaying tier options
  - Test random gem generation
  - _Requirements: 4.1, 4.4, 9.5_

- [ ] 6. Add Redis storage adapter
- [ ] 6.1 Implement RedisStorageAdapter
  - Create `RedisStorageAdapter` class
  - Implement listing storage with sorted sets
  - Implement user listing indexes
  - Implement mystery box tier storage
  - Implement transaction recording
  - Add pagination support with cursor
  - Write integration tests with real Redis
  - _Requirements: 5.2, 5.4, 5.5_

- [ ] 6.2 Add atomic transaction support
  - Implement `executeAtomicTrade` method
  - Use Redis transactions (MULTI/EXEC) if available
  - Add fallback for environments without WATCH support
  - Add error handling and rollback logic
  - Write tests for concurrent purchase scenarios
  - _Requirements: 5.4, 7.5_

- [ ] 7. Implement real x402 payment flow
- [ ] 7.1 Create real payment adapter
  - Implement `RealPaymentAdapter` class
  - Implement Solana RPC connection
  - Implement transaction verification on-chain
  - Add polling logic with retries
  - Add timeout handling
  - Write integration tests with devnet
  - _Requirements: 3.1, 3.2, 7.1_

- [ ] 7.2 Implement payment verifier
  - Create `PaymentVerifier` class
  - Implement payment header decoding
  - Implement x402 version validation
  - Implement amount validation
  - Implement recipient validation
  - Implement USDC mint validation
  - Implement on-chain transaction verification
  - Write unit tests with mocked Solana RPC
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.3 Update marketplace to support 402 responses
  - Modify `handlePurchaseRequest` to return 402 in real mode
  - Add payment requirements generation
  - Update `verifyAndCompletePurchase` to use real payment adapter
  - Add payment header validation
  - Update mystery box flow for 402 responses
  - Write integration tests with real payment flow
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7.4 Implement real wallet integration in client
  - Add Solana wallet adapter integration
  - Implement USDC transfer transaction creation
  - Implement transaction signing and sending
  - Implement payment payload encoding
  - Update `purchaseItem` to use real x402 flow
  - Add wallet connection UI
  - Write integration tests with test wallet
  - _Requirements: 8.4_

- [ ] 7.5 Add facilitator integration
  - Configure facilitator URL (x402.org)
  - Add facilitator verification calls (optional)
  - Add fallback to direct on-chain verification
  - Test with devnet facilitator
  - _Requirements: 3.1, 3.2_

- [ ] 8. Add documentation and examples
- [ ] 8.1 Create README files
  - Write main README for bazaar package
  - Write README for each sub-package
  - Add installation instructions
  - Add quick start guide
  - Add configuration reference
  - Add troubleshooting section
  - _Requirements: 10.1, 10.2_

- [ ] 8.2 Add API documentation
  - Add JSDoc comments to all public methods
  - Generate TypeScript documentation
  - Create API reference markdown
  - Add code examples for common use cases
  - Document error codes and handling
  - _Requirements: 10.4, 10.5_

- [ ] 8.3 Create integration guide
  - Write step-by-step integration tutorial
  - Document adapter implementation patterns
  - Add Goblin Gardens walkthrough
  - Add migration guide from mock to real mode
  - Add best practices section
  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 8.4 Add example implementations
  - Create standalone example project
  - Add mock mode example
  - Add real payment example
  - Add custom item adapter example
  - Add custom storage adapter example
  - _Requirements: 10.2, 10.3_

- [ ]* 9. Testing and quality assurance
- [ ]* 9.1 Write comprehensive unit tests
  - Test all core utilities
  - Test all adapter implementations
  - Test listing manager
  - Test mystery box manager
  - Test payment verifier
  - Achieve >80% code coverage
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 9.2 Write integration tests
  - Test full purchase flow (mock mode)
  - Test full purchase flow (real mode with devnet)
  - Test mystery box flow
  - Test concurrent purchases
  - Test error scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 9.3 Perform security audit
  - Review payment verification logic
  - Review atomic transaction handling
  - Review item transfer security
  - Test for race conditions
  - Test for replay attacks
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.4 Load testing
  - Test with 100+ concurrent listings
  - Test with 50+ concurrent purchases
  - Test pagination performance
  - Test Redis performance under load
  - Optimize bottlenecks
  - _Requirements: 5.4, 5.5_

- [ ] 10. Production deployment preparation
- [ ] 10.1 Add rate limiting
  - Implement rate limiting middleware
  - Configure limits for each endpoint
  - Add rate limit headers
  - Test rate limit enforcement
  - _Requirements: 7.5_

- [ ] 10.2 Add monitoring and logging
  - Add structured logging for all operations
  - Add metrics for purchases and listings
  - Add error tracking
  - Add performance monitoring
  - Create monitoring dashboard
  - _Requirements: 1.1_

- [ ] 10.3 Create deployment guide
  - Document environment variables
  - Document infrastructure requirements
  - Add mainnet deployment checklist
  - Add rollback procedures
  - Add monitoring setup guide
  - _Requirements: 10.1_

- [ ] 10.4 Mainnet testing
  - Test with real USDC on devnet
  - Test with small amounts on mainnet
  - Verify all transactions on-chain
  - Test with real users
  - Monitor for issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
