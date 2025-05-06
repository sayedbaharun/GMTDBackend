"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = exports.getCheckoutSession = exports.listProducts = exports.testStripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
/**
 * Test Stripe setup
 * @route GET /api/test/stripe
 */
const testStripe = async (req, res) => {
    try {
        const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
            apiVersion: '2025-04-30.basil',
        });
        // Get Stripe account info
        const account = await stripe.accounts.retrieve();
        return res.json({
            success: true,
            message: 'Stripe connected successfully',
            account: {
                id: account.id,
                email: account.email,
                country: account.country,
                created: account.created ? new Date(account.created * 1000).toISOString() : null,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Test Stripe error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to connect to Stripe',
            error: error.message
        });
    }
};
exports.testStripe = testStripe;
/**
 * List Stripe products and prices
 * @route GET /api/test/products
 */
const listProducts = async (req, res) => {
    try {
        const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
            apiVersion: '2025-04-30.basil',
        });
        // List products
        const products = await stripe.products.list({
            active: true,
            limit: 10,
        });
        // Get prices for each product
        const productsWithPrices = await Promise.all(products.data.map(async (product) => {
            const prices = await stripe.prices.list({
                product: product.id,
                active: true,
            });
            return {
                id: product.id,
                name: product.name,
                description: product.description,
                active: product.active,
                prices: prices.data.map(price => ({
                    id: price.id,
                    currency: price.currency,
                    unit_amount: price.unit_amount,
                    recurring: price.recurring ? {
                        interval: price.recurring.interval,
                        interval_count: price.recurring.interval_count,
                    } : null,
                })),
            };
        }));
        return res.json({
            success: true,
            products: productsWithPrices
        });
    }
    catch (error) {
        logger_1.logger.error('List products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to list Stripe products',
            error: error.message
        });
    }
};
exports.listProducts = listProducts;
/**
 * Retrieve a checkout session by ID
 * @route GET /api/test/checkout/:sessionId
 */
const getCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }
        const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
            apiVersion: '2025-04-30.basil',
        });
        // Retrieve the checkout session
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'customer', 'subscription']
        });
        return res.json({
            success: true,
            session: {
                id: session.id,
                status: session.status,
                customer: session.customer,
                subscription: session.subscription,
                payment_status: session.payment_status,
                amount_total: session.amount_total,
                line_items: session.line_items,
                created: session.created
                    ? new Date(session.created * 1000).toISOString()
                    : null,
                url: session.url,
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get checkout session error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve checkout session',
            error: error.message
        });
    }
};
exports.getCheckoutSession = getCheckoutSession;
/**
 * Create a checkout session for a subscription
 * @route POST /api/test/create-checkout
 */
const createCheckoutSession = async (req, res) => {
    try {
        const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
            apiVersion: '2025-04-30.basil',
        });
        // Use the price ID from the request body or a specific price ID
        // (do not use the config value which seems to have an incorrect value)
        const priceId = req.body.priceId || 'price_1RLQPV5rVX7weur8YSIitmqH';
        if (!priceId) {
            return res.status(400).json({
                success: false,
                message: 'Price ID is required'
            });
        }
        // Debug price ID
        logger_1.logger.info(`Using price ID: ${priceId}`);
        // Create the checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${config_1.config.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config_1.config.appUrl}/canceled`,
            metadata: {
                // We can add any additional metadata here
                source: 'express-backend'
            }
        });
        return res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    }
    catch (error) {
        logger_1.logger.error('Create checkout session error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create checkout session',
            error: error.message
        });
    }
};
exports.createCheckoutSession = createCheckoutSession;
//# sourceMappingURL=test.js.map