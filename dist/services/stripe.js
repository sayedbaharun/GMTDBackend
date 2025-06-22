"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const prisma = new client_1.PrismaClient();
// Initialize Stripe with the secret key
// Only initialize if secret key is provided
const stripe = config_1.config.stripe.secretKey
    ? new stripe_1.default(config_1.config.stripe.secretKey, {
        apiVersion: '2025-04-30.basil',
    })
    : null;
if (!stripe) {
    logger_1.logger.warn('Stripe not configured - STRIPE_SECRET_KEY environment variable is missing');
}
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
            if (!stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured'
                };
            }
            // Create the customer in Stripe
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    userId
                }
            });
            // Update the user profile with the Stripe customer ID using Prisma
            // await userService.updateUserStripeInfo(userId, customer.id, {}); // REMOVED userService call
            // We don't necessarily need to update here, as the caller (e.g., onboarding controller) will update the user record
            // Alternatively, we could update here:
            /*
            await prisma.user.update({
              where: { id: userId },
              data: { stripeCustomerId: customer.id }
            });
            */
            logger_1.logger.info(`Stripe customer created: ${customer.id} for user ${userId}`);
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
     * @param user - Prisma User object
     * @param priceId - Stripe price ID
     */
    createSubscription: async (user, priceId) => {
        try {
            let customerId = user.stripeCustomerId;
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
                // The caller (onboarding controller) should handle updating the user record with the new customerId
            }
            // Create the subscription
            if (!stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured'
                };
            }
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: priceId,
                    },
                ],
                payment_behavior: 'default_incomplete',
                // Only expand pending_setup_intent and latest_invoice
                expand: ['pending_setup_intent', 'latest_invoice'],
                metadata: {
                    userId: user.id
                }
            });
            let clientSecret = null;
            // Try to get client_secret from pending_setup_intent
            if (subscription.pending_setup_intent && typeof subscription.pending_setup_intent === 'object') {
                clientSecret = subscription.pending_setup_intent.client_secret;
                if (clientSecret) {
                    logger_1.logger.info(`Obtained client_secret from pending_setup_intent for sub ${subscription.id}`);
                }
                else {
                    logger_1.logger.warn(`pending_setup_intent object found for sub ${subscription.id}, but it did not contain a client_secret.`);
                }
            }
            else {
                logger_1.logger.warn(`pending_setup_intent not found or not an object for sub ${subscription.id}. Value: ${JSON.stringify(subscription.pending_setup_intent)}`);
            }
            // If client_secret not found in pending_setup_intent, try to get it from the latest invoice's payment intent
            if (!clientSecret && subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
                // Use 'any' type to bypass TypeScript limitations with Stripe types
                const invoice = subscription.latest_invoice;
                // Check if the invoice has a payment_intent ID (could be string or object depending on expansion)
                const paymentIntentId = typeof invoice.payment_intent === 'string'
                    ? invoice.payment_intent
                    : (invoice.payment_intent?.id || null);
                if (paymentIntentId) {
                    // Retrieve the payment intent to get the client secret
                    if (!stripe) {
                        throw new Error('Stripe not configured');
                    }
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                    clientSecret = paymentIntent.client_secret;
                    if (clientSecret) {
                        logger_1.logger.info(`Obtained client_secret from payment intent (${paymentIntentId}) for sub ${subscription.id}`);
                    }
                    else {
                        logger_1.logger.warn(`Retrieved payment intent (${paymentIntentId}) but it did not contain a client_secret.`);
                    }
                }
                else {
                    logger_1.logger.warn(`No payment_intent found in latest_invoice for sub ${subscription.id}`);
                }
            }
            if (!clientSecret) {
                // If neither pending_setup_intent nor invoice's payment_intent provided a client_secret, throw an error
                logger_1.logger.error(`Failed to obtain client_secret for subscription ${subscription.id}. PendingSetupIntent: ${JSON.stringify(subscription.pending_setup_intent)}`);
                throw new Error('Could not retrieve a client secret for payment setup from Stripe subscription.');
            }
            return {
                success: true,
                data: {
                    clientSecret: clientSecret,
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
            if (!user.subscriptionId) {
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
            if (!stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured'
                };
            }
            const subscription = await stripe.subscriptions.retrieve(user.subscriptionId, {
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
            if (!stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured'
                };
            }
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
            const userResult = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!userResult) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await prisma.user.update({
                where: { id: userResult.id },
                data: {
                    subscriptionId: subscription.id,
                    subscriptionStatus: subscription.status,
                    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
                }
            });
            logger_1.logger.info(`Subscription created for user ${userResult.id}`);
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
            const userResult = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!userResult) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await prisma.user.update({
                where: { id: userResult.id },
                data: {
                    subscriptionStatus: subscription.status,
                    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
                }
            });
            logger_1.logger.info(`Subscription updated for user ${userResult.id}`);
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
            const userResult = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!userResult) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's subscription data
            await prisma.user.update({
                where: { id: userResult.id },
                data: {
                    subscriptionStatus: 'canceled'
                }
            });
            logger_1.logger.info(`Subscription deleted for user ${userResult.id}`);
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
            const userResult = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!userResult) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // Update the user's payment date
            await prisma.user.update({
                where: { id: userResult.id },
                data: {
                // lastPaymentDate: new Date().toISOString() // REMOVED - Field doesn't exist on User model
                // Optionally update another relevant field if needed, e.g., extend subscription access?
                // For now, just logging is fine as per the original comment.
                }
            });
            logger_1.logger.info(`Payment succeeded for user ${userResult.id}`);
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
            const userResult = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });
            if (!userResult) {
                logger_1.logger.error(`No user found for Stripe customer ${customerId}`);
                return;
            }
            // We don't need to update the subscription status as Stripe will handle that
            // and trigger a subscription.updated event
            logger_1.logger.info(`Payment failed for user ${userResult.id}`);
        }
        catch (error) {
            logger_1.logger.error('handleInvoicePaymentFailed error:', error);
        }
    },
    /**
     * Create a Stripe Checkout Session for membership purchases
     * @param options - Checkout session configuration
     */
    createCheckoutSession: async (options) => {
        try {
            const { customerId, priceId, planName, successUrl, cancelUrl, metadata = {} } = options;
            // Determine if this is a subscription or one-time payment
            const isLifetime = priceId.includes('Founding') || priceId.includes('Lifetime');
            const sessionConfig = {
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: isLifetime ? 'payment' : 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    ...metadata,
                    plan_name: planName,
                    is_lifetime: isLifetime.toString()
                },
                allow_promotion_codes: true,
                billing_address_collection: 'required',
            };
            // Add subscription-specific configurations
            if (!isLifetime) {
                sessionConfig.subscription_data = {
                    metadata: {
                        ...metadata,
                        plan_name: planName
                    }
                };
            }
            // Add payment-specific configurations for lifetime memberships
            if (isLifetime) {
                sessionConfig.payment_intent_data = {
                    metadata: {
                        ...metadata,
                        plan_name: planName,
                        is_lifetime: 'true'
                    }
                };
            }
            if (!stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured'
                };
            }
            const session = await stripe.checkout.sessions.create(sessionConfig);
            logger_1.logger.info(`Checkout session created: ${session.id} for customer ${customerId}, plan: ${planName}`);
            return {
                success: true,
                data: session
            };
        }
        catch (error) {
            logger_1.logger.error('Create checkout session error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode || 500
            };
        }
    },
};
//# sourceMappingURL=stripe.js.map