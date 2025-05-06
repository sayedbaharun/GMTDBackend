"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentValidation = exports.subscriptionValidation = exports.onboardingValidation = exports.userProfileValidation = exports.authValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware to validate request data
 * @param validations - Array of validation chains from express-validator
 * @returns Middleware function that runs validations and checks results
 */
const validate = (validations) => {
    return async (req, res, next) => {
        try {
            // Execute all validations
            await Promise.all(validations.map(validation => validation.run(req)));
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (errors.isEmpty()) {
                next();
                return;
            }
            // Send validation errors and don't call next()
            res.status(400).json({
                errors: errors.array()
            });
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
// Validation chains for different routes
exports.authValidation = {
    register: [
        (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
        (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
        (0, express_validator_1.body)('fullName').notEmpty().withMessage('Full name is required'),
    ],
    login: [
        (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
        (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    ],
    resetPassword: [
        (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    ],
};
exports.userProfileValidation = {
    update: [
        (0, express_validator_1.body)('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
        (0, express_validator_1.body)('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('company_name').optional().notEmpty().withMessage('Company name cannot be empty'),
    ],
};
exports.onboardingValidation = {
    userInfo: [
        (0, express_validator_1.body)('fullName').notEmpty().withMessage('Full name is required'),
        (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
        (0, express_validator_1.body)('phone_number').isMobilePhone('any').withMessage('Valid phone number is required'),
        (0, express_validator_1.body)('company_name').notEmpty().withMessage('Company name is required'),
    ],
    additionalDetails: [
        (0, express_validator_1.body)('industry').notEmpty().withMessage('Industry is required'),
        (0, express_validator_1.body)('company_size').notEmpty().withMessage('Company size is required'),
        (0, express_validator_1.body)('role').notEmpty().withMessage('Role is required'),
        (0, express_validator_1.body)('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
        (0, express_validator_1.body)('referral_source').optional(),
    ],
    getOnboardingStatus: [],
    paymentProcess: [
        (0, express_validator_1.body)('priceId').notEmpty().withMessage('Price ID is required for subscription'),
    ],
};
exports.subscriptionValidation = {
    create: [
        (0, express_validator_1.body)('priceId').optional().notEmpty().withMessage('Price ID cannot be empty'),
    ],
};
exports.paymentValidation = {
    createPaymentIntent: [
        (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
        (0, express_validator_1.body)('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code')
    ],
};
//# sourceMappingURL=validation.js.map