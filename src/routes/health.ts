import * as express from 'express';
const Router = express.Router;

import { getHealthStatus } from '../controllers/health';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Health Routes
 * GET /api/health - Check system health status
 */

router.get('/', createRouteHandler(getHealthStatus));

export default router;