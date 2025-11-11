import { connectDB } from './db';
import mongoose from 'mongoose';

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: Date;
  createdAt: Date;
}

// Simple rate limit schema (in-memory for now, can be moved to models if needed)
const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index - auto-delete after resetAt
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

let RateLimit: mongoose.Model<RateLimitEntry>;
try {
  RateLimit = mongoose.model<RateLimitEntry>('RateLimit');
} catch {
  RateLimit = mongoose.model<RateLimitEntry>('RateLimit', rateLimitSchema);
}

export interface RateLimitConfig {
  maxRequests: number;      // Max requests allowed
  windowMs: number;          // Time window in milliseconds
  message?: string;          // Custom error message
  keyPrefix: string;         // Prefix for the rate limit key (e.g., 'purchase', 'listing')
}

/**
 * Check rate limit for a given key (usually wallet address)
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ 
  allowed: boolean; 
  remaining: number; 
  resetAt: Date;
  message?: string;
}> {
  await connectDB();

  const key = `${config.keyPrefix}:${identifier}`;
  const now = new Date();

  try {
    // Find existing rate limit entry
    let entry = await RateLimit.findOne({ key });

    // If no entry or expired, create new one
    if (!entry || entry.resetAt < now) {
      const resetAt = new Date(now.getTime() + config.windowMs);
      
      await RateLimit.findOneAndUpdate(
        { key },
        {
          key,
          count: 1,
          resetAt,
          createdAt: now
        },
        { upsert: true, new: true }
      );

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt
      };
    }

    // Entry exists and is active
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        message: config.message || `Rate limit exceeded. Try again after ${entry.resetAt.toLocaleTimeString()}`
      };
    }

    // Increment counter
    entry.count += 1;
    await entry.save();

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs)
    };
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Creating listings: 3 per hour
  CREATE_LISTING: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'create-listing',
    message: 'Too many listing attempts. Maximum 3 per hour. Please try again later.'
  },
  
  // Purchases: 10 per hour (prevent spam purchases)
  PURCHASE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'purchase',
    message: 'Too many purchase attempts. Maximum 10 per hour. Please try again later.'
  },
  
  // Image uploads: 5 per 10 minutes
  IMAGE_UPLOAD: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: 'image-upload',
    message: 'Too many upload attempts. Maximum 5 per 10 minutes. Please try again later.'
  },
  
  // General API calls: 100 per minute (very generous, catches only extreme abuse)
  GENERAL_API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api',
    message: 'Too many requests. Please slow down.'
  }
} as const;

