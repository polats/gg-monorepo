# Implementation Plan

- [x] 1. Set up core currency types and interfaces
  - Create TypeScript types for currency operations (CurrencyBalance, Transaction, DeductionResult, AdditionResult)
  - Define CurrencyAdapter interface with all required methods
  - Create error classes (InsufficientBalanceError, PaymentVerificationError, NetworkMismatchError)
  - Add configuration types for mock and production modes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement MockCurrencyAdapter
  - [x] 2.1 Create MockCurrencyAdapter class implementing CurrencyAdapter interface
    - Implement in-memory Map storage for balances
    - Implement getBalance() with default balance initialization
    - Implement deduct() with balance validation
    - Implement add() for balance addition
    - Generate mock transaction IDs with timestamp and random suffix
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Add transaction history tracking to MockCurrencyAdapter
    - Store transactions in memory Map
    - Implement getTransactions() with pagination support
    - Record transaction type, amount, timestamp, and IDs
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [x] 2.3 Add Redis support for persistent mock mode (optional)
    - Add Redis client integration
    - Implement balance storage in Redis
    - Implement transaction storage in Redis
    - Add configuration flag for Redis vs in-memory
    - _Requirements: 2.1, 9.1_

  - [ ]* 2.4 Write unit tests for MockCurrencyAdapter
    - Test balance initialization
    - Test deduction with sufficient/insufficient balance
    - Test addition
    - Test transaction ID generation
    - Test transaction history retrieval
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Integrate MockCurrencyAdapter with example application
  - [x] 3.1 Update example server to initialize MockCurrencyAdapter
    - Import MockCurrencyAdapter from @bazaar-x402/core
    - Create adapter instance with default configuration (1000 USDC starting balance)
    - Pass adapter to marketplace initialization
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Add balance display to example UI
    - Create balance display component showing current USDC balance
    - Fetch balance from new GET /api/balance endpoint
    - Update balance after purchases
    - Show loading state during balance queries
    - Display balance in header next to wallet button
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.3 Add balance checking to purchase flows
    - Check balance before mystery box purchases
    - Check balance before listing purchases
    - Show "Insufficient Balance" error if balance too low
    - Deduct balance on successful purchase
    - Add balance to seller on listing sales
    - _Requirements: 2.2, 2.3, 4.3, 5.4_

  - [x] 3.4 Add balance API endpoints to example server
    - Create GET /api/balance/:userId endpoint
    - Create POST /api/balance/add endpoint (for testing)
    - Return balance in USDC format with currency type
    - Handle errors gracefully
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.5 Update mystery box and listing purchase to use currency
    - Integrate currency deduction in mystery box purchases
    - Integrate currency transfer in listing purchases
    - Record transactions with proper metadata
    - Show transaction confirmation messages
    - _Requirements: 4.3, 4.4, 5.4, 5.5, 7.1, 7.2_

- [ ] 4. Implement x402 payment protocol types and utilities
  - [ ] 4.1 Create x402 protocol types
    - Define PaymentRequirements interface
    - Define PaymentPayload interface
    - Define PaymentRequiredResponse interface
    - Add x402 version constant and header constants
    - _Requirements: 3.1, 3.2_

  - [ ] 4.2 Implement payment header encoding/decoding utilities
    - Create encodePaymentHeader() function for Base64 encoding
    - Create decodePaymentHeader() function for Base64 decoding
    - Add payload validation function
    - Handle encoding/decoding errors gracefully
    - _Requirements: 3.2, 10.1, 10.2_

  - [ ] 4.3 Create payment requirements builder
    - Implement createPaymentRequirements() function
    - Convert USDC amount to smallest unit (6 decimals)
    - Include network-specific USDC mint address
    - Add resource, description, and timeout fields
    - _Requirements: 3.2, 8.1, 8.2, 8.3_

  - [ ]* 4.4 Write unit tests for x402 utilities
    - Test payment header encoding/decoding
    - Test payment requirements creation
    - Test payload validation
    - Test error handling for invalid payloads
    - _Requirements: 3.1, 3.2, 10.1_


