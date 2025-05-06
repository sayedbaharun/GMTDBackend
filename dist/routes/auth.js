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
const auth_1 = require("../controllers/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * Authentication Routes
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login an existing user
 * POST /api/auth/logout - Logout the current user
 * POST /api/auth/reset-password - Request a password reset
 */
// Apply rate limiting for auth routes
router.use(rateLimiter_1.authRateLimiter);
// Register a new user
router.post('/register', (0, validation_1.validate)(validation_1.authValidation.register), (0, errorHandler_1.createRouteHandler)(auth_1.register));
// Login an existing user
router.post('/login', (0, validation_1.validate)(validation_1.authValidation.login), (0, errorHandler_1.createRouteHandler)(auth_1.login));
// Logout the current user
router.post('/logout', (0, errorHandler_1.createRouteHandler)(auth_1.logout));
// Request a password reset (with specific rate limiter)
router.post('/reset-password', rateLimiter_1.passwordResetRateLimiter, (0, validation_1.validate)(validation_1.authValidation.resetPassword), (0, errorHandler_1.createRouteHandler)(auth_1.resetPassword));
exports.default = router;
//# sourceMappingURL=auth.js.map