import * as express from 'express';
const Router = express.Router;
// For direct validation test:
import { body, validationResult, Result } from 'express-validator'; 
import { Request, Response, NextFunction } from 'express'; // Explicit Express types

const router = Router();

// DEBUG: Log when this router is initialized/used
console.log('--- Initializing Onboarding Router (testing /user-info with local rules via validate()) ---'); 

router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`--> Request received by Onboarding Router: ${req.method} ${req.path}`);
  next();
});

import { 
  getOnboardingStatus,
  saveUserInfo,
  saveAdditionalDetails,
  processPayment,
  completeOnboarding 
} from '../controllers/onboarding';
import { authenticateAndSyncUser } from '../middleware/auth';
// Import the validate function, but we won't use onboardingValidation.userInfo for this route
import { validate } from '../middleware/validation'; 
import { createRouteHandler } from '../utils/errorHandler';
import { AuthenticatedRequest } from '../types'; // For the controller call

/**
 * Onboarding Routes - Multi-Step Process
 * GET /api/onboarding/status - Get current onboarding status
 * POST /api/onboarding/user-info - Save basic user information (Step 1)
 * POST /api/onboarding/additional-details - Save additional details (Step 2)
 * POST /api/onboarding/payment - Process payment (Step 3)
 * POST /api/onboarding/complete - Mark onboarding as complete
 */

// All onboarding routes require authentication
router.use(authenticateAndSyncUser);

// Get current onboarding status
router.get(
  '/status',
  createRouteHandler(getOnboardingStatus)
);

// INLINED VALIDATION RULES FOR /user-info TEST
const userInfoInlinedValidationRules = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().withMessage('Phone must be a string if provided'), 
  body('companyName').notEmpty().withMessage('Company name is required'),
];

// Step 1: Save basic user information - USING validate() MIDDLEWARE WITH LOCAL RULES
router.post(
  '/user-info',
  validate(userInfoInlinedValidationRules),
  createRouteHandler(saveUserInfo)
);

// INLINED VALIDATION RULES FOR /additional-details
const additionalDetailsInlinedValidationRules = [
  body('industry').notEmpty().withMessage('Industry is required'),
  body('companySize').notEmpty().withMessage('Company size is required'), // Ensure frontend sends companySize
  body('role').notEmpty().withMessage('Role is required'),
  body('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
  body('referralSource').optional().isString(), // Changed from just .optional()
];

// Step 2: Save additional details
router.post(
  '/additional-details',
  validate(additionalDetailsInlinedValidationRules), // Using INLINED RULES
  createRouteHandler(saveAdditionalDetails)
);

// INLINED VALIDATION RULES FOR /payment
const paymentProcessInlinedValidationRules = [
  body('priceId').notEmpty().withMessage('Price ID is required for subscription'),
];

// Step 3: Process payment
router.post(
  '/payment',
  validate(paymentProcessInlinedValidationRules), // Using INLINED RULES
  createRouteHandler(processPayment)
);

// Complete onboarding
router.post(
  '/complete',
  createRouteHandler(completeOnboarding)
);

export default router;
