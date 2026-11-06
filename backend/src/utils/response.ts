import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: string
): Response => {
  const body: ApiResponse = { success: false, message, error };
  return res.status(statusCode).json(body);
};
