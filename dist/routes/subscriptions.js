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
const subscriptions_1 = require("../controllers/subscriptions");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * Subscription Routes
 * POST /api/subscriptions/create - Create a new subscription
 * GET /api/subscriptions/status - Get current subscription status
 * POST /api/subscriptions/portal - Create a Stripe Customer Portal session
 */
// All subscription routes require authentication
router.use(auth_1.authenticateAndSyncUser);
// Create a new subscription
router.post('/create', (0, validation_1.validate)(validation_1.subscriptionValidation.create), (0, errorHandler_1.createRouteHandler)(subscriptions_1.createSubscription));
// Get current subscription status
router.get('/status', (0, errorHandler_1.createRouteHandler)(subscriptions_1.getSubscriptionStatus));
// Create a Stripe Customer Portal session
// Requires onboarding to be complete
router.post('/portal', auth_1.requireOnboardingComplete, (0, errorHandler_1.createRouteHandler)(subscriptions_1.createCustomerPortal));
exports.default = router;
//# sourceMappingURL=subscriptions.js.map