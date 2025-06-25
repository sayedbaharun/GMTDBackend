import { Request, Response, NextFunction } from 'express';
import { RLSError } from '../utils/rls-errors';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 * Handles RLS errors and other application errors
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle RLS errors
  if (error instanceof RLSError) {
    const statusCode = getStatusCodeForRLSError(error.code);
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
    }
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A resource with this information already exists',
        },
      });
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};

/**
 * Get appropriate HTTP status code for RLS error
 */
function getStatusCodeForRLSError(code: string): number {
  switch (code) {
    case 'AUTHENTICATION_REQUIRED':
      return 401;
    case 'UNAUTHORIZED_ACCESS':
      return 403;
    case 'RESOURCE_NOT_FOUND':
      return 404;
    case 'INVALID_USER_CONTEXT':
      return 400;
    default:
      return 500;
  }
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};