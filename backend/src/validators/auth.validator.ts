import { z } from 'zod';
import { isSafeMediaUrl } from '../utils/sanitize.util';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(1, 'Password is required').max(72),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  bio: z.string().trim().max(200).optional(),
  status: z.string().trim().max(100).optional(),
  avatar: z
    .string()
    .refine(
      (val) => val === '' || isSafeMediaUrl(val, { maxLength: 2_000_000 }),
      'Invalid or unsupported avatar URL'
    )
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required').max(256),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
