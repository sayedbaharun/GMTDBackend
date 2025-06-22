"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const mobileAuth_1 = require("../middleware/mobileAuth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Initialize Stripe only if key is provided
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new stripe_1.default(stripeKey, {
    apiVersion: '2025-04-30.basil',
}) : null;
if (!stripe) {
    console.warn('Stripe not configured - payments route will return errors');
}
/**
 * POST /api/payments/process - Process payment with booking creation
 */
router.post('/process', mobileAuth_1.authenticateMobile, async (req, res) => {
    try {
        const userId = req.userId;
        const { payment_intent_id, booking_id } = req.body;
        console.log('Processing payment:', { payment_intent_id, booking_id });
        if (!stripe) {
            res.status(503).json({
                success: false,
                error: 'Payment processing unavailable',
                message: 'Stripe is not configured'
            });
            return;
        }
        // Verify payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (paymentIntent.status !== 'succeeded') {
            res.status(400).json({
                success: false,
                error: 'Payment not completed',
                message: 'Payment must be confirmed before processing booking'
            });
            return;
        }
        // Verify booking ownership and update status
        const booking = await prisma.booking.findFirst({
            where: {
                id: booking_id,
                userId: userId,
                paymentIntentId: payment_intent_id
            },
            include: {
                confirmation: true,
                user: true
            }
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
            return;
        }
        // Update booking and transaction status
        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: booking_id },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED'
                }
            });
            await tx.paymentTransaction.updateMany({
                where: { stripePaymentIntentId: payment_intent_id },
                data: {
                    status: 'COMPLETED',
                    paymentMethod: paymentIntent.payment_method_types[0]
                }
            });
            if (booking.confirmation) {
                await tx.bookingConfirmation.update({
                    where: { id: booking.confirmation.id },
                    data: {
                        status: 'CONFIRMED',
                        confirmationSentAt: new Date()
                    }
                });
            }
            await tx.bookingAuditLog.create({
                data: {
                    bookingId: booking_id,
                    action: 'PAYMENT_PROCESSED',
                    entityType: 'PAYMENT',
                    entityId: payment_intent_id,
                    newData: { paymentStatus: 'PAID' },
                    changedBy: userId,
                    changedByType: 'USER',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
        });
        // Send confirmation notifications
        await sendBookingConfirmation(booking, booking.user);
        res.json({
            success: true,
            data: {
                booking_id: booking.id,
                payment_status: 'succeeded',
                booking_status: 'confirmed',
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                confirmation_number: booking.confirmation?.confirmationNumber
            },
            message: 'Payment processed and booking confirmed'
        });
    }
    catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment processing failed',
            message: error.message
        });
    }
});
/**
 * POST /api/payments/create-intent - Create Stripe payment intent
 */
router.post('/create-intent', mobileAuth_1.authenticateMobile, async (req, res) => {
    try {
        const userId = req.userId;
        const { booking_id } = req.body;
        if (!booking_id) {
            res.status(400).json({
                success: false,
                error: 'Booking ID is required'
            });
            return;
        }
        // Get booking details
        const booking = await prisma.booking.findFirst({
            where: {
                id: booking_id,
                userId: userId
            }
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
            return;
        }
        if (booking.paymentStatus === 'PAID') {
            res.status(400).json({
                success: false,
                error: 'Booking is already paid'
            });
            return;
        }
        // Get or create Stripe customer
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        let stripeCustomerId = user?.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user?.email,
                name: user?.fullName || undefined,
                metadata: { userId }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customer.id }
            });
            stripeCustomerId = customer.id;
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(booking.totalPrice * 100), // Convert to smallest unit
            currency: booking.currency.toLowerCase(),
            customer: stripeCustomerId,
            receipt_email: user?.email,
            metadata: {
                booking_id: booking.id,
                user_id: userId
            },
            description: `Booking #${booking.id}`,
            automatic_payment_methods: { enabled: true }
        });
        // Update booking with payment intent
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                paymentIntentId: paymentIntent.id,
                paymentStatus: 'PROCESSING'
            }
        });
        // Create payment transaction record
        await prisma.paymentTransaction.create({
            data: {
                bookingId: booking.id,
                stripePaymentIntentId: paymentIntent.id,
                amount: booking.totalPrice,
                currency: booking.currency,
                status: 'PENDING',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });
        // Create audit log
        await prisma.bookingAuditLog.create({
            data: {
                bookingId: booking.id,
                action: 'PAYMENT_INTENT_CREATED',
                entityType: 'PAYMENT',
                entityId: paymentIntent.id,
                newData: { paymentIntentId: paymentIntent.id },
                changedBy: userId,
                changedByType: 'USER',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
});
/**
 * POST /api/payments/webhook - Handle Stripe webhooks
 */
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('Stripe webhook secret not configured');
        res.status(500).json({ error: 'Webhook secret not configured' });
        return;
    }
    if (!stripe) {
        res.status(503).json({ error: 'Stripe not configured' });
        return;
    }
    let event;
    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
    }
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('Payment succeeded:', paymentIntent.id);
                // Update booking status to confirmed
                await handlePaymentSuccess(paymentIntent);
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('Payment failed:', failedPayment.id);
                // Update booking status to failed
                await handlePaymentFailure(failedPayment);
                break;
            case 'charge.dispute.created':
                const dispute = event.data.object;
                console.log('Dispute created:', dispute.id);
                // Handle chargeback/dispute
                await handleDispute(dispute);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
