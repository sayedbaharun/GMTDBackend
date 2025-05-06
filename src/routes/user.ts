import * as express from 'express';
const Router = express.Router;

import { getProfile, updateProfile } from '../controllers/user';
import { authenticate } from '../middleware/auth';
import { userProfileValidation, validate } from '../middleware/validation';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * User Profile Routes
 * GET /api/user/profile - Get the current user's profile
 * PUT /api/user/profile - Update the current user's profile
 */

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', createRouteHandler(getProfile));

// Update current user profile
router.put(
  '/profile',
  validate(userProfileValidation.update),
  createRouteHandler(updateProfile)
);

export default router;
