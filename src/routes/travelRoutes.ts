import { Router } from 'express';
import { asyncHandler } from '../utils/routeHandler';
import { authenticate, authenticateOptional } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { searchFlights, searchLocations, testAmadeusConnection } from '../controllers/travelController';

const router = Router();

/**
 * Travel Routes
 * GET /api/travel/flights - Search for flights
 * GET /api/travel/locations - Search for airports or cities
 * GET /api/travel/test-connection - Test Amadeus API connection
 */

// Test the Amadeus API connection
router.get('/test-connection', asyncHandler(testAmadeusConnection));

// Search for flights - Allow public access with optional authentication
router.get('/flights', authenticateOptional, asyncHandler(searchFlights));

// Search for airports or cities
router.get('/locations', asyncHandler(searchLocations));

export default router;
