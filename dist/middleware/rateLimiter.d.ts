/**
 * Rate limiting middleware to prevent abuse
 * Limits requests based on IP address
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Stricter rate limiting for authentication routes
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiting specifically for password reset attempts
 */
export declare const passwordResetRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
