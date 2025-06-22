import request from 'supertest';
import express from 'express';
import { getHealthStatus, getReadinessStatus, getLivenessStatus } from '../../src/controllers/health';

// Mock the dependencies
jest.mock('../../src/config', () => ({
  config: {
    enableDatabase: false, // Disable database for tests
    stripe: {
      secretKey: undefined // Disable stripe for tests
    }
  }
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/health', getHealthStatus as any);
  app.get('/health/ready', getReadinessStatus as any);
  app.get('/health/live', getLivenessStatus as any);
  
  return app;
};

describe('Health Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('checks');
      
      expect(response.body.checks).toHaveProperty('server');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('stripe');
      expect(response.body.checks).toHaveProperty('system');
      
      expect(response.body.checks.server.status).toBe('ok');
      expect(response.body.checks.database.status).toBe('disabled');
      expect(response.body.checks.stripe.status).toBe('disabled');
    });

    it('should include system metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks.system).toHaveProperty('loadAverage');
      expect(response.body.checks.system).toHaveProperty('freeMemory');
      expect(response.body.checks.system).toHaveProperty('totalMemory');
      expect(response.body.checks.system).toHaveProperty('cpus');
    });

    it('should handle disabled database gracefully', async () => {
      // With database disabled in config, it should return disabled status
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.checks.database.status).toBe('disabled');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status with uptime', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.uptime).toBe('number');
    });
  });
});