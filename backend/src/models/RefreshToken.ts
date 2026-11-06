import mongoose, { Schema } from 'mongoose';
import { IRefreshToken } from '../types';

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);
