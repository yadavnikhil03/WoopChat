import crypto from 'crypto';
import { config } from '../config/env';

const KEY = crypto.scryptSync(config.messageEncryptionKey, 'whopchat-message-key-v1', 32);

export const encryptMessage = (text: string): string => {
  if (!text || typeof text !== 'string' || text.startsWith('enc:gcm:')) {
    return text;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptMessage = (text: string): string => {
  if (!text || typeof text !== 'string' || !text.startsWith('enc:gcm:')) {
    return text;
  }
  try {
    const parts = text.split(':');
    if (parts.length !== 5) return text;
    const ivHex = parts[2] ?? '';
    const authTagHex = parts[3] ?? '';
    const encrypted = parts[4] ?? '';
    if (ivHex.length !== 24 || authTagHex.length !== 32) return text;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '[Encrypted message unavailable]';
  }
};