- [ ] 5. Implement X402Facilitator for payment verification
  - [ ] 5.1 Create X402Facilitator class
    - Initialize Solana Connection with network-specific RPC
    - Implement verifyPayment() method
    - Decode and validate payment payload
    - Verify network, amount, and recipient match requirements
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 8.5_

  - [ ] 5.2 Implement on-chain transaction verification
    - Create verifyTransactionOnChain() method
    - Poll Solana blockchain for transaction confirmation
    - Implement retry logic with configurable attempts and intervals
    - Validate transaction succeeded (no errors)
    - Return verification result with transaction hash
    - _Requirements: 3.3, 3.7, 3.8, 8.5, 10.6_

  - [ ] 5.3 Add network-specific configuration
    - Support devnet and mainnet RPC endpoints
    - Use network-specific USDC mint addresses
    - Validate transactions against correct network
    - Prevent cross-network verification
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

  - [ ]* 5.4 Write unit tests for X402Facilitator
    - Test payment verification with valid transaction
    - Test payment verification with invalid signature
    - Test amount validation
    - Test recipient validation
    - Test network mismatch handling
    - Test transaction polling with timeout
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 6. Implement X402CurrencyAdapter
  - [ ] 6.1 Create X402CurrencyAdapter class implementing CurrencyAdapter interface
    - Initialize with X402Facilitator and configuration
    - Implement getBalance() to query on-chain USDC balance
    - Cache balance queries for 30 seconds
    - Use network-specific USDC mint address
    - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 6.2 Implement purchase initiation (402 response)
    - Implement initiatePurchase() method
    - Create payment requirements with seller wallet
    - Return 402 status with payment requirements
    - Include resource URL and description
    - _Requirements: 3.2, 4.1, 4.2_

  - [ ] 6.3 Implement payment verification and completion
    - Implement verifyPurchase() method
    - Extract X-Payment header from request
    - Call X402Facilitator to verify payment
    - Return verification result with transaction hash
    - Handle verification errors appropriately
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 10.1, 10.2, 10.3_

  - [ ] 6.4 Implement transaction history for x402 mode
    - Store transaction records with blockchain tx hash
    - Include network ID in transaction records
    - Implement getTransactions() method
    - Support pagination for transaction queries
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 6.5 Write unit tests for X402CurrencyAdapter
    - Test balance queries with mocked Solana connection
    - Test purchase initiation returns 402
    - Test payment verification with valid payment
    - Test payment verification with invalid payment
    - Test transaction history retrieval
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.4, 7.5_


- [ ] 6. Integrate currency adapters with mystery box purchases
  - [ ] 6.1 Update MysteryBoxManager to accept CurrencyAdapter
    - Add currencyAdapter parameter to constructor
    - Update purchaseMysteryBox() to check balance
    - Deduct currency before generating box contents
    - Add items to inventory after successful payment
    - Create transaction record with purchase details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 6.2 Add rollback logic for failed mystery box purchases
    - Wrap item generation in try-catch
    - Refund currency if item generation fails
    - Refund currency if inventory update fails
    - Log rollback operations for debugging
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ] 6.3 Update mystery box API endpoint
    - Accept optional X-Payment header for x402 mode
    - Return 402 if using x402 and no payment header
    - Verify payment if payment header provided
    - Return mystery box contents on success
    - Return clear error messages on failure
    - _Requirements: 4.1, 4.2, 4.7, 10.1, 10.2_

  - [ ]* 6.4 Write integration tests for mystery box purchases
    - Test mock mode purchase with sufficient balance
    - Test mock mode purchase with insufficient balance
    - Test x402 mode returns 402 on initial request
    - Test x402 mode completes purchase with valid payment
    - Test x402 mode rejects invalid payment
    - Test rollback on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 7. Integrate currency adapters with marketplace listings
  - [ ] 7.1 Update ListingManager to accept CurrencyAdapter
    - Add currencyAdapter parameter to constructor
    - Update purchaseListing() to handle both mock and x402 modes
    - Check balance in mock mode
    - Return 402 in x402 mode without payment header
    - Verify payment in x402 mode with payment header
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 7.2 Implement listing purchase with currency transfer
    - Deduct currency from buyer (mock mode)
    - Add currency to seller (mock mode)
    - Verify payment on-chain (x402 mode)
    - Transfer item ownership from seller to buyer
    - Mark listing as sold
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 7.3 Create transaction records for buyer and seller
    - Record buyer transaction with purchase details
    - Record seller transaction with sale details
    - Include blockchain tx hash for x402 mode
    - Include listing ID and item ID
    - Store timestamp and amount
    - _Requirements: 5.7, 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.4 Update listing purchase API endpoint
    - Accept optional X-Payment header
    - Return 402 if using x402 and no payment header
    - Verify payment if payment header provided
    - Return purchase confirmation on success
    - Handle errors with clear messages
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 10.1, 10.2_

  - [ ]* 7.5 Write integration tests for listing purchases
    - Test mock mode purchase and currency transfer
    - Test mock mode insufficient balance error
    - Test x402 mode returns 402 on initial request
    - Test x402 mode completes purchase with valid payment
    - Test x402 mode rejects invalid payment
    - Test transaction records created for both parties
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_


