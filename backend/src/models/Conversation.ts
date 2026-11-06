import mongoose, { Schema } from 'mongoose';
import { IConversation } from '../types';

const ConversationSchema = new Schema<IConversation>(
  {
    isGroup: {
      type: Boolean,
      required: true,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    groupDescription: {
      type: String,
      maxlength: 500,
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    pinnedMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ participants: 1, isGroup: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ isGroup: 1 });

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
