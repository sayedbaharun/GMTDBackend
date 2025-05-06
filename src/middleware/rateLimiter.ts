import rateLimit from 'express-rate-limit';
import * as express from 'express';
type Request = express.Request;
import { config } from '../config';

/**
 * Rate limiting middleware to prevent abuse
 * Limits requests based on IP address
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
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
export const authRateLimiter = rateLimit({
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
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many password reset attempts, please try again later.',
  },
});
