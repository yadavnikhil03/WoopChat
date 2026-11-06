import crypto from 'crypto';

const secret =
  process.env['MESSAGE_ENCRYPTION_KEY'] ||
  process.env['JWT_SECRET'] ||
  'whopchat-aes-256-gcm-master-encryption-secret-key';

const KEY = crypto.createHash('sha256').update(secret).digest();

export const encryptMessage = (text: string): string => {
  if (!text || typeof text !== 'string' || text.startsWith('enc:gcm:')) {
    return text;
  }
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch {
    return text;
  }
};

export const decryptMessage = (text: string): string => {
  if (!text || typeof text !== 'string' || !text.startsWith('enc:gcm:')) {
    return text;
  }
  try {
    const parts = text.split(':');
    if (parts.length < 5) return text;
    const iv = Buffer.from(parts[2]!, 'hex');
    const authTag = Buffer.from(parts[3]!, 'hex');
    const encrypted = parts[4]!;
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text;
  }
};
