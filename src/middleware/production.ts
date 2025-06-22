import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils/logger';

/**
 * Enhanced rate limiting with different tiers for different endpoints
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

/**
 * Slow down repeated requests to prevent abuse
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: (used) => {
    return (used - 50) * 100; // Add 100ms delay per request after delayAfter
  },
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true
});

/**
 * API-specific rate limiters
 */
export const apiLimiters = {
  // General API rate limiting
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
    message: 'Too many API requests, please try again later.'
  }),

  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true
  }),

  // Rate limiting for search endpoints (can be expensive)
  search: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please try again later.'
  }),

  // Rate limiting for booking endpoints
  booking: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    message: 'Too many booking requests, please try again later.'
  }),

  // Rate limiting for payment endpoints
  payment: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many payment requests, please try again later.'
  }),

  // Very strict rate limiting for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts, please try again later.'
  })
};

/**
 * Request logging middleware for production
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.id || 'anonymous'
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      ip: req.ip,
      userId: (req as any).user?.id || 'anonymous'
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error tracking middleware
 */
export const errorTracker = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with request context
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  next(err);
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Response-Time', Date.now().toString());
  
  // Prevent caching of sensitive endpoints
  if (req.originalUrl.includes('/api/auth') || req.originalUrl.includes('/api/payments')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Request size limiter for specific endpoints
 */
export const requestSizeLimiter = (maxSize: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeInMB) {
        logger.warn(`Request size limit exceeded: ${sizeInMB}MB > ${maxSizeInMB}MB`, {
          ip: req.ip,
          url: req.originalUrl,
          size: `${sizeInMB}MB`
        });
        
        return res.status(413).json({
          error: 'Request entity too large',
          maxSize: maxSize
        });
      }
    }
    
    next();
  };
};

/**
 * API version middleware
 */
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  const apiVersion = req.get('API-Version') || req.query.version || '1.0';
  
  // Store API version in request for later use
  (req as any).apiVersion = apiVersion;
  
  // Set response header
  res.setHeader('API-Version', apiVersion as string);
  
  next();
};