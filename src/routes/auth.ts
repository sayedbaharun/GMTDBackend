import * as express from 'express';
const Router = express.Router;
import passport from 'passport';
import { validateAccessToken, syncUserWithDb } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
// Google redirects here after user authentication
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login-failed', // Redirect to a generic login failed page or frontend route
    // successRedirect: '/dashboard', // Or a frontend route like '/auth/success' that handles session
  }),
  (req, res) => {
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
  }
);

// Route for frontend to check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout route
router.post('/logout', (req, res, next) => {
  req.logout((err) => { // req.logout now requires a callback
    if (err) {
      return next(err);
    }
    req.session.destroy((destroyErr) => { // Destroy the session
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
router.post('/mobile/login', validateAccessToken, syncUserWithDb, async (req: any, res) => {
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
  } catch (error: any) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Mobile app profile creation/update endpoint
router.post('/mobile/profile', validateAccessToken, syncUserWithDb, async (req: any, res) => {
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
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
});

// Get current user info (for app initialization)
router.get('/mobile/me', validateAccessToken, syncUserWithDb, async (req: any, res) => {
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
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// Mobile onboarding completion endpoint
router.post('/mobile/complete-onboarding', validateAccessToken, syncUserWithDb, async (req: any, res) => {
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
  } catch (error: any) {
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

export default router;
