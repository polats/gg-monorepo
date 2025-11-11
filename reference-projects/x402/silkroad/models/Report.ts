/**
 * Report Model
 * 
 * Mongoose schema for listing reports
 */

import mongoose, { Schema } from 'mongoose';
import type { IReport } from '@/types/database';

const ReportSchema = new Schema<IReport>({
  listingId: {
    type: String,
    required: true,
    index: true,
  },
  reporterWallet: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    maxlength: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique compound index - prevents duplicate reports from same wallet
ReportSchema.index({ listingId: 1, reporterWallet: 1 }, { unique: true });

// Export model
export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export default Report;
