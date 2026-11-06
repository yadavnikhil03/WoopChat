import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDB, closeDB } from './config/database';
import { initializeSocket } from './sockets/socket.handler';

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`WhopChat server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Client URL:  ${config.clientUrl}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n⚡ ${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      console.log('HTTP server closed');
      await closeDB();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forcefully terminating process after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
