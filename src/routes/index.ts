import * as express from 'express';
const Router = express.Router;

import authRoutes from './auth';
import userRoutes from './user';
import onboardingRoutes from './onboarding';
import subscriptionRoutes from './subscriptions';
import webhookRoutes from './webhooks';
import paymentsRoutes from './payments';
import healthRoutes from './health';
import testRoutes from './test';
import adminRoutes from './admin';
import flightRoutes from './flightRoutes';
import hotelRoutes from './hotelRoutes';
import travelRoutes from './travelRoutes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register all route modules
router.use('/auth', authRoutes);
router.use(authenticate);
router.use('/user', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/payments', paymentsRoutes);
router.use('/health', healthRoutes);
router.use('/test', testRoutes);
router.use('/admin', adminRoutes);
router.use('/flights', flightRoutes);
router.use('/hotels', hotelRoutes);
router.use('/travel', travelRoutes);

export default router;
