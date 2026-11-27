import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  handler: (_req, res) => {
    sendError(res, 'Too many session refresh requests, please try again later.', 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  handler: (_req, res) => {
    sendError(res, 'Too many AI requests, please wait a few minutes.', 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
