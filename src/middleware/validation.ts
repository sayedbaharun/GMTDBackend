import * as express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { body, validationResult } from 'express-validator';

/**
 * Middleware to validate request data
 * @param validations - Array of validation chains from express-validator
 * @returns Middleware function that runs validations and checks results
 */
export const validate = (validations: any[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    console.log('--- Running Validation Middleware ---'); // DEBUG
    console.log('Request Body:', req.body); // DEBUG: Log incoming body
    try {
      // Execute all validations
      await Promise.all(validations.map(validation => validation.run(req)));
  
      // Check for validation errors
      const errors = validationResult(req);
      console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2)); // DEBUG: Log validation errors
      
      if (errors.isEmpty()) {
        console.log('Validation Passed.'); // DEBUG
        next();
        return;
      }
  
      console.log('Validation Failed. Sending 400.'); // DEBUG
      // Send validation errors and don't call next()
      res.status(400).json({
        errors: errors.array()
      });
    } catch (error) {
      console.error('Error within validation middleware:', error); // DEBUG
      next(error);
    }
  };
};

// Validation chains for different routes
export const authValidation = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('fullName').notEmpty().withMessage('Full name is required'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  resetPassword: [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
};

export const userProfileValidation = {
  update: [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  ],
};

export const onboardingValidation = {
  userInfo: [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('companyName').notEmpty().withMessage('Company name is required'),
  ],
  additionalDetails: [
    body('industry').notEmpty().withMessage('Industry is required'),
    body('company_size').notEmpty().withMessage('Company size is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
    body('referral_source').optional(),
  ],
  getOnboardingStatus: [],
  paymentProcess: [
    body('priceId').notEmpty().withMessage('Price ID is required for subscription'),
  ],
};

export const subscriptionValidation = {
  create: [
    body('priceId').optional().notEmpty().withMessage('Price ID cannot be empty'),
  ],
};

export const paymentValidation = {
  createPaymentIntent: [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code')
  ],
};
