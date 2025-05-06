"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const user_1 = require("./user");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
// Initialize Stripe with the secret key
const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
    apiVersion: '2025-04-30.basil',
});
/**
 * Service for handling Stripe operations
 */
exports.stripeService = {
    /**
     * Get customer subscriptions from Stripe
     * @param customerId - Stripe customer ID
     */
    getCustomerSubscriptions: async (customerId) => {
        try {
            if (!stripe) {
                throw new Error('Stripe client not initialized');
            }
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                limit: 5,
                expand: ['data.default_payment_method']
            });
            return subscriptions.data;
        }
        catch (error) {
            console.error(`Error getting customer subscriptions: ${error.message}`);
            throw error;
        }
    },
    /**
     * Get detailed subscription information from Stripe
     * @param subscriptionId - Stripe subscription ID
     */
    getSubscriptionDetails: async (subscriptionId) => {
        try {
            if (!stripe) {
                throw new Error('Stripe client not initialized');
            }
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: [
                    'default_payment_method',
                    'latest_invoice',
                    'customer'
                ]
            });
            return subscription;
        }
        catch (error) {
            console.error(`Error getting subscription details: ${error.message}`);
            throw error;
        }
    },
    /**
     * Cancel all of a customer's subscriptions
     * @param customerId - Stripe customer ID
     */
    cancelCustomerSubscriptions: async (customerId) => {
        try {
            if (!stripe) {
                throw new Error('Stripe client not initialized');
            }
            // Get all customer's subscriptions
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId
            });
            // Cancel each active subscription
            const cancellationPromises = subscriptions.data
                .filter(sub => sub.status === 'active' || sub.status === 'trialing')
                .map(sub => stripe.subscriptions.cancel(sub.id));
            await Promise.all(cancellationPromises);
            return { success: true };
        }
        catch (error) {
            console.error(`Error canceling customer subscriptions: ${error.message}`);
            throw error;
        }
    },
    /**
     * Get summary of all active subscriptions
     * (useful for admin dashboard)
     */
    getSubscriptionsSummary: async () => {
        try {
            if (!stripe) {
                throw new Error('Stripe client not initialized');
            }
            // Get active subscriptions
            const subscriptions = await stripe.subscriptions.list({
                limit: 100,
                status: 'active'
            });
            // Get all subscription products
            const products = await stripe.products.list({
                limit: 100,
                active: true
            });
            // Calculate metrics
            const metrics = {
                totalSubscriptions: subscriptions.data.length,
                subscriptionsByProduct: {},
                totalRecurringRevenue: 0
            };
            // Map product IDs to names for easier reference
            const productMap = products.data.reduce((acc, product) => {
                acc[product.id] = product.name;
                return acc;
            }, {});
            // Calculate metrics from subscriptions
            subscriptions.data.forEach(subscription => {
                // Add to recurring revenue (convert from cents to dollars)
                metrics.totalRecurringRevenue += subscription.items.data.reduce((sum, item) => sum + (item.price?.unit_amount || 0) * (item.quantity || 1) / 100, 0);
                // Count by product
                subscription.items.data.forEach(item => {
                    if (item.price?.product) {
                        const productId = typeof item.price.product === 'string'
                            ? item.price.product
                            : item.price.product.id;
                        const productName = productMap[productId] || productId;
                        if (!metrics.subscriptionsByProduct[productName]) {
                            metrics.subscriptionsByProduct[productName] = 0;
                        }
                        metrics.subscriptionsByProduct[productName] += (item.quantity || 1);
                    }
                });
            });
            return metrics;
        }
        catch (error) {
            console.error(`Error getting subscriptions summary: ${error.message}`);
            throw error;
        }
    },
    /**
     * Create a Stripe customer
     * @param userId - User ID
     * @param email - User email
     * @param name - User full name
     */
    createCustomer: async (userId, email, name) => {
        try {
            // Create the customer in Stripe
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    userId
                }
            });
            // Update the user profile with the Stripe customer ID
            await user_1.userService.updateUserStripeInfo(userId, customer.id, {});
            return {
                success: true,
                data: customer
            };
        }
        catch (error) {
            logger_1.logger.error('Create Stripe customer error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode || 500
            };
        }
    },
    /**
     * Create a subscription for a user
     * @param user - User profile
     * @param priceId - Stripe price ID
     */
    createSubscription: async (user, priceId) => {
        try {
            let customerId = user.stripe_customer_id || user.stripeCustomerId;
            // If the user doesn't have a Stripe customer ID, create one
            if (!customerId) {
                const customerResult = await exports.stripeService.createCustomer(user.id, user.email, user.fullName || user.email);
                if (!customerResult.success || !customerResult.data) {
                    return {
                        success: false,
                        error: 'Failed to create Stripe customer',
                        statusCode: 400
                    };
                }
                customerId = customerResult.data.id;
            }
            // Create the subscription
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: priceId,
                    },
                ],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });
            // Get the client secret for the payment intent
            const invoice = subscription.latest_invoice;
            const paymentIntent = invoice.payment_intent;
            // Update the user profile with the subscription ID
            await user_1.userService.updateUserStripeInfo(user.id, customerId, {
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });
            return {
                success: true,
                data: {
                    clientSecret: paymentIntent.client_secret,
                    subscriptionId: subscription.id
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Create subscription error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode || 500
            };
        }
    },
    /**
     * Get the subscription status for a user
     * @param user - User profile
     */
    getSubscriptionStatus: async (user) => {
        try {
            // If the user doesn't have a subscription, return inactive status
            if (!user.subscription_id) {
                return {
                    success: true,
                    data: {
                        active: false,
                        status: null,
                        current_period_end: null,
                        cancel_at_period_end: null,
                        subscription_id: null,
                        product_name: null,
                        price_id: null
                    }
                };
            }
            // Retrieve the subscription from Stripe
            const subscription = await stripe.subscriptions.retrieve(user.subscription_id, {
                expand: ['items.data.price.product']
            });
            // Parse the subscription data
            const item = subscription.items.data[0];
            const price = item.price;
            const product = price.product;
            const status = {
                active: subscription.status === 'active',
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                subscription_id: subscription.id,
                product_name: product.name,
                price_id: price.id
            };
            return {
                success: true,
                data: status
            };
        }
        catch (error) {
            logger_1.logger.error('Get subscription status error:', error);
            // If the subscription doesn't exist, return inactive status
            if (error.code === 'resource_missing') {
                return {
                    success: true,
                    data: {
                        active: false,
                        status: null,
                        current_period_end: null,
                        cancel_at_period_end: null,
                        subscription_id: null,
                        product_name: null,
                        price_id: null
                    }
                };
            }
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode || 500
            };
        }
    },
    /**
     * Create a Stripe Customer Portal session
     * @param customerId - Stripe customer ID
     * @param returnUrl - URL to return to after the session
     */
    createCustomerPortalSession: async (customerId, returnUrl) => {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl
            });
            return {
                success: true,
                data: {
                    url: session.url
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Create customer portal session error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode || 500
            };
        }
    },
    /**
     * Handle Stripe webhook events
     * @param event - Stripe event
     */
    handleWebhookEvent: async (event) => {
        try {
            switch (event.type) {
                case types_1.StripeWebhookEvents.SUBSCRIPTION_CREATED:
                    await exports.stripeService.handleSubscriptionCreated(event.data.object);
                    break;
                case types_1.StripeWebhookEvents.SUBSCRIPTION_UPDATED:
                    await exports.stripeService.handleSubscriptionUpdated(event.data.object);
                    break;
                case types_1.StripeWebhookEvents.SUBSCRIPTION_DELETED:
                    await exports.stripeService.handleSubscriptionDeleted(event.data.object);
                    break;
                case types_1.StripeWebhookEvents.INVOICE_PAYMENT_SUCCEEDED:
                    await exports.stripeService.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case types_1.StripeWebhookEvents.INVOICE_PAYMENT_FAILED:
                    await exports.stripeService.handleInvoicePaymentFailed(event.data.object);
                    break;
                default:
                    logger_1.logger.info(`Unhandled event type: ${event.type}`);
            }
            return {
                success: true,
                data: null
            };
        }
        catch (error) {
            logger_1.logger.error(`Webhook event handler error for ${event.type}:`, error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    },
    /**
     * Handle the 'customer.subscription.created' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionCreated: async (subscription) => {
        try {
            const customerId = subscription.customer;
            // Find the user with this Stripe customer ID
            const userResult = await user_1.userService.findUserByStripeCustomerId(customerId);
            if (!userResult.success || !userResult.data) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await user_1.userService.updateUserStripeInfo(userResult.data.id, customerId, {
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });
            logger_1.logger.info(`Subscription created for user ${userResult.data.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleSubscriptionCreated error:', error);
        }
    },
    /**
     * Handle the 'customer.subscription.updated' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionUpdated: async (subscription) => {
        try {
            const customerId = subscription.customer;
            // Find the user with this Stripe customer ID
            const userResult = await user_1.userService.findUserByStripeCustomerId(customerId);
            if (!userResult.success || !userResult.data) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await user_1.userService.updateUserStripeInfo(userResult.data.id, customerId, {
                subscription_status: subscription.status,
                subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });
            logger_1.logger.info(`Subscription updated for user ${userResult.data.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleSubscriptionUpdated error:', error);
        }
    },
    /**
     * Handle the 'customer.subscription.deleted' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionDeleted: async (subscription) => {
        try {
            const customerId = subscription.customer;
            // Find the user with this Stripe customer ID
            const userResult = await user_1.userService.findUserByStripeCustomerId(customerId);
            if (!userResult.success || !userResult.data) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await user_1.userService.updateUserStripeInfo(userResult.data.id, customerId, {
                subscription_status: 'canceled'
            });
            logger_1.logger.info(`Subscription deleted for user ${userResult.data.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleSubscriptionDeleted error:', error);
        }
    },
    /**
     * Handle the 'invoice.payment_succeeded' event
     * @param invoice - Stripe invoice
     */
    handleInvoicePaymentSucceeded: async (invoice) => {
        try {
            const customerId = invoice.customer;
            // Find the user with this Stripe customer ID
            const userResult = await user_1.userService.findUserByStripeCustomerId(customerId);
            if (!userResult.success || !userResult.data) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's payment date
            await user_1.userService.updateUserStripeInfo(userResult.data.id, customerId, {
                last_payment_date: new Date().toISOString()
            });
            logger_1.logger.info(`Payment succeeded for user ${userResult.data.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleInvoicePaymentSucceeded error:', error);
        }
    },
    /**
     * Handle the 'invoice.payment_failed' event
     * @param invoice - Stripe invoice
     */
    handleInvoicePaymentFailed: async (invoice) => {
        try {
            const customerId = invoice.customer;
            // Find the user with this Stripe customer ID
            const userResult = await user_1.userService.findUserByStripeCustomerId(customerId);
            if (!userResult.success || !userResult.data) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // We don't need to update the subscription status as Stripe will handle that
            // and trigger a subscription.updated event
            logger_1.logger.info(`Payment failed for user ${userResult.data.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleInvoicePaymentFailed error:', error);
        }
    }
};
//# sourceMappingURL=stripe.js.map