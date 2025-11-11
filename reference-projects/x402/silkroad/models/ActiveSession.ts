import mongoose from 'mongoose';

const activeSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  lastSeen: {
    type: Date,
    required: true,
    default: Date.now,
  },
  page: {
    type: String,
    default: '/',
  },
});

// Create TTL index - automatically delete documents 5 minutes after lastSeen
activeSessionSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });

export const ActiveSession = mongoose.models.ActiveSession || mongoose.model('ActiveSession', activeSessionSchema);

