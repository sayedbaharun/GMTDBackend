"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerPortal = exports.getSubscriptionStatus = exports.createSubscription = void 0;
const stripe_1 = require("../services/stripe");
const config_1 = require("../config");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Create a Stripe subscription checkout session
 * @route POST /api/subscriptions/create
 */
const createSubscription = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new types_1.ApiError('Authentication required', 401);
        }
        const priceId = req.body.priceId || config_1.config.stripe.priceId;
        if (!priceId) {
            throw new types_1.ApiError('Price ID is required', 400);
        }
        const result = await stripe_1.stripeService.createSubscription(user, priceId);
        if (!result.success || !result.data) {
            throw new types_1.ApiError(result.error || 'Failed to create subscription session', result.statusCode || 500);
        }
        res.status(200).json({
            success: true,
            clientSecret: result.data.clientSecret,
            subscriptionId: result.data.subscriptionId
        });
    }
    catch (error) {
        logger_1.logger.error('Create subscription controller error:', error);
        if (error instanceof types_1.ApiError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createSubscription = createSubscription;
/**
 * Get current subscription status for the authenticated user
 * @route GET /api/subscriptions/status
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new types_1.ApiError('Authentication required', 401);
        }
        const result = await stripe_1.stripeService.getSubscriptionStatus(user);
        if (!result.success) {
            throw new types_1.ApiError(result.error || 'Failed to get subscription status', result.statusCode || 500);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (error) {
        logger_1.logger.error('Get subscription status controller error:', error);
        if (error instanceof types_1.ApiError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
/**
 * Create a Stripe Customer Portal session
 * @route POST /api/subscriptions/portal
 */
const createCustomerPortal = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new types_1.ApiError('Authentication required', 401);
        }
        const customerId = user.stripeCustomerId;
        if (!customerId) {
            throw new types_1.ApiError('Stripe customer ID not found for this user', 400);
        }
        const returnUrl = req.body.returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
        const result = await stripe_1.stripeService.createCustomerPortalSession(customerId, returnUrl);
        if (!result.success || !result.data) {
            throw new types_1.ApiError(result.error || 'Failed to create customer portal session', result.statusCode || 500);
        }
        res.status(200).json({ success: true, url: result.data.url });
    }
    catch (error) {
        logger_1.logger.error('Create customer portal controller error:', error);
        if (error instanceof types_1.ApiError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createCustomerPortal = createCustomerPortal;
//# sourceMappingURL=subscriptions.js.map