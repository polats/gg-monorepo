/**
 * Log Model
 * 
 * Mongoose schema for system logs
 */

import mongoose, { Schema } from 'mongoose';
import type { ILog } from '@/types/database';

const LogSchema = new Schema<ILog>({
  type: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  wallet: {
    type: String,
  },
  ip: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index - auto-purge after 7 days (604800 seconds)
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Export model
export const Log = mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
export default Log;
