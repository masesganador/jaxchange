import { Request, Response, NextFunction } from 'express';
import { APIError, ApiResponse } from '../types';
import config from '../../config';

export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details (in production, use proper logging service)
  console.error('Error:', {
    message: error.message,
    stack: config.server.nodeEnv === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    user: (req as any).user?.user_id,
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let status = (error as any).statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = (error as any).code;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
  } else if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if ((error as any).code === '23505') { // PostgreSQL unique constraint violation
    status = 409;
    message = 'Resource already exists';
  } else if ((error as any).code === '23503') { // PostgreSQL foreign key violation
    status = 400;
    message = 'Invalid reference';
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
    ...(config.server.nodeEnv === 'development' && { stack: error.stack }),
  };

  res.status(status).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};