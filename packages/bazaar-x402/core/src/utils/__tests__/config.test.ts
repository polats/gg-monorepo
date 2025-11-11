/**
 * Tests for configuration loader
 */

import { describe, it, expect } from 'vitest';
import {
  loadConfig,
  validateConfig,
  loadAndValidateConfig,
  getConfigSummary,
  ConfigValidationError,
  DEFAULT_CONFIG,
} from '../config.js';

describe('Configuration Loader', () => {
  describe('loadConfig', () => {
    it('should load default configuration when no env vars provided', () => {
      const config = loadConfig({});
      
      expect(config.mode).toBe('mock');
      expect(config.mockConfig).toBeDefined();
      expect(config.mockConfig?.defaultBalance).toBe(1000);
      expect(config.mockConfig?.useRedis).toBe(false);
      expect(config.x402Config).toBeDefined();
    });
    
    it('should load mock mode configuration', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'mock',
        MOCK_DEFAULT_BALANCE: '500',
        MOCK_USE_REDIS: 'true',
        MOCK_REDIS_URL: 'redis://localhost:6379',
      });
      
      expect(config.mode).toBe('mock');
      expect(config.mockConfig?.defaultBalance).toBe(500);
      expect(config.mockConfig?.useRedis).toBe(true);
      expect(config.mockConfig?.redisUrl).toBe('redis://localhost:6379');
    });
    
    it('should load production mode configuration', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'production',
        SOLANA_NETWORK: 'devnet',
        SOLANA_DEVNET_RPC: 'https://custom-devnet.com',
        TX_POLL_MAX_ATTEMPTS: '15',
        TX_POLL_INTERVAL_MS: '1500',
      });
      
      expect(config.mode).toBe('production');
      expect(config.x402Config?.network).toBe('solana-devnet');
      expect(config.x402Config?.devnetRpcUrl).toBe('https://custom-devnet.com');
      expect(config.x402Config?.maxPollAttempts).toBe(15);
      expect(config.x402Config?.pollIntervalMs).toBe(1500);
    });
    
    it('should handle various network formats', () => {
      const config1 = loadConfig({ SOLANA_NETWORK: 'devnet' });
      expect(config1.x402Config?.network).toBe('solana-devnet');
      
      const config2 = loadConfig({ SOLANA_NETWORK: 'solana-devnet' });
      expect(config2.x402Config?.network).toBe('solana-devnet');
      
      const config3 = loadConfig({ SOLANA_NETWORK: 'mainnet' });
      expect(config3.x402Config?.network).toBe('solana-mainnet');
      
      const config4 = loadConfig({ SOLANA_NETWORK: 'mainnet-beta' });
      expect(config4.x402Config?.network).toBe('solana-mainnet');
    });
    
    it('should parse boolean values correctly', () => {
      const config1 = loadConfig({ MOCK_USE_REDIS: 'true' });
      expect(config1.mockConfig?.useRedis).toBe(true);
      
      const config2 = loadConfig({ MOCK_USE_REDIS: 'false' });
      expect(config2.mockConfig?.useRedis).toBe(false);
      
      const config3 = loadConfig({ MOCK_USE_REDIS: '1' });
      expect(config3.mockConfig?.useRedis).toBe(true);
      
      const config4 = loadConfig({ MOCK_USE_REDIS: '0' });
      expect(config4.mockConfig?.useRedis).toBe(false);
    });
  });
  
  describe('validateConfig', () => {
    it('should validate valid mock configuration', () => {
      const config = loadConfig({ PAYMENT_MODE: 'mock' });
      expect(() => validateConfig(config)).not.toThrow();
    });
    
    it('should validate valid production configuration', () => {
      const config = loadConfig({ PAYMENT_MODE: 'production' });
      expect(() => validateConfig(config)).not.toThrow();
    });
    
    it('should reject invalid payment mode', () => {
      const config = {
        mode: 'invalid' as any,
        mockConfig: { defaultBalance: 1000, useRedis: false },
        x402Config: undefined,
      };
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });
    
    it('should reject mock mode without mockConfig', () => {
      const config = {
        mode: 'mock' as const,
        mockConfig: undefined,
        x402Config: undefined,
      };
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Mock mode requires mockConfig');
    });
    
    it('should reject production mode without x402Config', () => {
      const config = {
        mode: 'production' as const,
        mockConfig: undefined,
        x402Config: undefined,
      };
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Production mode requires x402Config');
    });
    
    it('should reject negative default balance', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'mock',
        MOCK_DEFAULT_BALANCE: '-100',
      });
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });
    
    it('should reject invalid RPC URLs', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'production',
        SOLANA_DEVNET_RPC: 'not-a-url',
      });
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Invalid devnet RPC URL');
    });
    
    it('should reject invalid USDC mint addresses', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'production',
        USDC_MINT_DEVNET: 'invalid-address',
      });
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Invalid devnet USDC mint address');
    });
    
    it('should reject invalid polling parameters', () => {
      const config1 = loadConfig({
        PAYMENT_MODE: 'production',
        TX_POLL_MAX_ATTEMPTS: '0',
      });
      
      expect(() => validateConfig(config1)).toThrow(ConfigValidationError);
      
      const config2 = loadConfig({
        PAYMENT_MODE: 'production',
        TX_POLL_INTERVAL_MS: '50',
      });
      
      expect(() => validateConfig(config2)).toThrow(ConfigValidationError);
    });
    
    it('should reject Redis mode without URL', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'mock',
        MOCK_USE_REDIS: 'true',
        MOCK_REDIS_URL: '',
      });
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Mock mode with Redis requires redisUrl');
    });
  });
  
  describe('loadAndValidateConfig', () => {
    it('should load and validate in one step', () => {
      const config = loadAndValidateConfig({ PAYMENT_MODE: 'mock' });
      
      expect(config.mode).toBe('mock');
      expect(config.mockConfig).toBeDefined();
    });
    
    it('should throw on invalid configuration', () => {
      expect(() => {
        loadAndValidateConfig({
          PAYMENT_MODE: 'production',
          SOLANA_DEVNET_RPC: 'invalid-url',
        });
      }).toThrow(ConfigValidationError);
    });
  });
  
  describe('getConfigSummary', () => {
    it('should generate summary for mock mode', () => {
      const config = loadConfig({ PAYMENT_MODE: 'mock' });
      const summary = getConfigSummary(config);
      
      expect(summary).toContain('Payment Mode: mock');
      expect(summary).toContain('Mock Default Balance');
      expect(summary).toContain('Mock Use Redis');
    });
    
    it('should generate summary for production mode', () => {
      const config = loadConfig({ PAYMENT_MODE: 'production' });
      const summary = getConfigSummary(config);
      
      expect(summary).toContain('Payment Mode: production');
      expect(summary).toContain('Solana Network');
      expect(summary).toContain('RPC URL');
      expect(summary).toContain('USDC Mint');
    });
  });
  
  describe('DEFAULT_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CONFIG.PAYMENT_MODE).toBe('mock');
      expect(DEFAULT_CONFIG.SOLANA_NETWORK).toBe('solana-devnet');
      expect(DEFAULT_CONFIG.MOCK_DEFAULT_BALANCE).toBe(1000);
      expect(DEFAULT_CONFIG.TX_POLL_MAX_ATTEMPTS).toBe(10);
      expect(DEFAULT_CONFIG.TX_POLL_INTERVAL_MS).toBe(2000);
    });
  });
});
