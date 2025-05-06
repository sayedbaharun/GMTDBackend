import { supabaseAdmin } from './supabase';
import { stripeService } from './stripe';
import { logger } from '../utils/logger';
import { ServiceResponse } from '../types';

/**
 * Service for handling authentication operations
 */
export const authService = {
  /**
   * Register a new user with Supabase Auth
   * @param email - User email
   * @param password - User password
   * @param fullName - User's full name
   */
  registerUser: async (
    email: string, 
    password: string, 
    fullName: string
  ): Promise<ServiceResponse<any>> => {
    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for simplicity
        user_metadata: {
          full_name: fullName
        }
      });
      
      if (authError) {
        logger.error('Registration error:', authError);
        return {
          success: false,
          error: authError.message,
          statusCode: 400
        };
      }
      
      // The profile is automatically created via the Supabase trigger
      // Create a Stripe customer for the user
      if (authData.user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profile) {
          // Create Stripe customer
          const stripeResult = await stripeService.createCustomer(
            profile.id,
            email,
            fullName
          );
          
          if (!stripeResult.success) {
            logger.error('Failed to create Stripe customer', stripeResult.error);
            // Don't fail registration if Stripe fails, just log it
          }
        }
      }
      
      return {
        success: true,
        data: {
          id: authData.user?.id,
          email: authData.user?.email
        }
      };
    } catch (error: any) {
      logger.error('Registration service error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  },
  
  /**
   * Login a user with Supabase Auth
   * @param email - User email
   * @param password - User password
   */
  loginUser: async (
    email: string, 
    password: string
  ): Promise<ServiceResponse<any>> => {
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.error('Login error:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 401
        };
      }
      
      return {
        success: true,
        data: {
          session: data.session,
          user: data.user
        }
      };
    } catch (error: any) {
      logger.error('Login service error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  },
  
  /**
   * Logout a user with Supabase Auth
   * @param token - JWT token from the Authorization header
   */
  logoutUser: async (
    token: string
  ): Promise<ServiceResponse<null>> => {
    try {
      const { error } = await supabaseAdmin.auth.admin.signOut(token);
      
      if (error) {
        logger.error('Logout error:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      logger.error('Logout service error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  },
  
  /**
   * Request a password reset for a user
   * @param email - User email
   */
  resetPassword: async (
    email: string
  ): Promise<ServiceResponse<null>> => {
    try {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      });
      
      if (error) {
        logger.error('Password reset error:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      logger.error('Password reset service error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }
};
