import { User } from '@prisma/client';
import { ServiceResponse } from '../types';
interface Auth0UserProfile {
    sub: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
}
/**
 * Service for handling user synchronization with Auth0
 */
export declare const authService: {
    /**
     * Finds an existing user or creates a new one based on Auth0 profile.
     * Also creates a Stripe customer for new users.
     * @param auth0Profile - The user profile object from Auth0 (typically from a validated ID token).
     */
    getOrCreateUserFromAuth0: (auth0Profile: Auth0UserProfile) => Promise<ServiceResponse<User>>;
    /**
     * Retrieves a user from the local database by their Auth0 ID.
     * @param auth0Id - The Auth0 user ID (sub).
     */
    getUserByAuth0Id: (auth0Id: string) => Promise<ServiceResponse<User | null>>;
    /**
     * Retrieves a user from the local database by their internal database ID.
     * @param userId - The internal database user ID.
     */
    getUserById: (userId: string) => Promise<ServiceResponse<User | null>>;
};
export {};
