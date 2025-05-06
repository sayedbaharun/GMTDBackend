import * as express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { ApiError } from '../types';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 * Handles different types of errors and returns appropriate responses
 */
export const errorHandler = (
  err: Error | ApiError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack || 'No stack trace available',
    path: req.path,
    method: req.method
  });

  // Handle API errors (custom errors thrown by our application)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: true,
      message: err.message
    });
    return;
  }

  // Handle validation errors from express-validator
  if (err instanceof Array && err.length > 0 && 'msg' in err[0]) {
    res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: err
    });
    return;
  }

  // Handle Stripe errors
  if (err.name === 'StripeError') {
    res.status(400).json({
      error: true,
      message: err.message
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: true,
      message: 'Invalid or expired token'
    });
    return;
  }

  // Handle all other errors as internal server errors
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};
