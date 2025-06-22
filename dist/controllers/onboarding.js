"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = exports.processPayment = exports.saveAdditionalDetails = exports.saveUserInfo = exports.getOnboardingStatus = void 0;
const client_1 = require("@prisma/client");
const types_1 = require("../types");
const stripe_1 = require("../services/stripe");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get current onboarding status
 * @route GET /api/onboarding/status
 */
const getOnboardingStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        let nextStep = types_1.OnboardingStep.NOT_STARTED;
        if (user.onboardingComplete) {
            nextStep = types_1.OnboardingStep.COMPLETED;
        }
        else if (user.subscriptionId && user.subscriptionStatus === 'active') {
            nextStep = types_1.OnboardingStep.COMPLETED;
        }
        else if (user.industry && user.role && user.goals && user.goals.length > 0) {
            nextStep = types_1.OnboardingStep.PAYMENT;
        }
        else if (user.fullName && user.phone && user.companyName) {
            nextStep = types_1.OnboardingStep.ADDITIONAL_DETAILS;
        }
        else {
            nextStep = types_1.OnboardingStep.BASIC_INFO;
        }
        return res.status(200).json({
            currentStep: user.onboardingStep || types_1.OnboardingStep.NOT_STARTED,
            nextStep,
            profile: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                companyName: user.companyName,
                industry: user.industry,
                companySize: user.companySize,
                role: user.role,
                goals: user.goals,
                onboardingComplete: user.onboardingComplete,
                subscriptionStatus: user.subscriptionStatus,
                isEmailVerified: user.isEmailVerified,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get onboarding status error:', error);
        return res.status(500).json({ message: 'Failed to get onboarding status' });
    }
};
exports.getOnboardingStatus = getOnboardingStatus;
/**
 * Save basic user information (Step 1 of onboarding)
 * @route POST /api/onboarding/user-info
 */
const saveUserInfo = async (req, res) => {
    // DEBUG: Log body at the start of the controller
    console.log('Body in saveUserInfo Controller:', req.body);
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { fullName, email, phone, companyName } = req.body;
        if (!fullName || !email) {
            return res.status(400).json({ message: 'Full name and email are required.' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                fullName: fullName,
                phone: phone,
                companyName: companyName,
                onboardingStep: types_1.OnboardingStep.BASIC_INFO,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({
            message: 'User information saved successfully',
            profile: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                companyName: updatedUser.companyName,
                onboardingStep: updatedUser.onboardingStep
            },
            nextStep: types_1.OnboardingStep.ADDITIONAL_DETAILS
        });
    }
    catch (error) {
        logger_1.logger.error('Save user info error:', error);
        return res.status(500).json({ message: 'Failed to save user information' });
    }
};
exports.saveUserInfo = saveUserInfo;
/**
 * Save additional user details (Step 2 of onboarding)
 * @route POST /api/onboarding/additional-details
 */
const saveAdditionalDetails = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!user.fullName || !user.phone || !user.companyName) {
            return res.status(400).json({
                message: 'Please complete step 1 (basic info) first',
                nextStep: types_1.OnboardingStep.BASIC_INFO
            });
        }
        const { industry, companySize, role, goals, referralSource } = req.body;
        if (!industry || !companySize || !role || !goals) {
            return res.status(400).json({ message: 'Industry, company size, role, and goals are required.' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                industry: industry,
                companySize: companySize,
                role: role,
                goals: goals,
                referralSource: referralSource,
                onboardingStep: types_1.OnboardingStep.ADDITIONAL_DETAILS,
                updatedAt: new Date()
            }
        });
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            try {
                const customerResult = await stripe_1.stripeService.createCustomer(user.id, user.email, user.fullName || '');
                if (customerResult.success && customerResult.data) {
                    stripeCustomerId = customerResult.data.id;
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { stripeCustomerId: stripeCustomerId }
                    });
                }
                else {
                    logger_1.logger.error('Failed to create Stripe customer:', customerResult.error);
                }
            }
            catch (stripeError) {
                logger_1.logger.error('Create Stripe customer error:', stripeError);
            }
        }
        return res.status(200).json({
            message: 'Additional details saved successfully',
            profile: {
                id: updatedUser.id,
                industry: updatedUser.industry,
                companySize: updatedUser.companySize,
                role: updatedUser.role,
                goals: updatedUser.goals,
                onboardingStep: updatedUser.onboardingStep,
                stripeCustomerId: stripeCustomerId
            },
            nextStep: types_1.OnboardingStep.PAYMENT
        });
    }
    catch (error) {
        logger_1.logger.error('Save additional details error:', error);
        return res.status(500).json({ message: 'Failed to save additional details' });
    }
};
exports.saveAdditionalDetails = saveAdditionalDetails;
/**
 * Process payment (Step 3 of onboarding)
 * @route POST /api/onboarding/payment
 */
