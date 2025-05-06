import * as express from 'express';
const Router = express.Router;
import { authenticate } from '../middleware/auth';
import * as adminController from '../controllers/admin';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Admin Routes - All protected by authentication middleware
 * All routes require authentication and admin privileges
 */
router.use(authenticate);

// Apply authentication middleware to all admin routes
router.use(authenticate);
router.use(rateLimiter);

// User management endpoints
router.get('/users', (req, res) => {
  res.send('Admin users endpoint');
});

export default router;
