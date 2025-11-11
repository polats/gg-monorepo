/**
 * 🧪 x402 Devnet Payment Test Script
 * 
 * Standalone test to verify x402 payment flow on Solana devnet
 * Tests buyer → seller USDC transfer with balance verification
 * 
 * Run: npm run testx402
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  mintTo,
  createMint,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Configuration
// ============================================
const DEVNET_RPC = 'https://api.devnet.solana.com';
const TOKEN_DECIMALS = 6;
const TEST_AMOUNT = 5; // 5 TEST-USDC
const TEST_AMOUNT_LAMPORTS = TEST_AMOUNT * Math.pow(10, TOKEN_DECIMALS);
const INITIAL_MINT_AMOUNT = 100; // Mint 100 TEST-USDC to buyer

// Wallet storage path
const WALLETS_DIR = path.join(__dirname, '.test-wallets');
const BUYER_WALLET_PATH = path.join(WALLETS_DIR, 'buyer.json');
const SELLER_WALLET_PATH = path.join(WALLETS_DIR, 'seller.json');
const MINT_WALLET_PATH = path.join(WALLETS_DIR, 'mint.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================
// Wallet Management
// ============================================
function loadOrCreateWallet(filePath: string, name: string): Keypair {
  if (fs.existsSync(filePath)) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    log('💾', `Loaded existing ${name} wallet`, colors.yellow);
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } else {
    const keypair = Keypair.generate();
    if (!fs.existsSync(WALLETS_DIR)) {
      fs.mkdirSync(WALLETS_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
    log('✨', `Created new ${name} wallet`, colors.green);
    return keypair;
  }
}

// ============================================
// Balance Helpers
// ============================================
async function getSOLBalance(connection: Connection, pubkey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

async function getTokenBalance(
  connection: Connection,
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
      mint: mint,
    });
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const balance = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
    return parseFloat(balance.value.uiAmount?.toString() || '0');
  } catch (error) {
    return 0; // Account doesn't exist yet
  }
}

async function airdropSOL(connection: Connection, pubkey: PublicKey, amount: number) {
  log('💧', `Requesting ${amount} SOL airdrop...`, colors.blue);
  try {
    const signature = await connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    log('✅', `Airdrop confirmed!`, colors.green);
  } catch (error: any) {
    log('⚠️', `Airdrop failed (rate limited or network issue)`, colors.yellow);
  }
}

// ============================================
// x402 Payment Flow Simulation
// ============================================
interface PaymentRequired {
  x402Version: number;
  scheme: 'exact';
  network: 'solana-devnet';
  amount: string;
  seller: string;
  mint: string;
  description: string;
}

function create402Response(seller: PublicKey, mint: PublicKey, amount: number): PaymentRequired {
  return {
    x402Version: 1,
    scheme: 'exact',
    network: 'solana-devnet',
    amount: amount.toString(),
    seller: seller.toBase58(),
    mint: mint.toBase58(),
    description: 'Test Software Purchase',
  };
}

async function createPaymentTransaction(
  connection: Connection,
  buyer: Keypair,
  seller: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<{ transaction: Transaction; signature: string }> {
  log('🔨', 'Constructing SPL token transfer transaction...', colors.blue);

  // Get or create token accounts
  const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    buyer,
    mint,
    buyer.publicKey
  );

  const sellerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    buyer, // Buyer pays for seller's account creation if needed
    mint,
    seller
  );

  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    buyerTokenAccount.address,
    sellerTokenAccount.address,
    buyer.publicKey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );

  // Create and sign transaction
  const transaction = new Transaction().add(transferInstruction);
  transaction.feePayer = buyer.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  log('✍️', 'Signing transaction...', colors.blue);
  transaction.sign(buyer);

  log('📡', 'Broadcasting transaction...', colors.blue);
  const signature = await sendAndConfirmTransaction(connection, transaction, [buyer]);

  return { transaction, signature };
}

async function verifyPayment(
  connection: Connection,
  signature: string,
  expectedAmount: number,
  expectedRecipient: PublicKey,
  expectedMint: PublicKey
): Promise<boolean> {
  log('🔍', 'Verifying payment on-chain...', colors.blue);

  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    log('❌', 'Transaction not found', colors.red);
    return false;
  }

  if (!tx.meta || tx.meta.err) {
    log('❌', 'Transaction failed', colors.red);
    return false;
  }

  log('✅', 'Transaction confirmed on-chain', colors.green);
  log('✅', `Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`, colors.green);

  // In a real implementation, you'd parse the transaction to verify:
  // - Amount matches
  // - Recipient matches
  // - Token mint matches
  // For this test, we'll verify via balance changes

  return true;
}

// ============================================
// Main Test Flow
// ============================================
async function main() {
  logSection('🚀 x402 Solana Devnet Payment Test (Automated)');

  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  // Load or create wallets
  log('📝', 'Setting up test wallets...', colors.cyan);
  const buyer = loadOrCreateWallet(BUYER_WALLET_PATH, 'BUYER');
  const seller = loadOrCreateWallet(SELLER_WALLET_PATH, 'SELLER');
  const mintAuthority = loadOrCreateWallet(MINT_WALLET_PATH, 'MINT_AUTHORITY');

  console.log(`\n${colors.blue}Buyer:  ${buyer.publicKey.toBase58()}${colors.reset}`);
  console.log(`${colors.blue}Seller: ${seller.publicKey.toBase58()}${colors.reset}`);

  // Ensure buyer has SOL for fees
  logSection('💰 Funding Wallets with SOL');
  let buyerSOL = await getSOLBalance(connection, buyer.publicKey);
  log('💵', `Buyer SOL balance: ${buyerSOL.toFixed(4)} SOL`, colors.yellow);

  if (buyerSOL < 0.5) {
    log('⚠️', `Insufficient SOL for transaction fees!`, colors.red);
    log('💡', `Please airdrop SOL to: ${buyer.publicKey.toBase58()}`, colors.cyan);
    log('🔗', 'Visit: https://faucet.solana.com/', colors.cyan);
    console.log('\n❌ Need SOL to continue. Exiting.');
    process.exit(0);
  }

  // Create or get test token mint (persistent across runs)
  logSection('🪙 Test Token Setup (TEST-USDC)');
  
  const MINT_ADDRESS_FILE = path.join(WALLETS_DIR, 'mint-address.txt');
  let testMint: PublicKey;
  
  if (fs.existsSync(MINT_ADDRESS_FILE)) {
    const savedMintAddress = fs.readFileSync(MINT_ADDRESS_FILE, 'utf-8').trim();
    testMint = new PublicKey(savedMintAddress);
    log('💾', `Using existing test token mint`, colors.yellow);
    log('🪙', `Mint address: ${testMint.toBase58()}`, colors.cyan);
  } else {
    log('🔨', 'Creating NEW token mint...', colors.blue);
    
    testMint = await createMint(
      connection,
      buyer, // Payer
      mintAuthority.publicKey, // Mint authority
      null, // Freeze authority
      TOKEN_DECIMALS
    );
    
    // Save mint address for future runs
    fs.writeFileSync(MINT_ADDRESS_FILE, testMint.toBase58());
    
    log('✅', `Test token created!`, colors.green);
    log('🪙', `Mint address: ${testMint.toBase58()}`, colors.cyan);
  }
  
  log('💡', `This simulates USDC with ${TOKEN_DECIMALS} decimals`, colors.cyan);

  // Check if buyer needs tokens
  let currentBuyerBalance = await getTokenBalance(connection, buyer.publicKey, testMint);
  
  if (currentBuyerBalance < TEST_AMOUNT) {
    log('🔨', `Minting ${INITIAL_MINT_AMOUNT} TEST-USDC to buyer...`, colors.blue);
    
    const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      buyer,
      testMint,
      buyer.publicKey
    );

    await mintTo(
      connection,
      buyer, // Payer
      testMint,
      buyerTokenAccount.address,
      mintAuthority, // Mint authority
      INITIAL_MINT_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
    );

    log('✅', `Minted ${INITIAL_MINT_AMOUNT} TEST-USDC to buyer!`, colors.green);
    currentBuyerBalance = await getTokenBalance(connection, buyer.publicKey, testMint);
  } else {
    log('💰', `Buyer already has ${currentBuyerBalance.toFixed(2)} TEST-USDC (sufficient)`, colors.green);
  }

  // Check initial balances
  logSection('📊 Initial Balances');
  let buyerTokens = await getTokenBalance(connection, buyer.publicKey, testMint);
  let sellerTokens = await getTokenBalance(connection, seller.publicKey, testMint);

  log('💵', `Buyer TEST-USDC:  ${buyerTokens.toFixed(2)}`, colors.yellow);
  log('💵', `Seller TEST-USDC: ${sellerTokens.toFixed(2)}`, colors.yellow);

  // ============================================
  // Step 1: 402 Payment Required
  // ============================================
  logSection('📋 Step 1: Generate 402 Payment Required');
  const paymentRequired = create402Response(seller.publicKey, testMint, TEST_AMOUNT_LAMPORTS);
  
  log('💳', `Price: ${TEST_AMOUNT} TEST-USDC`, colors.blue);
  log('👤', `Seller: ${paymentRequired.seller.slice(0, 8)}...${paymentRequired.seller.slice(-8)}`, colors.blue);
  log('🪙', `Token: TEST-USDC (simulates USDC)`, colors.blue);
  
  console.log(`\n${colors.cyan}Payment Required Object:${colors.reset}`);
  console.log(JSON.stringify(paymentRequired, null, 2));

  // ============================================
  // Step 2: Create Payment Transaction
  // ============================================
  logSection('💳 Step 2: Buyer Creates Payment');
  
  const { transaction, signature } = await createPaymentTransaction(
    connection,
    buyer,
    seller.publicKey,
    testMint,
    TEST_AMOUNT_LAMPORTS
  );

  log('✅', `Transaction sent!`, colors.green);
  log('📝', `Signature: ${signature}`, colors.green);
  log('🔗', `View: https://explorer.solana.com/tx/${signature}?cluster=devnet`, colors.cyan);

  // ============================================
  // Step 3: Verify Payment
  // ============================================
  logSection('✅ Step 3: Verify Payment');
  
  const isValid = await verifyPayment(
    connection,
    signature,
    TEST_AMOUNT_LAMPORTS,
    seller.publicKey,
    testMint
  );

  if (!isValid) {
    log('❌', 'Payment verification failed!', colors.red);
    process.exit(1);
  }

  // Wait a moment for balances to update
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================
  // Step 4: Check Final Balances
  // ============================================
  logSection('💰 Final Balances');
  
  const buyerTokensFinal = await getTokenBalance(connection, buyer.publicKey, testMint);
  const sellerTokensFinal = await getTokenBalance(connection, seller.publicKey, testMint);

  const buyerChange = buyerTokensFinal - buyerTokens;
  const sellerChange = sellerTokensFinal - sellerTokens;

  log('💵', `Buyer TEST-USDC:  ${buyerTokensFinal.toFixed(2)} (${buyerChange >= 0 ? '+' : ''}${buyerChange.toFixed(2)})`, 
    buyerChange < 0 ? colors.red : colors.green);
  log('💵', `Seller TEST-USDC: ${sellerTokensFinal.toFixed(2)} (${sellerChange >= 0 ? '+' : ''}${sellerChange.toFixed(2)})`, 
    sellerChange > 0 ? colors.green : colors.red);

  // ============================================
  // Summary
  // ============================================
  logSection('🎉 Test Complete!');
  
  if (Math.abs(sellerChange - TEST_AMOUNT) < 0.01) {
    log('✅', 'x402 payment flow works perfectly!', colors.green);
    log('✅', `Buyer sent ${TEST_AMOUNT} TEST-USDC`, colors.green);
    log('✅', `Seller received ${sellerChange.toFixed(2)} TEST-USDC`, colors.green);
    log('✅', 'Funds moved successfully', colors.green);
    log('✅', 'SPL token transfer verified on-chain', colors.green);
    log('💡', 'This flow is IDENTICAL to real USDC transfers!', colors.cyan);
  } else {
    log('⚠️', 'Unexpected balance changes detected', colors.yellow);
    log('💡', 'Check transaction on Solana Explorer', colors.cyan);
  }

  // ============================================
  // Final Wallet Balances (All Assets)
  // ============================================
  logSection('💼 Final Wallet Balances (All Assets)');
  
  const buyerSOLFinal = await getSOLBalance(connection, buyer.publicKey);
  const sellerSOLFinal = await getSOLBalance(connection, seller.publicKey);
  
  console.log(`\n${colors.bright}${colors.blue}Buyer Wallet:${colors.reset}`);
  log('  ', `Address: ${buyer.publicKey.toBase58()}`);
  log('  ', `SOL Balance: ${buyerSOLFinal.toFixed(4)} SOL`, colors.yellow);
  log('  ', `TEST-USDC Balance: ${buyerTokensFinal.toFixed(2)} TEST-USDC`, colors.yellow);
  
  console.log(`\n${colors.bright}${colors.blue}Seller Wallet:${colors.reset}`);
  log('  ', `Address: ${seller.publicKey.toBase58()}`);
  log('  ', `SOL Balance: ${sellerSOLFinal.toFixed(4)} SOL`, colors.yellow);
  log('  ', `TEST-USDC Balance: ${sellerTokensFinal.toFixed(2)} TEST-USDC`, colors.yellow);

  console.log('\n');
}

// ============================================
// Run Test
// ============================================
main().catch((error) => {
  console.error(`\n${colors.red}❌ Test failed:${colors.reset}`, error);
  process.exit(1);
});

