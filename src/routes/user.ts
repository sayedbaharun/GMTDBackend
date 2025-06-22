import * as express from 'express';
const Router = express.Router;

import { getProfile, updateProfile } from '../controllers/user';
import { 
  getDashboardOverview,
  getBookingHistory,
  getActivityTimeline,
  getTravelPreferences,
  updateTravelPreferences
} from '../controllers/userDashboard';
import { authenticateAndSyncUser } from '../middleware/auth';
import { userProfileValidation, validate } from '../middleware/validation';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * User Routes
 * Profile and Dashboard endpoints
 */

// Authentication middleware for all user routes
router.use(authenticateAndSyncUser);

// Profile routes
router.get('/profile', createRouteHandler(getProfile));
router.put(
  '/profile',
  validate(userProfileValidation.update),
  createRouteHandler(updateProfile)
);

// Dashboard routes
router.get('/dashboard', createRouteHandler(getDashboardOverview));
router.get('/dashboard/bookings', createRouteHandler(getBookingHistory));
router.get('/dashboard/timeline', createRouteHandler(getActivityTimeline));
router.get('/dashboard/preferences', createRouteHandler(getTravelPreferences));
router.put('/dashboard/preferences', createRouteHandler(updateTravelPreferences));

export default router;
