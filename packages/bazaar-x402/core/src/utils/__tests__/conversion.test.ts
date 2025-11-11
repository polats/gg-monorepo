/**
 * Tests for USDC conversion utilities
 */

import { describe, it, expect } from 'vitest';
import {
  USDC_DECIMALS,
  USDC_MULTIPLIER,
  usdcToSmallestUnit,
  smallestUnitToUsdc,
  formatUsdc,
  isValidUsdcAmount,
} from '../conversion';

describe('conversion utilities', () => {
  describe('constants', () => {
    it('should have correct USDC decimals', () => {
      expect(USDC_DECIMALS).toBe(6);
    });

    it('should have correct USDC multiplier', () => {
      expect(USDC_MULTIPLIER).toBe(1000000);
    });
  });

  describe('usdcToSmallestUnit', () => {
    it('should convert whole USDC amounts', () => {
      expect(usdcToSmallestUnit(1)).toBe('1000000');
      expect(usdcToSmallestUnit(5)).toBe('5000000');
      expect(usdcToSmallestUnit(10)).toBe('10000000');
    });

    it('should convert decimal USDC amounts', () => {
      expect(usdcToSmallestUnit(0.5)).toBe('500000');
      expect(usdcToSmallestUnit(0.01)).toBe('10000');
      expect(usdcToSmallestUnit(10.25)).toBe('10250000');
    });

    it('should handle zero', () => {
      expect(usdcToSmallestUnit(0)).toBe('0');
    });

    it('should throw on negative amounts', () => {
      expect(() => usdcToSmallestUnit(-1)).toThrow('USDC amount cannot be negative');
    });

    it('should throw on non-finite amounts', () => {
      expect(() => usdcToSmallestUnit(Infinity)).toThrow('USDC amount must be a finite number');
      expect(() => usdcToSmallestUnit(NaN)).toThrow('USDC amount must be a finite number');
    });
  });

  describe('smallestUnitToUsdc', () => {
    it('should convert string amounts', () => {
      expect(smallestUnitToUsdc('1000000')).toBe(1);
      expect(smallestUnitToUsdc('5000000')).toBe(5);
      expect(smallestUnitToUsdc('500000')).toBe(0.5);
    });

    it('should convert number amounts', () => {
      expect(smallestUnitToUsdc(1000000)).toBe(1);
      expect(smallestUnitToUsdc(5000000)).toBe(5);
      expect(smallestUnitToUsdc(500000)).toBe(0.5);
    });

    it('should handle zero', () => {
      expect(smallestUnitToUsdc('0')).toBe(0);
      expect(smallestUnitToUsdc(0)).toBe(0);
    });

    it('should throw on invalid amounts', () => {
      expect(() => smallestUnitToUsdc('invalid')).toThrow('Invalid smallest unit amount');
      expect(() => smallestUnitToUsdc('-1000000')).toThrow('Invalid smallest unit amount');
    });
  });

  describe('formatUsdc', () => {
    it('should format with default 2 decimals', () => {
      expect(formatUsdc(5)).toBe('5.00 USDC');
      expect(formatUsdc(0.5)).toBe('0.50 USDC');
      expect(formatUsdc(10.256)).toBe('10.26 USDC');
    });

    it('should format with custom decimals', () => {
      expect(formatUsdc(5, 0)).toBe('5 USDC');
      expect(formatUsdc(10.256, 3)).toBe('10.256 USDC');
      expect(formatUsdc(0.5, 4)).toBe('0.5000 USDC');
    });
  });

  describe('isValidUsdcAmount', () => {
    it('should accept valid amounts', () => {
      expect(isValidUsdcAmount(0.01)).toBe(true);
      expect(isValidUsdcAmount(1)).toBe(true);
      expect(isValidUsdcAmount(100)).toBe(true);
      expect(isValidUsdcAmount(1000)).toBe(true);
    });

    it('should reject amounts below minimum', () => {
      expect(isValidUsdcAmount(0)).toBe(false);
      expect(isValidUsdcAmount(0.001)).toBe(false);
    });

    it('should reject amounts above maximum', () => {
      expect(isValidUsdcAmount(1000001)).toBe(false);
      expect(isValidUsdcAmount(10000000)).toBe(false);
    });

    it('should reject non-finite amounts', () => {
      expect(isValidUsdcAmount(Infinity)).toBe(false);
      expect(isValidUsdcAmount(NaN)).toBe(false);
    });

    it('should accept custom min/max', () => {
      expect(isValidUsdcAmount(5, 1, 10)).toBe(true);
      expect(isValidUsdcAmount(0.5, 1, 10)).toBe(false);
      expect(isValidUsdcAmount(15, 1, 10)).toBe(false);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain precision through round-trip', () => {
      const amounts = [0.01, 0.5, 1, 5, 10.25, 100, 1000];
      
      for (const amount of amounts) {
        const smallest = usdcToSmallestUnit(amount);
        const back = smallestUnitToUsdc(smallest);
        expect(back).toBe(amount);
      }
    });
  });
});
