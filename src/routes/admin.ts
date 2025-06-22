import * as express from 'express';
const Router = express.Router;
import { authenticateAndSyncUser, isAdmin } from '../middleware/auth';
import * as adminController from '../controllers/admin';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/errorHandler';
// import { validate } from '../middleware/validation'; // Import if you add validation schemas for admin updates

const router = Router();

/**
 * Admin Routes - All protected by authentication and admin role middleware
 */
// Authentication middleware for admin routes
router.use(authenticateAndSyncUser); // Ensures user is logged in
router.use(isAdmin);      // Ensures user is an admin
router.use(rateLimiter);  // Apply rate limiting to all admin routes

// User management endpoints
router.get('/users', asyncHandler(adminController.getAllUsers)); 
router.get('/users/:userId', asyncHandler(adminController.getUserById));
router.put('/users/:userId', asyncHandler(adminController.updateUser)); // Consider adding validate() middleware here if you have a Zod schema for admin user updates
router.delete('/users/:userId', asyncHandler(adminController.deleteUser));

// Dashboard and statistics
router.get('/dashboard', asyncHandler(adminController.getDashboardStats));
router.get('/stats', asyncHandler(adminController.getAdminStats)); // Frontend expects /stats
router.get('/activity', asyncHandler(adminController.getRecentActivity)); // Frontend expects /activity
router.get('/subscriptions', asyncHandler(adminController.getAllSubscriptions));
router.get('/bookings', asyncHandler(adminController.getAllBookings));

// System Logs (currently mocked in controller)
router.get('/logs', asyncHandler(adminController.getSystemLogs));

export default router;
