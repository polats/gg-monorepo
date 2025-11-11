/**
 * Database Model Types
 * 
 * TypeScript interfaces for Mongoose models
 */

import { Document } from 'mongoose';
import type { ListingCategory, RiskLevel, ListingState, TransactionStatus, LogType } from '@/config/constants';

// ============================================
// Listing
// ============================================
export interface IListing extends Document {
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  deliveryUrl: string;
  price: number;
  category: ListingCategory;
  riskLevel: RiskLevel;
  state: ListingState;
  approved: boolean;
  pinned: boolean;
  pinnedAt?: Date;
  reportsCount: number;
  failedPurchaseCount: number;
  lastFailureAt?: Date;
  views: number;
  goalAmount?: number; // For fundraisers
  raisedAmount?: number; // For fundraisers
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// User (for TOS tracking)
// ============================================
export interface IUser extends Document {
  wallet: string;
  tosAccepted: boolean;
  tosAcceptedAt?: Date;
  isTokenGated: boolean;
  tokenBalance: number;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Transaction
// ============================================
export interface ITransaction extends Document {
  listingId: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  txnHash: string;
  deliveryUrl: string; // Encrypted
  status: TransactionStatus;
  createdAt: Date;
}

// ============================================
// Report
// ============================================
export interface IReport extends Document {
  listingId: string;
  reporterWallet: string;
  reason?: string;
  createdAt: Date;
}

// ============================================
// Log
// ============================================
export interface ILog extends Document {
  type: LogType;
  message: string;
  wallet?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
