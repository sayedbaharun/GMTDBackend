import { PrismaClient } from '@prisma/client';
import { createPrismaClientWithRLS, RLSContext } from '../prisma-with-rls';
import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

export interface TestBooking {
  id: string;
  userId: string;
  status: string;
  totalPrice: number;
  currency: string;
  paymentStatus: string;
}

export class RLSTestHelper {
  private adminClient: PrismaClient;
  
  constructor() {
    const clientWithRLS = createPrismaClientWithRLS();
    const adminContext: RLSContext = {
      userId: 'system-admin',
      isAdmin: true,
      bypassRLS: true,
    };
    this.adminClient = clientWithRLS.withRLS(adminContext);
  }

  async createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    const user = {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      fullName: 'Test User',
      isAdmin: false,
      ...overrides,
    };

    await this.adminClient.user.create({
      data: user,
    });

    return user;
  }

  async createTestBooking(userId: string, overrides?: Partial<TestBooking>): Promise<TestBooking> {
    const booking = {
      id: uuidv4(),
      userId,
      status: 'PENDING',
      totalPrice: 1000,
      currency: 'USD',
      paymentStatus: 'UNPAID',
      ...overrides,
    };

    await this.adminClient.booking.create({
      data: booking,
    });

    return booking;
  }

  async cleanupTestData(userIds: string[]) {
    // Delete in order to respect foreign key constraints
    await this.adminClient.bookingAuditLog.deleteMany({
      where: {
        booking: {
          userId: { in: userIds },
        },
      },
    });

    await this.adminClient.booking.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });

    await this.adminClient.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });
  }

  async disconnect() {
    await this.adminClient.$disconnect();
  }

  // Helper to get a client for a specific user
  getClientForUser(userId: string, isAdmin: boolean = false): PrismaClient {
    const clientWithRLS = createPrismaClientWithRLS();
    const context: RLSContext = {
      userId,
      isAdmin,
      bypassRLS: false,
    };
    return clientWithRLS.withRLS(context);
  }
}