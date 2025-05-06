import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
/**
 * Get the current user's profile
 * @route GET /api/user/profile
 */
export declare const getProfile: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Update the current user's profile
 * @route PUT /api/user/profile
 */
export declare const updateProfile: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
