# Quickstart Guide: RaffleTime Platform

**Feature**: RaffleTime WorldID-Powered Sweepstakes Platform  
**Date**: 2025-09-08  
**Purpose**: End-to-end validation of platform functionality

## Prerequisites

### Development Environment
- Node.js 18+ installed
- PostgreSQL 14+ running
- WorldCoin wallet with test WLD tokens
- WorldID verification completed
- Ethereum wallet (MetaMask or similar)

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/raffletime_dev"

# WorldCoin
WORLDCOIN_APP_ID="app_staging_your_app_id"
WORLDCOIN_ACTION="create-raffle"
NEXT_PUBLIC_WLD_TOKEN_ADDRESS="0x..." # WLD token contract address

# Blockchain
NEXT_PUBLIC_CHAIN_ID=1 # or 480 for World Chain
RPC_URL="https://mainnet.infura.io/v3/your_key"
PRIVATE_KEY="0x..." # For contract deployment

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Chainlink VRF (for testnet)
VRF_COORDINATOR="0x..." # Chainlink VRF coordinator address
VRF_KEY_HASH="0x..." # Gas lane key hash
VRF_SUBSCRIPTION_ID="123" # Your VRF subscription ID
```

## 1. Database Setup

### Install Dependencies
```bash
npm install @prisma/client prisma
npm install @types/pg pg
```

### Initialize Database
```bash
# Generate Prisma client from schema
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data
npm run db:seed
```

### Verify Database Connection
```bash
npx prisma studio
# Should open browser with database viewer at http://localhost:5555
```

## 2. Smart Contract Deployment

### Install Hardhat Framework
```bash
npm install --save-dev hardhat
npm install @chainlink/contracts @openzeppelin/contracts
npx hardhat init # Choose TypeScript project
```

### Deploy Contracts (Testnet)
```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet (Sepolia)
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Update Environment Variables
```bash
# After deployment, update with contract addresses
RAFFLE_FACTORY_ADDRESS="0x..."
SOULBOUND_TICKET_IMPL="0x..."
```

## 3. Application Startup

### Install Frontend Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

Application should be available at `http://localhost:3000`

## 4. End-to-End Testing Scenarios

### Scenario 1: Raffle Operator Creates Raffle

#### Step 1: WorldID Authentication
1. Navigate to `http://localhost:3000`
2. Click "Connect Wallet" 
3. Complete WorldID verification flow
4. Verify login success with wallet address displayed

**Expected Result**: User logged in with WorldID verification complete

#### Step 2: Create New Raffle
1. Click "Create Raffle" button
2. Fill out raffle form:
   - **Title**: "Test Community Raffle"
   - **Description**: "Testing the RaffleTime platform"
   - **Ticket Price**: 1 WLD
   - **Max Entries**: 10 tickets per user
   - **Winners**: 3 winners
   - **Winner Share**: 80%
   - **Beneficiaries**: Select Red Cross
   - **Beneficiary Share**: 20%
   - **Duration**: 24 hours
3. Approve 10 WLD deposit transaction
4. Submit raffle creation

**Expected Result**: 
- Transaction confirmed on blockchain
- Raffle appears in "Active Raffles" list
- Raffle vault contract deployed
- Database updated with raffle record

#### Step 3: Verify Raffle Details
1. Click on created raffle from list
2. Verify all details match input
3. Check raffle status shows "Active"
4. Verify entry deadline countdown working

**Expected Result**: Raffle details page shows complete information

### Scenario 2: Participant Buys Tickets

#### Step 1: Participant Authentication
1. Use different browser/incognito for second user
2. Connect wallet with different address
3. Complete WorldID verification
4. Ensure test WLD balance available

**Expected Result**: Second user authenticated successfully

#### Step 2: Purchase Raffle Tickets
1. Navigate to test raffle details page
2. Select ticket quantity (e.g., 3 tickets)
3. Choose beneficiary (Red Cross)
4. Click "Purchase Tickets"
5. Approve WLD transfer transaction
6. Confirm ticket purchase

**Expected Result**:
- 3 WLD transferred to raffle vault
- 3 soulbound NFT tickets minted
- Participant count increases
- Prize pool updates in real-time
- Beneficiary vote recorded

#### Step 3: Verify Ticket Ownership
1. Go to "My Tickets" page
2. Verify 3 tickets shown for test raffle
3. Check NFT metadata includes raffle ID and beneficiary vote
4. Attempt to transfer ticket (should fail)

**Expected Result**: 
- Tickets displayed correctly
- Transfer attempts blocked (soulbound)
- Metadata accessible

### Scenario 3: Multiple Participants Join

#### Repeat Ticket Purchase
1. Create 2-3 additional test users
2. Each purchases 2-5 tickets
3. Mix of beneficiary votes (Red Cross, Oxfam, UNICEF)
4. Verify real-time updates work across browsers

**Expected Result**:
- Participant count reaches 8+ unique users
- Prize pool grows with each purchase
- Different beneficiary votes recorded
- Real-time updates visible to all users

### Scenario 4: Raffle Drawing Process

#### Step 1: Entry Period Ends
1. Wait for raffle entry deadline or manually advance time in test
2. Verify raffle status changes to "Drawing"
3. Check no new ticket purchases allowed

**Expected Result**: Raffle automatically transitions to drawing phase

