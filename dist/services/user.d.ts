import { ServiceResponse, UserProfile } from '../types';
/**
 * Service for handling user profile operations
 */
export declare const userService: {
    /**
     * Get a user profile by ID
     * @param userId - User ID
     */
    getUserProfile: (userId: string) => Promise<ServiceResponse<UserProfile>>;
    /**
     * Update a user profile
     * @param userId - User ID
     * @param profileData - Profile data to update
     */
    updateUserProfile: (userId: string, profileData: Partial<UserProfile>) => Promise<ServiceResponse<UserProfile>>;
    /**
     * Update user profile with Stripe information
     * @param userId - User ID
     * @param stripeCustomerId - Stripe customer ID
     * @param subscriptionData - Subscription data to update
     */
    updateUserStripeInfo: (userId: string, stripeCustomerId: string, subscriptionData: {
        subscription_id?: string;
        subscription_status?: string;
        subscription_current_period_start?: string;
        subscription_current_period_end?: string;
        last_payment_date?: string;
    }) => Promise<ServiceResponse<UserProfile>>;
    /**
     * Find a user by Stripe customer ID
     * @param stripeCustomerId - Stripe customer ID
     */
    findUserByStripeCustomerId: (stripeCustomerId: string) => Promise<ServiceResponse<UserProfile>>;
};
