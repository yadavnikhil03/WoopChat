import mongoose, { Schema } from 'mongoose';
import { IAIMessage } from '../types';

const AIMessageSchema = new Schema<IAIMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
  }
);

AIMessageSchema.index({ userId: 1, createdAt: -1 });

export const AIMessage = mongoose.model<IAIMessage>(
  'AIMessage',
  AIMessageSchema
);