- [ ] 8. Add balance query API endpoints
  - [ ] 8.1 Create GET /api/balance endpoint
    - Accept user ID from authentication
    - Query balance using currency adapter
    - Return balance in USDC format
    - Include currency type (USDC or MOCK_USDC)
    - Cache balance for 30 seconds in x402 mode
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 8.2 Create GET /api/transactions endpoint
    - Accept user ID from authentication
    - Support pagination parameters (page, limit)
    - Query transactions using currency adapter
    - Return transactions sorted by timestamp descending
    - Include transaction type, amount, and IDs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 8.3 Write API endpoint tests
    - Test balance query returns correct format
    - Test balance query with mock adapter
    - Test balance query with x402 adapter
    - Test transaction history with pagination
    - Test transaction history filtering by type
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.5, 7.6, 7.7_

- [ ] 9. Implement configuration and environment management
  - [ ] 9.1 Create configuration loader
    - Load PAYMENT_MODE from environment
    - Load SOLANA_NETWORK from environment
    - Load RPC endpoints for devnet and mainnet
    - Load USDC mint addresses for both networks
    - Load mock mode settings (default balance, Redis config)
    - Load transaction polling parameters
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 9.2 Add configuration validation
    - Validate payment mode is 'mock' or 'production'
    - Validate network is 'devnet' or 'mainnet'
    - Validate RPC URLs are valid
    - Validate USDC mint addresses are valid Solana public keys
    - Fail fast on startup if configuration is invalid
    - _Requirements: 9.6_

  - [ ] 9.3 Create currency adapter factory
    - Implement factory function to create appropriate adapter
    - Return MockCurrencyAdapter if mode is 'mock'
    - Return X402CurrencyAdapter if mode is 'production'
    - Pass configuration to adapter constructors
    - Log active mode and network on initialization
    - _Requirements: 1.4, 9.7_

  - [ ] 9.4 Add example .env file
    - Document all configuration variables
    - Provide example values for devnet
    - Provide example values for mainnet
    - Include comments explaining each variable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 9.5 Write configuration tests
    - Test configuration loading with valid env vars
    - Test configuration validation catches invalid values
    - Test adapter factory creates correct adapter type
    - Test configuration defaults
    - _Requirements: 9.1, 9.2, 9.6, 9.7_


