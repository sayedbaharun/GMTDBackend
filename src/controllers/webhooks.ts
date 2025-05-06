import * as express from 'express';
import { stripeService } from '../services/stripe';
import { logger } from '../utils/logger';
import { config } from '../config';
import Stripe from 'stripe';

/**
 * Handle Stripe webhook events
 * @route POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req: express.Request, res: express.Response) => {
  const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-04-30.basil',
  });
  
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    logger.error('Missing Stripe signature');
    return res.status(400).json({ message: 'Missing Stripe signature' });
  }
  
  // For Stripe webhooks, the body is a Buffer when using express.raw middleware
  const payload = req.body;
  
  if (!payload) {
    logger.error('Missing request body');
    return res.status(400).json({ message: 'Missing request body' });
  }
  
  if (!config.stripe.webhookSecret) {
    logger.error('Missing Stripe webhook secret');
    return res.status(500).json({ message: 'Server configuration error' });
  }
  
  try {
    // Verify the webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
      
      logger.info(`Webhook received: ${event.type}`);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    // Process the event based on its type
    const result = await stripeService.handleWebhookEvent(event);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return res.status(500).json({ 
      message: 'Failed to process webhook' 
    });
  }
};
