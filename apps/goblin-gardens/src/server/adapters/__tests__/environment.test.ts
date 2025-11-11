import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectEnvironment, getEnvironmentConfig, Environment } from '../environment';

describe('Environment Detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  it('should detect local environment by default', () => {
    delete process.env.VERCEL;
    delete process.env.NODE_ENV;
    delete process.env.LOCAL_DEV;

    const env = detectEnvironment();
    expect(env).toBe(Environment.LOCAL);
  });

  it('should detect Vercel environment when VERCEL is set', () => {
    process.env.VERCEL = '1';

    const env = detectEnvironment();
    expect(env).toBe(Environment.VERCEL);
  });

  it('should detect Reddit environment in production without LOCAL_DEV', () => {
    delete process.env.VERCEL;
    delete process.env.LOCAL_DEV;
    process.env.NODE_ENV = 'production';

    const env = detectEnvironment();
    expect(env).toBe(Environment.REDDIT);
  });

  it('should prioritize Vercel over Reddit when both conditions are met', () => {
    process.env.VERCEL = '1';
    process.env.NODE_ENV = 'production';

    const env = detectEnvironment();
    expect(env).toBe(Environment.VERCEL);
  });

  it('should detect local when LOCAL_DEV is set even in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOCAL_DEV = 'true';

    const env = detectEnvironment();
    expect(env).toBe(Environment.LOCAL);
  });

  it('should detect local in development mode', () => {
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'development';

    const env = detectEnvironment();
    expect(env).toBe(Environment.LOCAL);
  });

  describe('Environment Configuration', () => {
    it('should return local configuration', () => {
      delete process.env.VERCEL;
      delete process.env.NODE_ENV;

      const config = getEnvironmentConfig();
      
      expect(config.environment).toBe(Environment.LOCAL);
      expect(config.apiBaseUrl).toBe('http://localhost:3000');
      expect(config.isProduction).toBe(false);
    });

    it('should return Vercel configuration', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_URL = 'my-app.vercel.app';
      process.env.NODE_ENV = 'production';

      const config = getEnvironmentConfig();
      
      expect(config.environment).toBe(Environment.VERCEL);
      expect(config.apiBaseUrl).toBe('https://my-app.vercel.app');
      expect(config.isProduction).toBe(true);
    });

    it('should return Reddit configuration', () => {
      delete process.env.VERCEL;
      delete process.env.LOCAL_DEV;
      process.env.NODE_ENV = 'production';

      const config = getEnvironmentConfig();
      
      expect(config.environment).toBe(Environment.REDDIT);
      expect(config.apiBaseUrl).toBe('');
      expect(config.isProduction).toBe(true);
    });

    it('should handle missing VERCEL_URL in Vercel environment', () => {
      process.env.VERCEL = '1';
      delete process.env.VERCEL_URL;

      const config = getEnvironmentConfig();
      
      expect(config.environment).toBe(Environment.VERCEL);
      expect(config.apiBaseUrl).toBe('');
    });

    it('should detect production mode correctly', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';

      const config = getEnvironmentConfig();
      expect(config.isProduction).toBe(true);
    });

    it('should detect development mode correctly', () => {
      process.env.NODE_ENV = 'development';

      const config = getEnvironmentConfig();
      expect(config.isProduction).toBe(false);
    });
  });
});
