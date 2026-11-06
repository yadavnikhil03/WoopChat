import { Types } from 'mongoose';
import { User } from '../models/User';
import { isValidObjectId } from '../utils/database.util';

export class UserService {
  static async getProfile(userId: string) {
    if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
    const user = await User.findById(userId).select('-password -blockedUsers');
    if (!user) throw new Error('User not found');
    return user;
  }

  static async searchUsers(query: string, currentUserId: string) {
    if (!isValidObjectId(currentUserId)) throw new Error('Invalid user ID');
    const regex = new RegExp(query, 'i');
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -blockedUsers');
    if (!user) throw new Error('User not found');
    return user;
  }

  static async blockUser(userId: string, targetId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(targetId)) throw new Error('Invalid user ID');
    if (userId === targetId) throw new Error('Cannot block yourself');
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
