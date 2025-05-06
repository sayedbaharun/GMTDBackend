import * as express from 'express';
const Router = express.Router;

import { testStripe, listProducts, createCheckoutSession, getCheckoutSession } from '../controllers/test';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Test Routes
 * GET /api/test/stripe - Test Stripe connection
 * GET /api/test/products - List Stripe products and prices
 * POST /api/test/create-checkout - Create a Stripe checkout session for subscription
 * GET /api/test/checkout/:sessionId - Retrieve a Stripe checkout session by ID
 */

// Test Stripe connection
router.get('/stripe', createRouteHandler(testStripe));

// List Stripe products and prices
router.get('/products', createRouteHandler(listProducts));

// Create a checkout session for subscription
router.post('/create-checkout', createRouteHandler(createCheckoutSession));

// Retrieve a checkout session by ID
router.get('/checkout/:sessionId', createRouteHandler(getCheckoutSession));

export default router;