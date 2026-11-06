import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { ChatService } from '../services/chat.service';
import { isValidObjectId } from '../utils/database.util';

const userSocketMap = new Map<string, Set<string>>();

const getUserSockets = (userId: string): string[] => {
  return Array.from(userSocketMap.get(userId) ?? []);
};

export const emitToUser = (io: Server, userId: string, event: string, data: unknown): void => {
  getUserSockets(userId).forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

let ioInstance: Server | null = null;

export const getIO = (): Server => {
  if (!ioInstance) throw new Error('Socket.io has not been initialized yet');
  return ioInstance;
};

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers['authorization'];
      const token =
        (socket.handshake.auth?.['token'] as string | undefined) ||
        (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : undefined);

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      (socket as any).userId = payload._id;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId: string = (socket as any).userId;

    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    socket.broadcast.emit('user:online', { userId });
    io.emit('users:online', { onlineUsers: Array.from(userSocketMap.keys()) });

    console.log(`🟢 Socket connected: ${socket.id} (user: ${userId})`);

    socket.on('chat:join', (chatId: string) => {
      if (isValidObjectId(chatId)) {
        socket.join(`chat:${chatId}`);
      }
    });

    socket.on('chat:leave', (chatId: string) => {
      if (isValidObjectId(chatId)) {
        socket.leave(`chat:${chatId}`);
      }
    });

    socket.on(
      'message:send',
      async (payload: {
        chatId: string;
        content?: string;
        image?: string;
        audio?: string;
        audioDuration?: number;
        replyTo?: string;
        isForwarded?: boolean;
      }) => {
        try {
          const msg = await ChatService.sendMessage(
            payload.chatId,
            userId,
            payload.content ?? '',
            payload.image,
            payload.replyTo,
            payload.isForwarded,
            payload.audio,
            payload.audioDuration
          );

          io.to(`chat:${payload.chatId}`).emit('message:new', msg);

          const conversation = await Conversation.findById(
            payload.chatId
          ).select('participants');

          if (conversation) {
            for (const participantId of conversation.participants) {
              const pid = participantId.toString();
              if (pid !== userId) {
                emitToUser(io, pid, 'message:new', msg);
                emitToUser(io, pid, 'chat:updated', {
                  chatId: payload.chatId,
                  lastMessage: msg,
                });
              }
            }
          }

          emitToUser(io, userId, 'message:delivered', {
            chatId: payload.chatId,
            messageId: (msg._id as any).toString(),
          });
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    socket.on('typing:start', async (payload: { chatId: string }) => {
      const typingData = {
        chatId: payload.chatId,
        userId,
        user: (socket as any).user,
      };
      socket.to(`chat:${payload.chatId}`).emit('typing:start', typingData);

      try {
        const conv = await Conversation.findById(payload.chatId).select('participants');
        if (conv) {
          for (const pid of conv.participants) {
            const pStr = pid.toString();
            if (pStr !== userId) {
              emitToUser(io, pStr, 'typing:start', typingData);
            }
          }
        }
      } catch {}
    });

    socket.on('typing:stop', async (payload: { chatId: string }) => {
      const typingData = {
        chatId: payload.chatId,
        userId,
      };
      socket.to(`chat:${payload.chatId}`).emit('typing:stop', typingData);

      try {
        const conv = await Conversation.findById(payload.chatId).select('participants');
        if (conv) {
          for (const pid of conv.participants) {
            const pStr = pid.toString();
            if (pStr !== userId) {
              emitToUser(io, pStr, 'typing:stop', typingData);
            }
          }
        }
      } catch {}
    });

    socket.on('message:read', async (payload: { chatId: string }) => {
      try {
        await ChatService.markAsRead(payload.chatId, userId);
        io.to(`chat:${payload.chatId}`).emit('message:read', {
          chatId: payload.chatId,
          userId,
        });

        const conv = await Conversation.findById(payload.chatId);
        if (conv) {
          for (const pid of conv.participants) {
            emitToUser(io, pid.toString(), 'message:read', {
              chatId: payload.chatId,
              userId,
            });
          }
        }
      } catch {}
    });

    socket.on(
      'message:edit',
      async (payload: { messageId: string; chatId: string; content: string }) => {
        try {
          const msg = await ChatService.editMessage(payload.messageId, userId, payload.content);
          io.to(`chat:${payload.chatId}`).emit('message:edited', msg);

          const conversation = await Conversation.findById(payload.chatId);
          if (conversation) {
            for (const pid of conversation.participants) {
              emitToUser(io, pid.toString(), 'message:edited', msg);
            }
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    socket.on('message:delete', async (payload: { messageId: string; chatId: string }) => {
      try {
        const msg = await ChatService.deleteMessage(payload.messageId, userId);
        const conversation = await Conversation.findById(payload.chatId).populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: '_id name avatar email isOnline lastSeen isAI' },
        });

        const deletePayload = {
          messageId: (msg._id as any).toString(),
          chatId: payload.chatId,
          lastMessage: conversation?.lastMessage || null,
        };
        io.to(`chat:${payload.chatId}`).emit('message:deleted', deletePayload);

        if (conversation) {
          for (const pid of conversation.participants) {
            emitToUser(io, pid.toString(), 'message:deleted', deletePayload);
            emitToUser(io, pid.toString(), 'chat:updated', {
              chatId: payload.chatId,
              lastMessage: conversation.lastMessage || null,
            });
          }
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:react', async (payload: { messageId: string; emoji: string; chatId: string }) => {
      try {
        const msg = await ChatService.reactToMessage(payload.messageId, userId, payload.emoji);
        const conversation = await Conversation.findById(payload.chatId);

        const emitPayload = {
          messageId: payload.messageId,
          chatId: payload.chatId,
          reactions: msg.reactions,
          userId,
          emoji: payload.emoji,
        };

        io.to(`chat:${payload.chatId}`).emit('message:reaction', emitPayload);
        if (conversation) {
          for (const pid of conversation.participants) {
            emitToUser(io, pid.toString(), 'message:reaction', emitPayload);
          }
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:pin', async (payload: { chatId: string; messageId: string }) => {
      try {
        const { chat, message } = await ChatService.pinMessage(payload.chatId, payload.messageId, userId);
        const pinPayload = { chatId: payload.chatId, pinnedMessage: message };
        io.to(`chat:${payload.chatId}`).emit('chat:pinned', pinPayload);
        for (const pid of chat.participants) {
          emitToUser(io, (pid._id || pid).toString(), 'chat:pinned', pinPayload);
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:unpin', async (payload: { chatId: string }) => {
      try {
        const { chat } = await ChatService.unpinMessage(payload.chatId, userId);
        const unpinPayload = { chatId: payload.chatId };
        io.to(`chat:${payload.chatId}`).emit('chat:unpinned', unpinPayload);
        for (const pid of chat.participants) {
          emitToUser(io, (pid._id || pid).toString(), 'chat:unpinned', unpinPayload);
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('call:initiate', (payload: { to: string; chatId: string; callType: 'video' | 'audio'; callerName: string; callerAvatar?: string; signalData?: any }) => {
      emitToUser(io, payload.to, 'call:incoming', {
        ...payload,
        from: userId,
      });
    });

    socket.on('call:accept', (payload: { to: string; chatId: string; signalData?: any }) => {
      emitToUser(io, payload.to, 'call:accepted', {
        ...payload,
        from: userId,
      });
    });

    socket.on('call:reject', (payload: { to: string; chatId: string; reason?: string }) => {
      emitToUser(io, payload.to, 'call:rejected', {
        ...payload,
        from: userId,
      });
    });

    socket.on('call:ice-candidate', (payload: { to: string; candidate: any }) => {
      emitToUser(io, payload.to, 'call:ice-candidate', {
        candidate: payload.candidate,
        from: userId,
      });
    });

    socket.on('call:end', (payload: { to: string; chatId?: string }) => {
      emitToUser(io, payload.to, 'call:ended', {
        from: userId,
      });
    });

    socket.on('disconnect', async () => {
      userSocketMap.get(userId)?.delete(socket.id);
      if (userSocketMap.get(userId)?.size === 0) {
        userSocketMap.delete(userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });
        socket.broadcast.emit('user:offline', { userId, lastSeen });
        io.emit('users:online', { onlineUsers: Array.from(userSocketMap.keys()) });
      }
      console.log(`🔴 Socket disconnected: ${socket.id} (user: ${userId})`);
    });
  });

  return io;
};
