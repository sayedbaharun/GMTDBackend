import request from 'supertest';
import express from 'express';
import { searchFlights } from '../../src/controllers/travelController';

// Mock the dependencies
jest.mock('../../src/services/amadeus', () => ({
  amadeusService: {
    searchFlights: jest.fn(),
    searchHotels: jest.fn(),
    searchAirports: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/flights', searchFlights as any);
  
  return app;
};

describe('Travel Controller', () => {
  let app: express.Application;
  const mockAmadeusService = require('../../src/services/amadeus').amadeusService;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /flights', () => {
    const validFlightQuery = {
      origin: 'JFK',
      destination: 'DXB',
      departureDate: '2025-06-01',
      adults: '2',
      travelClass: 'ECONOMY'
    };

    it('should return flight results for valid search', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            id: '1',
            source: 'GDS',
            oneWay: false,
            itineraries: [
              {
                segments: [
                  {
                    departure: { iataCode: 'JFK', at: '2025-06-01T10:00:00' },
                    arrival: { iataCode: 'DXB', at: '2025-06-01T22:00:00' },
                    carrierCode: 'EK',
                    number: '202'
                  }
                ]
              }
            ],
            price: { total: '1200.00', currency: 'USD' }
          }
        ],
        meta: { count: 1 }
      };

      mockAmadeusService.searchFlights.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/flights')
        .query(validFlightQuery)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.flights).toHaveLength(1);
      expect(response.body.message).toContain('Found 1 flight options');
      expect(mockAmadeusService.searchFlights).toHaveBeenCalledWith(
        'JFK',
        'DXB', 
        '2025-06-01',
        undefined,
        2,
        'ECONOMY'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .get('/flights')
        .query({
          origin: 'JFK',
          // Missing destination and departureDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/flights')
        .query({
          ...validFlightQuery,
          departureDate: '2025/06/01' // Invalid format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid date format');
    });

    it('should return 400 for invalid passenger count', async () => {
      const response = await request(app)
        .get('/flights')
        .query({
          ...validFlightQuery,
          adults: '10' // Too many passengers
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid number of adults');
    });

    it('should handle Amadeus service errors', async () => {
      mockAmadeusService.searchFlights.mockRejectedValue(new Error('Amadeus API error'));

      const response = await request(app)
        .get('/flights')
        .query(validFlightQuery)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error while searching flights');
    });

    it('should handle empty flight results', async () => {
      mockAmadeusService.searchFlights.mockResolvedValue({
        success: true,
        data: [],
        meta: { count: 0 }
      });

      const response = await request(app)
        .get('/flights')
        .query(validFlightQuery)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.flights).toHaveLength(0);
      expect(response.body.message).toContain('Found 0 flight options');
    });

    it('should default adults to 1 and travelClass to ECONOMY', async () => {
      const mockFlights = { success: true, data: [], meta: { count: 0 } };
      mockAmadeusService.searchFlights.mockResolvedValue(mockFlights);

      await request(app)
        .get('/flights')
        .query({
          origin: 'JFK',
          destination: 'DXB',
          departureDate: '2025-06-01'
          // No adults or travelClass specified
        })
        .expect(200);

      expect(mockAmadeusService.searchFlights).toHaveBeenCalledWith(
        'JFK',
        'DXB',
        '2025-06-01',
        undefined,
        1,
        'ECONOMY'
      );
    });
  });
});