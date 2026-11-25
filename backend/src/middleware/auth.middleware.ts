import type { NextFunction, Request, Response } from 'express';
import { getSessionUser, type SessionUser } from '../auth/session';
import { AppError } from '../utils/app-error';

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    next(new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    }));
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
}
