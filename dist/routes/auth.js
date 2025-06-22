"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const Router = express.Router;
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Comment out or remove old controller imports if they are Supabase-specific
/*
import {
  register,
  login,
  logout,
  resetPassword
} from '../controllers/auth';
*/
// import { authValidation, validate } from '../middleware/validation'; // Assuming validation was for old forms
// import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter'; // Rate limiting can be added back later
// import { createRouteHandler } from '../utils/errorHandler'; // May not be needed if using passport directly
const router = Router();
/**
 * NEW Authentication Routes for Google OAuth
 */
// Route to start Google OAuth flow
// User clicks a "Login with Google" button which directs to this endpoint
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback route
// Google redirects here after user authentication
router.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/login-failed', // Redirect to a generic login failed page or frontend route
    // successRedirect: '/dashboard', // Or a frontend route like '/auth/success' that handles session
}), (req, res) => {
    // Successful authentication.
    // req.user should be populated by Passport with the user object from your DB.
    // Redirect to a frontend page, e.g., dashboard or a specific post-login page.
    // The frontend will then have the session cookie.
    // For SPAs, you might just send a success status and let the frontend handle routing.
    // res.redirect('http://localhost:3000/dashboard'); // Example: Redirect to frontend dashboard
    res.json({
        message: 'Successfully authenticated with Google!',
        user: req.user
    });
    // Or better: res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000/dashboard');
});
// Route for frontend to check authentication status
router.get('/status', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
    }
    else {
        res.json({ isAuthenticated: false });
    }
});
// Logout route
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                // Log error, but still attempt to clear cookie and send success
                console.error('Session destruction error:', destroyErr);
            }
            res.clearCookie('connect.sid'); // Clear the session cookie (name might vary based on session store)
            res.status(200).json({ message: 'Successfully logged out' });
        });
    });
});
// Placeholder for login failure (frontend could have a route for this)
router.get('/login-failed', (req, res) => {
    res.status(401).json({ message: 'Google authentication failed.' });
});
// =====================================================
// MOBILE APP AUTH ENDPOINTS
// =====================================================
/**
 * Mobile Auth Flow:
 * 1. Mobile app uses Auth0 React Native SDK
 * 2. Gets Auth0 access token
 * 3. Sends token to these endpoints
 * 4. Backend validates token and syncs user
 */
// Dependencies already imported at top of file
// Mobile app login endpoint - validates Auth0 token and returns user data
router.post('/mobile/login', auth_1.validateAccessToken, auth_1.syncUserWithDb, async (req, res) => {
    try {
        const user = req.user;
        // Update last login time
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Get user with profile data
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                profile: true,
                preferences: true,
                adminUser: true
            }
        });
        res.json({
            success: true,
            user: fullUser,
            needsOnboarding: !user.onboardingComplete
        });
    }
    catch (error) {
        console.error('Mobile login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});
// Mobile app profile creation/update endpoint
router.post('/mobile/profile', auth_1.validateAccessToken, auth_1.syncUserWithDb, async (req, res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;
        // Update user basic info
        await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: profileData.fullName,
                phone: profileData.phone,
                onboardingComplete: profileData.onboardingComplete || false
            }
        });
        // Create or update profile
        const profile = await prisma.profile.upsert({
            where: { userId },
            update: {
                title: profileData.title,
                bio: profileData.bio,
                avatarUrl: profileData.avatarUrl,
                preferences: profileData.preferences
            },
            create: {
                userId,
                title: profileData.title,
                bio: profileData.bio,
                avatarUrl: profileData.avatarUrl,
                preferences: profileData.preferences
            }
        });
        res.json({
            success: true,
            profile
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Profile update failed'
        });
    }
});
// Get current user info (for app initialization)
router.get('/mobile/me', auth_1.validateAccessToken, auth_1.syncUserWithDb, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                profile: true,
                preferences: true,
                adminUser: true
            }
        });
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user info'
        });
    }
});
// Mobile onboarding completion endpoint
router.post('/mobile/complete-onboarding', auth_1.validateAccessToken, auth_1.syncUserWithDb, async (req, res) => {
    try {
        const userId = req.user.id;
        const onboardingData = req.body;
        // Update user onboarding status
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                onboardingComplete: true,
                goals: onboardingData.goals || [],
                industry: onboardingData.industry,
                role: onboardingData.role
            }
        });
        // Create user preferences if provided
        if (onboardingData.preferences) {
            await prisma.userPreferences.upsert({
                where: { userId },
                update: onboardingData.preferences,
                create: {
                    userId,
                    ...onboardingData.preferences
                }
            });
        }
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Onboarding completion error:', error);
        res.status(500).json({
            success: false,
            error: 'Onboarding completion failed'
        });
    }
});
// Comment out or remove old routes
/*
router.use(authRateLimiter);
router.post(
  '/register',
  validate(authValidation.register),
  createRouteHandler(register)
);
router.post(
  '/login',
  validate(authValidation.login),
  createRouteHandler(login)
);
router.post('/logout', createRouteHandler(logout)); // This was the old logout
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(authValidation.resetPassword),
  createRouteHandler(resetPassword)
);
*/
exports.default = router;
//# sourceMappingURL=auth.js.map