- [ ] 10. Add security and validation
  - [ ] 10.1 Implement input validation utilities
    - Create validateWalletAddress() for Solana public keys
    - Create validateAmount() for positive numbers
    - Create validateTransactionSignature() for base58 strings
    - Add sanitization for user inputs before logging
    - _Requirements: 11.1, 11.2, 11.3, 11.7_

  - [ ] 10.2 Add payment verification security checks
    - Validate transaction signature is unique (prevent replay)
    - Validate amount matches expected price exactly
    - Validate recipient matches seller wallet
    - Validate token mint matches USDC mint
    - Validate network matches configuration
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 10.3 Implement rate limiting for payment endpoints
    - Add rate limiter middleware
    - Limit verification attempts to 10 per user per minute
    - Limit verification attempts to 100 per IP per hour
    - Return 429 status with retry-after header
    - Log rate limit violations
    - _Requirements: 11.6_

  - [ ] 10.4 Add error message sanitization
    - Create error response formatter
    - Return generic errors to clients
    - Log detailed errors server-side only
    - Never expose internal system details
    - Include error codes for client handling
    - _Requirements: 10.1, 10.2_

  - [ ]* 10.5 Write security tests
    - Test wallet address validation
    - Test amount validation
    - Test replay attack prevention
    - Test rate limiting enforcement
    - Test error message sanitization
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7_

- [ ] 11. Update example application
  - [ ] 11.1 Update example server to use currency adapters
    - Initialize currency adapter based on configuration
    - Pass adapter to MysteryBoxManager and ListingManager
    - Update purchase endpoints to handle x402 flow
    - Add balance and transaction endpoints
    - _Requirements: 1.4, 4.1, 5.1, 6.1, 7.5_

  - [ ] 11.2 Update example client for x402 payment flow
    - Add wallet connection UI component
    - Implement 402 response handling
    - Prompt user to sign transaction on 402
    - Retry request with X-Payment header after signing
    - Display transaction confirmation
    - _Requirements: 3.2, 4.1, 5.1_

  - [ ] 11.3 Add balance display to example UI
    - Show current balance in header
    - Update balance after purchases
    - Show loading state during balance queries
    - Handle balance query errors
    - _Requirements: 6.1, 6.2_

  - [ ] 11.4 Add transaction history to example UI
    - Create transaction history page
    - Display transactions with type, amount, and timestamp
    - Show blockchain tx hash with explorer link
    - Implement pagination for long histories
    - _Requirements: 7.5, 7.6, 7.7_

  - [ ] 11.5 Update example README
    - Document currency flow setup
    - Explain mock vs production modes
    - Provide devnet testing instructions
    - Include configuration examples
    - Add troubleshooting section
    - _Requirements: 9.1, 9.2, 9.3, 9.4_


- [ ] 12. Add monitoring and logging
  - [ ] 12.1 Implement structured logging
    - Create logger utility with log levels
    - Log payment initiations with user and amount
    - Log payment verifications with result and latency
    - Log errors with context and stack traces
    - Include mode and network in all logs
    - _Requirements: 9.7, 10.5_

  - [ ] 12.2 Add performance metrics
    - Track payment verification success rate
    - Track payment verification latency
    - Track transaction polling attempts
    - Track balance query latency
    - Track error rates by type
    - _Requirements: 10.5, 10.6_

  - [ ] 12.3 Create monitoring dashboard (optional)
    - Display real-time metrics
    - Show payment success/failure rates
    - Show average verification latency
    - Alert on high error rates
    - _Requirements: 10.5_

  - [ ]* 12.4 Write logging tests
    - Test log messages include required context
    - Test error logs include stack traces
    - Test sensitive data is not logged
    - Test log levels are correct
    - _Requirements: 9.7, 10.5_

- [ ] 13. Documentation and deployment
  - [ ] 13.1 Write API documentation
    - Document all currency-related endpoints
    - Include request/response examples
    - Document error codes and messages
    - Explain x402 payment flow
    - Provide curl examples for testing
    - _Requirements: 4.1, 5.1, 6.1, 7.5_

  - [ ] 13.2 Create deployment guide
    - Document environment variable setup
    - Explain devnet vs mainnet configuration
    - Provide migration steps from mock to production
    - Include rollback procedures
    - Document monitoring setup
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 13.3 Write developer guide
    - Explain currency adapter pattern
    - Show how to add new payment methods
    - Document testing strategies
    - Provide code examples
    - Include troubleshooting tips
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 13.4 Create end-to-end testing guide
    - Document devnet testing setup
    - Explain how to get test USDC
    - Provide test wallet creation steps
    - Include example test scenarios
    - Document expected results
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

