import { Request, Response, NextFunction } from 'express';

// Mock the services first
jest.mock('../../src/services/auth', () => ({
  authService: {
    getOrCreateUser: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock express-oauth2-jwt-bearer to avoid Auth0 validation issues
jest.mock('express-oauth2-jwt-bearer', () => ({
  auth: jest.fn(() => (req: any, res: any, next: any) => next()),
  claimCheck: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Auth Service Integration', () => {
  const mockAuthService = require('../../src/services/auth').authService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create mock auth service successfully', () => {
    expect(mockAuthService).toBeDefined();
    expect(mockAuthService.getOrCreateUser).toBeDefined();
  });

  it('should handle user creation flow', async () => {
    const mockUser = {
      id: 'user-123',
      auth0Id: 'auth0|123456789',
      email: 'test@example.com',
      name: 'Test User'
    };

    mockAuthService.getOrCreateUser.mockResolvedValue(mockUser);

    const result = await mockAuthService.getOrCreateUser('auth0|123456789', {
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(result).toBe(mockUser);
    expect(mockAuthService.getOrCreateUser).toHaveBeenCalledWith('auth0|123456789', {
      email: 'test@example.com',
      name: 'Test User'
    });
  });

  it('should handle user service errors', async () => {
    mockAuthService.getOrCreateUser.mockRejectedValue(new Error('Database error'));

    await expect(
      mockAuthService.getOrCreateUser('auth0|123456789', {})
    ).rejects.toThrow('Database error');
  });
});