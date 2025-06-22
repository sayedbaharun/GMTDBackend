import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    logger.warn('Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      errors: errorDetails,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),

  // Password validation
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Amount validation for payments
  amount: () => body('amount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Amount must be between 0.01 and 999,999.99'),

  // Currency validation
  currency: () => body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'AED', 'JPY'])
    .withMessage('Currency must be one of: USD, EUR, GBP, AED, JPY'),

  // Date validation (YYYY-MM-DD format)
  date: (fieldName: string) => body(fieldName)
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${fieldName} must be in YYYY-MM-DD format`)
    .isAfter(new Date().toISOString().split('T')[0])
    .withMessage(`${fieldName} must be in the future`),

  // IATA airport code validation
  airportCode: (fieldName: string) => body(fieldName)
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage(`${fieldName} must be a valid 3-letter airport code`),

  // Passenger count validation
  passengers: () => body('adults')
    .isInt({ min: 1, max: 9 })
    .withMessage('Number of adults must be between 1 and 9'),

  // Travel class validation
  travelClass: () => body('travelClass')
    .optional()
    .isIn(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'])
    .withMessage('Travel class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST'),

  // Booking ID validation
  bookingId: () => param('bookingId')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Search query validation
  searchQuery: () => query('q')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Search query must be between 1 and 100 characters'),

  // Phone number validation
  phone: () => body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Must be a valid phone number'),

  // Hotel search validation
  hotelSearch: () => [
    body('cityCode')
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('City code must be a valid 3-letter code'),
    body('checkInDate')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Check-in date must be in YYYY-MM-DD format')
      .isAfter(new Date().toISOString().split('T')[0])
      .withMessage('Check-in date must be in the future'),
    body('checkOutDate')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Check-out date must be in YYYY-MM-DD format')
      .custom((value, { req }) => {
        if (value <= req.body.checkInDate) {
          throw new Error('Check-out date must be after check-in date');
        }
        return true;
      }),
    body('adults')
      .isInt({ min: 1, max: 8 })
      .withMessage('Number of adults must be between 1 and 8'),
    body('children')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Number of children must be between 0 and 6')
  ],

  // Flight search validation
  flightSearch: () => [
    body('origin')
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Origin must be a valid 3-letter airport code'),
    body('destination')
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Destination must be a valid 3-letter airport code')
      .custom((value, { req }) => {
        if (value === req.body.origin) {
          throw new Error('Destination must be different from origin');
        }
        return true;
      }),
    body('departureDate')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Departure date must be in YYYY-MM-DD format')
      .isAfter(new Date().toISOString().split('T')[0])
      .withMessage('Departure date must be in the future'),
    body('returnDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Return date must be in YYYY-MM-DD format')
      .custom((value, { req }) => {
        if (value && value <= req.body.departureDate) {
          throw new Error('Return date must be after departure date');
        }
        return true;
      }),
    body('adults')
      .isInt({ min: 1, max: 9 })
      .withMessage('Number of adults must be between 1 and 9'),
    body('children')
      .optional()
      .isInt({ min: 0, max: 8 })
      .withMessage('Number of children must be between 0 and 8'),
    body('travelClass')
      .optional()
      .isIn(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'])
      .withMessage('Travel class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST')
  ]
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

/**
 * Validate API key for external integrations
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key') || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  // In production, validate against a list of valid API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (process.env.NODE_ENV === 'production' && !validApiKeys.includes(apiKey as string)) {
    logger.warn('Invalid API key used:', {
      apiKey: (apiKey as string).substring(0, 8) + '...',
      ip: req.ip,
      url: req.originalUrl
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};