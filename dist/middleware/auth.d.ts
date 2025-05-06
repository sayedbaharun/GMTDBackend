import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Middleware to authenticate requests using Supabase token
 * Extracts JWT from Authorization header and validates it
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if onboarding is complete
 * Used to protect routes that require completed onboarding
 */
export declare const requireOnboardingComplete: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware - tries to authenticate the user
 * but allows the request to proceed even if authentication fails
 * Use this for endpoints that can work with or without authentication
 */
export declare const authenticateOptional: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
