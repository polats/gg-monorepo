# Implementation Plan: Purchase Session Storage Bug Fix

- [x] 1. Fix gem balance context synchronization
  - [x] 1.1 Modify addGems function to use server-first approach
    - Remove optimistic update for purchases
    - Call API first and wait for response
    - Update state only after successful server response
    - Ensure sessionStorage is updated with server data
    - _Requirements: 1.1, 1.2, 2.2_
  
  - [x] 1.2 Add explicit balance refresh method
    - Create fetchBalance method to get current balance from server
    - Update state and sessionStorage with fetched data
    - Export method for use by other components
    - _Requirements: 1.4, 2.3_
  
  - [x] 1.3 Improve error handling in addGems
    - Add try-catch with detailed error logging
    - Return success/failure status
    - Do not update state on API failure
    - _Requirements: 3.1, 3.4_

- [x] 2. Update purchase page to handle async crediting
  - [x] 2.1 Add loading and error states
    - Add loading state during gem crediting
    - Add error state for failed credits
    - Display appropriate UI for each state
    - _Requirements: 1.3, 3.1_
  
  - [x] 2.2 Improve credit flow with proper error handling
    - Wrap creditGems in try-catch
    - Show error message to user on failure
    - Add retry button for failed credits
    - Ensure credited flag only sets on success
    - _Requirements: 1.3, 3.2, 3.4_
  
  - [x] 2.3 Add balance verification after credit
    - Call fetchBalance after successful credit
    - Verify balance matches expected amount
    - Log any discrepancies for debugging
    - _Requirements: 2.1, 2.4_

- [ ] 3. Add session recovery for expired sessions
  - [ ] 3.1 Enhance session initialization in context
    - Check for 401 responses from balance API
    - Automatically create session if missing
    - Retry balance fetch after session creation
    - _Requirements: 1.4, 3.3_
  
  - [ ] 3.2 Add session validation to addGems
    - Check for 401 response from add API
    - Create session and retry if needed
    - Log session creation events
    - _Requirements: 3.3, 3.4_

- [ ]* 4. Add debugging and monitoring
  - [ ]* 4.1 Add comprehensive logging
    - Log all API calls with timestamps
    - Log state changes with before/after values
    - Log sessionStorage operations
    - _Requirements: 3.4_
  
  - [ ]* 4.2 Add balance consistency checks
    - Compare server vs client balance on page load
    - Log discrepancies for investigation
    - Provide debug endpoint to check sync status
    - _Requirements: 2.2, 2.4_
