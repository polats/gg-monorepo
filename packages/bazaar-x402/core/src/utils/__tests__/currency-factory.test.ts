/**
 * Tests for currency adapter factory
 */

import { describe, it, expect } from 'vitest';
import { createCurrencyAdapter } from '../currency-factory.js';
import { loadConfig } from '../config.js';
import { MockCurrencyAdapter } from '../../adapters/mock-currency.js';
import { X402CurrencyAdapter } from '../../adapters/x402-currency.js';

describe('Currency Adapter Factory', () => {
  describe('createCurrencyAdapter', () => {
    it('should create MockCurrencyAdapter for mock mode', () => {
      const config = loadConfig({ PAYMENT_MODE: 'mock' });
      const adapter = createCurrencyAdapter({ config, verbose: false });
      
      expect(adapter).toBeInstanceOf(MockCurrencyAdapter);
    });
    
    it('should create X402CurrencyAdapter for production mode', () => {
      const config = loadConfig({ PAYMENT_MODE: 'production' });
      const adapter = createCurrencyAdapter({ config, verbose: false });
      
      expect(adapter).toBeInstanceOf(X402CurrencyAdapter);
    });
    
    it('should throw error for mock mode without mockConfig', () => {
      const config = {
        mode: 'mock' as const,
        mockConfig: undefined,
        x402Config: undefined,
      };
      
      expect(() => {
        createCurrencyAdapter({ config, verbose: false });
      }).toThrow('Mock mode requires mockConfig');
    });
    
    it('should throw error for production mode without x402Config', () => {
      const config = {
        mode: 'production' as const,
        mockConfig: undefined,
        x402Config: undefined,
      };
      
      expect(() => {
        createCurrencyAdapter({ config, verbose: false });
      }).toThrow('Production mode requires x402Config');
    });
    
    it('should throw error for unsupported mode', () => {
      const config = {
        mode: 'invalid' as any,
        mockConfig: undefined,
        x402Config: undefined,
      };
      
      expect(() => {
        createCurrencyAdapter({ config, verbose: false });
      }).toThrow('Unsupported payment mode');
    });
    
    it('should pass Redis client to MockCurrencyAdapter', () => {
      const config = loadConfig({
        PAYMENT_MODE: 'mock',
        MOCK_USE_REDIS: 'true',
        MOCK_REDIS_URL: 'redis://localhost:6379',
      });
      
      const mockRedisClient = {
        get: async () => null,
        set: async () => {},
        del: async () => {},
      };
      
      const adapter = createCurrencyAdapter({
        config,
        redisClient: mockRedisClient,
        verbose: false,
      });
      
      expect(adapter).toBeInstanceOf(MockCurrencyAdapter);
    });
  });
});
