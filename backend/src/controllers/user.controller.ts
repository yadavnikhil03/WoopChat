import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { getIO } from '../sockets/socket.handler';

export class UserController {
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const user = await UserService.getProfile(_id);
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserService.getProfile(req.params['userId']!);
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const user = await UserService.updateProfile(_id, req.body);
      try {
        const io = getIO();
        io.emit('user:updated', { user });
      } catch {}
      sendSuccess(res, { user }, 'Profile updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const query = (req.query['q'] as string) || '';
      const users = await UserService.searchUsers(query, _id);
      sendSuccess(res, { users });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const users = await UserService.getAllUsers(_id);
      sendSuccess(res, { users });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      await UserService.blockUser(_id, req.params['userId']!);
      sendSuccess(res, null, 'User blocked');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      await UserService.unblockUser(_id, req.params['userId']!);
      sendSuccess(res, null, 'User unblocked');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const users = await UserService.getBlockedUsers(_id);
      sendSuccess(res, { users });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }
}
