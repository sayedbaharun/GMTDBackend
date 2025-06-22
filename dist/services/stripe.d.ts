import Stripe from 'stripe';
import { User as PrismaUser } from '@prisma/client';
import { ServiceResponse, SubscriptionStatus } from '../types';
/**
 * Service for handling Stripe operations
 */
export declare const stripeService: {
    /**
     * Get customer subscriptions from Stripe
     * @param customerId - Stripe customer ID
     */
    getCustomerSubscriptions: (customerId: string) => Promise<Stripe.Subscription[]>;
    /**
     * Get detailed subscription information from Stripe
     * @param subscriptionId - Stripe subscription ID
     */
    getSubscriptionDetails: (subscriptionId: string) => Promise<Stripe.Response<Stripe.Subscription>>;
    /**
     * Cancel all of a customer's subscriptions
     * @param customerId - Stripe customer ID
     */
    cancelCustomerSubscriptions: (customerId: string) => Promise<{
        success: boolean;
    }>;
    /**
     * Get summary of all active subscriptions
     * (useful for admin dashboard)
     */
    getSubscriptionsSummary: () => Promise<{
        totalSubscriptions: number;
        subscriptionsByProduct: Record<string, number>;
        totalRecurringRevenue: number;
    }>;
    /**
     * Create a Stripe customer
     * @param userId - User ID
     * @param email - User email
     * @param name - User full name
     */
    createCustomer: (userId: string, email: string, name?: string) => Promise<ServiceResponse<Stripe.Customer>>;
    /**
     * Create a subscription for a user
     * @param user - Prisma User object
     * @param priceId - Stripe price ID
     */
    createSubscription: (user: PrismaUser, priceId: string) => Promise<ServiceResponse<{
        clientSecret: string;
        subscriptionId: string;
    }>>;
    /**
     * Get the subscription status for a user
     * @param user - User profile
     */
    getSubscriptionStatus: (user: PrismaUser) => Promise<ServiceResponse<SubscriptionStatus>>;
    /**
     * Create a Stripe Customer Portal session
     * @param customerId - Stripe customer ID
     * @param returnUrl - URL to return to after the session
     */
    createCustomerPortalSession: (customerId: string, returnUrl: string) => Promise<ServiceResponse<{
        url: string;
    }>>;
    /**
     * Handle Stripe webhook events
     * @param event - Stripe event
     */
    handleWebhookEvent: (event: Stripe.Event) => Promise<ServiceResponse<null>>;
    /**
     * Handle the 'customer.subscription.created' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionCreated: (subscription: Stripe.Subscription) => Promise<void>;
    /**
     * Handle the 'customer.subscription.updated' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionUpdated: (subscription: Stripe.Subscription) => Promise<void>;
    /**
     * Handle the 'customer.subscription.deleted' event
     * @param subscription - Stripe subscription
     */
    handleSubscriptionDeleted: (subscription: Stripe.Subscription) => Promise<void>;
    /**
     * Handle the 'invoice.payment_succeeded' event
     * @param invoice - Stripe invoice
     */
    handleInvoicePaymentSucceeded: (invoice: Stripe.Invoice) => Promise<void>;
    /**
     * Handle the 'invoice.payment_failed' event
     * @param invoice - Stripe invoice
     */
    handleInvoicePaymentFailed: (invoice: Stripe.Invoice) => Promise<void>;
    /**
     * Create a Stripe Checkout Session for membership purchases
     * @param options - Checkout session configuration
     */
    createCheckoutSession: (options: {
        customerId: string;
        priceId: string;
        planName: string;
        successUrl: string;
        cancelUrl: string;
        metadata?: Record<string, string>;
    }) => Promise<ServiceResponse<Stripe.Checkout.Session>>;
};
