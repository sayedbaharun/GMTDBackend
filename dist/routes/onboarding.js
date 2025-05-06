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
const onboarding_1 = require("../controllers/onboarding");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../utils/errorHandler");
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
router.use(auth_1.authenticate);
// Get current onboarding status
router.get('/status', (0, validation_1.validate)(validation_1.onboardingValidation.getOnboardingStatus), (0, errorHandler_1.createRouteHandler)(onboarding_1.getOnboardingStatus));
// Step 1: Save basic user information
router.post('/user-info', (0, validation_1.validate)(validation_1.onboardingValidation.userInfo), (0, errorHandler_1.createRouteHandler)(onboarding_1.saveUserInfo));
// Step 2: Save additional details
router.post('/additional-details', (0, validation_1.validate)(validation_1.onboardingValidation.additionalDetails), (0, errorHandler_1.createRouteHandler)(onboarding_1.saveAdditionalDetails));
// Step 3: Process payment
router.post('/payment', (0, validation_1.validate)(validation_1.onboardingValidation.paymentProcess), (0, errorHandler_1.createRouteHandler)(onboarding_1.processPayment));
// Complete onboarding
router.post('/complete', (0, errorHandler_1.createRouteHandler)(onboarding_1.completeOnboarding));
exports.default = router;
//# sourceMappingURL=onboarding.js.map