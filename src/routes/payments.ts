import * as express from 'express';
const Router = express.Router;

import { createPaymentIntent } from '../controllers/payments';
import { createRouteHandler } from '../utils/errorHandler';
import { authenticateOptional } from '../middleware/auth';
import { validate, paymentValidation } from '../middleware/validation';

const router = Router();

/**
 * Payment Routes
 * POST /api/payments/create-payment-intent - Create a new payment intent for one-time payment
 */

// Create a payment intent (supports both authenticated and unauthenticated users)
router.post(
  '/create-payment-intent',
  authenticateOptional, // Optional authentication - will populate req.user if token is valid
  validate(paymentValidation.createPaymentIntent),
  createRouteHandler(createPaymentIntent)
);

export default router;