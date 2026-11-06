import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/cookie';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken, refreshToken, user } = await AuthService.register(req.body);
      setRefreshTokenCookie(res, refreshToken);
      sendSuccess(res, { user, accessToken }, 'Registered successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken, refreshToken, user } = await AuthService.login(req.body);
      setRefreshTokenCookie(res, refreshToken);
      sendSuccess(res, { user, accessToken }, 'Login successful');
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies['refreshToken'] as string | undefined;
      if (!token) { sendError(res, 'No refresh token', 401); return; }
      const { accessToken, refreshToken, user } = await AuthService.refreshTokens(token);
      setRefreshTokenCookie(res, refreshToken);
      sendSuccess(res, { user, accessToken }, 'Tokens refreshed');
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies['refreshToken'] as string | undefined;
      if (token) await AuthService.logout(token);
      clearRefreshTokenCookie(res);
      const authReq = req as AuthenticatedRequest;
      if (authReq.user) {
        await User.findByIdAndUpdate(authReq.user._id, { isOnline: false, lastSeen: new Date() });
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await User.findById(authReq.user!._id).select('-password -blockedUsers');
      if (!user) { sendError(res, 'User not found', 404); return; }
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result, result.message);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const { accessToken, refreshToken, user } = await AuthService.resetPassword(token, password);
      setRefreshTokenCookie(res, refreshToken);
      sendSuccess(res, { user, accessToken }, 'Password reset successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }
}
