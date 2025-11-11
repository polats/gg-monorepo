/**
 * USDC decimal conversion utilities
 */

/**
 * Number of decimals in USDC token (6 decimals)
 */
export const USDC_DECIMALS = 6;

/**
 * Multiplier for converting USDC to smallest unit
 */
export const USDC_MULTIPLIER = Math.pow(10, USDC_DECIMALS);

/**
 * Convert USDC amount to smallest unit (lamports)
 * 
 * @param usdcAmount - Amount in USDC (e.g., 5.0 = 5 USDC)
 * @returns Amount in smallest unit as string (e.g., "5000000")
 * 
 * @example
 * ```typescript
 * usdcToSmallestUnit(5.0) // "5000000"
 * usdcToSmallestUnit(0.5) // "500000"
 * usdcToSmallestUnit(10.25) // "10250000"
 * ```
 */
export function usdcToSmallestUnit(usdcAmount: number): string {
  if (usdcAmount < 0) {
    throw new Error('USDC amount cannot be negative');
  }
  
  if (!Number.isFinite(usdcAmount)) {
    throw new Error('USDC amount must be a finite number');
  }
  
  // Multiply by 10^6 and round to avoid floating point errors
  const smallestUnit = Math.round(usdcAmount * USDC_MULTIPLIER);
  return smallestUnit.toString();
}

/**
 * Convert smallest unit (lamports) to USDC amount
 * 
 * @param smallestUnit - Amount in smallest unit (string or number)
 * @returns Amount in USDC (e.g., 5.0)
 * 
 * @example
 * ```typescript
 * smallestUnitToUsdc("5000000") // 5.0
 * smallestUnitToUsdc("500000") // 0.5
 * smallestUnitToUsdc(10250000) // 10.25
 * ```
 */
export function smallestUnitToUsdc(smallestUnit: string | number): number {
  const amount = typeof smallestUnit === 'string' 
    ? parseInt(smallestUnit, 10) 
    : smallestUnit;
  
  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid smallest unit amount');
  }
  
  return amount / USDC_MULTIPLIER;
}

/**
 * Format USDC amount for display
 * 
 * @param usdcAmount - Amount in USDC
 * @param decimals - Number of decimal places to show (default 2)
 * @returns Formatted string (e.g., "5.00 USDC")
 * 
 * @example
 * ```typescript
 * formatUsdc(5.0) // "5.00 USDC"
 * formatUsdc(0.5) // "0.50 USDC"
 * formatUsdc(10.256, 3) // "10.256 USDC"
 * ```
 */
export function formatUsdc(usdcAmount: number, decimals: number = 2): string {
  return `${usdcAmount.toFixed(decimals)} USDC`;
}

/**
 * Validate USDC amount is within acceptable range
 * 
 * @param usdcAmount - Amount to validate
 * @param min - Minimum allowed amount (default 0.01)
 * @param max - Maximum allowed amount (default 1000000)
 * @returns True if valid, false otherwise
 */
export function isValidUsdcAmount(
  usdcAmount: number,
  min: number = 0.01,
  max: number = 1000000
): boolean {
  return (
    Number.isFinite(usdcAmount) &&
    usdcAmount >= min &&
    usdcAmount <= max
  );
}
