import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDB, closeDB } from './config/database';
import { initializeSocket, emitToUser } from './sockets/socket.handler';
import { ChatService } from './services/chat.service';

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = initializeSocket(httpServer);

  const schedulerInterval = setInterval(async () => {
    try {
      const dispatched = await ChatService.processDueScheduledMessages();
      for (const item of dispatched) {
        const msg = item.message;
        if (msg.whisperTo && msg.whisperTo.length > 0) {
          const senderId = (msg.sender?._id || msg.sender).toString();
          emitToUser(io, senderId, 'message:new', msg);
          msg.whisperTo.forEach((recipient: any) => {
            emitToUser(io, (recipient._id || recipient).toString(), 'message:new', msg);
          });
        } else {
          io.to(`chat:${item.chatId}`).emit('message:new', msg);
          item.participants.forEach((pid) => {
            emitToUser(io, pid, 'message:new', msg);
            emitToUser(io, pid, 'chat:updated', {
              chatId: item.chatId,
              lastMessage: msg,
            });
          });
        }
      }
    } catch {}
  }, 5000);

  httpServer.listen(config.port, () => {
    console.log(`WhopChat server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Client URL:  ${config.clientUrl}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n⚡ ${signal} received. Shutting down gracefully...`);
    clearInterval(schedulerInterval);
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
