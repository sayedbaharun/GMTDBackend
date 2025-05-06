import { supabaseAdmin } from './supabase';
import { logger } from '../utils/logger';
import { ServiceResponse, UserProfile } from '../types';

/**
 * Service for handling user profile operations
 */
export const userService = {
  /**
   * Get a user profile by ID
   * @param userId - User ID
   */
  getUserProfile: async (
    userId: string
  ): Promise<ServiceResponse<UserProfile>> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        logger.error('Get user profile error:', error);
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
    } catch (error: any) {
      logger.error('Get user profile service error:', error);
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
  updateUserProfile: async (
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<ServiceResponse<UserProfile>> => {
    try {
      // Add updated_at timestamp
      const dataToUpdate = {
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', userId)
        .select('*')
        .single();
      
      if (error) {
        logger.error('Update user profile error:', error);
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
    } catch (error: any) {
      logger.error('Update user profile service error:', error);
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
  updateUserStripeInfo: async (
    userId: string,
    stripeCustomerId: string,
    subscriptionData: {
      subscription_id?: string;
      subscription_status?: string;
      subscription_current_period_start?: string;
      subscription_current_period_end?: string;
      last_payment_date?: string;
    }
  ): Promise<ServiceResponse<UserProfile>> => {
    try {
      const dataToUpdate = {
        stripe_customer_id: stripeCustomerId,
        ...subscriptionData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', userId)
        .select('*')
        .single();
      
      if (error) {
        logger.error('Update user stripe info error:', error);
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
    } catch (error: any) {
      logger.error('Update user stripe info service error:', error);
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
  findUserByStripeCustomerId: async (
    stripeCustomerId: string
  ): Promise<ServiceResponse<UserProfile>> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();
      
      if (error) {
        logger.error('Find user by Stripe customer ID error:', error);
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
    } catch (error: any) {
      logger.error('Find user by Stripe customer ID service error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }
};
