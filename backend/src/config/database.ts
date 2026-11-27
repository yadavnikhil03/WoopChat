import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { RefreshToken } from '../models/RefreshToken';
import { AIMessage } from '../models/AIMessage';

let memoryServer: MongoMemoryServer | null = null;

export const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 3000,
  heartbeatFrequencyMS: 10000,
  family: 4,
  autoIndex: true,
};

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

mongoose.connection.on('connected', () => {
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message || err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully');
});

export const syncAllIndexes = async (): Promise<void> => {
  try {
    await Promise.all([
      User.syncIndexes(),
      Conversation.syncIndexes(),
      Message.syncIndexes(),
      RefreshToken.syncIndexes(),
      AIMessage.syncIndexes(),
    ]);
    console.log('✅ MongoDB collection indexes synchronized');
  } catch (err: any) {
    console.warn('⚠️ MongoDB index synchronization notice:', err.message || err);
  }
};

export const checkDBHealth = async () => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;

  let pingMs = -1;
  if (isConnected && mongoose.connection.db) {
    const start = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch {
      pingMs = -1;
    }
  }

  return {
    connected: isConnected,
    readyState,
    status: stateMap[readyState] || 'unknown',
    host: mongoose.connection.host || 'unknown',
    dbName: mongoose.connection.name || 'whopchat',
    pingMs,
    models: Object.keys(mongoose.models).length,
  };
};

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      ...mongooseOptions,
      dbName: 'whopchat',
    });
    console.log(`✅ MongoDB active via ${config.mongoUri}`);
    await syncAllIndexes();
    return;
  } catch {
    console.log(`ℹ️ No external MongoDB detected on ${config.mongoUri}. Starting embedded in-memory MongoDB...`);
  }

  try {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'whopchat' },
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri, {
      ...mongooseOptions,
      dbName: 'whopchat',
    });
    console.log(`✅ Embedded MongoDB active at: ${uri}`);
    await syncAllIndexes();
  } catch (err: any) {
    console.error('❌ Failed to initialize database:', err.message || err);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close(false);
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('✅ MongoDB connection closed cleanly');
  } catch (err: any) {
    console.error('❌ Error closing MongoDB connection:', err.message || err);
  }
};
