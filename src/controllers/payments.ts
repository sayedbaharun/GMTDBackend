import * as express from 'express';
type Response = express.Response;
import { AuthenticatedRequest } from '../types/express';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

/**
 * Create a payment intent for one-time payments
 * @route POST /api/payments/create-payment-intent
 */
export const createPaymentIntent = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured'
      });
    }

    const { amount, currency = 'usd', description, metadata } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description,
      metadata: {
        userId,
        ...metadata
      }
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};