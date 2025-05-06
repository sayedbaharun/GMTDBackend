import Stripe from 'stripe';
import { config } from '../config';
import { userService } from './user';
import { logger } from '../utils/logger';
import { 
  ServiceResponse, 
  UserProfile, 
  SubscriptionStatus,
  StripeWebhookEvents
} from '../types';

// Initialize Stripe with the secret key
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-04-30.basil' as any,
});

/**
 * Service for handling Stripe operations
 */
export const stripeService = {
  /**
   * Get customer subscriptions from Stripe
   * @param customerId - Stripe customer ID
   */
  getCustomerSubscriptions: async (customerId: string) => {
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
    } catch (error: any) {
      console.error(`Error getting customer subscriptions: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get detailed subscription information from Stripe
   * @param subscriptionId - Stripe subscription ID
   */
  getSubscriptionDetails: async (subscriptionId: string) => {
    try {
      if (!stripe) {
        throw new Error('Stripe client not initialized');
      }

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: [
            'default_payment_method',
            'latest_invoice',
            'customer'
          ]
        }
      );

      return subscription;
    } catch (error: any) {
      console.error(`Error getting subscription details: ${error.message}`);
      throw error;
    }
  },

  /**
   * Cancel all of a customer's subscriptions
   * @param customerId - Stripe customer ID
   */
  cancelCustomerSubscriptions: async (customerId: string) => {
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
    } catch (error: any) {
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
        subscriptionsByProduct: {} as Record<string, number>,
        totalRecurringRevenue: 0
      };

      // Map product IDs to names for easier reference
      const productMap = products.data.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {} as Record<string, string>);

      // Calculate metrics from subscriptions
      subscriptions.data.forEach(subscription => {
        // Add to recurring revenue (convert from cents to dollars)
        metrics.totalRecurringRevenue += subscription.items.data.reduce(
          (sum, item) => sum + (item.price?.unit_amount || 0) * (item.quantity || 1) / 100,
          0
        );

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
    } catch (error: any) {
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
  createCustomer: async (
    userId: string,
    email: string,
    name?: string
  ): Promise<ServiceResponse<Stripe.Customer>> => {
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
      await userService.updateUserStripeInfo(userId, customer.id, {});
      
      return {
        success: true,
        data: customer
      };
    } catch (error: any) {
      logger.error('Create Stripe customer error:', error);
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
  createSubscription: async (
    user: UserProfile,
    priceId: string
  ): Promise<ServiceResponse<{ clientSecret: string; subscriptionId: string }>> => {
    try {
      let customerId = user.stripe_customer_id || user.stripeCustomerId;
      
      // If the user doesn't have a Stripe customer ID, create one
      if (!customerId) {
        const customerResult = await stripeService.createCustomer(
          user.id,
          user.email,
          user.fullName || user.email
        );
        
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
        customer: customerId as string,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Get the client secret for the payment intent
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice.payment_intent as any;
      
      // Update the user profile with the subscription ID
      await userService.updateUserStripeInfo(user.id, customerId as string, {
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString()
      });
      
      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret as string,
          subscriptionId: subscription.id
        }
      };
    } catch (error: any) {
      logger.error('Create subscription error:', error);
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
  getSubscriptionStatus: async (
    user: UserProfile
  ): Promise<ServiceResponse<SubscriptionStatus>> => {
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
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription_id,
        {
          expand: ['items.data.price.product']
        }
      );
      
      // Parse the subscription data
      const item = subscription.items.data[0];
      const price = item.price;
      const product = price.product as Stripe.Product;
      
      const status: SubscriptionStatus = {
        active: subscription.status === 'active',
        status: subscription.status,
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        subscription_id: subscription.id,
        product_name: product.name,
        price_id: price.id
      };
      
      return {
        success: true,
        data: status
      };
    } catch (error: any) {
      logger.error('Get subscription status error:', error);
      
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
  createCustomerPortalSession: async (
    customerId: string,
    returnUrl: string
  ): Promise<ServiceResponse<{ url: string }>> => {
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
    } catch (error: any) {
      logger.error('Create customer portal session error:', error);
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
  handleWebhookEvent: async (
    event: Stripe.Event
  ): Promise<ServiceResponse<null>> => {
    try {
      switch (event.type) {
        case StripeWebhookEvents.SUBSCRIPTION_CREATED:
          await stripeService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
          
        case StripeWebhookEvents.SUBSCRIPTION_UPDATED:
          await stripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case StripeWebhookEvents.SUBSCRIPTION_DELETED:
          await stripeService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case StripeWebhookEvents.INVOICE_PAYMENT_SUCCEEDED:
          await stripeService.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case StripeWebhookEvents.INVOICE_PAYMENT_FAILED:
          await stripeService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      logger.error(`Webhook event handler error for ${event.type}:`, error);
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
  handleSubscriptionCreated: async (
    subscription: Stripe.Subscription
  ): Promise<void> => {
    try {
      const customerId = subscription.customer as string;
      
      // Find the user with this Stripe customer ID
      const userResult = await userService.findUserByStripeCustomerId(customerId);
      
      if (!userResult.success || !userResult.data) {
        logger.error(`No user found for Stripe customer ${customerId}`);
        return;
      }
      
      // Update the user's subscription data
      await userService.updateUserStripeInfo(userResult.data.id, customerId, {
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString()
      });
      
      logger.info(`Subscription created for user ${userResult.data.id}`);
    } catch (error) {
      logger.error('handleSubscriptionCreated error:', error);
    }
  },
  
  /**
   * Handle the 'customer.subscription.updated' event
   * @param subscription - Stripe subscription
   */
  handleSubscriptionUpdated: async (
    subscription: Stripe.Subscription
  ): Promise<void> => {
    try {
      const customerId = subscription.customer as string;
      
      // Find the user with this Stripe customer ID
      const userResult = await userService.findUserByStripeCustomerId(customerId);
      
      if (!userResult.success || !userResult.data) {
        logger.error(`No user found for Stripe customer ${customerId}`);
        return;
      }
      
      // Update the user's subscription data
      await userService.updateUserStripeInfo(userResult.data.id, customerId, {
        subscription_status: subscription.status,
        subscription_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString()
      });
      
      logger.info(`Subscription updated for user ${userResult.data.id}`);
    } catch (error) {
      logger.error('handleSubscriptionUpdated error:', error);
    }
  },
  
  /**
   * Handle the 'customer.subscription.deleted' event
   * @param subscription - Stripe subscription
   */
  handleSubscriptionDeleted: async (
    subscription: Stripe.Subscription
  ): Promise<void> => {
    try {
      const customerId = subscription.customer as string;
      
      // Find the user with this Stripe customer ID
      const userResult = await userService.findUserByStripeCustomerId(customerId);
      
      if (!userResult.success || !userResult.data) {
        logger.error(`No user found for Stripe customer ${customerId}`);
        return;
      }
      
      // Update the user's subscription data
      await userService.updateUserStripeInfo(userResult.data.id, customerId, {
        subscription_status: 'canceled'
      });
      
      logger.info(`Subscription deleted for user ${userResult.data.id}`);
    } catch (error) {
      logger.error('handleSubscriptionDeleted error:', error);
    }
  },
  
  /**
   * Handle the 'invoice.payment_succeeded' event
   * @param invoice - Stripe invoice
   */
  handleInvoicePaymentSucceeded: async (
    invoice: Stripe.Invoice
  ): Promise<void> => {
    try {
      const customerId = invoice.customer as string;
      
      // Find the user with this Stripe customer ID
      const userResult = await userService.findUserByStripeCustomerId(customerId);
      
      if (!userResult.success || !userResult.data) {
        logger.error(`No user found for Stripe customer ${customerId}`);
        return;
      }
      
      // Update the user's payment date
      await userService.updateUserStripeInfo(userResult.data.id, customerId, {
        last_payment_date: new Date().toISOString()
      });
      
      logger.info(`Payment succeeded for user ${userResult.data.id}`);
    } catch (error) {
      logger.error('handleInvoicePaymentSucceeded error:', error);
    }
  },
  
  /**
   * Handle the 'invoice.payment_failed' event
   * @param invoice - Stripe invoice
   */
  handleInvoicePaymentFailed: async (
    invoice: Stripe.Invoice
  ): Promise<void> => {
    try {
      const customerId = invoice.customer as string;
      
      // Find the user with this Stripe customer ID
      const userResult = await userService.findUserByStripeCustomerId(customerId);
      
      if (!userResult.success || !userResult.data) {
        logger.error(`No user found for Stripe customer ${customerId}`);
        return;
      }
      
      // We don't need to update the subscription status as Stripe will handle that
      // and trigger a subscription.updated event
      
      logger.info(`Payment failed for user ${userResult.data.id}`);
    } catch (error) {
      logger.error('handleInvoicePaymentFailed error:', error);
    }
  }
};
