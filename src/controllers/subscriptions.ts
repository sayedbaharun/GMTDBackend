import * as express from 'express';
type Response = express.Response;
import { AuthenticatedRequest, UserProfile } from '../types';
import { stripeService } from '../services/stripe';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Create a new subscription
 * @route POST /api/subscriptions/create
 */
export const createSubscription = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    // Use provided price ID or default from config
    const priceId = req.body.priceId || config.stripe.priceId;
    
    // Convert req.user to UserProfile type, handling null values
    const userProfile: UserProfile = {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName || undefined,
      phone: req.user.phone || undefined,
      companyName: req.user.companyName || undefined,
      industry: req.user.industry || undefined,
      companySize: req.user.companySize || undefined,
      role: req.user.role || undefined,
      goals: req.user.goals || undefined,
      stripeCustomerId: req.user.stripeCustomerId || undefined,
      stripe_customer_id: req.user.stripeCustomerId || undefined, // Use stripeCustomerId for both
      subscriptionId: req.user.subscriptionId || undefined,
      subscription_id: req.user.subscriptionId || undefined // Use subscriptionId for both
    };
    
    const result = await stripeService.createSubscription(userProfile, priceId);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      clientSecret: result.data?.clientSecret || null,
      subscriptionId: result.data?.subscriptionId || null
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    return res.status(500).json({ 
      message: 'Failed to create subscription' 
    });
  }
};

/**
 * Get current subscription status
 * @route GET /api/subscriptions/status
 */
export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    // Convert req.user to UserProfile type, handling null values
    const userProfile: UserProfile = {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName || undefined,
      phone: req.user.phone || undefined,
      companyName: req.user.companyName || undefined,
      industry: req.user.industry || undefined,
      companySize: req.user.companySize || undefined,
      role: req.user.role || undefined,
      goals: req.user.goals || undefined,
      stripeCustomerId: req.user.stripeCustomerId || undefined,
      stripe_customer_id: req.user.stripeCustomerId || undefined, // Use stripeCustomerId for both
      subscriptionId: req.user.subscriptionId || undefined,
      subscription_id: req.user.subscriptionId || undefined // Use subscriptionId for both
    };
    
    const result = await stripeService.getSubscriptionStatus(userProfile);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      subscription: result.data
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);
    return res.status(500).json({ 
      message: 'Failed to get subscription status' 
    });
  }
};

/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
export const createCustomerPortal = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        message: 'No Stripe customer associated with this account'
      });
    }
    
    const result = await stripeService.createCustomerPortalSession(
      req.user.stripeCustomerId, 
      config.appUrl
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      url: result.data?.url || null
    });
  } catch (error) {
    logger.error('Create customer portal error:', error);
    return res.status(500).json({ 
      message: 'Failed to create customer portal session' 
    });
  }
};
