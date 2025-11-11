# Requirements Document

## Introduction

This specification defines the integration of currency flow into the bazaar-x402 marketplace example. The system SHALL support two operational modes: mock mode for development/testing using in-memory or Redis-based currency, and production mode using the x402 payment protocol with real Solana USDC transactions. The implementation SHALL enable users to purchase mystery boxes and marketplace listings using either mock currency or real cryptocurrency payments.

## Glossary

- **Bazaar System**: The marketplace application that manages listings, mystery boxes, and transactions
- **x402 Protocol**: HTTP 402-based payment protocol for blockchain transactions
- **Mock Mode**: Development mode using simulated currency without blockchain integration
- **Production Mode**: Live mode using real Solana USDC transactions via x402 protocol
- **Currency Adapter**: Interface that abstracts currency operations for both mock and production modes
- **USDC**: USD Coin stablecoin on Solana blockchain
- **Payment Gateway**: x402 facilitator that verifies and settles blockchain transactions
- **Mystery Box**: Randomized item bundle purchasable with currency
- **Listing**: Individual item offered for sale in the marketplace
- **Wallet**: Solana blockchain wallet address for cryptocurrency transactions
- **Transaction Record**: Persistent record of completed purchases

## Requirements

### Requirement 1: Currency Abstraction Layer

**User Story:** As a developer, I want a unified currency interface so that I can switch between mock and production payment modes without changing application code.

#### Acceptance Criteria

1. THE Bazaar System SHALL define a CurrencyAdapter interface with methods for balance checking, deduction, addition, and transaction verification
2. THE Bazaar System SHALL implement a MockCurrencyAdapter that uses in-memory or Redis storage for currency balances
3. THE Bazaar System SHALL implement a X402CurrencyAdapter that integrates with the x402 payment protocol for Solana USDC transactions
4. THE Bazaar System SHALL allow runtime selection of currency adapter based on configuration
5. THE Bazaar System SHALL ensure both adapters implement identical interface methods with consistent return types

### Requirement 2: Mock Currency System

**User Story:** As a developer, I want to test marketplace functionality with mock currency so that I can develop and debug without requiring blockchain integration.

#### Acceptance Criteria

1. THE MockCurrencyAdapter SHALL maintain user currency balances in memory or Redis storage
2. WHEN a user is initialized, THE MockCurrencyAdapter SHALL assign a default starting balance
3. THE MockCurrencyAdapter SHALL support balance queries by user identifier
4. THE MockCurrencyAdapter SHALL support currency deduction with balance validation
5. THE MockCurrencyAdapter SHALL support currency addition for testing purposes
6. THE MockCurrencyAdapter SHALL generate mock transaction identifiers for purchase records
7. THE MockCurrencyAdapter SHALL log all currency operations for debugging purposes

### Requirement 3: x402 Payment Integration

**User Story:** As a marketplace operator, I want to accept real USDC payments via x402 protocol so that users can purchase items with cryptocurrency.

#### Acceptance Criteria

1. THE X402CurrencyAdapter SHALL implement the x402 payment protocol for Solana USDC transactions
2. WHEN a purchase is initiated, THE X402CurrencyAdapter SHALL return HTTP 402 Payment Required with payment requirements
3. THE X402CurrencyAdapter SHALL verify payment signatures against the Solana blockchain
4. THE X402CurrencyAdapter SHALL validate transaction amount matches expected price
5. THE X402CurrencyAdapter SHALL validate recipient wallet matches seller address
6. THE X402CurrencyAdapter SHALL validate token mint matches USDC mint address
7. THE X402CurrencyAdapter SHALL poll for transaction confirmation with configurable retry logic
8. THE X402CurrencyAdapter SHALL return transaction hash upon successful verification

### Requirement 4: Mystery Box Purchase Flow

**User Story:** As a user, I want to purchase mystery boxes with currency so that I can acquire randomized items.

#### Acceptance Criteria

1. WHEN a user initiates mystery box purchase, THE Bazaar System SHALL check user currency balance
2. IF balance is insufficient, THEN THE Bazaar System SHALL return an error indicating insufficient funds
3. THE Bazaar System SHALL deduct the mystery box price from user balance before revealing contents
4. THE Bazaar System SHALL generate mystery box contents after successful payment
5. THE Bazaar System SHALL add generated items to user inventory
6. THE Bazaar System SHALL create a transaction record with purchase details
7. THE Bazaar System SHALL return mystery box contents and transaction identifier to user

### Requirement 5: Marketplace Listing Purchase Flow

**User Story:** As a buyer, I want to purchase marketplace listings with currency so that I can acquire specific items from sellers.

#### Acceptance Criteria

