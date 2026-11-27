import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { Types } from 'mongoose';

interface TokenPayload {
  _id: string;
  email: string;
  name: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign(
    { _id: userId.toString(), jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { _id: string } => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  }) as { _id: string };
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const refreshTokenExpiry = (): Date => {
  const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
