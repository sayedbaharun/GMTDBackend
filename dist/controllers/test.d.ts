import * as express from 'express';
/**
 * Test Stripe setup
 * @route GET /api/test/stripe
 */
export declare const testStripe: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * List Stripe products and prices
 * @route GET /api/test/products
 */
export declare const listProducts: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Retrieve a checkout session by ID
 * @route GET /api/test/checkout/:sessionId
 */
export declare const getCheckoutSession: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Create a checkout session for a subscription
 * @route POST /api/test/create-checkout
 */
export declare const createCheckoutSession: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