/**
 * GET /api/payments/status/:payment_intent_id - Check payment status
 */
router.get('/status/:payment_intent_id', async (req, res) => {
    try {
        const { payment_intent_id } = req.params;
        if (!stripe) {
            res.status(503).json({
                success: false,
                error: 'Payment processing unavailable'
            });
            return;
        }
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        res.json({
            success: true,
            data: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                created: paymentIntent.created,
                client_secret: paymentIntent.client_secret
            }
        });
    }
    catch (error) {
        console.error('Error retrieving payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve payment status',
            message: error.message
        });
    }
});
// Helper Functions
async function sendBookingConfirmation(booking, guestDetails) {
    try {
        console.log('Sending booking confirmation:', {
            booking_id: booking.id,
            email: guestDetails.email,
            phone: guestDetails.phone
        });
        // TODO: Implement actual email/SMS sending
        // - SendGrid for email confirmations
        // - Twilio for SMS notifications
        // - WhatsApp Business API for WhatsApp confirmations
        const confirmationData = {
            booking_reference: booking.id,
            guest_name: guestDetails.name,
            booking_type: booking.booking_type,
            amount: booking.amount,
            currency: booking.currency,
            confirmation_link: `${process.env.CLIENT_URL}/booking/${booking.id}`
        };
        console.log('Confirmation data prepared:', confirmationData);
        // Placeholder for actual implementation
        return true;
    }
    catch (error) {
        console.error('Error sending booking confirmation:', error);
        throw error;
    }
}
async function handlePaymentSuccess(paymentIntent) {
    try {
        console.log('Processing successful payment:', paymentIntent.id);
        const booking = await prisma.booking.findFirst({
            where: { paymentIntentId: paymentIntent.id },
            include: {
                confirmation: true,
                user: true
            }
        });
        if (!booking) {
            console.error('Booking not found for payment intent:', paymentIntent.id);
            return;
        }
        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID'
                }
            });
            await tx.paymentTransaction.updateMany({
                where: { stripePaymentIntentId: paymentIntent.id },
                data: {
                    status: 'COMPLETED'
                }
            });
            if (booking.confirmation) {
                await tx.bookingConfirmation.update({
                    where: { id: booking.confirmation.id },
                    data: {
                        status: 'CONFIRMED',
                        confirmationSentAt: new Date()
                    }
                });
            }
            await tx.bookingAuditLog.create({
                data: {
                    bookingId: booking.id,
                    action: 'PAYMENT_WEBHOOK_SUCCESS',
                    entityType: 'PAYMENT',
                    entityId: paymentIntent.id,
                    newData: {
                        paymentStatus: 'PAID',
                        bookingStatus: 'CONFIRMED'
                    },
                    changedBy: 'SYSTEM',
                    changedByType: 'SYSTEM'
                }
            });
        });
        // Send confirmation notifications
        await sendBookingConfirmation(booking, booking.user);
    }
    catch (error) {
        console.error('Error handling payment success:', error);
    }
}
async function handlePaymentFailure(paymentIntent) {
    try {
        console.log('Processing failed payment:', paymentIntent.id);
        const booking = await prisma.booking.findFirst({
            where: { paymentIntentId: paymentIntent.id }
        });
        if (!booking) {
            console.error('Booking not found for failed payment:', paymentIntent.id);
            return;
        }
        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    paymentStatus: 'FAILED'
                }
            });
            await tx.paymentTransaction.updateMany({
                where: { stripePaymentIntentId: paymentIntent.id },
                data: {
                    status: 'FAILED'
                }
            });
            await tx.bookingAuditLog.create({
                data: {
                    bookingId: booking.id,
                    action: 'PAYMENT_WEBHOOK_FAILED',
                    entityType: 'PAYMENT',
                    entityId: paymentIntent.id,
                    newData: {
                        paymentStatus: 'FAILED',
                        error: paymentIntent.last_payment_error?.message
                    },
                    changedBy: 'SYSTEM',
                    changedByType: 'SYSTEM'
                }
            });
        });
    }
    catch (error) {
        console.error('Error handling payment failure:', error);
    }
}
async function handleDispute(dispute) {
    try {
        console.log('Processing dispute:', dispute.id);
        // TODO: Create dispute record and notify admin
        // - Log dispute in database
        // - Notify admin team
        // - Prepare dispute response materials
        console.log('Dispute handling logged for charge:', dispute.charge);
    }
    catch (error) {
        console.error('Error handling dispute:', error);
    }
}
exports.default = router;
//# sourceMappingURL=payments.js.map