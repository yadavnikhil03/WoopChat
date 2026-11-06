import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';
import { encryptMessage, decryptMessage } from '../utils/encryption.util';

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
      set: (val: string) => encryptMessage(val),
      get: (val: string) => decryptMessage(val),
    },
    image: {
      type: String,
      default: null,
    },
    audio: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

MessageSchema.index({ chatId: 1, isDeleted: 1, createdAt: 1, _id: 1 });
MessageSchema.index({ chatId: 1, isPinned: 1 });
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ replyTo: 1 });
MessageSchema.index({ readBy: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
