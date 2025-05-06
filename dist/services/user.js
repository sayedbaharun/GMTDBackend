"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const supabase_1 = require("./supabase");
const logger_1 = require("../utils/logger");
/**
 * Service for handling user profile operations
 */
exports.userService = {
    /**
     * Get a user profile by ID
     * @param userId - User ID
     */
    getUserProfile: async (userId) => {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                logger_1.logger.error('Get user profile error:', error);
                return {
                    success: false,
                    error: error.message,
                    statusCode: 404
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            logger_1.logger.error('Get user profile service error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    },
    /**
     * Update a user profile
     * @param userId - User ID
     * @param profileData - Profile data to update
     */
    updateUserProfile: async (userId, profileData) => {
        try {
            // Add updated_at timestamp
            const dataToUpdate = {
                ...profileData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .update(dataToUpdate)
                .eq('id', userId)
                .select('*')
                .single();
            if (error) {
                logger_1.logger.error('Update user profile error:', error);
                return {
                    success: false,
                    error: error.message,
                    statusCode: 400
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            logger_1.logger.error('Update user profile service error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    },
    /**
     * Update user profile with Stripe information
     * @param userId - User ID
     * @param stripeCustomerId - Stripe customer ID
     * @param subscriptionData - Subscription data to update
     */
    updateUserStripeInfo: async (userId, stripeCustomerId, subscriptionData) => {
        try {
            const dataToUpdate = {
                stripe_customer_id: stripeCustomerId,
                ...subscriptionData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .update(dataToUpdate)
                .eq('id', userId)
                .select('*')
                .single();
            if (error) {
                logger_1.logger.error('Update user stripe info error:', error);
                return {
                    success: false,
                    error: error.message,
                    statusCode: 400
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            logger_1.logger.error('Update user stripe info service error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    },
    /**
     * Find a user by Stripe customer ID
     * @param stripeCustomerId - Stripe customer ID
     */
    findUserByStripeCustomerId: async (stripeCustomerId) => {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('stripe_customer_id', stripeCustomerId)
                .single();
            if (error) {
                logger_1.logger.error('Find user by Stripe customer ID error:', error);
                return {
                    success: false,
                    error: error.message,
                    statusCode: 404
                };
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            logger_1.logger.error('Find user by Stripe customer ID service error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    }
};
//# sourceMappingURL=user.js.map