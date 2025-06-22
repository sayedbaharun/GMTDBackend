/**
 * Simple JWT Authentication Middleware for Mobile App
 * This is separate from Auth0 and used specifically for mobile authentication
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

const prisma = new PrismaClient();

// Extend Request type to include user
export interface MobileAuthRequest extends Request {
  user?: any;
  userId?: string;
}

/**
 * Middleware to authenticate mobile app requests
 */
export const authenticateMobile = async (
  req: MobileAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
      return;
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        preferences: true,
        adminUser: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid authentication token'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const authenticateMobileOptional = async (
  req: MobileAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      // No token, proceed without user
      return next();
    }

    // Try to verify token
    const payload = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        preferences: true,
        adminUser: true
      }
    });

    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Token invalid, but continue anyway for optional auth
    console.log('Optional auth failed:', error);
  }
  
  next();
};

/**
 * Require onboarding to be complete
 */
export const requireOnboarding = (
  req: MobileAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!req.user.onboardingComplete) {
    res.status(403).json({
      success: false,
      error: 'Please complete onboarding first',
      needsOnboarding: true
    });
    return;
  }

  next();
};

/**
 * Require admin access
 */
export const requireAdmin = (
  req: MobileAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  next();
};