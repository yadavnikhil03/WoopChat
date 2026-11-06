import { Request } from 'express';
import { Document, Types } from 'mongoose';


export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  status?: string;
  isOnline: boolean;
  lastSeen: Date;
  blockedUsers: Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}


export interface IConversation extends Document {
  _id: Types.ObjectId;
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  participants: Types.ObjectId[];
  admins: Types.ObjectId[];
  createdBy: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  pinnedMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IMessageReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  image?: string;
  audio?: string;
  audioDuration?: number;
  replyTo?: Types.ObjectId;
  status: MessageStatus;
  readBy: Types.ObjectId[];
  reactions?: IMessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  isForwarded?: boolean;
  isPinned?: boolean;
  pinnedBy?: Types.ObjectId;
  pinnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}


export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}


export interface IAIMessage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}


export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
  };
}


export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}


export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}
