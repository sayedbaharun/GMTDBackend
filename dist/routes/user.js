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
const user_1 = require("../controllers/user");
const userDashboard_1 = require("../controllers/userDashboard");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * User Routes
 * Profile and Dashboard endpoints
 */
// Authentication middleware for all user routes
router.use(auth_1.authenticateAndSyncUser);
// Profile routes
router.get('/profile', (0, errorHandler_1.createRouteHandler)(user_1.getProfile));
router.put('/profile', (0, validation_1.validate)(validation_1.userProfileValidation.update), (0, errorHandler_1.createRouteHandler)(user_1.updateProfile));
// Dashboard routes
router.get('/dashboard', (0, errorHandler_1.createRouteHandler)(userDashboard_1.getDashboardOverview));
router.get('/dashboard/bookings', (0, errorHandler_1.createRouteHandler)(userDashboard_1.getBookingHistory));
router.get('/dashboard/timeline', (0, errorHandler_1.createRouteHandler)(userDashboard_1.getActivityTimeline));
router.get('/dashboard/preferences', (0, errorHandler_1.createRouteHandler)(userDashboard_1.getTravelPreferences));
router.put('/dashboard/preferences', (0, errorHandler_1.createRouteHandler)(userDashboard_1.updateTravelPreferences));
exports.default = router;
//# sourceMappingURL=user.js.map