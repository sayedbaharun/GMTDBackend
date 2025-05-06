import * as express from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Get current onboarding status
 * @route GET /api/onboarding/status
 */
export declare const getOnboardingStatus: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Save basic user information (Step 1 of onboarding)
 * @route POST /api/onboarding/user-info
 */
export declare const saveUserInfo: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Save additional user details (Step 2 of onboarding)
 * @route POST /api/onboarding/additional-details
 */
export declare const saveAdditionalDetails: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Process payment (Step 3 of onboarding)
 * @route POST /api/onboarding/payment
 */
export declare const processPayment: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Mark onboarding as complete
 * @route POST /api/onboarding/complete
 */
export declare const completeOnboarding: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
