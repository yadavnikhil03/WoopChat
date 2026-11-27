import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { config } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { ChatService } from '../services/chat.service';
import { isValidObjectId } from '../utils/database.util';
import { sendMessageSchema, editMessageSchema } from '../validators/chat.validator';
import { isSafeMediaUrl } from '../utils/sanitize.util';

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

const isChatParticipant = async (chatId: string, userId: string): Promise<boolean> => {
  if (!isValidObjectId(chatId) || !isValidObjectId(userId)) return false;
  const exists = await Conversation.exists({
    _id: new Types.ObjectId(chatId),
    participants: new Types.ObjectId(userId),
  });
  return Boolean(exists);
};

const areCallPeers = async (userId: string, targetId: string): Promise<boolean> => {
  if (!isValidObjectId(userId) || !isValidObjectId(targetId) || userId === targetId) return false;
  const uid = new Types.ObjectId(userId);
  const tid = new Types.ObjectId(targetId);
  const shared = await Conversation.exists({
    participants: { $all: [uid, tid] },
  });
  if (!shared) return false;

  const [caller, callee] = await Promise.all([
    User.findById(uid).select('blockedUsers'),
    User.findById(tid).select('blockedUsers'),
  ]);
  if (!caller || !callee) return false;
  if (caller.blockedUsers?.some((id) => id.equals(tid))) return false;
  if (callee.blockedUsers?.some((id) => id.equals(uid))) return false;
  return true;
};

