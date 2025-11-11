/**
 * Chat Message Content Filter
 * 
 * Prevents spam, profanity, and malicious content
 */

// Common curse words to filter (expand as needed)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap',
  'bastard', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'fag', 'faggot', 'retard', 'cunt', 'CP', 'Cheese pizza', 'child'
];

/**
 * Check if message contains URLs
 */
export function containsLinks(message: string): boolean {
  const urlPattern = /(?:https?:\/\/|www\.|[\w-]+\.(?:com|net|org|io|xyz|gg|dev|app|co|me|tv))/gi;
  return urlPattern.test(message);
}

/**
 * Check if message has 10+ successive identical characters (spam)
 */
export function isSpammy(message: string): boolean {
  // Check for 10+ repeated characters
  const repeatedCharsPattern = /(.)\1{9,}/;
  return repeatedCharsPattern.test(message);
}

/**
 * Filter profanity by replacing with asterisks
 */
export function filterProfanity(message: string): string {
  let filtered = message;
  
  PROFANITY_LIST.forEach(word => {
    // Case-insensitive replacement with word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
  });
  
  return filtered;
}

/**
 * Validate and sanitize chat message
 * 
 * Returns { valid: boolean, message: string, error?: string }
 */
export function validateChatMessage(message: string): {
  valid: boolean;
  message: string;
  error?: string;
} {
  // Trim and basic validation
  const trimmed = message.trim();
  
  if (!trimmed || trimmed.length < 1) {
    return { valid: false, message: '', error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 280) {
    return { valid: false, message: '', error: 'Message too long (max 280 characters)' };
  }
  
  // Check for links
  if (containsLinks(trimmed)) {
    return { valid: false, message: '', error: 'Links are not allowed in chat' };
  }
  
  // Check for spam
  if (isSpammy(trimmed)) {
    return { valid: false, message: '', error: 'Spammy content detected (10+ repeated characters)' };
  }
  
  // Filter profanity
  const filtered = filterProfanity(trimmed);
  
  return { valid: true, message: filtered };
}

