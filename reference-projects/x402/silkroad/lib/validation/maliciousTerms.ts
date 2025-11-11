/**
 * Malicious Terms Detection
 * 
 * Fuzzy string matching to detect prohibited terms in listings
 */

import Fuse from 'fuse.js';
import maliciousTermsList from '@/config/maliciousTerms.json';
import { VALIDATION } from '@/config/constants';

// Initialize Fuse.js with malicious terms
const fuse = new Fuse(maliciousTermsList, {
  threshold: VALIDATION.MALICIOUS_TERMS_THRESHOLD, // 0.8 Levenshtein threshold
  includeScore: true,
  minMatchCharLength: 3,
});

/**
 * Check if text contains malicious terms
 * 
 * Uses Fuse.js for fuzzy matching to catch leetspeak and variants
 * 
 * @param text - Text to check (title, description, etc.)
 * @returns {detected: boolean, matches: string[]} - Detection result
 */
export function checkMaliciousTerms(text: string): {
  detected: boolean;
  matches: string[];
} {
  // Normalize text for better matching
  const normalizedText = text.toLowerCase();

  // Split into words
  const words = normalizedText.split(/\s+/);

  const matches: string[] = [];

  // Check each word against malicious terms
  for (const word of words) {
    const results = fuse.search(word);

    if (results.length > 0) {
      // Add matched terms
      results.forEach(result => {
        if (!matches.includes(result.item)) {
          matches.push(result.item);
        }
      });
    }
  }

  // Also check for exact matches in full text
  for (const term of maliciousTermsList) {
    if (normalizedText.includes(term) && !matches.includes(term)) {
      matches.push(term);
    }
  }

  return {
    detected: matches.length > 0,
    matches,
  };
}

/**
 * Validate listing content
 * 
 * Checks title and description for malicious terms
 * 
 * @param title - Listing title
 * @param description - Listing description
 * @returns {valid: boolean, reason?: string} - Validation result
 */
export function validateListingContent(
  title: string,
  description: string
): { valid: boolean; reason?: string } {
  // Check title
  const titleCheck = checkMaliciousTerms(title);
  if (titleCheck.detected) {
    return {
      valid: false,
      reason: `Prohibited terms detected in title: ${titleCheck.matches.join(', ')}`,
    };
  }

  // Check description
  const descriptionCheck = checkMaliciousTerms(description);
  if (descriptionCheck.detected) {
    return {
      valid: false,
      reason: `Prohibited terms detected in description: ${descriptionCheck.matches.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get malicious terms list
 * 
 * @returns string[] - Array of prohibited terms
 */
export function getMaliciousTermsList(): string[] {
  return [...maliciousTermsList];
}

