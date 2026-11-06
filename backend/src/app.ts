import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env';
import { checkDBHealth } from './config/database';
import { notFound, errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.isDev) app.use(morgan('dev'));

app.use('/api', generalLimiter);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'WhopChat API Server is running',
    version: '1.0.0',
    clientUrl: config.clientUrl,
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      chats: '/api/chats',
      ai: '/api/ai',
    },
  });
});

app.get('/health', async (_req, res) => {
  const dbHealth = await checkDBHealth();
  const isHealthy = dbHealth.connected;
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbHealth,
  });
});

app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDBHealth();
  const isHealthy = dbHealth.connected;
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbHealth,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
