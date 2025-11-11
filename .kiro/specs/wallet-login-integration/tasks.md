# Implementation Plan: Wallet Login Integration for Bazaar-x402

## Overview

This implementation plan converts the bazaar-x402 example from vanilla JavaScript with manual user selection to a React-based application with Solana wallet authentication. Each task builds incrementally on previous work.

## Tasks

- [x] 1. Set up React build infrastructure
  - Install Vite and React dependencies
  - Create Vite configuration file
  - Update package.json scripts for dev/build
  - Test basic React rendering
  - _Requirements: 1.1, 1.2_

- [x] 1.1 Install dependencies
  - Add @vitejs/plugin-react, vite, react, react-dom to package.json
  - Add @solana/wallet-adapter-base, @solana/wallet-adapter-react, @solana/wallet-adapter-react-ui
  - Add @solana/wallet-adapter-wallets, @solana/web3.js
  - Run pnpm install
  - _Requirements: 1.1, 6.1, 6.2_

- [x] 1.2 Create Vite configuration
  - Create vite.config.js with React plugin
  - Configure dev server port (3000)
  - Configure build output directory
  - Add proxy configuration for API calls
  - _Requirements: 1.1_

- [x] 1.3 Update package.json scripts
  - Add "dev": "vite" script
  - Add "build": "vite build" script
  - Add "preview": "vite preview" script
  - Update server script to run on port 3001
  - _Requirements: 1.1_

- [x] 2. Create wallet provider infrastructure
  - Create wallet-provider.jsx component
  - Configure Solana connection provider
  - Set up wallet adapter with Phantom and MetaMask
  - Add wallet modal provider
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 2.1 Create wallet provider component
  - Create packages/bazaar-x402/example/public/components/wallet-provider.jsx
  - Import wallet adapter dependencies
  - Configure network endpoint (devnet)
  - Initialize wallet adapters array with Phantom
  - Wrap children with ConnectionProvider, WalletProvider, WalletModalProvider
  - _Requirements: 1.1, 6.1, 6.3_



- [x] 2.2 Configure auto-connect
  - Enable autoConnect prop on WalletProvider
  - Add session storage check for previous connection
  - Implement reconnection logic on page load
  - Handle auto-connect errors gracefully
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Create wallet button component
  - Create wallet-button.jsx component
  - Use WalletMultiButton from adapter UI
  - Add wallet address display
  - Style component to match bazaar theme
  - _Requirements: 1.1, 1.4, 8.1, 8.2, 8.3_

- [x] 3.1 Create base wallet button
  - Create packages/bazaar-x402/example/public/components/wallet-button.jsx
  - Import useWallet hook and WalletMultiButton
  - Render WalletMultiButton component
  - Add basic styling
  - _Requirements: 1.1, 8.1_

- [x] 3.2 Add wallet address display
  - Show truncated address when connected (e.g., "7xKX...9Abc")
  - Add tooltip with full address on hover
  - Show connection status indicator
  - Add loading state during connection
  - _Requirements: 1.4, 8.2, 8.3_

- [x] 3.3 Style wallet button
  - Match existing bazaar purple gradient theme
  - Add responsive styles for mobile
  - Style wallet modal to match theme
  - Add hover and active states
  - _Requirements: 8.1, 8.5_

- [ ] 4. Create wallet context hook
  - Create use-wallet-context.js hook
  - Extend base wallet adapter functionality
  - Add username derivation from wallet address
  - Implement session persistence
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.1 Create base context hook
  - Create packages/bazaar-x402/example/public/hooks/use-wallet-context.js
  - Import and wrap useWallet from adapter
  - Export wallet state (publicKey, connected, connecting)
  - Add isConnected boolean helper
  - _Requirements: 4.1_

- [ ] 4.2 Add username derivation
  - Derive username from publicKey.toBase58()
  - Return null when wallet not connected
  - Add walletAddress convenience property
  - Update on wallet connection/disconnection
  - _Requirements: 4.1, 4.2_

- [ ] 4.3 Implement session persistence
  - Store wallet address in sessionStorage on connect
  - Clear sessionStorage on disconnect
  - Check sessionStorage on mount for auto-reconnect
  - Handle session expiration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Convert app to React
  - Create main App component
  - Convert index.html to React root
  - Wrap app with wallet provider
  - Update entry point (app.js)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5.1 Create main App component
  - Create packages/bazaar-x402/example/public/components/app.jsx
  - Import all marketplace components
  - Create app layout structure
  - Add header with wallet button
  - Add main content area with cards
  - _Requirements: 1.1, 8.1_

- [x] 5.2 Update index.html
  - Add root div element
  - Remove inline styles (move to CSS file)
  - Remove manual user dropdown
  - Add wallet adapter CSS import
  - Update script tag to load React app
  - _Requirements: 1.1, 8.1_

