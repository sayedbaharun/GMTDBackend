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
const auth_1 = require("../middleware/auth");
const adminController = __importStar(require("../controllers/admin"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * Admin Routes - All protected by authentication middleware
 * All routes require authentication and admin privileges
 */
// Apply authentication middleware to all admin routes
router.use(auth_1.authenticate);
router.use(rateLimiter_1.rateLimiter);
// User management endpoints
router.get('/users', (0, errorHandler_1.asyncHandler)(adminController.getAllUsers));
router.get('/users/:userId', (0, errorHandler_1.asyncHandler)(adminController.getUserById));
router.put('/users/:userId', (0, errorHandler_1.asyncHandler)(adminController.updateUser));
router.delete('/users/:userId', (0, errorHandler_1.asyncHandler)(adminController.deleteUser));
// Subscription management endpoints
router.get('/subscriptions', (0, errorHandler_1.asyncHandler)(adminController.getAllSubscriptions));
// Booking management endpoints
router.get('/bookings', (0, errorHandler_1.asyncHandler)(adminController.getAllBookings));
// Dashboard statistics
router.get('/dashboard', (0, errorHandler_1.asyncHandler)(adminController.getDashboardStats));
// System monitoring and logs
router.get('/system-logs', (0, errorHandler_1.asyncHandler)(adminController.getSystemLogs));
exports.default = router;
//# sourceMappingURL=admin.js.map