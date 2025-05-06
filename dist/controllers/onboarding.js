"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = exports.processPayment = exports.saveAdditionalDetails = exports.saveUserInfo = exports.getOnboardingStatus = void 0;
const types_1 = require("../types");
const user_1 = require("../services/user");
const stripe_1 = require("../services/stripe");
const logger_1 = require("../utils/logger");
/**
 * Get current onboarding status
 * @route GET /api/onboarding/status
 */
const getOnboardingStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        let nextStep = types_1.OnboardingStep.NOT_STARTED;
        // Determine the current step and next step based on user profile
        if (req.user.onboardingComplete) {
            nextStep = types_1.OnboardingStep.COMPLETED;
        }
        else if (req.user.subscriptionId && req.user.subscriptionStatus === 'active') {
            nextStep = types_1.OnboardingStep.COMPLETED;
        }
        else if (req.user.industry && req.user.role && req.user.goals) {
            nextStep = types_1.OnboardingStep.PAYMENT;
        }
        else if (req.user.fullName && req.user.phone && req.user.companyName) {
            nextStep = types_1.OnboardingStep.ADDITIONAL_DETAILS;
        }
        else {
            nextStep = types_1.OnboardingStep.BASIC_INFO;
        }
        return res.status(200).json({
            currentStep: req.user.onboardingStep || types_1.OnboardingStep.NOT_STARTED,
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
    }
    catch (error) {
        logger_1.logger.error('Get onboarding status error:', error);
        return res.status(500).json({
            message: 'Failed to get onboarding status'
        });
    }
};
exports.getOnboardingStatus = getOnboardingStatus;
/**
 * Save basic user information (Step 1 of onboarding)
 * @route POST /api/onboarding/user-info
 */
const saveUserInfo = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        const userInfo = {
            fullName: req.body.fullName,
            email: req.body.email,
            phone_number: req.body.phone_number, // Keep as is for the payload
            company_name: req.body.company_name // Keep as is for the payload
        };
        // Update profile and set onboarding step
        const result = await user_1.userService.updateUserProfile(req.user.id, {
            fullName: userInfo.fullName,
            email: userInfo.email,
            phone: userInfo.phone_number, // Convert to camelCase for Prisma
            companyName: userInfo.company_name, // Convert to camelCase for Prisma
            phone_number: userInfo.phone_number, // Keep snake_case for Supabase
            company_name: userInfo.company_name, // Keep snake_case for Supabase
            onboardingStep: types_1.OnboardingStep.BASIC_INFO,
            onboarding_step: types_1.OnboardingStep.BASIC_INFO // Use snake_case for Supabase
        });
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'User information saved successfully',
            profile: result.data,
            nextStep: types_1.OnboardingStep.ADDITIONAL_DETAILS
        });
    }
    catch (error) {
        logger_1.logger.error('Save user info error:', error);
        return res.status(500).json({
            message: 'Failed to save user information'
        });
    }
};
exports.saveUserInfo = saveUserInfo;
/**
 * Save additional user details (Step 2 of onboarding)
 * @route POST /api/onboarding/additional-details
 */
const saveAdditionalDetails = async (req, res) => {
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
                nextStep: types_1.OnboardingStep.BASIC_INFO
            });
        }
        const additionalDetails = {
            industry: req.body.industry,
            company_size: req.body.company_size,
            role: req.body.role,
            goals: req.body.goals,
            referral_source: req.body.referral_source
        };
        // Update profile and set onboarding step
        const result = await user_1.userService.updateUserProfile(req.user.id, {
            industry: additionalDetails.industry,
            companySize: additionalDetails.company_size,
            role: additionalDetails.role,
            goals: additionalDetails.goals,
            referralSource: additionalDetails.referral_source,
            company_size: additionalDetails.company_size, // Keep snake_case for Supabase
            referral_source: additionalDetails.referral_source, // Keep snake_case for Supabase
            onboardingStep: types_1.OnboardingStep.ADDITIONAL_DETAILS,
            onboarding_step: types_1.OnboardingStep.ADDITIONAL_DETAILS // Use snake_case for Supabase
        });
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        // Create Stripe customer if it doesn't exist
        if (!req.user.stripeCustomerId) {
            try {
                const customerResult = await stripe_1.stripeService.createCustomer(req.user.id, req.user.email, req.user.fullName || '');
                if (customerResult.success && customerResult.data) {
                    await user_1.userService.updateUserProfile(req.user.id, {
                        stripeCustomerId: customerResult.data.id
                    });
                }
            }
            catch (stripeError) {
                logger_1.logger.error('Create Stripe customer error:', stripeError);
                // Continue even if Stripe customer creation fails
                // We'll try again during the payment step
            }
        }
        return res.status(200).json({
            message: 'Additional details saved successfully',
            profile: result.data,
            nextStep: types_1.OnboardingStep.PAYMENT
        });
    }
    catch (error) {
        logger_1.logger.error('Save additional details error:', error);
        return res.status(500).json({
            message: 'Failed to save additional details'
        });
    }
};
exports.saveAdditionalDetails = saveAdditionalDetails;
/**
 * Process payment (Step 3 of onboarding)
 * @route POST /api/onboarding/payment
 */
