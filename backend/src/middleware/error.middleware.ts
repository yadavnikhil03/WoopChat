import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { sendError } from '../utils/response';

export const notFound = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.type === 'entity.too.large') {
    sendError(res, 'Payload size exceeds limit', 413);
    return;
  }

  if (err.type === 'entity.parse.failed') {
    sendError(res, 'Malformed JSON payload', 400);
    return;
  }

  if (err.name === 'CastError') {
    sendError(res, `Invalid format for field: ${err.path}`, 400);
    return;
  }

  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    sendError(res, `Duplicate field value entered: ${fields || 'resource exists'}`, 409);
    return;
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(', ');
    sendError(res, messages || 'Validation error', 400);
    return;
  }

  console.error('Unhandled error:', err);
  const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
  const safeMessage =
    !config.isDev && statusCode >= 500
      ? 'Internal server error'
      : err.message || 'Internal server error';
  sendError(res, safeMessage, statusCode, config.isDev ? err.stack : undefined);
};
