"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const Router = express.Router;
// For direct validation test:
const express_validator_1 = require("express-validator");
const router = Router();
// DEBUG: Log when this router is initialized/used
console.log('--- Initializing Onboarding Router (testing /user-info with local rules via validate()) ---');
router.use((req, res, next) => {
    console.log(`--> Request received by Onboarding Router: ${req.method} ${req.path}`);
    next();
});
const onboarding_1 = require("../controllers/onboarding");
const auth_1 = require("../middleware/auth");
// Import the validate function, but we won't use onboardingValidation.userInfo for this route
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Onboarding Routes - Multi-Step Process
 * GET /api/onboarding/status - Get current onboarding status
 * POST /api/onboarding/user-info - Save basic user information (Step 1)
 * POST /api/onboarding/additional-details - Save additional details (Step 2)
 * POST /api/onboarding/payment - Process payment (Step 3)
 * POST /api/onboarding/complete - Mark onboarding as complete
 */
// All onboarding routes require authentication
router.use(auth_1.authenticateAndSyncUser);
// Get current onboarding status
router.get('/status', (0, errorHandler_1.createRouteHandler)(onboarding_1.getOnboardingStatus));
// INLINED VALIDATION RULES FOR /user-info TEST
const userInfoInlinedValidationRules = [
    (0, express_validator_1.body)('fullName').notEmpty().withMessage('Full name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').optional().isString().withMessage('Phone must be a string if provided'),
    (0, express_validator_1.body)('companyName').notEmpty().withMessage('Company name is required'),
];
// Step 1: Save basic user information - USING validate() MIDDLEWARE WITH LOCAL RULES
router.post('/user-info', (0, validation_1.validate)(userInfoInlinedValidationRules), (0, errorHandler_1.createRouteHandler)(onboarding_1.saveUserInfo));
// INLINED VALIDATION RULES FOR /additional-details
const additionalDetailsInlinedValidationRules = [
    (0, express_validator_1.body)('industry').notEmpty().withMessage('Industry is required'),
    (0, express_validator_1.body)('companySize').notEmpty().withMessage('Company size is required'), // Ensure frontend sends companySize
    (0, express_validator_1.body)('role').notEmpty().withMessage('Role is required'),
    (0, express_validator_1.body)('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
    (0, express_validator_1.body)('referralSource').optional().isString(), // Changed from just .optional()
];
// Step 2: Save additional details
router.post('/additional-details', (0, validation_1.validate)(additionalDetailsInlinedValidationRules), // Using INLINED RULES
(0, errorHandler_1.createRouteHandler)(onboarding_1.saveAdditionalDetails));
// INLINED VALIDATION RULES FOR /payment
const paymentProcessInlinedValidationRules = [
    (0, express_validator_1.body)('priceId').notEmpty().withMessage('Price ID is required for subscription'),
];
// Step 3: Process payment
router.post('/payment', (0, validation_1.validate)(paymentProcessInlinedValidationRules), // Using INLINED RULES
(0, errorHandler_1.createRouteHandler)(onboarding_1.processPayment));
// Complete onboarding
router.post('/complete', (0, errorHandler_1.createRouteHandler)(onboarding_1.completeOnboarding));
exports.default = router;
//# sourceMappingURL=onboarding.js.map