/**
 * User Model
 * 
 * Mongoose schema for user data (TOS tracking)
 */

import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/types/database';

const UserSchema = new Schema<IUser>({
  wallet: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tosAccepted: {
    type: Boolean,
    required: true,
    default: false,
  },
  tosAcceptedAt: {
    type: Date,
  },
  isTokenGated: {
    type: Boolean,
    default: false,
  },
  tokenBalance: {
    type: Number,
    default: 0,
  },
  lastSeen: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Export model
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
