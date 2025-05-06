import express, { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiError } from '../types';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate requests using Supabase token
 * Extracts JWT from Authorization header and validates it
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new ApiError('Authorization header is required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Bearer token is required', 401);
    }

    // Verify the token and get user data
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.error('Token verification failed:', error);
      throw new ApiError('Invalid or expired token', 401);
    }

    // Get the user profile from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('User profile not found:', profileError);
      throw new ApiError('User profile not found', 404);
    }

    // Attach the user profile to the request
    req.user = profile;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

/**
 * Middleware to check if onboarding is complete
 * Used to protect routes that require completed onboarding
 */
export const requireOnboardingComplete = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!req.user.onboardingComplete) {
      throw new ApiError('Onboarding not completed', 403);
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Optional authentication middleware - tries to authenticate the user
 * but allows the request to proceed even if authentication fails
 * Use this for endpoints that can work with or without authentication
 */
export const authenticateOptional = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // If token verification fails, continue without authentication
      logger.warn('Token verification failed, proceeding without authentication:', error);
      next();
      return;
    }

    // Get the user profile from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // If profile retrieval fails, continue without authentication
      logger.warn('User profile not found, proceeding without authentication:', profileError);
      next();
      return;
    }

    // Attach the user profile to the request
    req.user = profile;
    next();
  } catch (error) {
    // For any unexpected errors, log and continue without authentication
    logger.error('Optional authentication error, proceeding without authentication:', error);
    next();
  }
};
