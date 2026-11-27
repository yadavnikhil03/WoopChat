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
    messageType: {
      type: String,
      enum: ['text', 'poll', 'code', 'digest', 'ai_copilot', 'whisper'],
      default: 'text',
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
    poll: {
      type: {
        question: { type: String, required: true },
        options: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
            votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
          },
        ],
        allowMultiple: { type: Boolean, default: false },
      },
      default: null,
    },
    codeBlock: {
      type: {
        language: { type: String, default: 'typescript' },
        title: { type: String, default: '' },
        code: { type: String, required: true },
      },
      default: null,
    },
    digest: {
      type: {
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        highlights: [{ type: String }],
        messageCount: { type: Number, default: 0 },
        participantCount: { type: Number, default: 0 },
      },
      default: null,
    },
    isAICopilot: {
      type: Boolean,
      default: false,
    },
    whisperTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ephemeralSeconds: {
      type: Number,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    isScheduledPending: {
      type: Boolean,
      default: false,
    },
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

MessageSchema.index({ chatId: 1, isDeleted: 1, isScheduledPending: 1, createdAt: 1, _id: 1 });
MessageSchema.index({ chatId: 1, isPinned: 1 });
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ isScheduledPending: 1, scheduledFor: 1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ replyTo: 1 });
MessageSchema.index({ readBy: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
