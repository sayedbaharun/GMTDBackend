"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOptional = exports.requireOnboardingComplete = exports.authenticate = void 0;
const types_1 = require("../types");
const supabase_1 = require("../services/supabase");
const logger_1 = require("../utils/logger");
/**
 * Middleware to authenticate requests using Supabase token
 * Extracts JWT from Authorization header and validates it
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new types_1.ApiError('Authorization header is required', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new types_1.ApiError('Bearer token is required', 401);
        }
        // Verify the token and get user data
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            logger_1.logger.error('Token verification failed:', error);
            throw new types_1.ApiError('Invalid or expired token', 401);
        }
        // Get the user profile from the database
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            logger_1.logger.error('User profile not found:', profileError);
            throw new types_1.ApiError('User profile not found', 404);
        }
        // Attach the user profile to the request
        req.user = profile;
        next();
    }
    catch (error) {
        if (error instanceof types_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        logger_1.logger.error('Authentication error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to check if onboarding is complete
 * Used to protect routes that require completed onboarding
 */
const requireOnboardingComplete = (req, res, next) => {
    try {
        if (!req.user) {
            throw new types_1.ApiError('Authentication required', 401);
        }
        if (!req.user.onboardingComplete) {
            throw new types_1.ApiError('Onboarding not completed', 403);
        }
        next();
    }
    catch (error) {
        if (error instanceof types_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.requireOnboardingComplete = requireOnboardingComplete;
/**
 * Optional authentication middleware - tries to authenticate the user
 * but allows the request to proceed even if authentication fails
 * Use this for endpoints that can work with or without authentication
 */
const authenticateOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // If no Authorization header, continue without authentication
        if (!authHeader) {
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        // If no token, continue without authentication
        if (!token) {
            next();
            return;
        }
        // Try to verify the token and get user data
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            // If token verification fails, continue without authentication
            logger_1.logger.warn('Token verification failed, proceeding without authentication:', error);
            next();
            return;
        }
        // Get the user profile from the database
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            // If profile retrieval fails, continue without authentication
            logger_1.logger.warn('User profile not found, proceeding without authentication:', profileError);
            next();
            return;
        }
        // Attach the user profile to the request
        req.user = profile;
        next();
    }
    catch (error) {
        // For any unexpected errors, log and continue without authentication
        logger_1.logger.error('Optional authentication error, proceeding without authentication:', error);
        next();
    }
};
exports.authenticateOptional = authenticateOptional;
//# sourceMappingURL=auth.js.map