#### Step 2: Initiate Winner Selection
1. As raffle operator, click "Draw Winners"
2. Confirm VRF randomness request transaction
3. Wait for Chainlink VRF callback (testnet ~1-2 minutes)
4. Verify winners selected automatically

**Expected Result**:
- VRF request submitted successfully  
- Winners selected using verifiable randomness
- Winning tickets marked in database
- Most-voted beneficiary determined

#### Step 3: Verify Results
1. Check raffle results page shows:
   - 3 winning ticket holders
   - Prize amounts calculated correctly (80% split 3 ways)
   - Red Cross selected as winning beneficiary (20%)
   - Random seed displayed for transparency
2. Verify winner notifications sent

**Expected Result**: All results calculated and displayed correctly

### Scenario 5: Prize Claiming

#### Step 1: Winner Claims Prize
1. Log in as winning ticket holder
2. Navigate to "My Tickets" page
3. See winning ticket with "Claim Prize" button
4. Click to claim prize
5. Specify recipient address
6. Confirm claim transaction

**Expected Result**:
- Prize amount transferred to recipient
- Ticket marked as "Claimed"
- Transaction recorded on blockchain

#### Step 2: Beneficiary Receives Donation
1. Check beneficiary wallet balance
2. Verify automatic transfer of 20% to Red Cross
3. Confirm transaction hash available

**Expected Result**: Beneficiary receives funds automatically

#### Step 3: Non-Winners Check Status
1. Log in as non-winning participant
2. Verify tickets show "Not a winner"
3. Confirm no claim option available

**Expected Result**: Non-winners clearly informed of status

### Scenario 6: Operator Deposit Return

#### Step 1: Raffle Completion
1. Verify all prizes claimed or timeout period passed
2. Raffle status shows "Completed"

#### Step 2: Return Operator Deposit
1. As operator, click "Claim Deposit Return"
2. Confirm transaction
3. Verify 5 WLD returned to operator
4. Confirm 5 WLD retained by protocol

**Expected Result**: Operator receives partial deposit refund

## 5. Integration Testing Checklist

### WorldID Verification
- [ ] Authentication flow completes successfully
- [ ] User identity uniquely verified
- [ ] Sybil attack prevention active
- [ ] Session persistence works correctly

### Smart Contract Integration
- [ ] RaffleFactory creates new raffles correctly
- [ ] RaffleVault handles WLD deposits safely
- [ ] SoulboundTicket NFTs mint and restrict transfers
- [ ] Chainlink VRF provides verifiable randomness
- [ ] Prize distribution executes automatically

### Database Consistency
- [ ] All blockchain events synced to database
- [ ] Real-time updates propagate correctly
- [ ] Data integrity maintained under concurrent access
- [ ] Audit trail captures all state changes

### Payment Processing
- [ ] WLD token transfers execute correctly
- [ ] Transaction confirmations processed
- [ ] Failed transactions handled gracefully
- [ ] Refund mechanism works for cancelled raffles

### User Interface
- [ ] Responsive design works on mobile/desktop
- [ ] Real-time updates display immediately
- [ ] Error states handled gracefully
- [ ] Loading states provide clear feedback

### Security
- [ ] Only verified users can participate
- [ ] Raffle operators cannot win own raffles
- [ ] Ticket transfers properly blocked
- [ ] Prize claims require proper ownership proof

## 6. Performance Validation

### Load Testing
```bash
# Install k6 for load testing
npm install -g k6

# Run load test
k6 run tests/load/raffle-creation.js
k6 run tests/load/ticket-purchase.js
```

### Performance Targets
- [ ] Page load times < 200ms (95th percentile)
- [ ] API responses < 100ms average
- [ ] Database queries < 50ms average
- [ ] Real-time updates < 1 second propagation
- [ ] Support 100+ concurrent ticket purchases

## 7. Troubleshooting Common Issues

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo service postgresql status

# Reset database
npx prisma db push --force-reset
npm run db:seed
```

### Smart Contract Deployment Failures
```bash
# Check network configuration
npx hardhat network

# Verify account balance
npx hardhat run scripts/check-balance.ts

# Redeploy with more gas
npx hardhat run scripts/deploy.ts --network sepolia --gas-limit 5000000
```

### WorldID Verification Failures
- Ensure app configured in WorldCoin Developer Portal
- Verify action name matches environment variable
- Check staging vs production environment settings

### Transaction Failures
- Verify sufficient gas limit set
- Check token balances before operations
- Confirm contract addresses are correct
- Review transaction logs for revert reasons

## 8. Production Readiness Checklist

### Security Audit
- [ ] Smart contracts audited by external firm
- [ ] Penetration testing completed
- [ ] Bug bounty program activated

### Monitoring Setup
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring active (DataDog)
- [ ] Blockchain event monitoring
- [ ] Alert system for critical failures

### Backup and Recovery
- [ ] Database backup strategy implemented
- [ ] Smart contract upgrade mechanisms tested
- [ ] Disaster recovery procedures documented

### Legal and Compliance
- [ ] Terms of service reviewed
- [ ] Privacy policy compliant with GDPR
- [ ] Anti-money laundering procedures
- [ ] Jurisdiction-specific gambling regulations reviewed

This quickstart guide provides comprehensive validation of the RaffleTime platform from user registration through prize distribution, ensuring all core functionality works correctly before production deployment.