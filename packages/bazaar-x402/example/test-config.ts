/**
 * Test configuration loading
 * 
 * Run with: tsx test-config.ts
 */

import { loadAndValidateConfig, getConfigSummary } from '@bazaar-x402/core';

console.log('Testing configuration loading...\n');

try {
  // Load configuration from environment
  const config = loadAndValidateConfig(process.env);
  
  // Print configuration summary
  console.log(getConfigSummary(config));
  
  console.log('\n✅ Configuration loaded successfully!');
  
  // Print some details
  console.log('\nConfiguration Details:');
  console.log(`- Mode: ${config.mode}`);
  
  if (config.mode === 'mock' && config.mockConfig) {
    console.log(`- Default Balance: ${config.mockConfig.defaultBalance} USDC`);
    console.log(`- Use Redis: ${config.mockConfig.useRedis}`);
    if (config.mockConfig.redisUrl) {
      console.log(`- Redis URL: ${config.mockConfig.redisUrl}`);
    }
  }
  
  if (config.mode === 'production' && config.x402Config) {
    console.log(`- Network: ${config.x402Config.network}`);
    console.log(`- RPC URL: ${
      config.x402Config.network === 'solana-mainnet'
        ? config.x402Config.mainnetRpcUrl
        : config.x402Config.devnetRpcUrl
    }`);
    console.log(`- USDC Mint: ${
      config.x402Config.network === 'solana-mainnet'
        ? config.x402Config.usdcMintMainnet
        : config.x402Config.usdcMintDevnet
    }`);
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Configuration error:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
