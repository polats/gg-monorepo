/**
 * Transaction Model
 * 
 * Mongoose schema for purchase transactions
 */

import mongoose, { Schema } from 'mongoose';
import type { ITransaction } from '@/types/database';

const TransactionSchema = new Schema<ITransaction>({
  listingId: {
    type: String,
    required: true,
    index: true,
  },
  buyerWallet: {
    type: String,
    required: true,
    index: true,
  },
  sellerWallet: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  txnHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deliveryUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export model
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
