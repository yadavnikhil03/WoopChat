import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { isValidObjectId } from '../utils/database.util';
import { AIService } from './ai.service';

const PARTICIPANT_SELECT = '_id name email avatar status isOnline lastSeen';
const LAST_MSG_POPULATE = {
  path: 'lastMessage',
  populate: { path: 'sender', select: PARTICIPANT_SELECT },
};
const PINNED_MSG_POPULATE = {
  path: 'pinnedMessage',
  populate: [
    { path: 'sender', select: PARTICIPANT_SELECT },
    { path: 'pinnedBy', select: PARTICIPANT_SELECT },
  ],
};

export interface SendMessageOptions {
  messageType?: 'text' | 'poll' | 'code' | 'digest' | 'ai_copilot' | 'whisper';
  poll?: {
    question: string;
    options: Array<{ id: string; text: string }>;
    allowMultiple?: boolean;
  } | null;
  codeBlock?: {
    language?: string;
    title?: string;
    code: string;
  } | null;
  digest?: {
    title: string;
    subtitle?: string;
    highlights: string[];
    messageCount?: number;
    participantCount?: number;
  } | null;
  isAICopilot?: boolean;
  whisperTo?: string[];
  ephemeralSeconds?: number | null;
  scheduledFor?: string | null;
}

