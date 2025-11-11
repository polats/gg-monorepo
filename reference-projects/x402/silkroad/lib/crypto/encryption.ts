/**
 * Encryption Utilities
 * 
 * AES encryption/decryption for sensitive data (e.g., deliveryUrl)
 */

import CryptoJS from 'crypto-js';
import { CONFIG } from '@/config/constants';

/**
 * Encrypt string using AES-256
 * 
 * @param plaintext - String to encrypt
 * @returns string - Encrypted ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!CONFIG.APP_SECRET) {
    throw new Error('APP_SECRET not configured');
  }

  const ciphertext = CryptoJS.AES.encrypt(plaintext, CONFIG.APP_SECRET).toString();
  return ciphertext;
}

/**
 * Decrypt string using AES-256
 * 
 * @param ciphertext - Encrypted string
 * @returns string - Decrypted plaintext
 * @throws Error if decryption fails
 */
export function decrypt(ciphertext: string): string {
  if (!CONFIG.APP_SECRET) {
    throw new Error('APP_SECRET not configured');
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CONFIG.APP_SECRET);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption failed - empty result');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Safely decrypt a string with fallback for legacy unencrypted data
 * 
 * Used for backward compatibility with data that was stored before encryption.
 * Attempts decryption and returns the original string if it fails (no error logging).
 * 
 * @param potentialCiphertext - String that may or may not be encrypted
 * @returns string - Decrypted plaintext or original string if not encrypted
 */
export function safeDecrypt(potentialCiphertext: string): string {
  if (!potentialCiphertext) {
    return potentialCiphertext;
  }

  if (!CONFIG.APP_SECRET) {
    return potentialCiphertext;
  }

  // Trim any whitespace
  const trimmedCiphertext = potentialCiphertext.trim();

  try {
    const bytes = CryptoJS.AES.decrypt(trimmedCiphertext, CONFIG.APP_SECRET);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);

    // Check if decryption produced valid UTF-8 text
    // Valid decryption should produce readable text, not empty or gibberish
    if (plaintext && plaintext.length > 0) {
      // Additional check: if it looks like a URL or readable text, it's probably decrypted
      // If it's all weird characters, decryption likely failed
      const hasReadableChars = /[\w\-\/:\.@]/.test(plaintext);
      
      if (hasReadableChars) {
        return plaintext;
      }
    }

    // Empty result or gibberish = not encrypted or wrong key, return original
    return potentialCiphertext;
  } catch (error) {
    // Decryption failed = not encrypted, return original
    return potentialCiphertext;
  }
}

/**
 * Hash string using SHA-256
 * 
 * @param input - String to hash
 * @returns string - SHA-256 hash
 */
export function hash(input: string): string {
  return CryptoJS.SHA256(input).toString();
}

/**
 * Generate random nonce
 * 
 * @param length - Length of nonce (default 16)
 * @returns string - Random hex string
 */
export function generateNonce(length: number = 16): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Generate OTP (One-Time Password)
 * 
 * @returns string - 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify OTP
 * 
 * Compares hashed OTP with stored hash
 * 
 * @param inputOTP - User-provided OTP
 * @param storedHash - Stored OTP hash
 * @returns boolean - True if OTP matches
 */
export function verifyOTP(inputOTP: string, storedHash: string): boolean {
  const inputHash = hash(inputOTP);
  return inputHash === storedHash;
}
