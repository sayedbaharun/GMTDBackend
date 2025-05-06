import * as express from 'express';
type Response = express.Response;
import { 
  AuthenticatedRequest, 
  UserInfoPayload, 
  AdditionalDetailsPayload, 
  OnboardingStep,
  UserProfile
} from '../types';
import { userService } from '../services/user';
import { stripeService } from '../services/stripe';
import { logger } from '../utils/logger';

/**
 * Get current onboarding status
 * @route GET /api/onboarding/status
 */
export const getOnboardingStatus = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    let nextStep = OnboardingStep.NOT_STARTED;
    
    // Determine the current step and next step based on user profile
    if (req.user.onboardingComplete) {
      nextStep = OnboardingStep.COMPLETED;
    } else if (req.user.subscriptionId && req.user.subscriptionStatus === 'active') {
      nextStep = OnboardingStep.COMPLETED;
    } else if (req.user.industry && req.user.role && req.user.goals) {
      nextStep = OnboardingStep.PAYMENT;
    } else if (req.user.fullName && req.user.phone && req.user.companyName) {
      nextStep = OnboardingStep.ADDITIONAL_DETAILS;
    } else {
      nextStep = OnboardingStep.BASIC_INFO;
    }
    
    return res.status(200).json({
      currentStep: req.user.onboardingStep || OnboardingStep.NOT_STARTED,
      nextStep,
      profile: {
        // Only send necessary information for onboarding
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        companyName: req.user.companyName,
        industry: req.user.industry,
        companySize: req.user.companySize,
        role: req.user.role,
        goals: req.user.goals,
        onboardingComplete: req.user.onboardingComplete,
        subscriptionStatus: req.user.subscriptionStatus
      }
    });
  } catch (error) {
    logger.error('Get onboarding status error:', error);
    return res.status(500).json({ 
      message: 'Failed to get onboarding status' 
    });
  }
};

/**
 * Save basic user information (Step 1 of onboarding)
 * @route POST /api/onboarding/user-info
 */
export const saveUserInfo = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    const userInfo: UserInfoPayload = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone_number: req.body.phone_number, // Keep as is for the payload
      company_name: req.body.company_name  // Keep as is for the payload
    };
    
    // Update profile and set onboarding step
    const result = await userService.updateUserProfile(req.user.id, {
      fullName: userInfo.fullName,
      email: userInfo.email,
      phone: userInfo.phone_number, // Convert to camelCase for Prisma
      companyName: userInfo.company_name, // Convert to camelCase for Prisma
      phone_number: userInfo.phone_number, // Keep snake_case for Supabase
      company_name: userInfo.company_name, // Keep snake_case for Supabase
      onboardingStep: OnboardingStep.BASIC_INFO,
      onboarding_step: OnboardingStep.BASIC_INFO // Use snake_case for Supabase
    });
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'User information saved successfully',
      profile: result.data,
      nextStep: OnboardingStep.ADDITIONAL_DETAILS
    });
  } catch (error) {
    logger.error('Save user info error:', error);
    return res.status(500).json({ 
      message: 'Failed to save user information' 
    });
  }
};

/**
 * Save additional user details (Step 2 of onboarding)
 * @route POST /api/onboarding/additional-details
 */
export const saveAdditionalDetails = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    // Check if step 1 was completed
    if (!req.user.fullName || !req.user.phone || !req.user.companyName) {
      return res.status(400).json({
        message: 'Please complete step 1 (basic info) first',
        nextStep: OnboardingStep.BASIC_INFO
      });
    }
    
    const additionalDetails: AdditionalDetailsPayload = {
      industry: req.body.industry,
      company_size: req.body.company_size,
      role: req.body.role,
      goals: req.body.goals,
      referral_source: req.body.referral_source
    };
    
    // Update profile and set onboarding step
    const result = await userService.updateUserProfile(req.user.id, {
      industry: additionalDetails.industry,
      companySize: additionalDetails.company_size,
      role: additionalDetails.role,
      goals: additionalDetails.goals,
      referralSource: additionalDetails.referral_source,
      company_size: additionalDetails.company_size, // Keep snake_case for Supabase
      referral_source: additionalDetails.referral_source, // Keep snake_case for Supabase
      onboardingStep: OnboardingStep.ADDITIONAL_DETAILS,
      onboarding_step: OnboardingStep.ADDITIONAL_DETAILS // Use snake_case for Supabase
    });
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    // Create Stripe customer if it doesn't exist
    if (!req.user.stripeCustomerId) {
      try {
        const customerResult = await stripeService.createCustomer(
          req.user.id,
          req.user.email,
          req.user.fullName || ''
        );
        
        if (customerResult.success && customerResult.data) {
          await userService.updateUserProfile(req.user.id, {
            stripeCustomerId: customerResult.data.id
          });
        }
      } catch (stripeError) {
        logger.error('Create Stripe customer error:', stripeError);
        // Continue even if Stripe customer creation fails
        // We'll try again during the payment step
      }
    }
    
    return res.status(200).json({
      message: 'Additional details saved successfully',
      profile: result.data,
      nextStep: OnboardingStep.PAYMENT
    });
  } catch (error) {
    logger.error('Save additional details error:', error);
    return res.status(500).json({ 
      message: 'Failed to save additional details' 
    });
  }
};

