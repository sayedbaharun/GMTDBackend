"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
    : null;
/**
 * Create a payment intent for one-time payments
 * @route POST /api/payments/create-payment-intent
 */
const createPaymentIntent = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: 'Stripe is not configured'
            });
        }
        const { amount, currency = 'usd', description, metadata = {} } = req.body;
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }
        // User may or may not be authenticated with authenticateOptional middleware
        const paymentMetadata = { ...metadata };
        // Add userId to metadata if user is authenticated
        if (req.user?.id) {
            paymentMetadata.userId = req.user.id;
        }
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100), // Convert to cents
            currency: currency.toLowerCase(),
            description,
            metadata: paymentMetadata
        });
        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    }
    catch (error) {
        console.error('Error creating payment intent:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
};
exports.createPaymentIntent = createPaymentIntent;
//# sourceMappingURL=payments.js.map