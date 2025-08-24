import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { JWTPayload, APIError } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const error = new APIError('Access token required', 401);
    return next(error);
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      const error = new APIError('Invalid or expired token', 403);
      return next(error);
    }

    req.user = user as JWTPayload;
    next();
  });
};

export const requireVerificationLevel = (minLevel: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error = new APIError('Authentication required', 401);
      return next(error);
    }

    if ((req.user as any).verification_level < minLevel) {
      const error = new APIError(`Verification level ${minLevel} required`, 403);
      (error as any).code = 'INSUFFICIENT_VERIFICATION';
      return next(error);
    }

    next();
  };
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // No token provided, continue without user
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      // Invalid token, but optional auth, so continue without user
      return next();
    }

    req.user = user as JWTPayload;
    next();
  });
};