export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    maxHttpBufferSize: 10 * 1024 * 1024,
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
      if (!isValidObjectId(payload._id)) return next(new Error('Invalid token'));

      const dbUser = await User.findById(payload._id).select('_id name email avatar');
      if (!dbUser) return next(new Error('User no longer exists'));

      (socket as any).userId = dbUser._id.toString();
      (socket as any).user = {
        _id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const authUser = (socket as any).user as {
      _id: string;
      name: string;
      email: string;
      avatar: string;
    };

    const rateState = { count: 0, resetAt: Date.now() + 10000 };
    const allowEvent = (): boolean => {
      const now = Date.now();
      if (now > rateState.resetAt) {
        rateState.count = 0;
        rateState.resetAt = now + 10000;
      }
      rateState.count += 1;
      if (rateState.count > 80) {
        socket.emit('error', { message: 'Rate limit exceeded. Slow down.' });
        return false;
      }
      return true;
    };

    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    socket.broadcast.emit('user:online', { userId });
    io.emit('users:online', { onlineUsers: Array.from(userSocketMap.keys()) });

    socket.on('chat:join', async (chatId: string) => {
      if (!allowEvent()) return;
      if (await isChatParticipant(chatId, userId)) {
        socket.join(`chat:${chatId}`);
      }
    });

    socket.on('chat:leave', (chatId: string) => {
      if (isValidObjectId(chatId)) {
        socket.leave(`chat:${chatId}`);
      }
    });

    socket.on('message:send', async (payload: Record<string, any>) => {
      if (!allowEvent()) return;
      try {
        if (!payload || !isValidObjectId(payload['chatId'])) {
          socket.emit('error', { message: 'Invalid conversation ID' });
          return;
        }
        const chatId = payload['chatId'] as string;
        const parsed = sendMessageSchema.parse(payload);

        const msg = await ChatService.sendMessage(
          chatId,
          userId,
          parsed.content ?? '',
          parsed.image ?? undefined,
          parsed.replyTo ?? undefined,
          parsed.isForwarded,
          parsed.audio ?? undefined,
          parsed.audioDuration,
          {
            messageType: parsed.messageType === 'ai_copilot' ? 'text' : parsed.messageType,
            poll: parsed.poll ?? null,
            codeBlock: parsed.codeBlock ?? null,
            whisperTo: parsed.whisperTo,
            ephemeralSeconds: parsed.ephemeralSeconds ?? null,
            scheduledFor: parsed.scheduledFor ?? null,
          }
        );

        if (msg.isScheduledPending) {
          emitToUser(io, userId, 'message:scheduled', {
            chatId,
            message: msg,
          });
          return;
        }

        if (msg.whisperTo && msg.whisperTo.length > 0) {
          emitToUser(io, userId, 'message:new', msg);
          msg.whisperTo.forEach((recipient: any) => {
            const rid = (recipient._id || recipient).toString();
            if (rid !== userId) {
              emitToUser(io, rid, 'message:new', msg);
            }
          });
          return;
        }

        io.to(`chat:${chatId}`).emit('message:new', msg);

        const conversation = await Conversation.findById(chatId).select('participants');

        if (conversation) {
          for (const participantId of conversation.participants) {
            const pid = participantId.toString();
            if (pid !== userId) {
              emitToUser(io, pid, 'message:new', msg);
              emitToUser(io, pid, 'chat:updated', {
                chatId,
                lastMessage: msg,
              });
            }
          }
        }

        emitToUser(io, userId, 'message:delivered', {
          chatId,
          messageId: (msg._id as any).toString(),
        });

        if (
          typeof parsed.content === 'string' &&
          parsed.content.toLowerCase().includes('@whopai')
        ) {
          const promptText =
            parsed.content.replace(/@whopai/gi, '').trim().slice(0, 1000) || 'catch me up';
          const aiMsg = await ChatService.triggerInlineCopilot(chatId, userId, promptText);
          io.to(`chat:${chatId}`).emit('message:new', aiMsg);
          if (conversation) {
            for (const participantId of conversation.participants) {
              const pid = participantId.toString();
              if (pid !== userId) {
                emitToUser(io, pid, 'message:new', aiMsg);
                emitToUser(io, pid, 'chat:updated', {
                  chatId,
                  lastMessage: aiMsg,
                });
              }
            }
          }
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('poll:vote', async (payload: { chatId: string; messageId: string; optionId: string }) => {
      if (!allowEvent()) return;
      try {
        if (typeof payload?.optionId !== 'string' || !payload.optionId.trim()) {
          socket.emit('error', { message: 'Option ID is required' });
          return;
        }
        const msg = await ChatService.votePoll(payload.messageId, userId, payload.optionId.trim());
        const targetChatId = msg.chatId.toString();
        const votePayload = {
          messageId: (msg._id as any).toString(),
          chatId: targetChatId,
          poll: msg.poll,
        };
        io.to(`chat:${targetChatId}`).emit('poll:updated', votePayload);
        const conv = await Conversation.findById(targetChatId).select('participants');
        if (conv) {
          conv.participants.forEach((pid) => {
            emitToUser(io, pid.toString(), 'poll:updated', votePayload);
          });
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('studio:focus-start', async (payload: { chatId: string; durationMinutes: number; label?: string }) => {
      if (!allowEvent()) return;
      if (!(await isChatParticipant(payload?.chatId, userId))) return;
      const mins = Math.min(120, Math.max(1, Number(payload.durationMinutes) || 25));
      const endsAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
      const safeLabel =
        typeof payload.label === 'string' && payload.label.trim()
          ? payload.label.trim().slice(0, 60)
          : 'Deep Work Sprint';
      io.to(`chat:${payload.chatId}`).emit('studio:focus-state', {
        chatId: payload.chatId,
        active: true,
        label: safeLabel,
        startedBy: authUser.name || 'Teammate',
        endsAt,
      });
    });

    socket.on('studio:focus-stop', async (payload: { chatId: string }) => {
      if (!allowEvent()) return;
      if (!(await isChatParticipant(payload?.chatId, userId))) return;
      io.to(`chat:${payload.chatId}`).emit('studio:focus-state', {
        chatId: payload.chatId,
        active: false,
      });
    });

    socket.on(
      'studio:walkie-audio',
      async (payload: { chatId: string; audioDataUrl: string; duration: number }) => {
        if (!allowEvent()) return;
        if (!(await isChatParticipant(payload?.chatId, userId))) return;
        if (
          typeof payload.audioDataUrl !== 'string' ||
          !payload.audioDataUrl.startsWith('data:audio/') ||
          !isSafeMediaUrl(payload.audioDataUrl, { allowAudio: true, maxLength: 1_500_000 })
        ) {
          socket.emit('error', { message: 'Unsupported walkie-talkie audio format or size' });
          return;
        }
        const safeDuration = Math.min(60, Math.max(1, Math.round(Number(payload.duration) || 1)));
        socket.to(`chat:${payload.chatId}`).emit('studio:walkie-audio', {
          chatId: payload.chatId,
          senderId: userId,
          senderName: authUser.name || 'Teammate',
          audioDataUrl: payload.audioDataUrl,
          duration: safeDuration,
        });
      }
    );

    socket.on('typing:start', async (payload: { chatId: string }) => {
      if (!allowEvent()) return;
      if (!(await isChatParticipant(payload?.chatId, userId))) return;
      const typingData = {
        chatId: payload.chatId,
        userId,
        user: { _id: authUser._id, name: authUser.name },
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
      if (!allowEvent()) return;
      if (!(await isChatParticipant(payload?.chatId, userId))) return;
      const typingData = {
        chatId: payload.chatId,
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
      if (!allowEvent()) return;
      try {
        if (!(await isChatParticipant(payload?.chatId, userId))) return;
        await ChatService.markAsRead(payload.chatId, userId);
        io.to(`chat:${payload.chatId}`).emit('message:read', {
          chatId: payload.chatId,
          userId,
        });

        const conv = await Conversation.findById(payload.chatId).select('participants');
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
        if (!allowEvent()) return;
        try {
          const parsed = editMessageSchema.parse({ content: payload?.content });
          const msg = await ChatService.editMessage(payload.messageId, userId, parsed.content);
          const targetChatId = msg.chatId.toString();
          io.to(`chat:${targetChatId}`).emit('message:edited', msg);

          const conversation = await Conversation.findById(targetChatId).select('participants');
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
      if (!allowEvent()) return;
      try {
        const msg = await ChatService.deleteMessage(payload.messageId, userId);
        const targetChatId = msg.chatId.toString();
        const conversation = await Conversation.findById(targetChatId).populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: '_id name avatar email isOnline lastSeen isAI' },
        });

        const deletePayload = {
          messageId: (msg._id as any).toString(),
          chatId: targetChatId,
          lastMessage: conversation?.lastMessage || null,
        };
        io.to(`chat:${targetChatId}`).emit('message:deleted', deletePayload);

        if (conversation) {
          for (const pid of conversation.participants) {
            emitToUser(io, pid.toString(), 'message:deleted', deletePayload);
            emitToUser(io, pid.toString(), 'chat:updated', {
              chatId: targetChatId,
              lastMessage: conversation.lastMessage || null,
            });
          }
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:react', async (payload: { messageId: string; emoji: string; chatId: string }) => {
      if (!allowEvent()) return;
      try {
        const msg = await ChatService.reactToMessage(payload.messageId, userId, payload.emoji);
        const targetChatId = msg.chatId.toString();
        const conversation = await Conversation.findById(targetChatId).select('participants');

        const emitPayload = {
          messageId: (msg._id as any).toString(),
          chatId: targetChatId,
          reactions: msg.reactions,
          userId,
          emoji: payload.emoji,
        };

        io.to(`chat:${targetChatId}`).emit('message:reaction', emitPayload);
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
      if (!allowEvent()) return;
      try {
        const { chat, message } = await ChatService.pinMessage(payload.chatId, payload.messageId, userId);
        const targetChatId = chat._id.toString();
        const pinPayload = { chatId: targetChatId, pinnedMessage: message };
        io.to(`chat:${targetChatId}`).emit('chat:pinned', pinPayload);
        for (const pid of chat.participants) {
          emitToUser(io, (pid._id || pid).toString(), 'chat:pinned', pinPayload);
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:unpin', async (payload: { chatId: string }) => {
      if (!allowEvent()) return;
      try {
        const { chat } = await ChatService.unpinMessage(payload.chatId, userId);
        const targetChatId = chat._id.toString();
        const unpinPayload = { chatId: targetChatId };
        io.to(`chat:${targetChatId}`).emit('chat:unpinned', unpinPayload);
        for (const pid of chat.participants) {
          emitToUser(io, (pid._id || pid).toString(), 'chat:unpinned', unpinPayload);
        }
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on(
      'call:initiate',
      async (payload: {
        to: string;
        chatId: string;
        callType: 'video' | 'audio';
        signalData?: unknown;
      }) => {
        if (!allowEvent()) return;
        if (!(await areCallPeers(userId, payload?.to))) return;
        const callType = payload.callType === 'audio' ? 'audio' : 'video';
        emitToUser(io, payload.to, 'call:incoming', {
          to: payload.to,
          chatId: isValidObjectId(payload.chatId) ? payload.chatId : undefined,
          callType,
          callerName: authUser.name,
          callerAvatar: authUser.avatar,
          signalData: payload.signalData,
          from: userId,
        });
      }
    );

    socket.on('call:accept', async (payload: { to: string; chatId: string; signalData?: unknown }) => {
      if (!allowEvent()) return;
      if (!(await areCallPeers(userId, payload?.to))) return;
      emitToUser(io, payload.to, 'call:accepted', {
        to: payload.to,
        chatId: isValidObjectId(payload.chatId) ? payload.chatId : undefined,
        signalData: payload.signalData,
        from: userId,
      });
    });

    socket.on('call:reject', async (payload: { to: string; chatId: string; reason?: string }) => {
      if (!allowEvent()) return;
      if (!(await areCallPeers(userId, payload?.to))) return;
      emitToUser(io, payload.to, 'call:rejected', {
        to: payload.to,
        chatId: isValidObjectId(payload.chatId) ? payload.chatId : undefined,
        reason: typeof payload.reason === 'string' ? payload.reason.slice(0, 80) : undefined,
        from: userId,
      });
    });

    socket.on('call:ice-candidate', async (payload: { to: string; candidate: unknown }) => {
      if (!allowEvent()) return;
      if (!(await areCallPeers(userId, payload?.to))) return;
      emitToUser(io, payload.to, 'call:ice-candidate', {
        candidate: payload.candidate,
        from: userId,
      });
    });

    socket.on('call:end', async (payload: { to: string; chatId?: string }) => {
      if (!allowEvent()) return;
      if (!(await areCallPeers(userId, payload?.to))) return;
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
    });
  });

  return io;
};
