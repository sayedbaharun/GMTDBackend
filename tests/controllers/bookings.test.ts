import request from 'supertest';
import express from 'express';
import { getUserBookings } from '../../src/controllers/bookingController';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({}));
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Add middleware to simulate authenticated user
  app.use((req: any, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  });
  
  app.get('/bookings', getUserBookings as any);
  
  return app;
};

describe('Booking Controller', () => {
  let app: express.Application;
  const mockPrisma = require('../../src/lib/prisma').prisma;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /bookings', () => {
    it('should return user bookings successfully', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          totalAmount: 1500.00,
          currency: 'USD',
          status: 'CONFIRMED',
          bookedAt: new Date('2025-01-01'),
          flightBookings: [
            {
              id: 'flight-booking-1',
              flight: {
                id: 'flight-1',
                origin: 'JFK',
                destination: 'DXB',
                departureTime: new Date('2025-06-01T10:00:00Z')
              }
            }
          ],
          hotelBookings: [],
          conciergeRequests: []
        },
        {
          id: 'booking-2',
          userId: 'user-123',
          totalAmount: 800.00,
          currency: 'USD',
          status: 'PENDING',
          bookedAt: new Date('2025-01-02'),
          flightBookings: [],
          hotelBookings: [
            {
              id: 'hotel-booking-1',
              hotel: {
                id: 'hotel-1',
                name: 'Luxury Hotel Dubai',
                address: 'Dubai Marina'
              },
              room: {
                id: 'room-1',
                type: 'Deluxe Suite'
              }
            }
          ],
          conciergeRequests: []
        }
      ];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.data[0].id).toBe('booking-1');
      expect(response.body.data[1].id).toBe('booking-2');

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          flightBookings: {
            include: {
              flight: true,
            },
          },
          hotelBookings: {
            include: {
              hotel: true,
              room: true,
            },
          },
          conciergeRequests: true,
        },
        orderBy: {
          bookedAt: 'desc',
        },
      });
    });

    it('should return empty array when user has no bookings', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle database errors', async () => {
      mockPrisma.booking.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/bookings')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch user bookings');
    });

    it('should return 401 for unauthenticated users', async () => {
      // Create app without user middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.get('/bookings', getUserBookings as any);

      const response = await request(unauthApp)
        .get('/bookings')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not authenticated');
    });

    it('should include all booking relations', async () => {
      const mockBookingsWithRelations = [
        {
          id: 'booking-1',
          userId: 'user-123',
          flightBookings: [
            {
              id: 'fb-1',
              flight: { id: 'f-1', origin: 'JFK', destination: 'DXB' }
            }
          ],
          hotelBookings: [
            {
              id: 'hb-1',
              hotel: { id: 'h-1', name: 'Test Hotel' },
              room: { id: 'r-1', type: 'Suite' }
            }
          ],
          conciergeRequests: [
            { id: 'cr-1', description: 'Restaurant reservation' }
          ]
        }
      ];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookingsWithRelations);

      const response = await request(app)
        .get('/bookings')
        .expect(200);

      const booking = response.body.data[0];
      expect(booking.flightBookings).toHaveLength(1);
      expect(booking.hotelBookings).toHaveLength(1);
      expect(booking.conciergeRequests).toHaveLength(1);
      expect(booking.flightBookings[0].flight).toBeDefined();
      expect(booking.hotelBookings[0].hotel).toBeDefined();
      expect(booking.hotelBookings[0].room).toBeDefined();
    });
  });
});