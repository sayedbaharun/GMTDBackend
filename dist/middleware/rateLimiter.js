"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
/**
 * Rate limiting middleware to prevent abuse
 * Limits requests based on IP address
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: 'Too many requests, please try again later.',
    },
    skip: (req) => {
        // Skip rate limiting for webhook endpoints
        if (req && req.path) {
            return req.path.startsWith('/api/webhooks');
        }
        return false;
    },
});
/**
 * Stricter rate limiting for authentication routes
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: 'Too many authentication attempts, please try again later.',
    },
});
/**
 * Rate limiting specifically for password reset attempts
 */
exports.passwordResetRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: 'Too many password reset attempts, please try again later.',
    },
});
//# sourceMappingURL=rateLimiter.js.map