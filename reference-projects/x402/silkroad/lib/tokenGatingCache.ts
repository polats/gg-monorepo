/**
 * Token Gating Cache
 * 
 * Caches token balance checks to avoid rate limiting from RPC providers.
 * Balance is cached for CACHE_DURATION_MS to balance between:
 * - Avoiding excessive RPC calls
 * - Detecting when users sell tokens mid-session
 */

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'token_gate_cache_';

export interface TokenGateCache {
  wallet: string;
  tokenBalance: number;
  isTokenGated: boolean;
  timestamp: number;
}

/**
 * Get cached token gating result if still valid
 */
export function getCachedTokenGate(wallet: string): TokenGateCache | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${wallet}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const data: TokenGateCache = JSON.parse(cached);
    const now = Date.now();
    const age = now - data.timestamp;
    
    // Check if cache is still valid
    if (age < CACHE_DURATION_MS) {
      const remainingMinutes = Math.ceil((CACHE_DURATION_MS - age) / 60000);
      console.log(`✅ Using cached token balance (valid for ${remainingMinutes} more minutes)`);
      return data;
    }
    
    // Cache expired
    console.log('⏰ Token balance cache expired, will re-check');
    sessionStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading token gate cache:', error);
    return null;
  }
}

/**
 * Cache token gating result
 */
export function setCachedTokenGate(
  wallet: string,
  tokenBalance: number,
  isTokenGated: boolean
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${wallet}`;
    const data: TokenGateCache = {
      wallet,
      tokenBalance,
      isTokenGated,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.log(`💾 Cached token balance: ${tokenBalance} (valid for ${CACHE_DURATION_MS / 60000} minutes)`);
  } catch (error) {
    console.error('Error writing token gate cache:', error);
  }
}

/**
 * Clear cache for a specific wallet
 */
export function clearCachedTokenGate(wallet: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${wallet}`;
    sessionStorage.removeItem(cacheKey);
    console.log('🧹 Cleared token balance cache');
  } catch (error) {
    console.error('Error clearing token gate cache:', error);
  }
}

/**
 * Clear all token gate caches
 */
export function clearAllTokenGateCaches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('🧹 Cleared all token balance caches');
  } catch (error) {
    console.error('Error clearing all token gate caches:', error);
  }
}