const processPayment = async (req, res) => {
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
                nextStep: !req.user.fullName ? types_1.OnboardingStep.BASIC_INFO : types_1.OnboardingStep.ADDITIONAL_DETAILS
            });
        }
        const { priceId } = req.body;
        // Create Stripe customer if it doesn't exist
        if (!req.user.stripeCustomerId) {
            const customerResult = await stripe_1.stripeService.createCustomer(req.user.id, req.user.email, req.user.fullName || '');
            if (!customerResult.success) {
                return res.status(customerResult.statusCode || 500).json({
                    message: customerResult.error || 'Failed to create customer'
                });
            }
            await user_1.userService.updateUserProfile(req.user.id, {
                stripeCustomerId: customerResult.data?.id,
                stripe_customer_id: customerResult.data?.id, // Use snake_case for Supabase
                onboardingStep: types_1.OnboardingStep.PAYMENT,
                onboarding_step: types_1.OnboardingStep.PAYMENT // Use snake_case for Supabase
            });
        }
        // Convert req.user to UserProfile type, handling null values
        const userProfile = {
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
        const subscriptionResult = await stripe_1.stripeService.createSubscription(userProfile, priceId);
        if (!subscriptionResult.success) {
            return res.status(subscriptionResult.statusCode || 500).json({
                message: subscriptionResult.error || 'Failed to create subscription'
            });
        }
        return res.status(200).json({
            message: 'Payment process initiated',
            clientSecret: subscriptionResult.data?.clientSecret,
            subscriptionId: subscriptionResult.data?.subscriptionId,
            nextStep: types_1.OnboardingStep.COMPLETED
        });
    }
    catch (error) {
        logger_1.logger.error('Process payment error:', error);
        return res.status(500).json({
            message: 'Failed to process payment'
        });
    }
};
exports.processPayment = processPayment;
/**
 * Mark onboarding as complete
 * @route POST /api/onboarding/complete
 */
const completeOnboarding = async (req, res) => {
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
                    ? types_1.OnboardingStep.BASIC_INFO
                    : !req.user.industry
                        ? types_1.OnboardingStep.ADDITIONAL_DETAILS
                        : types_1.OnboardingStep.PAYMENT
            });
        }
        // Check if subscription is active before completing onboarding
        if (!req.user.subscriptionId || req.user.subscriptionStatus !== 'active') {
            return res.status(400).json({
                message: 'Active subscription required to complete onboarding',
                nextStep: types_1.OnboardingStep.PAYMENT
            });
        }
        const result = await user_1.userService.updateUserProfile(req.user.id, {
            onboardingComplete: true,
            onboarding_complete: true, // Use snake_case for Supabase
            onboardingStep: types_1.OnboardingStep.COMPLETED,
            onboarding_step: types_1.OnboardingStep.COMPLETED // Use snake_case for Supabase
        });
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'Onboarding completed successfully',
            profile: result.data,
            nextStep: types_1.OnboardingStep.COMPLETED
        });
    }
    catch (error) {
        logger_1.logger.error('Complete onboarding error:', error);
        return res.status(500).json({
            message: 'Failed to complete onboarding'
        });
    }
};
exports.completeOnboarding = completeOnboarding;
//# sourceMappingURL=onboarding.js.map