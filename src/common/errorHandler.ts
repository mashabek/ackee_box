import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.errorCode,
      ...(error.details && { details: error.details })
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 