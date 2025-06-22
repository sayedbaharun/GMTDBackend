import { Router } from 'express';
import { authenticateAndSyncUser } from '../middleware/auth';
import { createRouteHandler } from '../utils/errorHandler';
import { 
  createTravelRequest,
  getUserTravelRequests,
  getTravelRequestById,
  updateTravelRequest,
  presentOptions,
  selectOption,
  getPendingTravelRequests,
  assignTravelRequest,
  convertToBooking
} from '../controllers/travelRequestController';

const router = Router();

// User routes
router.post('/', authenticateAndSyncUser, createRouteHandler(createTravelRequest));
router.get('/', authenticateAndSyncUser, createRouteHandler(getUserTravelRequests));
router.get('/:id', authenticateAndSyncUser, createRouteHandler(getTravelRequestById));
router.post('/:id/select-option', authenticateAndSyncUser, createRouteHandler(selectOption));

// Admin routes
router.put('/:id', authenticateAndSyncUser, createRouteHandler(updateTravelRequest));
router.post('/:id/present-options', authenticateAndSyncUser, createRouteHandler(presentOptions));
router.get('/admin/pending', authenticateAndSyncUser, createRouteHandler(getPendingTravelRequests));
router.post('/:id/assign', authenticateAndSyncUser, createRouteHandler(assignTravelRequest));
router.post('/:id/convert', authenticateAndSyncUser, createRouteHandler(convertToBooking));

export default router; 