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
const test_1 = require("../controllers/test");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * Test Routes
 * GET /api/test/stripe - Test Stripe connection
 * GET /api/test/products - List Stripe products and prices
 * POST /api/test/create-checkout - Create a Stripe checkout session for subscription
 * GET /api/test/checkout/:sessionId - Retrieve a Stripe checkout session by ID
 */
// Test Stripe connection
router.get('/stripe', (0, errorHandler_1.createRouteHandler)(test_1.testStripe));
// List Stripe products and prices
router.get('/products', (0, errorHandler_1.createRouteHandler)(test_1.listProducts));
// Create a checkout session for subscription
router.post('/create-checkout', (0, errorHandler_1.createRouteHandler)(test_1.createCheckoutSession));
// Retrieve a checkout session by ID
router.get('/checkout/:sessionId', (0, errorHandler_1.createRouteHandler)(test_1.getCheckoutSession));
exports.default = router;
//# sourceMappingURL=test.js.map