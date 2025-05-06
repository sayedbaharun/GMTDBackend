import * as express from 'express';
/**
 * Register a new user
 * @route POST /api/auth/register
 */
export declare const register: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Login an existing user
 * @route POST /api/auth/login
 */
export declare const login: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Logout the current user
 * @route POST /api/auth/logout
 */
export declare const logout: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Request a password reset
 * @route POST /api/auth/reset-password
 */
export declare const resetPassword: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