export class ChatService {
  static async getConversations(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const uid = new Types.ObjectId(userId);
    const now = new Date();

    const conversations = await Conversation.find({
      participants: uid,
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .populate(PINNED_MSG_POPULATE)
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          chatId: conv._id,
          sender: { $ne: uid },
          readBy: { $nin: [uid] },
          isDeleted: false,
          isScheduledPending: { $ne: true },
          $and: [
            { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
            {
              $or: [
                { whisperTo: { $exists: false } },
                { whisperTo: { $size: 0 } },
                { whisperTo: uid },
              ],
            },
          ],
        });
        const obj: any = conv.toObject();
        obj.unreadCount = unreadCount;
        return obj;
      })
    );

    return conversationsWithUnread;
  }

  static async createOrGetDirect(userId: string, participantId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(participantId)) {
      throw new Error('Invalid user ID');
    }
    if (userId === participantId) {
      throw new Error('Cannot create chat with yourself');
    }

    const other = await User.findById(participantId);
    if (!other) throw new Error('User not found');

    const currentUser = await User.findById(userId);
    if (currentUser?.blockedUsers.some((id) => id.equals(participantId))) {
      throw new Error('You have blocked this user');
    }

    const existing = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(participantId)],
        $size: 2,
      },
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);

    if (existing) return existing;

    const conv = await Conversation.create({
      isGroup: false,
      participants: [new Types.ObjectId(userId), new Types.ObjectId(participantId)],
      admins: [],
      createdBy: new Types.ObjectId(userId),
    });

    return conv.populate('participants', PARTICIPANT_SELECT);
  }

  static async createGroup(
    userId: string,
    groupName: string,
    participantIds: string[],
    groupDescription?: string
  ) {
    if (!isValidObjectId(userId) || participantIds.some((id) => !isValidObjectId(id))) {
      throw new Error('Invalid user ID');
    }
    const uniqueIds = [...new Set([userId, ...participantIds])];
    const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));

    const existingUsersCount = await User.countDocuments({ _id: { $in: objectIds } });
    if (existingUsersCount !== objectIds.length) {
      throw new Error('One or more selected participants do not exist');
    }

    const creatorUser = await User.findById(userId);

    const conv = await Conversation.create({
      isGroup: true,
      groupName: groupName.trim(),
      groupDescription: groupDescription?.trim() ?? '',
      participants: objectIds,
      admins: [new Types.ObjectId(userId)],
      createdBy: new Types.ObjectId(userId),
    });

    const welcomeMsg = await Message.create({
      chatId: conv._id,
      sender: new Types.ObjectId(userId),
      content: `🎉 ${creatorUser?.name || 'Admin'} created group "${groupName.trim()}"`,
      status: 'read',
      readBy: [new Types.ObjectId(userId)],
    });

    conv.lastMessage = welcomeMsg._id as any;
    await conv.save();

    await conv.populate('participants', PARTICIPANT_SELECT);
    await conv.populate(LAST_MSG_POPULATE);
    await welcomeMsg.populate('sender', PARTICIPANT_SELECT);

    return { chat: conv, message: welcomeMsg };
  }

  static async getConversation(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid conversation ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .populate(PINNED_MSG_POPULATE);

    if (!conv) throw new Error('Conversation not found or access denied');
    return conv;
  }

  static async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid conversation ID');
    }
    const uid = new Types.ObjectId(userId);
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: uid,
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 50;

    const now = new Date();
    const skip = (safePage - 1) * safeLimit;
    const messages = await Message.find({
      chatId: new Types.ObjectId(chatId),
      isDeleted: false,
      isScheduledPending: { $ne: true },
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $or: [
            { whisperTo: { $exists: false } },
            { whisperTo: { $size: 0 } },
            { whisperTo: uid },
            { sender: uid },
          ],
        },
      ],
    })
      .populate('sender', PARTICIPANT_SELECT)
      .populate('whisperTo', PARTICIPANT_SELECT)
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: PARTICIPANT_SELECT },
      })
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(safeLimit);

    return messages;
  }

  static async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    image?: string,
    replyTo?: string,
    isForwarded?: boolean,
    audio?: string,
    audioDuration?: number,
    options?: SendMessageOptions
  ) {
    if (!isValidObjectId(chatId) || !isValidObjectId(senderId)) {
      throw new Error('Invalid conversation ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(senderId),
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    if (!conv.isGroup) {
      const recipientId = conv.participants.find(
        (p) => p.toString() !== senderId.toString()
      );
      if (recipientId) {
        const [sender, recipient] = await Promise.all([
          User.findById(senderId).select('blockedUsers'),
          User.findById(recipientId).select('blockedUsers'),
        ]);

        if (sender?.blockedUsers?.some((id) => id.equals(recipientId))) {
          throw new Error('You have blocked this contact. Unblock to send messages.');
        }
        if (recipient?.blockedUsers?.some((id) => id.equals(senderId))) {
          throw new Error('You cannot send messages to this contact.');
        }
      }
    }

    let validReplyTo: Types.ObjectId | null = null;
    if (replyTo && isValidObjectId(replyTo)) {
      const targetReply = await Message.findOne({
        _id: new Types.ObjectId(replyTo),
        chatId: conv._id,
        isDeleted: false,
      }).select('_id whisperTo sender');
      if (!targetReply) {
        throw new Error('Replied message not found in this conversation');
      }
      const isWhisperRestricted =
        Array.isArray(targetReply.whisperTo) &&
        targetReply.whisperTo.length > 0 &&
        targetReply.sender.toString() !== senderId &&
        !targetReply.whisperTo.some((w) => w.toString() === senderId);
      if (isWhisperRestricted) {
        throw new Error('Cannot reply to a private whisper');
      }
      validReplyTo = targetReply._id as Types.ObjectId;
    }

    const participantSet = new Set(conv.participants.map((p) => p.toString()));
    const whisperObjectIds = Array.isArray(options?.whisperTo)
      ? [...new Set(options!.whisperTo)]
          .filter((id) => isValidObjectId(id) && participantSet.has(id.toString()))
          .map((id) => new Types.ObjectId(id))
      : [];

    const ephemeralSeconds =
      typeof options?.ephemeralSeconds === 'number' &&
      options.ephemeralSeconds >= 5 &&
      options.ephemeralSeconds <= 86400
        ? Math.floor(options.ephemeralSeconds)
        : null;
    const expiresAt = ephemeralSeconds
      ? new Date(Date.now() + ephemeralSeconds * 1000)
      : null;

    const scheduledDate = options?.scheduledFor ? new Date(options.scheduledFor) : null;
    const isScheduledPending = Boolean(
      scheduledDate && !isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now() + 2000
    );

    let resolvedType = options?.messageType || 'text';
    if (options?.poll) resolvedType = 'poll';
    else if (options?.codeBlock) resolvedType = 'code';
    else if (options?.digest) resolvedType = 'digest';
    else if (options?.isAICopilot) resolvedType = 'ai_copilot';
    else if (whisperObjectIds.length > 0) resolvedType = 'whisper';

    const formattedPoll = options?.poll
      ? {
          question: options.poll.question,
          allowMultiple: Boolean(options.poll.allowMultiple),
          options: options.poll.options.map((o) => ({
            id: o.id,
            text: o.text,
            votes: [],
          })),
        }
      : null;

    const formattedCode = options?.codeBlock
      ? {
          language: options.codeBlock.language || 'typescript',
          title: options.codeBlock.title || '',
          code: options.codeBlock.code,
        }
      : null;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(senderId),
      content: content ?? '',
      messageType: resolvedType,
      image: image ?? null,
      audio: audio ?? null,
      audioDuration: typeof audioDuration === 'number' ? audioDuration : 0,
      replyTo: validReplyTo,
      isForwarded: Boolean(isForwarded),
      poll: formattedPoll,
      codeBlock: formattedCode,
      digest: options?.digest ?? null,
      isAICopilot: Boolean(options?.isAICopilot),
      whisperTo: whisperObjectIds,
      ephemeralSeconds,
      expiresAt,
      scheduledFor: isScheduledPending ? scheduledDate : null,
      isScheduledPending,
      status: 'sent',
      readBy: [new Types.ObjectId(senderId)],
    });

    if (!isScheduledPending && whisperObjectIds.length === 0) {
      await Conversation.findByIdAndUpdate(chatId, {
        lastMessage: msg._id,
        updatedAt: new Date(),
      });
    }

    await msg.populate('sender', PARTICIPANT_SELECT);
    if (whisperObjectIds.length > 0) {
      await msg.populate('whisperTo', PARTICIPANT_SELECT);
    }
    if (validReplyTo) {
      await msg.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: PARTICIPANT_SELECT },
      });
    }

    return msg;
  }

  static async votePoll(messageId: string, userId: string, optionId: string) {
    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const msg = await Message.findById(messageId);
    if (
      !msg ||
      msg.isDeleted ||
      msg.isScheduledPending ||
      (msg.expiresAt && msg.expiresAt <= new Date()) ||
      !msg.poll
    ) {
      throw new Error('Poll not found');
    }

    const conv = await Conversation.findOne({
      _id: msg.chatId,
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Access denied');

    if (
      msg.whisperTo &&
      msg.whisperTo.length > 0 &&
      msg.sender.toString() !== userId &&
      !msg.whisperTo.some((w) => w.toString() === userId)
    ) {
      throw new Error('Access denied');
    }

    const uid = new Types.ObjectId(userId);
    const targetOption = msg.poll.options.find((o) => o.id === optionId);
    if (!targetOption) throw new Error('Poll option not found');

    const alreadyVoted = targetOption.votes.some((v) => v.toString() === userId);

    if (!msg.poll.allowMultiple) {
      for (const opt of msg.poll.options) {
        opt.votes = opt.votes.filter((v) => v.toString() !== userId);
      }
    }

    if (alreadyVoted) {
      targetOption.votes = targetOption.votes.filter((v) => v.toString() !== userId);
    } else {
      targetOption.votes.push(uid);
    }

    msg.markModified('poll');
    await msg.save();
    await msg.populate('sender', PARTICIPANT_SELECT);
    return msg;
  }

  static async triggerInlineCopilot(chatId: string, userId: string, prompt: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    const now = new Date();
    const uid = new Types.ObjectId(userId);
    const recentDocs = await Message.find({
      chatId: new Types.ObjectId(chatId),
      isDeleted: false,
      isScheduledPending: { $ne: true },
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $or: [
            { whisperTo: { $exists: false } },
            { whisperTo: { $size: 0 } },
            { whisperTo: uid },
            { sender: uid },
          ],
        },
      ],
    })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(25);

    const contextList = recentDocs.reverse().map((m: any) => ({
      senderName: m.isAICopilot ? 'WhopAI' : m.sender?.name || 'Member',
      content: m.content || (m.poll ? `Poll: ${m.poll.question}` : ''),
      createdAt: m.createdAt,
    }));

    const aiReply = await AIService.generateInlineCopilot(prompt, contextList);

    return ChatService.sendMessage(
      chatId,
      userId,
      aiReply,
      undefined,
      undefined,
      false,
      undefined,
      0,
      {
        messageType: 'ai_copilot',
        isAICopilot: true,
      }
    );
  }

  static async createDigest(chatId: string, userId: string, publishToChat = false) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    }).populate('participants', PARTICIPANT_SELECT);
    if (!conv) throw new Error('Conversation not found or access denied');

    const now = new Date();
    const recentDocs = await Message.find({
      chatId: new Types.ObjectId(chatId),
      isDeleted: false,
      isScheduledPending: { $ne: true },
      messageType: { $nin: ['digest', 'whisper'] },
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ whisperTo: { $exists: false } }, { whisperTo: { $size: 0 } }] },
      ],
    })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(40);

    const ordered = recentDocs.reverse();
    const meaningful = ordered.filter(
      (m: any) =>
        m.content &&
        m.content.trim().length > 3 &&
        !['👤', '🚫', '🚪', '🛡️', '✏️', '🎉', 'ℹ️'].some((p) => m.content.startsWith(p))
    );

    const highlights = meaningful
      .slice(-5)
      .map((m: any) => `${m.sender?.name || 'Member'}: "${m.content.slice(0, 120)}${m.content.length > 120 ? '...' : ''}"`);

    const title = conv.isGroup
      ? `${conv.groupName || 'Channel'} — Edition Digest`
      : 'Conversation Edition Digest';
    const subtitle = `Curated snapshot of the latest ${ordered.length} dispatches across ${conv.participants.length} participants.`;

    const digestData = {
      title,
      subtitle,
      highlights: highlights.length > 0 ? highlights : ['No conversation highlights captured yet.'],
      messageCount: ordered.length,
      participantCount: conv.participants.length,
    };

    if (!publishToChat) {
      return { digest: digestData, message: null };
    }

    const msg = await ChatService.sendMessage(
      chatId,
      userId,
      `📰 ${digestData.title}`,
      undefined,
      undefined,
      false,
      undefined,
      0,
      {
        messageType: 'digest',
        digest: digestData,
      }
    );

    return { digest: digestData, message: msg };
  }

  static async getScheduledMessages(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    return Message.find({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(userId),
      isScheduledPending: true,
      isDeleted: false,
    }).sort({ scheduledFor: 1 });
  }

  static async cancelScheduledMessage(messageId: string, userId: string) {
    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const deleted = await Message.findOneAndDelete({
      _id: new Types.ObjectId(messageId),
      sender: new Types.ObjectId(userId),
      isScheduledPending: true,
    });
    if (!deleted) throw new Error('Scheduled message not found');
    return deleted;
  }

  static async processDueScheduledMessages() {
    const now = new Date();
    const dueMessages = await Message.find({
      isScheduledPending: true,
      isDeleted: false,
      scheduledFor: { $lte: now },
    });

    if (dueMessages.length === 0) return [];

    const results: Array<{ message: any; participants: string[]; chatId: string }> = [];

    for (const msg of dueMessages) {
      msg.isScheduledPending = false;
      msg.scheduledFor = null;
      await msg.save();

      await msg.populate('sender', PARTICIPANT_SELECT);
      if (msg.whisperTo && msg.whisperTo.length > 0) {
        await msg.populate('whisperTo', PARTICIPANT_SELECT);
      }

      const conv = await Conversation.findById(msg.chatId).select('participants');
      if (conv) {
        if (!msg.whisperTo || msg.whisperTo.length === 0) {
          await Conversation.findByIdAndUpdate(msg.chatId, {
            lastMessage: msg._id,
            updatedAt: new Date(),
          });
        }
        results.push({
          message: msg,
          chatId: msg.chatId.toString(),
          participants: conv.participants.map((p) => p.toString()),
        });
      }
    }

    return results;
  }

  static async editMessage(messageId: string, userId: string, content: string) {
    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid message ID');
    }
    const msg = await Message.findOne({
      _id: new Types.ObjectId(messageId),
      sender: new Types.ObjectId(userId),
      isDeleted: false,
    });
    if (!msg) throw new Error('Message not found or permission denied');

    msg.content = content;
    msg.isEdited = true;
    await msg.save();
    await msg.populate('sender', PARTICIPANT_SELECT);
    return msg;
  }

  static async deleteMessage(messageId: string, userId: string) {
    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid message ID');
    }
    const msg = await Message.findOne({
      _id: new Types.ObjectId(messageId),
      sender: new Types.ObjectId(userId),
    });
    if (!msg) throw new Error('Message not found or permission denied');

    msg.isDeleted = true;
    msg.content = '';
    await msg.save();

    const conv = await Conversation.findById(msg.chatId);
    if (conv && conv.lastMessage?.toString() === messageId) {
      const prevMsg = await Message.findOne({
        chatId: conv._id,
        isDeleted: false,
        isScheduledPending: { $ne: true },
      })
        .populate('sender', PARTICIPANT_SELECT)
        .sort({ createdAt: -1 });

      conv.lastMessage = prevMsg ? (prevMsg._id as any) : null;
      await conv.save();
    }

    return msg;
  }

  static async reactToMessage(messageId: string, userId: string, emoji: string) {
    if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid message ID');
    }
    if (typeof emoji !== 'string' || !emoji.trim() || emoji.trim().length > 16) {
      throw new Error('Invalid reaction emoji');
    }
    const cleanEmoji = emoji.trim();
    const msg = await Message.findById(messageId);
    if (!msg || msg.isDeleted || msg.isScheduledPending || (msg.expiresAt && msg.expiresAt <= new Date())) {
      throw new Error('Message not found');
    }

    const uId = new Types.ObjectId(userId);
    const isMember = await Conversation.exists({
      _id: msg.chatId,
      participants: uId,
    });
    if (!isMember) throw new Error('Access denied');

    if (
      msg.whisperTo &&
      msg.whisperTo.length > 0 &&
      msg.sender.toString() !== userId &&
      !msg.whisperTo.some((w) => w.toString() === userId)
    ) {
      throw new Error('Access denied');
    }

    if (!msg.reactions) {
      msg.reactions = [];
    }

    const reactionGroup = msg.reactions.find((r) => r.emoji === cleanEmoji);

    if (reactionGroup) {
      const userIndex = reactionGroup.users.findIndex((u: any) => u.toString() === userId);
      if (userIndex > -1) {
        reactionGroup.users.splice(userIndex, 1);
        if (reactionGroup.users.length === 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== cleanEmoji);
        }
      } else {
        reactionGroup.users.push(uId);
      }
    } else {
      if (msg.reactions.length >= 30) {
        throw new Error('Reaction limit reached for this message');
      }
      msg.reactions.push({
        emoji: cleanEmoji,
        users: [uId],
      });
    }

    await msg.save();
    return msg;
  }

  static async markAsRead(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid conversation ID');
    }
    const uid = new Types.ObjectId(userId);
    const isMember = await Conversation.exists({
      _id: new Types.ObjectId(chatId),
      participants: uid,
    });
    if (!isMember) throw new Error('Conversation not found or access denied');

    await Message.updateMany(
      {
        chatId: new Types.ObjectId(chatId),
        sender: { $ne: uid },
        readBy: { $nin: [uid] },
        isScheduledPending: { $ne: true },
        $or: [
          { whisperTo: { $exists: false } },
          { whisperTo: { $size: 0 } },
          { whisperTo: uid },
        ],
      },
      {
        $addToSet: { readBy: uid },
        $set: { status: 'read' },
      }
    );
  }

  static async deleteGroup(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid conversation ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(userId) },
        { createdBy: new Types.ObjectId(userId) },
      ],
    });
    if (!conv) throw new Error('Group not found or permission denied');

    await Message.deleteMany({ chatId: new Types.ObjectId(chatId) });
    await Conversation.findByIdAndDelete(chatId);
  }

  static async addMember(chatId: string, adminId: string, memberId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(adminId) || !isValidObjectId(memberId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(adminId) },
        { createdBy: new Types.ObjectId(adminId) },
      ],
    });
    if (!conv) throw new Error('Group not found or permission denied');

    const adminUser = await User.findById(adminId);
    const memberUser = await User.findById(memberId);
    if (!memberUser) throw new Error('User not found');
    const content = `👤 ${adminUser?.name || 'Admin'} added ${memberUser.name} to the group`;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(adminId),
      content,
      status: 'read',
    });
    await msg.populate('sender', PARTICIPANT_SELECT);

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { participants: new Types.ObjectId(memberId) },
        $set: { lastMessage: msg._id },
      },
      { new: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);
    return { chat: updated, message: msg };
  }

  static async removeMember(chatId: string, adminId: string, memberId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(adminId) || !isValidObjectId(memberId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(adminId) },
        { createdBy: new Types.ObjectId(adminId) },
      ],
    });
    if (!conv) throw new Error('Group not found or permission denied');
    if (conv.createdBy.toString() === memberId) {
      throw new Error('Cannot remove the group owner');
    }
    if (adminId === memberId) {
      throw new Error('Admins should use leave or delete group');
    }

    const adminUser = await User.findById(adminId);
    const memberUser = await User.findById(memberId);
    const content = `🚫 ${adminUser?.name || 'Admin'} removed ${memberUser?.name || 'a member'} from the group`;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(adminId),
      content,
      status: 'read',
    });
    await msg.populate('sender', PARTICIPANT_SELECT);

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $pull: {
          participants: new Types.ObjectId(memberId),
          admins: new Types.ObjectId(memberId),
        },
        $set: { lastMessage: msg._id },
      },
      { new: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);
    return { chat: updated, message: msg };
  }

  static async promoteAdmin(chatId: string, adminId: string, memberId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(adminId) || !isValidObjectId(memberId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(adminId) },
        { createdBy: new Types.ObjectId(adminId) },
      ],
    });
    if (!conv) throw new Error('Group not found or permission denied');

    const adminUser = await User.findById(adminId);
    const memberUser = await User.findById(memberId);
    const content = `🛡️ ${adminUser?.name || 'Admin'} made ${memberUser?.name || 'a member'} a group admin`;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(adminId),
      content,
      status: 'read',
    });
    await msg.populate('sender', PARTICIPANT_SELECT);

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { admins: new Types.ObjectId(memberId) },
        $set: { lastMessage: msg._id },
      },
      { new: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);
    return { chat: updated, message: msg };
  }

  static async demoteAdmin(chatId: string, adminId: string, memberId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(adminId) || !isValidObjectId(memberId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(adminId) },
        { createdBy: new Types.ObjectId(adminId) },
      ],
    });
    if (!conv) throw new Error('Group not found or permission denied');
    if (conv.createdBy.toString() === memberId) {
      throw new Error('Cannot demote the group owner');
    }

    const adminUser = await User.findById(adminId);
    const memberUser = await User.findById(memberId);
    const content = `🛡️ ${adminUser?.name || 'Admin'} dismissed ${memberUser?.name || 'a member'} as group admin`;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(adminId),
      content,
      status: 'read',
    });
    await msg.populate('sender', PARTICIPANT_SELECT);

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $pull: { admins: new Types.ObjectId(memberId) },
        $set: { lastMessage: msg._id },
      },
      { new: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);
    return { chat: updated, message: msg };
  }

  static async leaveGroup(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Group not found or you are not a member');

    const user = await User.findById(userId);
    const content = `🚪 ${user?.name || 'A member'} left the group`;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(userId),
      content,
      status: 'read',
    });
    await msg.populate('sender', PARTICIPANT_SELECT);

    let nextCreatedBy = conv.createdBy;
    if (conv.createdBy.toString() === userId) {
      const remaining = conv.participants.filter((p) => p.toString() !== userId);
      if (remaining.length === 0) {
        await Message.deleteMany({ chatId: new Types.ObjectId(chatId) });
        await Conversation.findByIdAndDelete(chatId);
        return { chat: null, message: msg };
      }
      nextCreatedBy = (conv.admins.find((a) => a.toString() !== userId) || remaining[0]) as any;
    }

    const updated = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $pull: {
          participants: new Types.ObjectId(userId),
          admins: new Types.ObjectId(userId),
        },
        $set: { createdBy: nextCreatedBy, lastMessage: msg._id },
      },
      { new: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);
    return { chat: updated, message: msg };
  }

  static async updateGroup(
    chatId: string,
    adminId: string,
    updates: { groupName?: string; groupDescription?: string; groupAvatar?: string }
  ) {
    if (!isValidObjectId(chatId) || !isValidObjectId(adminId)) {
      throw new Error('Invalid ID');
    }

    const existingConv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      isGroup: true,
      $or: [
        { admins: new Types.ObjectId(adminId) },
        { createdBy: new Types.ObjectId(adminId) },
      ],
    });
    if (!existingConv) throw new Error('Group not found or permission denied');

    const safeUpdates: Record<string, string> = {};
    if (typeof updates.groupName === 'string' && updates.groupName.trim()) {
      safeUpdates['groupName'] = updates.groupName.trim();
    }
    if (typeof updates.groupDescription === 'string') {
      safeUpdates['groupDescription'] = updates.groupDescription.trim();
    }
    if (typeof updates.groupAvatar === 'string') {
      safeUpdates['groupAvatar'] = updates.groupAvatar;
    }

    const adminUser = await User.findById(adminId);
    let content = '';
    if (safeUpdates['groupName']) {
      content = `✏️ ${adminUser?.name || 'Admin'} changed group name to "${safeUpdates['groupName']}"`;
    } else if (safeUpdates['groupDescription'] !== undefined) {
      content = `✏️ ${adminUser?.name || 'Admin'} updated group description`;
    } else if (safeUpdates['groupAvatar'] !== undefined) {
      content = `🖼️ ${adminUser?.name || 'Admin'} updated group avatar`;
    }

    let msg = null;
    if (content) {
      msg = await Message.create({
        chatId: new Types.ObjectId(chatId),
        sender: new Types.ObjectId(adminId),
        content,
        status: 'read',
      });
      await msg.populate('sender', PARTICIPANT_SELECT);
    }

    const setFields: Record<string, any> = { ...safeUpdates };
    if (msg) setFields['lastMessage'] = msg._id;

    const conv = await Conversation.findByIdAndUpdate(
      existingConv._id,
      { $set: setFields },
      { new: true, runValidators: true }
    )
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);

    if (!conv) throw new Error('Group not found or permission denied');
    return { chat: conv, message: msg };
  }

  static async pinMessage(chatId: string, messageId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(messageId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    const msg = await Message.findOne({
      _id: new Types.ObjectId(messageId),
      chatId: new Types.ObjectId(chatId),
      isDeleted: false,
    });
    if (!msg) throw new Error('Message not found');

    await Message.updateMany(
      { chatId: new Types.ObjectId(chatId), isPinned: true },
      { $set: { isPinned: false, pinnedBy: null, pinnedAt: null } }
    );

    msg.isPinned = true;
    msg.pinnedBy = new Types.ObjectId(userId) as any;
    msg.pinnedAt = new Date();
    await msg.save();
    await msg.populate('pinnedBy', PARTICIPANT_SELECT);
    await msg.populate('sender', PARTICIPANT_SELECT);

    conv.pinnedMessage = msg._id as any;
    await conv.save();
    await conv.populate(PINNED_MSG_POPULATE);
    await conv.populate('participants', PARTICIPANT_SELECT);

    return { chat: conv, message: msg };
  }

  static async unpinMessage(chatId: string, userId: string) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    await Message.updateMany(
      { chatId: new Types.ObjectId(chatId), isPinned: true },
      { $set: { isPinned: false, pinnedBy: null, pinnedAt: null } }
    );

    conv.pinnedMessage = null as any;
    await conv.save();
    await conv.populate('participants', PARTICIPANT_SELECT);

    return { chat: conv };
  }
}
