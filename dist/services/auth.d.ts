import { ServiceResponse } from '../types';
/**
 * Service for handling authentication operations
 */
export declare const authService: {
    /**
     * Register a new user with Supabase Auth
     * @param email - User email
     * @param password - User password
     * @param fullName - User's full name
     */
    registerUser: (email: string, password: string, fullName: string) => Promise<ServiceResponse<any>>;
    /**
     * Login a user with Supabase Auth
     * @param email - User email
     * @param password - User password
     */
    loginUser: (email: string, password: string) => Promise<ServiceResponse<any>>;
    /**
     * Logout a user with Supabase Auth
     * @param token - JWT token from the Authorization header
     */
    logoutUser: (token: string) => Promise<ServiceResponse<null>>;
    /**
     * Request a password reset for a user
     * @param email - User email
     */
    resetPassword: (email: string) => Promise<ServiceResponse<null>>;
};
