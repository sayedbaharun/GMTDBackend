"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripe_1 = require("../services/stripe");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const stripe_2 = __importDefault(require("stripe"));
/**
 * Handle Stripe webhook events
 * @route POST /api/webhooks/stripe
 */
const handleStripeWebhook = async (req, res) => {
    const stripe = new stripe_2.default(config_1.config.stripe.secretKey, {
        apiVersion: '2025-04-30.basil',
    });
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        logger_1.logger.error('Missing Stripe signature');
        return res.status(400).json({ message: 'Missing Stripe signature' });
    }
    // For Stripe webhooks, the body is a Buffer when using express.raw middleware
    const payload = req.body;
    if (!payload) {
        logger_1.logger.error('Missing request body');
        return res.status(400).json({ message: 'Missing request body' });
    }
    if (!config_1.config.stripe.webhookSecret) {
        logger_1.logger.error('Missing Stripe webhook secret');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    try {
        // Verify the webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, config_1.config.stripe.webhookSecret);
            logger_1.logger.info(`Webhook received: ${event.type}`);
        }
        catch (err) {
            logger_1.logger.error(`Webhook signature verification failed: ${err.message}`);
            return res.status(400).json({ message: 'Invalid signature' });
        }
        // Process the event based on its type
        const result = await stripe_1.stripeService.handleWebhookEvent(event);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({ received: true });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing error:', error);
        return res.status(500).json({
            message: 'Failed to process webhook'
        });
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
//# sourceMappingURL=webhooks.js.map