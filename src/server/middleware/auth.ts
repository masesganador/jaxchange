import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload, APIError } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new APIError('Access token is required', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new APIError('Invalid or expired token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new APIError('Token has expired', 401));
    } else {
      next(error);
    }
  }
};

export const requireActiveUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new APIError('Authentication required', 401));
    return;
  }

  if (req.user.status !== 'ACTIVE') {
    next(new APIError('Account is not active', 403));
    return;
  }

  next();
};

export const requireVerificationLevel = (requiredLevel: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new APIError('Authentication required', 401));
      return;
    }

    // For now, we'll assume all authenticated users have basic verification
    // In a real implementation, you'd check the user's verification level from the database
    next();
  };
};

export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} => {
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry
  } as jwt.SignOptions);

  // Calculate expiration time in seconds
  const expiresIn = parseInt(config.jwtExpiry.replace(/[^0-9]/g, '')) * 60;

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};
