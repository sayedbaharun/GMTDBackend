import * as express from 'express';
import { AuthenticatedRequest } from '../types';
import { stripeService } from '../services/stripe';
import { config } from '../config';
import { ApiError } from '../types';
import { logger } from '../utils/logger';
import { PrismaClient, User as PrismaUser } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a Stripe subscription checkout session
 * @route POST /api/subscriptions/create
 */
export const createSubscription = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const user = req.user as PrismaUser;
    if (!user) {
      throw new ApiError('Authentication required', 401);
    }

    const priceId = req.body.priceId || config.stripe.priceId;
    if (!priceId) {
      throw new ApiError('Price ID is required', 400);
    }

    const result = await stripeService.createSubscription(user, priceId);

    if (!result.success || !result.data) {
      throw new ApiError(result.error || 'Failed to create subscription session', result.statusCode || 500);
    }

    res.status(200).json({
      success: true,
      clientSecret: result.data.clientSecret,
      subscriptionId: result.data.subscriptionId
    });

  } catch (error: any) {
    logger.error('Create subscription controller error:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get current subscription status for the authenticated user
 * @route GET /api/subscriptions/status
 */
export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const user = req.user as PrismaUser;
    if (!user) {
      throw new ApiError('Authentication required', 401);
    }

    const result = await stripeService.getSubscriptionStatus(user);

    if (!result.success) {
      throw new ApiError(result.error || 'Failed to get subscription status', result.statusCode || 500);
    }

    res.status(200).json({ success: true, data: result.data });

  } catch (error: any) {
    logger.error('Get subscription status controller error:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
export const createCustomerPortal = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const user = req.user as PrismaUser;
    if (!user) {
      throw new ApiError('Authentication required', 401);
    }

    const customerId = user.stripeCustomerId;
    if (!customerId) {
      throw new ApiError('Stripe customer ID not found for this user', 400);
    }

    const returnUrl = req.body.returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    const result = await stripeService.createCustomerPortalSession(customerId, returnUrl);

    if (!result.success || !result.data) {
      throw new ApiError(result.error || 'Failed to create customer portal session', result.statusCode || 500);
    }

    res.status(200).json({ success: true, url: result.data.url });

  } catch (error: any) {
    logger.error('Create customer portal controller error:', error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
