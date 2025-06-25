import { createPrismaClientWithRLS, RLSContext } from '../prisma-with-rls';
import { PrismaClient } from '@prisma/client';

describe('Prisma with RLS', () => {
  let prisma: PrismaClient;
  let rlsClient: PrismaClient;
  
  beforeAll(() => {
    // Create base client
    const clientWithRLS = createPrismaClientWithRLS();
    
    // Create RLS-enabled client for a specific user
    const context: RLSContext = {
      userId: 'test-user-123',
      isAdmin: false,
      bypassRLS: false,
    };
    
    rlsClient = clientWithRLS.withRLS(context);
    
    // Create admin client
    const adminContext: RLSContext = {
      userId: 'admin-user-123',
      isAdmin: true,
      bypassRLS: true,
    };
    
    prisma = clientWithRLS.withRLS(adminContext);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await rlsClient.$disconnect();
  });

  describe('RLS Context Injection', () => {
    it('should create RLS client with user context', () => {
      expect(rlsClient).toBeDefined();
      expect(rlsClient).toHaveProperty('booking');
      expect(rlsClient).toHaveProperty('user');
    });

    it('should create admin client with bypass', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toHaveProperty('booking');
      expect(prisma).toHaveProperty('user');
    });
  });

  describe('User Data Filtering', () => {
    // These tests would need a test database with seed data
    // They are marked as skipped for now
    
    it.skip('should only return bookings for the authenticated user', async () => {
      // This would test that rlsClient.booking.findMany() only returns
      // bookings where userId matches the context userId
    });

    it.skip('should prevent access to other users bookings', async () => {
      // This would test that rlsClient.booking.findUnique() returns null
      // when trying to access a booking with a different userId
    });

    it.skip('should automatically set userId on create', async () => {
      // This would test that creating a booking automatically sets
      // the userId from the context
    });
  });

  describe('Admin Access', () => {
    it.skip('should allow admin to access all bookings', async () => {
      // This would test that prisma.booking.findMany() returns all bookings
      // regardless of userId when bypassRLS is true
    });

    it.skip('should allow admin to update any booking', async () => {
      // This would test that admin can update bookings from any user
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no userId in context for protected models', async () => {
      const clientWithRLS = createPrismaClientWithRLS();
      const noUserContext: RLSContext = {
        bypassRLS: false,
      };
      
      const invalidClient = clientWithRLS.withRLS(noUserContext);
      
      // This should throw an error
      await expect(invalidClient.booking.findMany()).rejects.toThrow(
        'Authentication required for this operation'
      );
    });
  });
});