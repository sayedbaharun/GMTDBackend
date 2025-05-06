import * as express from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Create a new subscription
 * @route POST /api/subscriptions/create
 */
export declare const createSubscription: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Get current subscription status
 * @route GET /api/subscriptions/status
 */
export declare const getSubscriptionStatus: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
export declare const createCustomerPortal: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