const processPayment = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { priceId, planName, successUrl, cancelUrl } = req.body;
        if (!priceId) {
            return res.status(400).json({ message: 'Price ID is required for membership selection.' });
        }
        logger_1.logger.info(`Processing payment for user ${user.id}, plan: ${planName}, priceId: ${priceId}`);
        // Ensure user has Stripe customer ID
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            logger_1.logger.info('Creating Stripe customer for payment...');
            try {
                const customerResult = await stripe_1.stripeService.createCustomer(user.id, user.email, user.fullName || '');
                if (!customerResult.success || !customerResult.data?.id) {
                    return res.status(customerResult.statusCode || 500).json({
                        message: customerResult.error || 'Failed to create Stripe customer'
                    });
                }
                stripeCustomerId = customerResult.data.id;
                await prisma.user.update({
                    where: { id: user.id },
                    data: { stripeCustomerId: stripeCustomerId }
                });
            }
            catch (stripeError) {
                logger_1.logger.error('Create Stripe customer error:', stripeError);
                return res.status(500).json({ message: 'Failed to setup payment customer.' });
            }
        }
        // Create Stripe Checkout Session for better UX
        try {
            const checkoutSession = await stripe_1.stripeService.createCheckoutSession({
                customerId: stripeCustomerId,
                priceId: priceId,
                planName: planName,
                successUrl: successUrl || `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/membership`,
                metadata: {
                    userId: user.id,
                    planName: planName,
                    tier: getTierFromPriceId(priceId)
                }
            });
            if (!checkoutSession.success || !checkoutSession.data) {
                return res.status(checkoutSession.statusCode || 500).json({
                    message: checkoutSession.error || 'Failed to create checkout session'
                });
            }
            // Update user onboarding step
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    onboardingStep: types_1.OnboardingStep.PAYMENT,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Checkout session created: ${checkoutSession.data.id} for user ${user.id}`);
            return res.status(200).json({
                success: true,
                message: 'Checkout session created successfully',
                checkoutUrl: checkoutSession.data.url,
                sessionId: checkoutSession.data.id
            });
        }
        catch (checkoutError) {
            logger_1.logger.error('Checkout session creation error:', checkoutError);
            // Fallback to subscription creation for development
            logger_1.logger.info('Falling back to direct subscription creation...');
            const subscriptionResult = await stripe_1.stripeService.createSubscription(user, priceId);
            if (!subscriptionResult.success || !subscriptionResult.data) {
                return res.status(subscriptionResult.statusCode || 500).json({
                    message: subscriptionResult.error || 'Failed to create subscription'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Payment initiated successfully',
                clientSecret: subscriptionResult.data.clientSecret,
                subscriptionId: subscriptionResult.data.subscriptionId,
                checkoutUrl: `${process.env.FRONTEND_URL}/dashboard?payment_success=true&plan=${planName}`
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Process payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process payment'
        });
    }
};
exports.processPayment = processPayment;
/**
 * Helper function to get tier from price ID
 */
function getTierFromPriceId(priceId) {
    if (priceId.includes('Vip') || priceId.includes('Monthly')) {
        return 'vip';
    }
    else if (priceId.includes('Elite') || priceId.includes('Annual')) {
        return 'elite';
    }
    else if (priceId.includes('Founding') || priceId.includes('Lifetime')) {
        return 'founding';
    }
    return 'vip'; // Default
}
/**
 * Mark onboarding as complete
 * @route POST /api/onboarding/complete
 */
const completeOnboarding = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!user.fullName || !user.phone || !user.companyName ||
            !user.industry || !user.role || !user.goals || user.goals.length === 0) {
            return res.status(400).json({
                message: 'Please complete all onboarding steps first',
                nextStep: !user.fullName
                    ? types_1.OnboardingStep.BASIC_INFO
                    : types_1.OnboardingStep.ADDITIONAL_DETAILS
            });
        }
        if (user.subscriptionStatus !== 'active') {
            return res.status(400).json({
                message: 'Active subscription required to complete onboarding. Please complete payment.',
                nextStep: types_1.OnboardingStep.PAYMENT
            });
        }
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                onboardingComplete: true,
                onboardingStep: types_1.OnboardingStep.COMPLETED,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({
            message: 'Onboarding completed successfully',
            profile: {
                id: updatedUser.id,
                onboardingComplete: updatedUser.onboardingComplete,
                onboardingStep: updatedUser.onboardingStep
            },
            nextStep: types_1.OnboardingStep.COMPLETED
        });
    }
    catch (error) {
        logger_1.logger.error('Complete onboarding error:', error);
        return res.status(500).json({ message: 'Failed to complete onboarding' });
    }
};
exports.completeOnboarding = completeOnboarding;
//# sourceMappingURL=onboarding.js.map