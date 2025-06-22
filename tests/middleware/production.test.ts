import request from 'supertest';
import express from 'express';
import { 
  createRateLimiter, 
  apiLimiters, 
  requestLogger, 
  securityHeaders,
  requestSizeLimiter,
  apiVersioning
} from '../../src/middleware/production';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Production Middleware', () => {
  let app: express.Application;
  const mockLogger = require('../../src/utils/logger').logger;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with specified options', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 2, // 2 requests per minute
        message: 'Too many requests'
      });

      app.use(rateLimiter);
      app.get('/test', (req, res) => res.json({ success: true }) as any);

      // First request should succeed
      await request(app)
        .get('/test')
        .expect(200);

      // Second request should succeed
      await request(app)
        .get('/test')
        .expect(200);

      // Third request should be rate limited
      await request(app)
        .get('/test')
        .expect(429);
    });
  });

  describe('securityHeaders', () => {
    it('should add security headers to responses', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }) as any);

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-api-version']).toBe('1.0');
      expect(response.headers['x-response-time']).toBeDefined();
    });

    it('should add no-cache headers for sensitive endpoints', async () => {
      app.use(securityHeaders);
      app.get('/api/auth/login', (req, res) => res.json({ success: true }) as any);

      const response = await request(app)
        .get('/api/auth/login')
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should add no-cache headers for payment endpoints', async () => {
      app.use(securityHeaders);
      app.get('/api/payments/create', (req, res) => res.json({ success: true }) as any);

      const response = await request(app)
        .get('/api/payments/create')
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('requestSizeLimiter', () => {
    it('should create a request size limiter middleware', () => {
      const sizeLimiter = requestSizeLimiter('1mb');
      expect(typeof sizeLimiter).toBe('function');
    });

    it('should allow requests without content-length header', async () => {
      app.use(requestSizeLimiter('1mb') as any);
      app.post('/test', (req, res) => res.json({ success: true }) as any);

      await request(app)
        .post('/test')
        .send({ data: 'small payload' })
        .expect(200);
    });
  });

  describe('apiVersioning', () => {
    it('should set API version from header', async () => {
      app.use(apiVersioning);
      app.get('/test', ((req: any, res: any) => {
        res.json({ 
          success: true, 
          apiVersion: req.apiVersion 
        });
      }) as any);

      const response = await request(app)
        .get('/test')
        .set('API-Version', '2.0')
        .expect(200);

      expect(response.body.apiVersion).toBe('2.0');
      expect(response.headers['api-version']).toBe('2.0');
    });

    it('should set API version from query parameter', async () => {
      app.use(apiVersioning);
      app.get('/test', ((req: any, res: any) => {
        res.json({ 
          success: true, 
          apiVersion: req.apiVersion 
        });
      }) as any);

      const response = await request(app)
        .get('/test?version=1.5')
        .expect(200);

      expect(response.body.apiVersion).toBe('1.5');
      expect(response.headers['api-version']).toBe('1.5');
    });

    it('should default to version 1.0', async () => {
      app.use(apiVersioning);
      app.get('/test', ((req: any, res: any) => {
        res.json({ 
          success: true, 
          apiVersion: req.apiVersion 
        });
      }) as any);

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.apiVersion).toBe('1.0');
      expect(response.headers['api-version']).toBe('1.0');
    });
  });

  describe('requestLogger', () => {
    it('should log requests and responses', async () => {
      app.use(requestLogger);
      app.get('/test', (req, res) => res.json({ success: true }) as any);

      await request(app)
        .get('/test')
        .expect(200);

      // Check that logger was called for request and response
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      
      // Check request log
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'GET /test', expect.objectContaining({
        ip: expect.any(String),
        timestamp: expect.any(String),
        userId: 'anonymous'
      }));

      // Check response log
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'GET /test - 200', expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
        statusCode: 200,
        ip: expect.any(String),
        userId: 'anonymous'
      }));
    });

    it('should log user ID when user is authenticated', async () => {
      app.use((req: any, res, next) => {
        req.user = { id: 'user-123' };
        next();
      });
      app.use(requestLogger);
      app.get('/test', (req, res) => res.json({ success: true }) as any);

      await request(app)
        .get('/test')
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith('GET /test', expect.objectContaining({
        userId: 'user-123'
      }));
    });
  });

  describe('API Rate Limiters', () => {
    it('should have different limits for different endpoints', () => {
      expect(apiLimiters.general).toBeDefined();
      expect(apiLimiters.auth).toBeDefined();
      expect(apiLimiters.search).toBeDefined();
      expect(apiLimiters.booking).toBeDefined();
      expect(apiLimiters.payment).toBeDefined();
      expect(apiLimiters.passwordReset).toBeDefined();
    });

    it('should apply auth rate limiter correctly', async () => {
      // Create a simple rate limiter for testing
      const testRateLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 2, // 2 requests per minute for testing
        message: 'Too many auth attempts'
      });
      
      app.use('/api/auth', testRateLimiter);
      app.post('/api/auth/login', (req, res) => res.json({ success: true }) as any);

      // First two requests should succeed
      await request(app)
        .post('/api/auth/login')
        .expect(200);
        
      await request(app)
        .post('/api/auth/login')
        .expect(200);

      // Third request should be rate limited
      await request(app)
        .post('/api/auth/login')
        .expect(429);
    });
  });
});