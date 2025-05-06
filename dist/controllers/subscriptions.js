"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerPortal = exports.getSubscriptionStatus = exports.createSubscription = void 0;
const stripe_1 = require("../services/stripe");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
/**
 * Create a new subscription
 * @route POST /api/subscriptions/create
 */
const createSubscription = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        // Use provided price ID or default from config
        const priceId = req.body.priceId || config_1.config.stripe.priceId;
        // Convert req.user to UserProfile type, handling null values
        const userProfile = {
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
        const result = await stripe_1.stripeService.createSubscription(userProfile, priceId);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            clientSecret: result.data?.clientSecret || null,
            subscriptionId: result.data?.subscriptionId || null
        });
    }
    catch (error) {
        logger_1.logger.error('Create subscription error:', error);
        return res.status(500).json({
            message: 'Failed to create subscription'
        });
    }
};
exports.createSubscription = createSubscription;
/**
 * Get current subscription status
 * @route GET /api/subscriptions/status
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        // Convert req.user to UserProfile type, handling null values
        const userProfile = {
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
        const result = await stripe_1.stripeService.getSubscriptionStatus(userProfile);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            subscription: result.data
        });
    }
    catch (error) {
        logger_1.logger.error('Get subscription status error:', error);
        return res.status(500).json({
            message: 'Failed to get subscription status'
        });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
const createCustomerPortal = async (req, res) => {
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
        const result = await stripe_1.stripeService.createCustomerPortalSession(req.user.stripeCustomerId, config_1.config.appUrl);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            url: result.data?.url || null
        });
    }
    catch (error) {
        logger_1.logger.error('Create customer portal error:', error);
        return res.status(500).json({
            message: 'Failed to create customer portal session'
        });
    }
};
exports.createCustomerPortal = createCustomerPortal;
//# sourceMappingURL=subscriptions.js.map