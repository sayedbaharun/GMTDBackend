import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';

// Type for controller functions that return a Response
type ControllerFunction<T extends Request = Request> = (
  req: T,
  res: Response,
  next?: NextFunction
) => Promise<Response | void>;

// Wrapper for controller functions to make them compatible with Express router
export const asyncHandler = <T extends Request = Request>(fn: ControllerFunction<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

// Wrapper specifically for authenticated routes
export const authHandler = (fn: ControllerFunction<AuthenticatedRequest>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};
