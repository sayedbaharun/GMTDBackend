/// <reference types="jest" />
import { jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Global test setup
declare global {
  var __PRISMA__: PrismaClient;
}

// Mock external services
jest.mock('amadeus', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    shopping: {
      flightOffersSearch: {
        get: jest.fn()
      },
      hotelOffersSearch: {
        get: jest.fn()
      }
    },
    referenceData: {
      locations: {
        get: jest.fn()
      }
    }
  }))
}));

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn()
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn()
    }
  }))
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

// Setup test environment
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:gmtd-secure-password-2025@localhost:5432/gmtd_dubai?host=/cloudsql/frontend-459111:us-central1:gmtd-postgres';
  global.__PRISMA__ = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
  process.env.AUTH0_AUDIENCE = 'test-audience';
  process.env.AUTH0_CLIENT_ID = 'test-client-id';
  process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.OPENAI_API_KEY = 'test-openai-key';
});

afterAll(async () => {
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect();
  }
});

// Clean up between tests
beforeEach(() => {
  jest.clearAllMocks();
});