- [x] 5.3 Create React entry point
  - Update app.js to use React
  - Import createRoot from react-dom/client
  - Render App wrapped in WalletProvider
  - Remove vanilla JS code
  - _Requirements: 1.1_

- [ ] 6. Convert inventory component to React
  - Create inventory-card.jsx component
  - Use wallet context for user identity
  - Fetch inventory based on wallet address
  - Handle loading and error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6.1 Create inventory component
  - Create packages/bazaar-x402/example/public/components/inventory-card.jsx
  - Import useWalletContext hook
  - Add state for items, loading, error
  - Create loadInventory function
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Implement wallet-based loading
  - Use wallet address as API parameter
  - Call loadInventory when wallet connects
  - Clear inventory when wallet disconnects
  - Show "Connect wallet" message when not connected
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6.3 Add loading and error states
  - Show loading spinner while fetching
  - Display error messages clearly
  - Add retry button on error
  - Show empty state when no items
  - _Requirements: 7.4, 8.4_

- [ ] 7. Convert create listing component to React
  - Create create-listing-card.jsx component
  - Use wallet context for seller identity
  - Auto-populate seller fields from wallet
  - Handle form submission with wallet address
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7.1 Create listing form component
  - Create packages/bazaar-x402/example/public/components/create-listing-card.jsx
  - Import useWalletContext hook
  - Create form state management
  - Add form fields (itemId, type, description, price)
  - _Requirements: 4.1, 4.2_

- [ ] 7.2 Auto-populate seller fields
  - Remove manual seller username/wallet inputs
  - Use wallet address from context automatically
  - Display current wallet in form (read-only)
  - Disable form when wallet not connected
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7.3 Implement form submission
  - Create handleSubmit function
  - Include wallet address in listing data
  - Call API with wallet-based authentication
  - Show success/error messages
  - Refresh inventory and listings after success
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Convert listings browser component to React
  - Create listings-card.jsx component
  - Use wallet context to identify own listings
  - Fetch and display active listings
  - Handle purchase with wallet address
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

- [ ] 8.1 Create listings component
  - Create packages/bazaar-x402/example/public/components/listings-card.jsx
  - Import useWalletContext hook
  - Add state for listings, loading, error
  - Create loadListings function
  - _Requirements: 4.1, 4.2_

- [ ] 8.2 Implement listing display
  - Map listings to list items
  - Show seller wallet address (truncated)
  - Highlight own listings differently
  - Disable buy button for own listings
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 8.3 Implement purchase flow
  - Create purchaseItem function
  - Include buyer wallet address in API call
  - Show confirmation before purchase
  - Handle purchase success/error
  - Refresh inventory and listings after purchase
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Convert mystery box component to React
  - Create mystery-box-card.jsx component
  - Use wallet context for purchases
  - Fetch and display available tiers
  - Handle box opening with wallet address
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9.1 Create mystery box component
  - Create packages/bazaar-x402/example/public/components/mystery-box-card.jsx
  - Import useWalletContext hook
  - Add state for tiers, loading, error
  - Create loadMysteryBoxes function
  - _Requirements: 4.1, 4.2_

- [ ] 9.2 Implement box purchase
  - Create purchaseMysteryBox function
  - Include wallet address in API call
  - Show box opening animation/result
  - Handle purchase success/error
  - Refresh inventory after opening
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Implement error handling
  - Create error handling utilities
  - Add error boundary component
  - Implement wallet-specific error messages
  - Add user-friendly error displays
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.1 Create error utilities
  - Create packages/bazaar-x402/example/public/utils/wallet-errors.js
  - Add handleWalletError function
  - Map wallet adapter errors to user messages
  - Export error message constants
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.2 Create error display component
  - Create packages/bazaar-x402/example/public/components/error-message.jsx
  - Accept error prop
  - Display formatted error message
  - Add dismiss button
  - Style error message box
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.5_

- [ ] 10.3 Add error boundary
  - Create packages/bazaar-x402/example/public/components/error-boundary.jsx
  - Catch React errors
  - Display fallback UI
  - Log errors to console
  - Add reset button
  - _Requirements: 7.5_

- [ ] 11. Add wallet detection and installation guidance
  - Detect installed wallets
  - Show installation instructions when no wallet found
  - Add links to wallet download pages
  - Handle wallet not ready states
  - _Requirements: 6.3, 6.4, 7.2, 7.3_

- [ ] 11.1 Create wallet detection utility
  - Create packages/bazaar-x402/example/public/utils/wallet-detection.js
  - Check for window.solana (Phantom)
  - Return boolean for Phantom detection
  - Export detection function
  - _Requirements: 6.2, 6.3_

- [ ] 11.2 Create installation guide component
  - Create packages/bazaar-x402/example/public/components/wallet-install-guide.jsx
  - Show when Phantom not detected
  - Add link to Phantom download page
  - Include installation instructions
  - Style as modal or banner
  - _Requirements: 6.3, 6.5, 7.2_

