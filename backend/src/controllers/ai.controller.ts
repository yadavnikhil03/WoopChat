import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AIController {
  static async streamChat(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const { message } = req.body as { message: string };
      if (!message?.trim()) {
        sendError(res, 'Message is required', 400);
        return;
      }
      await AIService.streamChat(_id, message, req, res);
    } catch (err: any) {
      if (!res.headersSent) {
        sendError(res, err.message, 500);
      }
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      const messages = await AIService.getHistory(_id);
      sendSuccess(res, { messages });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async clearHistory(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = (req as AuthenticatedRequest).user!;
      await AIService.clearHistory(_id);
      sendSuccess(res, null, 'History cleared');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }
}
