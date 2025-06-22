import * as express from 'express';
const Router = express.Router;

import { getHealthStatus, getReadinessStatus, getLivenessStatus } from '../controllers/health';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Health Routes
 * GET /api/health - Check system health status
 * GET /api/health/ready - Readiness probe (Kubernetes)
 * GET /api/health/live - Liveness probe (Kubernetes)
 * GET /api/health/connectivity - Test mobile app connectivity
 */

router.get('/', createRouteHandler(getHealthStatus));
router.get('/ready', createRouteHandler(getReadinessStatus));
router.get('/live', createRouteHandler(getLivenessStatus));

// Specific endpoint for mobile app connectivity testing
router.get('/connectivity', (req, res) => {
  res.json({
    success: true,
    message: 'Backend connectivity successful',
    timestamp: new Date().toISOString(),
    server: 'GetMeToDubai Backend',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      bookings: '/api/bookings',
      payments: '/api/payments/process',
      health: '/api/health',
      chat: '/api/chat',
      travel: '/api/travel'
    }
  });
});

export default router;