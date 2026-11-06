import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { getIO, emitToUser } from '../sockets/socket.handler';

const broadcastGroupActivity = (chatId: string, updated: any, msg: any) => {
  try {
    const io = getIO();
    if (msg) {
      io.to(`chat:${chatId}`).emit('message:new', msg);
    }
    io.to(`chat:${chatId}`).emit('chat:updated', {
      chatId,
      lastMessage: msg || updated?.lastMessage,
      chat: updated,
    });
    if (updated?.participants) {
      for (const p of updated.participants) {
        const pid = (p._id || p).toString();
        if (msg) emitToUser(io, pid, 'message:new', msg);
        emitToUser(io, pid, 'chat:updated', {
          chatId,
          lastMessage: msg || updated?.lastMessage,
          chat: updated,
        });
      }
    }
  } catch {}
};

export class ChatController {
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chats = await ChatService.getConversations(_id);
      sendSuccess(res, { chats });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async createChat(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const { isGroup, participantId, groupName, groupDescription, participants } = req.body;

      let chat: any;
      let initialMsg: any = null;
      if (isGroup) {
        const result = await ChatService.createGroup(_id, groupName, participants, groupDescription);
        chat = result.chat;
        initialMsg = result.message;
      } else {
        chat = await ChatService.createOrGetDirect(_id, participantId);
      }

      try {
        const io = getIO();
        chat?.participants?.forEach((p: any) => {
          const pid = p._id ? p._id.toString() : p.toString();
          emitToUser(io, pid, 'chat:new', chat);
          io.to(`user:${pid}`).emit('chat:new', chat);
          if (initialMsg) {
            emitToUser(io, pid, 'message:new', initialMsg);
          }
        });
      } catch {}

      sendSuccess(res, { chat }, 'Chat created', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chat = await ChatService.getConversation(req.params['chatId']!, _id);
      sendSuccess(res, { chat });
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  }

  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const page = parseInt((req.query['page'] as string) || '1', 10);
      const limit = parseInt((req.query['limit'] as string) || '50', 10);
      const messages = await ChatService.getMessages(req.params['chatId']!, _id, page, limit);
      sendSuccess(res, { messages });
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { content, image, replyTo, isForwarded, audio, audioDuration } = req.body;
      const msg = await ChatService.sendMessage(
        chatId,
        _id,
        content ?? '',
        image,
        replyTo,
        isForwarded,
        audio,
        audioDuration
      );

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('message:new', msg);
      } catch {}

      sendSuccess(res, { message: msg }, 'Message sent', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async editMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const msg = await ChatService.editMessage(req.params['messageId']!, _id, req.body.content);
      
      try {
        const io = getIO();
        io.to(`chat:${(msg.chatId as any).toString()}`).emit('message:edited', msg);
      } catch {}

      sendSuccess(res, { message: msg }, 'Message edited');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const msg = await ChatService.deleteMessage(req.params['messageId']!, _id);

      try {
        const io = getIO();
        io.to(`chat:${(msg.chatId as any).toString()}`).emit('message:deleted', {
          messageId: (msg._id as any).toString(),
          chatId: (msg.chatId as any).toString(),
        });
      } catch {}

      sendSuccess(res, null, 'Message deleted');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async reactToMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const { emoji, chatId } = req.body;
      if (!emoji) {
        sendError(res, 'Emoji is required', 400);
        return;
      }
      const msg = await ChatService.reactToMessage(req.params['messageId']!, _id, emoji);

      try {
        const io = getIO();
        const emitPayload = {
          messageId: (msg._id as any).toString(),
          chatId: chatId || (msg.chatId as any).toString(),
          reactions: msg.reactions,
          userId: _id,
          emoji,
        };
        io.to(`chat:${(msg.chatId as any).toString()}`).emit('message:reaction', emitPayload);
      } catch {}

      sendSuccess(res, { reactions: msg.reactions }, 'Reaction updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      await ChatService.markAsRead(chatId, _id);

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('message:read', { chatId, userId: _id });
      } catch {}

      sendSuccess(res, null, 'Messages marked as read');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      await ChatService.deleteGroup(chatId, _id);

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('chat:deleted', { chatId });
      } catch {}

      sendSuccess(res, null, 'Group deleted');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat: updated, message: msg } = await ChatService.addMember(chatId, _id, req.body.userId);

      broadcastGroupActivity(chatId, updated, msg);
      sendSuccess(res, { chat: updated, message: msg }, 'Member added');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat: updated, message: msg } = await ChatService.removeMember(chatId, _id, req.params['userId']!);

      broadcastGroupActivity(chatId, updated, msg);
      sendSuccess(res, { chat: updated, message: msg }, 'Member removed');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async promoteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat: updated, message: msg } = await ChatService.promoteAdmin(chatId, _id, req.params['userId']!);

      broadcastGroupActivity(chatId, updated, msg);
      sendSuccess(res, { chat: updated, message: msg }, 'Admin privileges granted');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async demoteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat: updated, message: msg } = await ChatService.demoteAdmin(chatId, _id, req.params['userId']!);

      broadcastGroupActivity(chatId, updated, msg);
      sendSuccess(res, { chat: updated, message: msg }, 'Admin privileges revoked');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async leaveGroup(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat: updated, message: msg } = await ChatService.leaveGroup(chatId, _id);

      broadcastGroupActivity(chatId, updated, msg);
      sendSuccess(res, { chat: updated, message: msg }, 'Left group');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat, message: msg } = await ChatService.updateGroup(chatId, _id, req.body);

      broadcastGroupActivity(chatId, chat, msg);
      sendSuccess(res, { chat, message: msg }, 'Group updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async pinMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const messageId = req.params['messageId']!;
      const { chat, message } = await ChatService.pinMessage(chatId, messageId, _id);

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('chat:pinned', { chatId, pinnedMessage: message });
        chat.participants.forEach((p: any) => {
          emitToUser(io, (p._id || p).toString(), 'chat:pinned', { chatId, pinnedMessage: message });
        });
      } catch {}

      sendSuccess(res, { chat, message }, 'Message pinned');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async unpinMessage(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const chatId = req.params['chatId']!;
      const { chat } = await ChatService.unpinMessage(chatId, _id);

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('chat:unpinned', { chatId });
        chat.participants.forEach((p: any) => {
          emitToUser(io, (p._id || p).toString(), 'chat:unpinned', { chatId });
        });
      } catch {}

      sendSuccess(res, { chat }, 'Message unpinned');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }
}
