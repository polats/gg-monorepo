/**
 * Fundraiser Model
 * 
 * Mongoose schema for fundraiser listings
 * Similar to Listing model but tailored for fundraising campaigns
 */

import mongoose, { Schema } from 'mongoose';
import type { IListing } from '@/types/database';

// Reusing IListing interface since fundraisers have the same structure
const FundraiserSchema = new Schema<IListing>({
  wallet: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 2000,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  demoVideoUrl: {
    type: String,
  },
  whitepaperUrl: {
    type: String,
  },
  githubUrl: {
    type: String,
  },
  deliveryUrl: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0.10,
  },
  goalAmount: {
    type: Number,
    required: true,
    default: 500,
    min: 1,
  },
  raisedAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Medical',
      'Education',
      'Community',
      'Emergency',
      'Animal Welfare',
      'Environmental',
      'Arts & Culture',
      'Technology',
      'Sports',
      'Religious',
      'Memorial',
      'Business',
      'Personal',
      'Other',
    ],
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['standard', 'high-risk'],
    default: 'standard',
  },
  state: {
    type: String,
    required: true,
    enum: ['in_review', 'on_market', 'pulled'],
    default: 'in_review',
    index: true,
  },
  approved: {
    type: Boolean,
    required: true,
    default: false,
  },
  pinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  pinnedAt: {
    type: Date,
  },
  reportsCount: {
    type: Number,
    default: 0,
  },
  failedPurchaseCount: {
    type: Number,
    default: 0,
  },
  lastFailureAt: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes
FundraiserSchema.index({ wallet: 1, state: 1 });
FundraiserSchema.index({ state: 1, category: 1 });

// Export model
export const Fundraiser = mongoose.models.Fundraiser || mongoose.model<IListing>('Fundraiser', FundraiserSchema);
export default Fundraiser;

