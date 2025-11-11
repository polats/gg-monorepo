/**
 * Listing Model
 * 
 * Mongoose schema for marketplace listings
 */

import mongoose, { Schema } from 'mongoose';
import type { IListing } from '@/types/database';

const ListingSchema = new Schema<IListing>({
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
  category: {
    type: String,
    required: true,
    enum: [
      'Trading Bot',
      'API Tool',
      'Script',
      'Jobs/Services',
      'Music',
      'Games',
      'Mods',
      'Private Access',
      'Call Groups',
      'Raid Services',
      'Telegram Groups',
      'Discord Services',
      'Art & Design',
      'Video Content',
      'Courses & Tutorials',
      'Data & Analytics',
      'Marketing Tools',
      'Social Media',
      'NFT Tools',
      'Custom',
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
ListingSchema.index({ wallet: 1, state: 1 });
ListingSchema.index({ state: 1, category: 1 });

// Export model
export const Listing = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;
