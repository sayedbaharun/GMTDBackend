import * as express from 'express';
const Router = express.Router;

import { 
  getOnboardingStatus,
  saveUserInfo,
  saveAdditionalDetails,
  processPayment,
  completeOnboarding 
} from '../controllers/onboarding';
import { authenticate } from '../middleware/auth';
import { onboardingValidation, validate } from '../middleware/validation';
import { createRouteHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Onboarding Routes - Multi-Step Process
 * GET /api/onboarding/status - Get current onboarding status
 * POST /api/onboarding/user-info - Save basic user information (Step 1)
 * POST /api/onboarding/additional-details - Save additional details (Step 2)
 * POST /api/onboarding/payment - Process payment (Step 3)
 * POST /api/onboarding/complete - Mark onboarding as complete
 */

// All onboarding routes require authentication
router.use(authenticate);

// Get current onboarding status
router.get(
  '/status',
  validate(onboardingValidation.getOnboardingStatus),
  createRouteHandler(getOnboardingStatus)
);

// Step 1: Save basic user information
router.post(
  '/user-info',
  validate(onboardingValidation.userInfo),
  createRouteHandler(saveUserInfo)
);

// Step 2: Save additional details
router.post(
  '/additional-details',
  validate(onboardingValidation.additionalDetails),
  createRouteHandler(saveAdditionalDetails)
);

// Step 3: Process payment
router.post(
  '/payment',
  validate(onboardingValidation.paymentProcess),
  createRouteHandler(processPayment)
);

// Complete onboarding
router.post(
  '/complete',
  createRouteHandler(completeOnboarding)
);

export default router;
