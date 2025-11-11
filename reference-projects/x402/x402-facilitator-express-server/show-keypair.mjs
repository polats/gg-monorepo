#!/usr/bin/env node

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { readFileSync } from 'fs';

try {
  // Read the keypair file
  const keypairData = JSON.parse(
    readFileSync('./facilitator-keypair.json', 'utf-8')
  );

  // Create Keypair from the secret key bytes
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // Display the information
  console.log('\n=== Facilitator Keypair Information ===\n');
  console.log('Public Key (Address):');
  console.log(keypair.publicKey.toBase58());
  console.log('\nPrivate Key (Base58):');
  console.log(bs58.encode(keypair.secretKey));
  console.log('\n');
} catch (error) {
  console.error('Error reading keypair:', error.message);
  process.exit(1);
}
