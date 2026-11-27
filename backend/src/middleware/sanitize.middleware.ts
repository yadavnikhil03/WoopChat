import { Request, Response, NextFunction } from 'express';
import { sanitizeMongoValue } from '../utils/sanitize.util';

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeMongoValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const cleanQuery = sanitizeMongoValue(req.query);
    for (const key of Object.keys(req.query)) {
      if (!(key in cleanQuery)) {
        delete req.query[key];
      }
    }
    Object.assign(req.query, cleanQuery);
  }
  if (req.params && typeof req.params === 'object') {
    const cleanParams = sanitizeMongoValue(req.params);
    Object.assign(req.params, cleanParams);
  }
  next();
};
