import * as express from 'express';
const Router = express.Router;

import { 
  createSubscription, 
  getSubscriptionStatus, 
  createCustomerPortal 
} from '../controllers/subscriptions';
import { authenticate, requireOnboardingComplete } from '../middleware/auth';
import { subscriptionValidation, validate } from '../middleware/validation';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Subscription Routes
 * POST /api/subscriptions/create - Create a new subscription
 * GET /api/subscriptions/status - Get current subscription status
 * POST /api/subscriptions/portal - Create a Stripe Customer Portal session
 */

// All subscription routes require authentication
router.use(authenticate);

// Create a new subscription
router.post(
  '/create',
  validate(subscriptionValidation.create),
  createRouteHandler(createSubscription)
);

// Get current subscription status
router.get('/status', createRouteHandler(getSubscriptionStatus));

// Create a Stripe Customer Portal session
// Requires onboarding to be complete
router.post(
  '/portal',
  requireOnboardingComplete,
  createRouteHandler(createCustomerPortal)
);

export default router;
