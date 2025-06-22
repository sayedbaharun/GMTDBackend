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
const health_1 = require("../controllers/health");
const errorHandler_1 = require("../utils/errorHandler");
const router = Router();
/**
 * Health Routes
 * GET /api/health - Check system health status
 * GET /api/health/ready - Readiness probe (Kubernetes)
 * GET /api/health/live - Liveness probe (Kubernetes)
 * GET /api/health/connectivity - Test mobile app connectivity
 */
router.get('/', (0, errorHandler_1.createRouteHandler)(health_1.getHealthStatus));
router.get('/ready', (0, errorHandler_1.createRouteHandler)(health_1.getReadinessStatus));
router.get('/live', (0, errorHandler_1.createRouteHandler)(health_1.getLivenessStatus));
// Specific endpoint for mobile app connectivity testing
router.get('/connectivity', (req, res) => {
    res.json({
        success: true,
        message: 'Backend connectivity successful',
        timestamp: new Date().toISOString(),
        server: 'GetMeToDubai Backend',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
            bookings: '/api/bookings',
            payments: '/api/payments/process',
            health: '/api/health',
            chat: '/api/chat',
            travel: '/api/travel'
        }
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map