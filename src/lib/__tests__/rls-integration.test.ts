import { RLSTestHelper, TestUser, TestBooking } from './rls-test-helpers';
import { PrismaClient } from '@prisma/client';

describe('RLS Integration Tests', () => {
  let helper: RLSTestHelper;
  let user1: TestUser;
  let user2: TestUser;
  let adminUser: TestUser;
  let booking1: TestBooking;
  let booking2: TestBooking;
  let userClient1: PrismaClient;
  let userClient2: PrismaClient;
  let adminClient: PrismaClient;

  beforeAll(async () => {
    helper = new RLSTestHelper();
    
    // Create test users
    user1 = await helper.createTestUser({ fullName: 'User One' });
    user2 = await helper.createTestUser({ fullName: 'User Two' });
    adminUser = await helper.createTestUser({ fullName: 'Admin User', isAdmin: true });
    
    // Create test bookings
    booking1 = await helper.createTestBooking(user1.id, { totalPrice: 500 });
    booking2 = await helper.createTestBooking(user2.id, { totalPrice: 750 });
    
    // Get clients for each user
    userClient1 = helper.getClientForUser(user1.id);
    userClient2 = helper.getClientForUser(user2.id);
    adminClient = helper.getClientForUser(adminUser.id, true);
  });

  afterAll(async () => {
    await helper.cleanupTestData([user1.id, user2.id, adminUser.id]);
    await userClient1.$disconnect();
    await userClient2.$disconnect();
    await adminClient.$disconnect();
    await helper.disconnect();
  });

  describe('User Access Control', () => {
    it('should only return own bookings for user 1', async () => {
      const bookings = await userClient1.booking.findMany();
      
      expect(bookings).toHaveLength(1);
      expect(bookings[0].id).toBe(booking1.id);
      expect(bookings[0].userId).toBe(user1.id);
    });

    it('should only return own bookings for user 2', async () => {
      const bookings = await userClient2.booking.findMany();
      
      expect(bookings).toHaveLength(1);
      expect(bookings[0].id).toBe(booking2.id);
      expect(bookings[0].userId).toBe(user2.id);
    });

    it('should not allow user 1 to access user 2 booking', async () => {
      const booking = await userClient1.booking.findUnique({
        where: { id: booking2.id },
      });
      
      expect(booking).toBeNull();
    });

    it('should automatically filter count queries', async () => {
      const count1 = await userClient1.booking.count();
      const count2 = await userClient2.booking.count();
      
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('Create Operations', () => {
    it('should automatically set userId when creating booking', async () => {
      const newBooking = await userClient1.booking.create({
        data: {
          status: 'PENDING',
          totalPrice: 300,
          currency: 'USD',
          paymentStatus: 'UNPAID',
        },
      });
      
      expect(newBooking.userId).toBe(user1.id);
      
      // Cleanup
      await helper.adminClient.booking.delete({ where: { id: newBooking.id } });
    });

    it('should not allow creating booking with different userId', async () => {
      const bookingData = {
        userId: user2.id, // Trying to set different userId
        status: 'PENDING',
        totalPrice: 300,
        currency: 'USD',
        paymentStatus: 'UNPAID',
      };
      
      // The RLS middleware should override the userId
      const newBooking = await userClient1.booking.create({
        data: bookingData,
      });
      
      expect(newBooking.userId).toBe(user1.id); // Should be user1, not user2
      
      // Cleanup
      await helper.adminClient.booking.delete({ where: { id: newBooking.id } });
    });
  });

  describe('Update Operations', () => {
    it('should only allow updating own bookings', async () => {
      const updated = await userClient1.booking.update({
        where: { id: booking1.id },
        data: { status: 'CONFIRMED' },
      });
      
      expect(updated.status).toBe('CONFIRMED');
      
      // Reset
      await helper.adminClient.booking.update({
        where: { id: booking1.id },
        data: { status: 'PENDING' },
      });
    });

    it('should not allow updating other user bookings', async () => {
      await expect(
        userClient1.booking.update({
          where: { id: booking2.id },
          data: { status: 'CONFIRMED' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Operations', () => {
    it('should only allow deleting own bookings', async () => {
      // Create a temporary booking
      const tempBooking = await helper.createTestBooking(user1.id, { 
        totalPrice: 999 
      });
      
      // User should be able to delete their own booking
      const deleted = await userClient1.booking.delete({
        where: { id: tempBooking.id },
      });
      
      expect(deleted.id).toBe(tempBooking.id);
    });

    it('should not allow deleting other user bookings', async () => {
      await expect(
        userClient1.booking.delete({
          where: { id: booking2.id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to see all bookings', async () => {
      const bookings = await adminClient.booking.findMany({
        orderBy: { bookedAt: 'asc' },
      });
      
      expect(bookings.length).toBeGreaterThanOrEqual(2);
      const bookingIds = bookings.map(b => b.id);
      expect(bookingIds).toContain(booking1.id);
      expect(bookingIds).toContain(booking2.id);
    });

    it('should allow admin to update any booking', async () => {
      const updated = await adminClient.booking.update({
        where: { id: booking2.id },
        data: { status: 'COMPLETED' },
      });
      
      expect(updated.status).toBe('COMPLETED');
      
      // Reset
      await adminClient.booking.update({
        where: { id: booking2.id },
        data: { status: 'PENDING' },
      });
    });
  });

  describe('Aggregate Operations', () => {
    it('should filter aggregate queries by user', async () => {
      const sum1 = await userClient1.booking.aggregate({
        _sum: { totalPrice: true },
      });
      
      const sum2 = await userClient2.booking.aggregate({
        _sum: { totalPrice: true },
      });
      
      expect(sum1._sum.totalPrice).toBe(500);
      expect(sum2._sum.totalPrice).toBe(750);
    });
  });

  describe('Related Models', () => {
    it('should filter related booking flights by user', async () => {
      // This would test that BookingFlight entries are filtered
      // based on the parent booking's userId
      // Skipped for now as it requires more complex setup
    });
  });
});