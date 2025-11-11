#!/usr/bin/env node

/**
 * Test configuration loading
 * 
 * This script helps debug configuration issues by:
 * 1. Loading .env file
 * 2. Showing environment variables
 * 3. Testing configuration parsing
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
console.log('📁 Loading .env file from:', join(__dirname, '.env'));
const result = dotenvConfig({ path: join(__dirname, '.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('✅ .env file loaded successfully\n');

// Show relevant environment variables
console.log('🔍 Environment Variables:');
console.log('  PAYMENT_MODE =', process.env.PAYMENT_MODE);
console.log('  SOLANA_NETWORK =', process.env.SOLANA_NETWORK);
console.log('  SOLANA_DEVNET_RPC =', process.env.SOLANA_DEVNET_RPC);
console.log('  SOLANA_MAINNET_RPC =', process.env.SOLANA_MAINNET_RPC);
console.log('  USDC_MINT_DEVNET =', process.env.USDC_MINT_DEVNET);
console.log('  USDC_MINT_MAINNET =', process.env.USDC_MINT_MAINNET);
console.log('  MOCK_DEFAULT_BALANCE =', process.env.MOCK_DEFAULT_BALANCE);
console.log('  MOCK_USE_REDIS =', process.env.MOCK_USE_REDIS);
console.log('');

// Test configuration parsing
console.log('🧪 Testing configuration parsing...\n');

try {
  const { loadAndValidateConfig, getConfigSummary } = await import('@bazaar-x402/core');
  
  const config = loadAndValidateConfig(process.env);
  
  console.log('✅ Configuration parsed successfully\n');
  console.log('📋 Configuration Summary:');
  console.log(getConfigSummary(config));
  console.log('');
  
  console.log('🔍 Detailed Configuration:');
  console.log('  config.mode =', config.mode);
  console.log('  config.mockConfig =', JSON.stringify(config.mockConfig, null, 2));
  console.log('  config.x402Config =', JSON.stringify(config.x402Config, null, 2));
  console.log('');
  
  // Test currency adapter creation
  console.log('🧪 Testing currency adapter creation...\n');
  const { createCurrencyAdapter } = await import('@bazaar-x402/core');
  
  const currencyAdapter = createCurrencyAdapter({
    config,
    verbose: true,
  });
  
  console.log('✅ Currency adapter created successfully');
  console.log('  Type:', currencyAdapter.constructor.name);
  console.log('');
  
  // Summary
  console.log('✅ All tests passed!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  Payment Mode: ${config.mode}`);
  console.log(`  Currency Adapter: ${currencyAdapter.constructor.name}`);
  if (config.mode === 'production') {
    console.log(`  Network: ${config.x402Config?.network}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error);
  console.error('');
  console.error('Stack trace:');
  console.error(error.stack);
  process.exit(1);
}
