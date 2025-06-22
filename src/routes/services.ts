import * as express from 'express';
const Router = express.Router;
import { authenticateAndSyncUser, isAdmin } from '../middleware/auth';
import * as serviceCategoriesController from '../controllers/serviceCategories';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Public Service Routes - Available to all users
 */
router.get('/categories', asyncHandler(serviceCategoriesController.getAllServiceCategories));
router.get('/categories/:slug', asyncHandler(serviceCategoriesController.getServiceCategoryBySlug));

/**
 * Admin Service Routes - Protected by admin middleware
 */
// Admin routes for managing service categories
router.use('/admin', authenticateAndSyncUser); // Authentication for admin routes
router.use('/admin', isAdmin);

router.post('/admin/categories', asyncHandler(serviceCategoriesController.createServiceCategory));
router.put('/admin/categories/:id', asyncHandler(serviceCategoriesController.updateServiceCategory));
router.delete('/admin/categories/:id', asyncHandler(serviceCategoriesController.deleteServiceCategory));

export default router; 