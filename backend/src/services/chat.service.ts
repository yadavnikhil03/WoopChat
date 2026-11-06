import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { isValidObjectId } from '../utils/database.util';

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

export class ChatService {
  static async getConversations(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');

    const conversations = await Conversation.find({
      participants: new Types.ObjectId(userId),
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE)
      .populate(PINNED_MSG_POPULATE)
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          chatId: conv._id,
          sender: { $ne: new Types.ObjectId(userId) },
          readBy: { $nin: [new Types.ObjectId(userId)] },
          isDeleted: false,
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
    if (userId === participantId)
      throw new Error('Cannot create chat with yourself');

    const other = await User.findById(participantId);
    if (!other) throw new Error('User not found');

    const currentUser = await User.findById(userId);
    if (currentUser?.blockedUsers.some((id) => id.equals(participantId))) {
      throw new Error('You have blocked this user');
    }

    const existing = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [
          new Types.ObjectId(userId),
          new Types.ObjectId(participantId),
        ],
        $size: 2,
      },
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate(LAST_MSG_POPULATE);

    if (existing) return existing;

    const conv = await Conversation.create({
      isGroup: false,
      participants: [
        new Types.ObjectId(userId),
        new Types.ObjectId(participantId),
      ],
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

  static async getMessages(
    chatId: string,
    userId: string,
    page = 1,
    limit = 50
  ) {
    if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
      throw new Error('Invalid conversation ID');
    }
    const conv = await Conversation.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    if (!conv) throw new Error('Conversation not found or access denied');

    const skip = (page - 1) * limit;
    const messages = await Message.find({
      chatId: new Types.ObjectId(chatId),
      isDeleted: false,
    })
      .populate('sender', PARTICIPANT_SELECT)
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: PARTICIPANT_SELECT },
      })
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit);

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
    audioDuration?: number
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
      if (recipientId && !content?.startsWith('🚫') && !content?.startsWith('✅')) {
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

    const validReplyTo =
      replyTo && Types.ObjectId.isValid(replyTo) ? new Types.ObjectId(replyTo) : null;

    const msg = await Message.create({
      chatId: new Types.ObjectId(chatId),
      sender: new Types.ObjectId(senderId),
      content: content ?? '',
      image: image ?? null,
      audio: audio ?? null,
      audioDuration: typeof audioDuration === 'number' ? audioDuration : 0,
      replyTo: validReplyTo,
      isForwarded: Boolean(isForwarded),
      status: 'sent',
      readBy: [new Types.ObjectId(senderId)],
    });

    await Conversation.findByIdAndUpdate(chatId, {
      lastMessage: msg._id,
      updatedAt: new Date(),
    });

    await msg.populate('sender', PARTICIPANT_SELECT);
    if (validReplyTo) {
      await msg.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: PARTICIPANT_SELECT },
      });
    }

    return msg;
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
    const msg = await Message.findById(messageId);
    if (!msg || msg.isDeleted) throw new Error('Message not found');

    if (!msg.reactions) {
      msg.reactions = [];
    }

    const uId = new Types.ObjectId(userId);
    let reactionGroup = msg.reactions.find((r) => r.emoji === emoji);

    if (reactionGroup) {
      const userIndex = reactionGroup.users.findIndex((u: any) => u.toString() === userId);
      if (userIndex > -1) {
        reactionGroup.users.splice(userIndex, 1);
        if (reactionGroup.users.length === 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        reactionGroup.users.push(uId);
      }
    } else {
      msg.reactions.push({
        emoji,
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
    await Message.updateMany(
      {
        chatId: new Types.ObjectId(chatId),
        sender: { $ne: new Types.ObjectId(userId) },
        readBy: { $nin: [new Types.ObjectId(userId)] },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
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
    const content = `👤 ${adminUser?.name || 'Admin'} added ${memberUser?.name || 'a new member'} to the group`;

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
    const adminUser = await User.findById(adminId);
    let content = '';
    if (updates.groupName) {
      content = `✏️ ${adminUser?.name || 'Admin'} changed group name to "${updates.groupName}"`;
    } else if (updates.groupDescription) {
      content = `✏️ ${adminUser?.name || 'Admin'} updated group description`;
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

    const setFields: Record<string, any> = { ...updates };
    if (msg) setFields['lastMessage'] = msg._id;

    const conv = await Conversation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(chatId),
        isGroup: true,
        $or: [
          { admins: new Types.ObjectId(adminId) },
          { createdBy: new Types.ObjectId(adminId) },
        ],
      },
      { $set: setFields },
      { new: true }
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
