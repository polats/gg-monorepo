/**
 * Input Sanitization Utilities
 * 
 * Clean and validate user inputs
 */

import validator from 'validator';
import { marked } from 'marked';

/**
 * Sanitize string input
 * 
 * Removes potentially dangerous characters
 * 
 * @param input - Raw string input
 * @returns string - Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Escape HTML
  sanitized = validator.escape(sanitized);

  return sanitized;
}

/**
 * Sanitize markdown
 * 
 * Converts markdown to HTML and sanitizes (serverless-friendly)
 * 
 * @param markdown - Raw markdown input
 * @returns string - Sanitized HTML
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Configure marked to be safe
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Convert markdown to HTML
  const html = marked(markdown) as string;

  // Simple serverless-friendly HTML sanitization
  // Remove script tags and dangerous event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Validate URL
 * 
 * @param url - URL string to validate
 * @returns boolean - True if valid URL
 */
export function isValidURL(url: string): boolean {
  if (!url) return false;

  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

/**
 * Validate email
 * 
 * @param email - Email string to validate
 * @returns boolean - True if valid email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return validator.isEmail(email);
}

/**
 * Validate Solana address
 * 
 * Basic validation (32-44 characters, base58)
 * 
 * @param address - Solana address string
 * @returns boolean - True if likely valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;

  // Solana addresses are 32-44 base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate price
 * 
 * @param price - Price number
 * @param min - Minimum allowed price
 * @returns boolean - True if valid price
 */
export function isValidPrice(price: number, min: number = 0.10): boolean {
  if (typeof price !== 'number') return false;
  if (isNaN(price)) return false;
  if (price < min) return false;
  return true;
}

/**
 * Sanitize object keys
 * 
 * Removes any keys that aren't in allowedKeys
 * 
 * @param obj - Input object
 * @param allowedKeys - Array of allowed key names
 * @returns any - Sanitized object
 */
export function sanitizeObjectKeys(obj: any, allowedKeys: string[]): any {
  if (!obj || typeof obj !== 'object') return {};

  const sanitized: any = {};

  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

/**
 * Validate image file type
 * 
 * @param mimeType - MIME type string
 * @returns boolean - True if allowed image type
 */
export function isValidImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 * 
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns boolean - True if within size limit
 */
export function isValidFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}

