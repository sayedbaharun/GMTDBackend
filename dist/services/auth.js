"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const supabase_1 = require("./supabase");
const stripe_1 = require("./stripe");
const logger_1 = require("../utils/logger");
/**
 * Service for handling authentication operations
 */
exports.authService = {
    /**
     * Register a new user with Supabase Auth
     * @param email - User email
     * @param password - User password
     * @param fullName - User's full name
     */
    registerUser: async (email, password, fullName) => {
        try {
            // Create the user in Supabase Auth
            const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Auto-confirm email for simplicity
                user_metadata: {
                    full_name: fullName
                }
            });
            if (authError) {
                logger_1.logger.error('Registration error:', authError);
                return {
                    success: false,
                    error: authError.message,
                    statusCode: 400
                };
            }
            // The profile is automatically created via the Supabase trigger
            // Create a Stripe customer for the user
            if (authData.user) {
                const { data: profile } = await supabase_1.supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();
                if (profile) {
                    // Create Stripe customer
                    const stripeResult = await stripe_1.stripeService.createCustomer(profile.id, email, fullName);
                    if (!stripeResult.success) {
                        logger_1.logger.error('Failed to create Stripe customer', stripeResult.error);
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
        }
        catch (error) {
            logger_1.logger.error('Registration service error:', error);
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
    loginUser: async (email, password) => {
        try {
            const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                logger_1.logger.error('Login error:', error);
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
        }
        catch (error) {
            logger_1.logger.error('Login service error:', error);
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
    logoutUser: async (token) => {
        try {
            const { error } = await supabase_1.supabaseAdmin.auth.admin.signOut(token);
            if (error) {
                logger_1.logger.error('Logout error:', error);
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
        }
        catch (error) {
            logger_1.logger.error('Logout service error:', error);
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
    resetPassword: async (email) => {
        try {
            const { error } = await supabase_1.supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
            });
            if (error) {
                logger_1.logger.error('Password reset error:', error);
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
        }
        catch (error) {
            logger_1.logger.error('Password reset service error:', error);
            return {
                success: false,
                error: error.message,
                statusCode: 500
            };
        }
    }
};
//# sourceMappingURL=auth.js.map