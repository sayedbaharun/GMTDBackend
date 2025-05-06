import { ApiError } from '../types';
import * as express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

/**
 * Create a custom API error with status code
 * @param message - Error message
 * @param statusCode - HTTP status code
 */
export const createError = (message: string, statusCode: number = 500): ApiError => {
  return new ApiError(message, statusCode);
};

/**
 * Handle async function errors
 * Wrap async functions to catch errors and pass them to the error handler
 * @param fn - Async function to wrap
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Creates an Express-compatible route handler from a controller function
 * This wrapper ensures the controller's return value is properly handled
 * @param fn Controller function that may return a response
 */
export const createRouteHandler = (
  fn: (req: any, res: Response, ...args: any[]) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
