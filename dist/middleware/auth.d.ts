import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
export declare const validateAccessToken: import("express").Handler;
export declare const syncUserWithDb: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authenticateAndSyncUser: (import("express").Handler | ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>))[];
export declare const authenticateOptional: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireOnboardingComplete: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const isAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
