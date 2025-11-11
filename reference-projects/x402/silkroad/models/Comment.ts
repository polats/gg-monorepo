import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  listingId: string;
  buyerWallet: string;
  comment: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    listingId: {
      type: String,
      required: true,
      index: true,
    },
    buyerWallet: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one comment per buyer per listing
CommentSchema.index({ listingId: 1, buyerWallet: 1 }, { unique: true });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

