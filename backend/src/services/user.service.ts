import { Types } from 'mongoose';
import { User } from '../models/User';
import { isValidObjectId } from '../utils/database.util';
import { escapeRegex, isSafeMediaUrl } from '../utils/sanitize.util';

export class UserService {
  static async getProfile(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const user = await User.findById(userId).select('-password -blockedUsers');
    if (!user) throw new Error('User not found');
    return user;
  }

  static async searchUsers(query: string, currentUserId: string) {
    if (!isValidObjectId(currentUserId)) throw new Error('Invalid user ID');
    const escaped = escapeRegex(typeof query === 'string' ? query : '');
    if (!escaped) {
      return UserService.getAllUsers(currentUserId);
    }
    const regex = new RegExp(escaped, 'i');
    const users = await User.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('_id name email avatar status isOnline lastSeen')
      .limit(20);
    return users;
  }

  static async getAllUsers(currentUserId: string) {
    if (!isValidObjectId(currentUserId)) throw new Error('Invalid user ID');
    const users = await User.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
    })
      .select('_id name email avatar status isOnline lastSeen')
      .sort({ name: 1 })
      .limit(100);
    return users;
  }

  static async updateProfile(
    userId: string,
    updates: { name?: string; bio?: string; status?: string; avatar?: string }
  ) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const safeUpdates: Record<string, string> = {};
    if (typeof updates.name === 'string') safeUpdates['name'] = updates.name.trim();
    if (typeof updates.bio === 'string') safeUpdates['bio'] = updates.bio.trim();
    if (typeof updates.status === 'string') safeUpdates['status'] = updates.status.trim();
    if (typeof updates.avatar === 'string') {
      if (updates.avatar !== '' && !isSafeMediaUrl(updates.avatar, { maxLength: 2_000_000 })) {
        throw new Error('Invalid or unsupported avatar URL');
      }
      safeUpdates['avatar'] = updates.avatar;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    ).select('-password -blockedUsers');
    if (!user) throw new Error('User not found');
    return user;
  }

  static async blockUser(userId: string, targetId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(targetId)) throw new Error('Invalid user ID');
    if (userId === targetId) throw new Error('Cannot block yourself');
    const target = await User.exists({ _id: new Types.ObjectId(targetId) });
    if (!target) throw new Error('User not found');
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: new Types.ObjectId(targetId) },
    });
  }

  static async unblockUser(userId: string, targetId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(targetId)) throw new Error('Invalid user ID');
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: new Types.ObjectId(targetId) },
    });
  }

  static async getBlockedUsers(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const user = await User.findById(userId).populate(
      'blockedUsers',
      '_id name email avatar'
    );
    if (!user) throw new Error('User not found');
    return user.blockedUsers;
  }
}
