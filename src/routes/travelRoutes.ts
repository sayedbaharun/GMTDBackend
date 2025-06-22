import { Router } from 'express';
import { asyncHandler } from '../utils/routeHandler';
import { authenticateAndSyncUser, authenticateOptional } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { 
  searchFlights, 
  searchHotels,
  searchLocations, 
  getHotelOffers,
  searchPointsOfInterest,
  testAmadeusConnection 
} from '../controllers/travelController';

const router = Router();

/**
 * Travel Routes
 * GET /api/travel/flights - Search for flights
 * GET /api/travel/hotels - Search for hotels
 * GET /api/travel/hotels/:hotelId/offers - Get hotel offers by hotel ID
 * GET /api/travel/locations - Search for airports or cities
 * GET /api/travel/points-of-interest - Search for points of interest
 * GET /api/travel/test-connection - Test Amadeus API connection
 */

// Test the Amadeus API connection
router.get('/test-connection', asyncHandler(testAmadeusConnection));

// Search for flights (public endpoint - no auth required for browsing)
router.get('/flights', authenticateOptional, asyncHandler(searchFlights));

// Search for hotels (public endpoint - no auth required for browsing)
router.get('/hotels', authenticateOptional, asyncHandler(searchHotels));

// Get hotel offers by hotel ID
router.get('/hotels/:hotelId/offers', authenticateOptional, asyncHandler(getHotelOffers));

// Search for airports or cities
router.get('/locations', authenticateOptional, asyncHandler(searchLocations));

// Search for points of interest
router.get('/points-of-interest', authenticateOptional, asyncHandler(searchPointsOfInterest));

export { router as travelRoutes };