/**
 * Process payment (Step 3 of onboarding)
 * @route POST /api/onboarding/payment
 */
export const processPayment = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    // Check if previous steps were completed
    if (!req.user.fullName || !req.user.phone || !req.user.companyName || 
        !req.user.industry || !req.user.role || !req.user.goals) {
      return res.status(400).json({
        message: 'Please complete previous onboarding steps first',
        nextStep: !req.user.fullName ? OnboardingStep.BASIC_INFO : OnboardingStep.ADDITIONAL_DETAILS
      });
    }
    
    const { priceId } = req.body;
    
    // Create Stripe customer if it doesn't exist
    if (!req.user.stripeCustomerId) {
      const customerResult = await stripeService.createCustomer(
        req.user.id,
        req.user.email,
        req.user.fullName || ''
      );
      
      if (!customerResult.success) {
        return res.status(customerResult.statusCode || 500).json({
          message: customerResult.error || 'Failed to create customer'
        });
      }
      
      await userService.updateUserProfile(req.user.id, {
        stripeCustomerId: customerResult.data?.id,
        stripe_customer_id: customerResult.data?.id, // Use snake_case for Supabase
        onboardingStep: OnboardingStep.PAYMENT,
        onboarding_step: OnboardingStep.PAYMENT // Use snake_case for Supabase
      });
    }
    
    // Convert req.user to UserProfile type, handling null values
    const userProfile: UserProfile = {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName || undefined,
      phone: req.user.phone || undefined,
      companyName: req.user.companyName || undefined,
      industry: req.user.industry || undefined,
      companySize: req.user.companySize || undefined,
      role: req.user.role || undefined,
      goals: req.user.goals || undefined,
      stripeCustomerId: req.user.stripeCustomerId || undefined,
      stripe_customer_id: req.user.stripeCustomerId || undefined, // Use stripeCustomerId for both
      subscriptionId: req.user.subscriptionId || undefined,
      subscription_id: req.user.subscriptionId || undefined // Use subscriptionId for both
    };
    
    // Create subscription checkout session
    const subscriptionResult = await stripeService.createSubscription(userProfile, priceId);
    
    if (!subscriptionResult.success) {
      return res.status(subscriptionResult.statusCode || 500).json({
        message: subscriptionResult.error || 'Failed to create subscription'
      });
    }
    
    return res.status(200).json({
      message: 'Payment process initiated',
      clientSecret: subscriptionResult.data?.clientSecret,
      subscriptionId: subscriptionResult.data?.subscriptionId,
      nextStep: OnboardingStep.COMPLETED
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    return res.status(500).json({ 
      message: 'Failed to process payment' 
    });
  }
};

/**
 * Mark onboarding as complete
 * @route POST /api/onboarding/complete
 */
export const completeOnboarding = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    // Check if all required steps are completed
    if (!req.user.fullName || !req.user.phone || !req.user.companyName || 
        !req.user.industry || !req.user.role || !req.user.goals) {
      return res.status(400).json({
        message: 'Please complete all onboarding steps first',
        nextStep: !req.user.fullName 
          ? OnboardingStep.BASIC_INFO 
          : !req.user.industry 
            ? OnboardingStep.ADDITIONAL_DETAILS 
            : OnboardingStep.PAYMENT
      });
    }
    
    // Check if subscription is active before completing onboarding
    if (!req.user.subscriptionId || req.user.subscriptionStatus !== 'active') {
      return res.status(400).json({
        message: 'Active subscription required to complete onboarding',
        nextStep: OnboardingStep.PAYMENT
      });
    }
    
    const result = await userService.updateUserProfile(req.user.id, { 
      onboardingComplete: true,
      onboarding_complete: true, // Use snake_case for Supabase
      onboardingStep: OnboardingStep.COMPLETED,
      onboarding_step: OnboardingStep.COMPLETED // Use snake_case for Supabase
    });
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'Onboarding completed successfully',
      profile: result.data,
      nextStep: OnboardingStep.COMPLETED
    });
  } catch (error) {
    logger.error('Complete onboarding error:', error);
    return res.status(500).json({ 
      message: 'Failed to complete onboarding' 
    });
  }
};