- [ ] 12. Implement session management
  - Add session storage utilities
  - Implement auto-reconnect logic
  - Handle session expiration
  - Add session cleanup on disconnect
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 12.1 Create session utilities
  - Create packages/bazaar-x402/example/public/utils/session.js
  - Add saveSession function (stores wallet address)
  - Add loadSession function (retrieves wallet address)
  - Add clearSession function (removes session data)
  - Add isSessionValid function (checks expiration)
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 12.2 Implement auto-reconnect
  - Check session on app mount
  - Attempt wallet reconnection if session valid
  - Handle reconnection failures gracefully
  - Clear invalid sessions
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 13. Add styling and theming
  - Create CSS file for wallet components
  - Match existing bazaar purple theme
  - Add responsive styles
  - Style wallet modal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13.1 Create wallet styles
  - Create packages/bazaar-x402/example/public/styles/wallet.css
  - Style wallet button to match theme
  - Style wallet address display
  - Add hover and active states
  - Add loading spinner styles
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13.2 Style wallet modal
  - Override default wallet adapter modal styles
  - Match purple gradient theme
  - Add custom wallet icons
  - Improve mobile responsiveness
  - _Requirements: 8.5_

- [ ] 13.3 Add responsive styles
  - Test on mobile viewport
  - Adjust wallet button size for mobile
  - Stack components vertically on small screens
  - Ensure touch targets are adequate (44px min)
  - _Requirements: 8.5_

- [ ] 14. Update server to handle wallet addresses
  - Update API endpoints to accept wallet addresses
  - Validate wallet address format
  - Update storage to use wallet addresses as keys
  - Test multi-user scenarios
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14.1 Update inventory endpoint
  - Modify GET /api/inventory/:username to accept wallet addresses
  - Validate wallet address format (Solana public key)
  - Update item adapter to query by wallet address
  - Test with real wallet addresses
  - _Requirements: 4.1, 4.2_

- [ ] 14.2 Update listing endpoints
  - Modify POST /api/bazaar/listings to accept wallet addresses
  - Validate seller wallet address
  - Store listings with wallet address as seller ID
  - Update GET /api/bazaar/listings to return wallet addresses
  - _Requirements: 4.2, 4.3_

- [ ] 14.3 Update purchase endpoint
  - Modify purchase endpoint to accept buyer wallet address
  - Validate buyer and seller wallet addresses
  - Update transaction records with wallet addresses
  - Ensure atomic updates for both parties
  - _Requirements: 4.3, 5.4_

- [ ] 15. Add multi-user testing support
  - Test with multiple browser tabs
  - Verify independent wallet connections
  - Test marketplace interactions between users
  - Verify state isolation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15.1 Create test wallets
  - Document how to create test wallets
  - Add instructions for getting devnet SOL
  - Create test wallet addresses for documentation
  - Add multi-user testing guide
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 15.2 Test multi-user scenarios
  - Open two browser tabs
  - Connect different wallets in each tab
  - Create listing in tab 1
  - Purchase listing from tab 2
  - Verify both inventories update correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 16. Add documentation
  - Update README with wallet setup instructions
  - Document wallet provider configuration
  - Add troubleshooting guide
  - Include screenshots of wallet connection
  - _Requirements: 6.4, 7.2_

- [ ] 16.1 Update README
  - Add "Wallet Setup" section
  - Document Phantom wallet support
  - Add Phantom installation link
  - Include configuration options
  - _Requirements: 6.3, 6.5_

- [ ] 16.2 Create troubleshooting guide
  - Document common wallet connection issues
  - Add solutions for each error type
  - Include network configuration help
  - Add FAQ section
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16.3 Add code examples
  - Show how to use wallet context
  - Demonstrate wallet-based API calls
  - Include error handling examples
  - Add multi-user testing examples
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

- [ ] 17. Testing and validation
  - Test wallet connection flow
  - Test all marketplace operations with wallet
  - Verify error handling
  - Test session persistence
  - _Requirements: All_

- [ ] 17.1 Test wallet connection
  - Test Phantom wallet connection
  - Test connection rejection
  - Test wallet switching
  - Test auto-reconnect
  - Test with Phantom not installed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 17.2 Test marketplace operations
  - Test viewing inventory with wallet
  - Test creating listing with wallet
  - Test purchasing item with wallet
  - Test opening mystery box with wallet
  - Verify all operations use wallet address correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 17.3 Test error scenarios
  - Test with no wallet installed
  - Test with locked wallet
  - Test with network errors
  - Test with invalid wallet addresses
  - Verify error messages display correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 17.4 Test session persistence
  - Connect wallet and reload page
  - Verify auto-reconnect works
  - Test session expiration
  - Test manual disconnect
  - Verify session cleanup
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 17.5 Test multi-user scenarios
  - Test with two different wallets
  - Verify independent sessions
  - Test trading between users
  - Verify state isolation
  - Test concurrent operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
