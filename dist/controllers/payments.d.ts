import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
/**
 * Create a payment intent for one-time payments
 * @route POST /api/payments/create-payment-intent
 */
export declare const createPaymentIntent: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
