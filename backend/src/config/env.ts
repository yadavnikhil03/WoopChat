import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

export const config = {
  port: parseInt(process.env['PORT'] ?? '8000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  isDev: (process.env['NODE_ENV'] ?? 'development') === 'development',

  mongoUri: required('MONGO_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },

  clientUrl: process.env['CLIENT_URL'] ?? 'http://localhost:5173',

  openai: {
    apiKey: process.env['OPENAI_API_KEY'] ?? '',
    baseUrl: process.env['OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1',
    model: process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini',
  },
};
