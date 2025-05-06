import * as express from 'express';
const Router = express.Router;

import { 
  register, 
  login, 
  logout, 
  resetPassword 
} from '../controllers/auth';
import { authValidation, validate } from '../middleware/validation';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Authentication Routes
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login an existing user
 * POST /api/auth/logout - Logout the current user
 * POST /api/auth/reset-password - Request a password reset
 */

// Apply rate limiting for auth routes
router.use(authRateLimiter);

// Register a new user
router.post(
  '/register',
  validate(authValidation.register),
  createRouteHandler(register)
);

// Login an existing user
router.post(
  '/login',
  validate(authValidation.login),
  createRouteHandler(login)
);

// Logout the current user
router.post('/logout', createRouteHandler(logout));

// Request a password reset (with specific rate limiter)
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(authValidation.resetPassword),
  createRouteHandler(resetPassword)
);

export default router;
