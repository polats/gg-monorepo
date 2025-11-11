import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  wallet: string;
  message: string;
  messageType: 'selling' | 'buying' | 'general';
  listingId?: string; // Optional listing to shill
  reactions: Map<string, string[]>; // emoji -> array of wallet addresses
  replyTo?: string; // Optional message ID this is replying to
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    wallet: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 280,
    },
    messageType: {
      type: String,
      enum: ['selling', 'buying', 'general'],
      default: 'general',
    },
    listingId: {
      type: String,
      required: false, // Optional - can attach a listing
    },
    reactions: {
      type: Map,
      of: [String], // Map of emoji -> array of wallet addresses
      default: new Map(),
    },
    replyTo: {
      type: String,
      required: false, // Optional - ID of message being replied to
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - auto-purge after 7 days (604800 seconds)
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

