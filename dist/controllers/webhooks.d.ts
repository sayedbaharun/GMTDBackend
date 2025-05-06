import * as express from 'express';
/**
 * Handle Stripe webhook events
 * @route POST /api/webhooks/stripe
 */
export declare const handleStripeWebhook: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
