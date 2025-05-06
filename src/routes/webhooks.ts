import * as express from 'express';
const Router = express.Router;

import { handleStripeWebhook } from '../controllers/webhooks';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Webhook Routes
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 */

// Stripe webhooks need raw body for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  createRouteHandler(handleStripeWebhook)
);

export default router;