1. WHEN a buyer initiates listing purchase, THE Bazaar System SHALL verify listing availability
2. THE Bazaar System SHALL check buyer currency balance against listing price
3. IF balance is insufficient, THEN THE Bazaar System SHALL return an error indicating insufficient funds
4. THE Bazaar System SHALL transfer currency from buyer to seller
5. THE Bazaar System SHALL transfer item ownership from seller to buyer
6. THE Bazaar System SHALL mark listing as sold and remove from marketplace
7. THE Bazaar System SHALL create transaction records for both buyer and seller
8. THE Bazaar System SHALL return purchase confirmation with transaction details

### Requirement 6: Currency Balance Management

**User Story:** As a user, I want to view my current currency balance so that I know how much I can spend.

#### Acceptance Criteria

1. THE Bazaar System SHALL provide an API endpoint to query user currency balance
2. THE Bazaar System SHALL return balance in USDC format with decimal precision
3. WHEN using mock mode, THE Bazaar System SHALL return mock balance from storage
4. WHEN using production mode, THE Bazaar System SHALL return on-chain USDC balance from Solana
5. THE Bazaar System SHALL cache balance queries to avoid excessive RPC calls

### Requirement 7: Transaction History

**User Story:** As a user, I want to view my transaction history so that I can track my purchases and sales.

#### Acceptance Criteria

1. THE Bazaar System SHALL record all currency transactions in persistent storage
2. THE Bazaar System SHALL store transaction type (mystery box purchase, listing purchase, listing sale)
3. THE Bazaar System SHALL store transaction amount, timestamp, and involved parties
4. THE Bazaar System SHALL store blockchain transaction hash for production mode transactions
5. THE Bazaar System SHALL provide an API endpoint to query user transaction history
6. THE Bazaar System SHALL support pagination for transaction history queries
7. THE Bazaar System SHALL sort transactions by timestamp in descending order

### Requirement 8: Multi-Network Support

**User Story:** As a developer, I want to support both Solana devnet and mainnet so that I can test with devnet USDC before deploying to production with real USDC.

#### Acceptance Criteria

1. THE Bazaar System SHALL support Solana devnet network for testing with test USDC
2. THE Bazaar System SHALL support Solana mainnet network for production with real USDC
3. THE Bazaar System SHALL use network-specific USDC mint addresses for devnet and mainnet
4. THE Bazaar System SHALL use network-specific RPC endpoints for devnet and mainnet
5. THE Bazaar System SHALL validate transactions against the configured network
6. THE Bazaar System SHALL prevent cross-network transaction verification
7. THE Bazaar System SHALL clearly indicate active network in logs and responses

### Requirement 9: Configuration and Environment Management

**User Story:** As a developer, I want to configure payment mode and network settings so that I can control marketplace behavior across environments.

#### Acceptance Criteria

1. THE Bazaar System SHALL support environment variable configuration for payment mode selection
2. THE Bazaar System SHALL support environment variable configuration for Solana network selection
3. THE Bazaar System SHALL support configuration of USDC mint addresses for each network
4. THE Bazaar System SHALL support configuration of default mock currency balance
5. THE Bazaar System SHALL support configuration of transaction polling parameters
6. THE Bazaar System SHALL validate configuration on startup and fail fast if invalid
7. THE Bazaar System SHALL log active configuration mode and network on initialization

### Requirement 10: Error Handling and Recovery

**User Story:** As a user, I want clear error messages when payments fail so that I understand what went wrong and how to resolve it.

#### Acceptance Criteria

1. WHEN payment verification fails, THE Bazaar System SHALL return a descriptive error message
2. THE Bazaar System SHALL distinguish between insufficient balance, invalid transaction, and network errors
3. THE Bazaar System SHALL not deduct currency if payment verification fails
4. THE Bazaar System SHALL not transfer items if payment verification fails
5. THE Bazaar System SHALL log all payment failures with error details for debugging
6. THE Bazaar System SHALL support transaction retry for transient network errors
7. THE Bazaar System SHALL prevent duplicate purchases using transaction idempotency

### Requirement 11: Security and Validation

**User Story:** As a developer, I want secure payment processing so that users cannot exploit the system or perform fraudulent transactions.

#### Acceptance Criteria

1. THE Bazaar System SHALL validate all payment amounts match expected prices
2. THE Bazaar System SHALL validate recipient wallets match seller addresses
3. THE Bazaar System SHALL validate transaction signatures are authentic
4. THE Bazaar System SHALL prevent replay attacks using transaction uniqueness checks
5. THE Bazaar System SHALL validate token mints match expected USDC addresses
6. THE Bazaar System SHALL rate limit payment verification requests to prevent abuse
7. THE Bazaar System SHALL sanitize all user inputs before processing
