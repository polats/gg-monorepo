import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Launch Mode Detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when NEXT_PUBLIC_APP_LAUNCHED is not set', () => {
    it('should default to minigame mode', () => {
      delete process.env.NEXT_PUBLIC_APP_LAUNCHED;

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });

    it('should show minigame when env var is undefined', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = undefined;

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });

    it('should show minigame when env var is empty string', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = '';

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });
  });

  describe('when NEXT_PUBLIC_APP_LAUNCHED is set to true', () => {
    it('should show main app when explicitly set to true', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = 'true';

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(true);
    });

    it('should be case-sensitive (TRUE should not work)', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = 'TRUE';

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });
  });

  describe('when NEXT_PUBLIC_APP_LAUNCHED has other values', () => {
    it('should show minigame for any non-true value', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = 'false';

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });

    it('should show minigame for numeric values', () => {
      process.env.NEXT_PUBLIC_APP_LAUNCHED = '1';

      const { isLaunched } = require('@/lib/launch-config');
      expect(isLaunched()).toBe(false);
    });
  });
});