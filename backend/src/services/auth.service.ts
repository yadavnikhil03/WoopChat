import { Types } from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  verifyRefreshToken,
} from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export class AuthService {
  static async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already registered');

    const user = await User.create({
      name: input.name.trim(),
      email,
      password: input.password,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(input.name.trim())}`,
    });

    return AuthService._issueTokens(user);
  }

  static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email.trim().toLowerCase() }).select('+password');
    if (!user) throw new Error('Invalid email or password');

    const valid = await (user as any).comparePassword(input.password);
    if (!valid) throw new Error('Invalid email or password');

    return AuthService._issueTokens(user);
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return { message: 'If that email exists, a password reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    return {
      message: 'If that email exists, a password reset link has been sent.',
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      throw new Error('Password reset token is invalid or has expired');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await RefreshToken.deleteMany({ userId: user._id });

    return AuthService._issueTokens(user);
  }

  static async refreshTokens(incomingToken: string) {
    let payload: { _id: string };
    try {
      payload = verifyRefreshToken(incomingToken);
    } catch {
      throw new Error('Invalid refresh token');
    }

    const tokenDigest = hashToken(incomingToken);
    const stored = await RefreshToken.findOneAndDelete({ token: tokenDigest });
    if (!stored) {
      if (Types.ObjectId.isValid(payload._id)) {
        await RefreshToken.deleteMany({ userId: new Types.ObjectId(payload._id) });
      }
      throw new Error('Refresh token not found or revoked');
    }

    const user = await User.findById(payload._id);
    if (!user) throw new Error('User not found');

    return AuthService._issueTokens(user);
  }

  static async logout(refreshToken: string) {
    const tokenDigest = hashToken(refreshToken);
    await RefreshToken.deleteMany({
      $or: [{ token: tokenDigest }, { token: refreshToken }],
    });
  }

  private static async _issueTokens(user: any) {
    const payload = {
      _id: user._id.toString(),
      email: user.email as string,
      name: user.name as string,
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenValue = generateRefreshToken(user._id as Types.ObjectId);
    const refreshTokenDigest = hashToken(refreshTokenValue);

    await RefreshToken.create({
      token: refreshTokenDigest,
      userId: user._id,
      expiresAt: refreshTokenExpiry(),
    });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      isOnline: user.isOnline,
    };

    return { accessToken, refreshToken: refreshTokenValue, user: safeUser };
  }
}
