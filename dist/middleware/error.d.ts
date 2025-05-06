import * as express from 'express';
import { ApiError } from '../types';
/**
 * Global error handling middleware
 * Handles different types of errors and returns appropriate responses
 */
export declare const errorHandler: (err: Error | ApiError, req: express.Request, res: express.Response, next: express.NextFunction) => void;
