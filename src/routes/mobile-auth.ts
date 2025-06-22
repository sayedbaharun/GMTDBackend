/**
 * Mobile Authentication Routes with JWT
 * For mobile app authentication
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { authenticateMobile } from '../middleware/mobileAuth';
import { MobileAuthRequest } from '../middleware/mobileAuth';

const router = Router();
const prisma = new PrismaClient();

// Simple health check for mobile auth
router.get('/health', (req, res): void => {
  res.json({
    success: true,
    message: 'Mobile auth endpoints are working',
    timestamp: new Date().toISOString()
  });
});


// Shared login handler function
async function loginHandler(req: any, res: any): Promise<void> {
  try {
    const { email, name, password } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    // Create or find user
    let user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          fullName: name || email.split('@')[0],
          auth0Id: `mobile-${Date.now()}`,
          onboardingComplete: false
        }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Get user with relations
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        preferences: true,
        adminUser: true
      }
    });

    // Generate JWT token
    const token = generateToken(fullUser);

    res.json({
      success: true,
      user: fullUser,
      token,
      needsOnboarding: !user.onboardingComplete,
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
}

// Main login endpoint
router.post('/login', loginHandler);

// Keep test-login for backward compatibility
router.post('/test-login', loginHandler);

// Register endpoint
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { email, name, password } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        fullName: name || email.split('@')[0],
        auth0Id: `mobile-${Date.now()}`,
        onboardingComplete: false
      }
    });

    // Get user with relations
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        preferences: true,
        adminUser: true
      }
    });

    // Generate JWT token
    const token = generateToken(fullUser);

    res.json({
      success: true,
      user: fullUser,
      token,
      needsOnboarding: true,
      message: 'Registration successful'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token is valid'
  });
});

// Update profile (protected route)
router.post('/profile', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const { email, profileData } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: profileData.fullName,
        phone: profileData.phone,
        onboardingComplete: profileData.onboardingComplete || false
      }
    });

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        title: profileData.title,
        bio: profileData.bio,
        preferences: profileData.preferences
      },
      create: {
        userId: user.id,
        title: profileData.title,
        bio: profileData.bio,
        preferences: profileData.preferences
      }
    });

    res.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error('Test profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed',
      details: error.message
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
      return;
    }

    // For now, verify the existing token and issue a new one if it's valid
    // In production, you'd have separate refresh tokens with longer expiry
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        preferences: true,
        adminUser: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      token: newToken,
      user,
      message: 'Token refreshed successfully'
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    // For JWT tokens, logout is typically handled client-side by removing the token
    // In production, you might maintain a token blacklist
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
});

// Get user info
router.get('/test-me/:email', async (req, res): Promise<void> => {
  try {
    const { email } = req.params;
    
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        profile: true,
        preferences: true,
        adminUser: true,
        bookings: {
          take: 5,
          orderBy: { id: 'desc' }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      details: error.message
    });
  }
});

export default router;