import { Log } from '@/models/Log';
import { CONFIG } from '@/config/constants';
import { connectDB } from './db';

/**
 * Log types
 */
export type LogType = 
  | 'info'
  | 'error'
  | 'admin_action'
  | 'txn_failure'
  | 'admin_fail'
  | 'listing_created'
  | 'listing_purchased'
  | 'listing_approved'
  | 'listing_rejected'
  | 'fundraiser_created'
  | 'fundraiser_donated'
  | 'fundraiser_approved'
  | 'fundraiser_rejected'
  | 'report_submitted'
  | 'comment_posted';

/**
 * Create a log entry
 */
export async function createLog(
  type: LogType,
  message: string,
  wallet?: string,
  ip?: string
): Promise<void> {
  try {
    await connectDB();
    
    await Log.create({
      type,
      message,
      wallet: wallet || undefined,
      ip: ip || undefined,
    });

    console.log(`📝 LOG [${type}]: ${message}`);
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('❌ Failed to create log:', error);
  }
}

/**
 * Extract IP from request headers
 */
export function getIpFromRequest(req: Request): string | undefined {
  const headers = req.headers;
  
  // Check various headers for IP
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return undefined;
}

