import * as express from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Create a Stripe subscription checkout session
 * @route POST /api/subscriptions/create
 */
export declare const createSubscription: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Get current subscription status for the authenticated user
 * @route GET /api/subscriptions/status
 */
export declare const getSubscriptionStatus: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
export declare const createCustomerPortal: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
