import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { Types } from 'mongoose';

interface TokenPayload {
  _id: string;
  email: string;
  name: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign({ _id: userId.toString() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { _id: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { _id: string };
};

export const refreshTokenExpiry = (): Date => {
  const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
