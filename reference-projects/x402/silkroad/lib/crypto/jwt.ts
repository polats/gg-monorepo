/**
 * JWT Utilities
 * 
 * JSON Web Token signing and verification for authentication
 */

import jwt from 'jsonwebtoken';
import type { UserJWTPayload, AdminJWTPayload } from '@/types/api';
import { CONFIG, JWT_CONFIG } from '@/config/constants';

/**
 * Sign user JWT
 * 
 * @param wallet - User's Solana wallet address
 * @param tosAccepted - Whether user accepted TOS
 * @returns string - Signed JWT token
 */
export function signUserJWT(wallet: string, tosAccepted: boolean = false): string {
  const payload: UserJWTPayload = {
    wallet,
    tosAccepted,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_CONFIG.EXPIRY,
  };

  return jwt.sign(payload, JWT_CONFIG.SECRET);
}

/**
 * Verify user JWT
 * 
 * @param token - JWT token string
 * @returns UserJWTPayload | null - Decoded payload or null if invalid
 */
export function verifyUserJWT(token: string): UserJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as UserJWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Sign admin JWT
 * 
 * @returns string - Signed admin JWT token
 */
export function signAdminJWT(): string {
  const payload: AdminJWTPayload = {
    isAdmin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_CONFIG.ADMIN_EXPIRY,
  };

  return jwt.sign(payload, JWT_CONFIG.SECRET);
}

/**
 * Verify admin JWT
 * 
 * @param token - JWT token string
 * @returns AdminJWTPayload | null - Decoded payload or null if invalid
 */
export function verifyAdminJWT(token: string): AdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as AdminJWTPayload;
    
    if (!decoded.isAdmin) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Admin JWT verification failed:', error);
    return null;
  }
}

/**
 * Update user JWT with TOS acceptance
 * 
 * @param token - Existing JWT token
 * @returns string | null - New JWT with tosAccepted=true, or null if invalid
 */
export function updateJWTWithTOS(token: string): string | null {
  const payload = verifyUserJWT(token);
  
  if (!payload) {
    return null;
  }

  // Create new token with TOS accepted
  return signUserJWT(payload.wallet, true);
}

/**
 * Decode JWT without verification (for debugging)
 * 
 * @param token - JWT token string
 * @returns any - Decoded payload (unverified)
 */
export function decodeJWT(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}

/**
 * Extract JWT from cookie string
 * 
 * @param cookieHeader - Cookie header string
 * @param cookieName - Name of the JWT cookie
 * @returns string | null - JWT token or null if not found
 */
export function extractJWTFromCookie(
  cookieHeader: string | null,
  cookieName: string = JWT_CONFIG.COOKIE_NAME
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const jwtCookie = cookies.find(c => c.startsWith(`${cookieName}=`));

  if (!jwtCookie) {
    return null;
  }

  return jwtCookie.split('=')[1];
}
