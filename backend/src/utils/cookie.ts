import { CookieOptions, Response } from 'express';
import { config } from '../config/env';

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: !config.isDev,
  sameSite: config.isDev ? 'lax' : 'strict',
  path: '/',
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  res.cookie('refreshToken', token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: days * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refreshToken', BASE_COOKIE_OPTIONS);
};
