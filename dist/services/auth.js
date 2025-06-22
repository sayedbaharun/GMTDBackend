"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const stripe_1 = require("./stripe");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Service for handling user synchronization with Auth0
 */
exports.authService = {
    /**
     * Finds an existing user or creates a new one based on Auth0 profile.
     * Also creates a Stripe customer for new users.
     * @param auth0Profile - The user profile object from Auth0 (typically from a validated ID token).
     */
    getOrCreateUserFromAuth0: async (auth0Profile) => {
        if (!auth0Profile.sub) {
            logger_1.logger.error('Auth0 user ID (sub) is missing from profile.');
            return {
                success: false,
                error: 'Auth0 user ID (sub) is required.',
                statusCode: 400,
            };
        }
        if (!auth0Profile.email) {
            logger_1.logger.warn('Auth0 user email is missing from profile.');
            // Depending on your policy, you might want to reject this
            // or proceed with a placeholder/allow update later.
            // For now, we'll proceed but log a warning.
        }
        try {
            let user = await prisma.user.findUnique({
                where: { auth0Id: auth0Profile.sub },
            });
            if (user) {
                // Optionally, update user details if they've changed in Auth0
                // For example, if email_verified status or name changes.
                // For now, we'll just return the existing user.
                logger_1.logger.info('User found with Auth0 ID: ' + auth0Profile.sub);
                return { success: true, data: user };
            }
            // User not found, create a new one
            logger_1.logger.info('Creating new user for Auth0 ID: ' + auth0Profile.sub);
            const newUser = await prisma.user.create({
                data: {
                    auth0Id: auth0Profile.sub,
                    email: auth0Profile.email || 'user_' + auth0Profile.sub + '@gmtd.example.com', // Use a placeholder if email is missing
                    fullName: auth0Profile.name,
                    isEmailVerified: auth0Profile.email_verified || false,
                    // Initialize other fields as per your User model defaults
                    onboardingStep: 'auth0_signup_complete',
                },
            });
            // Create a Stripe customer for the new user
            const stripeResult = await stripe_1.stripeService.createCustomer(newUser.id, // Use our internal DB user ID
            newUser.email, newUser.fullName ?? undefined // Pass undefined if fullName is null
            );
            if (!stripeResult.success || !stripeResult.data?.id) {
                logger_1.logger.error('Failed to create Stripe customer for user ' + newUser.id + ': ' + stripeResult.error);
                // Decide on error handling:
                // Option 1: Rollback user creation (more complex)
                // Option 2: Log error and proceed (user exists, but Stripe customer creation failed)
                // For now, we'll log and proceed, but this should be reviewed.
                // Consider a background job to retry Stripe customer creation.
            }
            else {
                // Update user with Stripe Customer ID
                await prisma.user.update({
                    where: { id: newUser.id },
                    data: { stripeCustomerId: stripeResult.data.id },
                });
                logger_1.logger.info('Stripe customer created for user ' + newUser.id + ': ' + stripeResult.data.id);
            }
            return { success: true, data: newUser };
        }
        catch (error) {
            logger_1.logger.error('Error in getOrCreateUserFromAuth0:', error);
            if (error.code === 'P2002' && error.meta?.target?.includes('auth0Id')) {
                return {
                    success: false,
                    error: 'A user with this Auth0 ID already exists.',
                    statusCode: 409, // Conflict
                };
            }
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                // This case might happen if an email exists but with a different auth0Id
                // Or if a previous user creation attempt failed after Prisma write but before commit.
                logger_1.logger.error('A user with email ' + auth0Profile.email + ' might already exist with a different Auth0 ID or due to a partial previous transaction.');
                return {
                    success: false,
                    error: 'A user with this email may already exist or there was an issue creating the user.',
                    statusCode: 409, // Conflict
                };
            }
            return {
                success: false,
                error: 'Failed to get or create user: ' + error.message,
                statusCode: 500,
            };
        }
    },
    /**
     * Retrieves a user from the local database by their Auth0 ID.
     * @param auth0Id - The Auth0 user ID (sub).
     */
    getUserByAuth0Id: async (auth0Id) => {
        if (!auth0Id) {
            return { success: false, error: 'Auth0 ID is required.', statusCode: 400 };
        }
        try {
            const user = await prisma.user.findUnique({
                where: { auth0Id },
            });
            if (!user) {
                return { success: false, error: 'User not found.', statusCode: 404, data: null };
            }
            return { success: true, data: user };
        }
        catch (error) {
            logger_1.logger.error('Error fetching user by Auth0 ID ' + auth0Id + ':', error);
            return { success: false, error: 'Database error while fetching user.', statusCode: 500 };
        }
    },
    /**
     * Retrieves a user from the local database by their internal database ID.
     * @param userId - The internal database user ID.
     */
    getUserById: async (userId) => {
        if (!userId) {
            return { success: false, error: 'User ID is required.', statusCode: 400 };
        }
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                }
            });
            if (!user) {
                return { success: false, error: 'User not found.', statusCode: 404, data: null };
            }
            return { success: true, data: user };
        }
        catch (error) {
            logger_1.logger.error('Error fetching user by ID ' + userId + ':', error);
            return { success: false, error: 'Database error while fetching user.', statusCode: 500 };
        }
    }
};
//# sourceMappingURL=auth.js.map