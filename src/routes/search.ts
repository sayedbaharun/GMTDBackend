/**
 * Search Routes - Integrates with Amadeus API
 * Provides real-time flight and hotel search functionality
 */

import { Router } from 'express';
import { amadeusService } from '../services/amadeus';
import { authenticateMobileOptional, MobileAuthRequest } from '../middleware/mobileAuth';
import { z } from 'zod';

const router = Router();

// Flight search validation schema
const flightSearchSchema = z.object({
  origin: z.string().length(3, 'Origin must be 3-letter airport code'),
  destination: z.string().length(3, 'Destination must be 3-letter airport code'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  adults: z.number().min(1).max(9).default(1),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY')
});

// Hotel search validation schema
const hotelSearchSchema = z.object({
  cityCode: z.string().length(3, 'City code must be 3 letters').default('DXB'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  adults: z.number().min(1).max(9).default(1),
  radius: z.number().min(1).max(50).default(5),
  ratings: z.array(z.number().min(1).max(5)).default([3, 4, 5])
});

// Airport search validation schema
const airportSearchSchema = z.object({
  keyword: z.string().min(2, 'Keyword must be at least 2 characters'),
  subType: z.enum(['AIRPORT', 'CITY']).default('AIRPORT')
});

/**
 * Search flights using Amadeus API
 * POST /api/search/flights
 */
router.post('/flights', authenticateMobileOptional, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    // Validate request body
    const validationResult = flightSearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const searchParams = validationResult.data;
    
    // Log search for analytics (if user is logged in)
    if (req.userId) {
      console.log(`User ${req.userId} searching flights:`, searchParams);
    }

    // Search flights using Amadeus
    const result = await amadeusService.searchFlights(
      searchParams.origin,
      searchParams.destination,
      searchParams.departureDate,
      searchParams.returnDate,
      searchParams.adults,
      searchParams.travelClass
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to search flights',
        code: result.code
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        searchParams,
        searchedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search flights',
      details: error.message
    });
  }
});

/**
 * Search hotels using Amadeus API
 * POST /api/search/hotels
 */
router.post('/hotels', authenticateMobileOptional, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    // Validate request body
    const validationResult = hotelSearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const searchParams = validationResult.data;
    
    // Log search for analytics (if user is logged in)
    if (req.userId) {
      console.log(`User ${req.userId} searching hotels:`, searchParams);
    }

    // Search hotels using Amadeus
    const result = await amadeusService.searchHotels(
      searchParams.cityCode,
      searchParams.checkInDate,
      searchParams.checkOutDate,
      searchParams.adults,
      searchParams.radius,
      searchParams.ratings
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to search hotels',
        code: result.code
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        searchParams,
        searchedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
      details: error.message
    });
  }
});

/**
 * Get hotel offers for specific hotel
 * GET /api/search/hotels/:hotelId/offers
 */
router.get('/hotels/:hotelId/offers', authenticateMobileOptional, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate, adults = 1 } = req.query;

    if (!checkInDate || !checkOutDate) {
      res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
      return;
    }

    // Get hotel offers using Amadeus
    const result = await amadeusService.getHotelOffers(
      hotelId,
      checkInDate as string,
      checkOutDate as string,
      Number(adults)
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to get hotel offers',
        code: result.code
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error: any) {
    console.error('Hotel offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel offers',
      details: error.message
    });
  }
});

/**
 * Search airports/cities
 * POST /api/search/airports
 */
router.post('/airports', async (req, res): Promise<void> => {
  try {
    // Validate request body
    const validationResult = airportSearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const { keyword, subType } = validationResult.data;

    // Search airports using Amadeus
    const result = await amadeusService.searchAirports(keyword, subType);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to search airports',
        code: result.code
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error: any) {
    console.error('Airport search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search airports',
      details: error.message
    });
  }
});

/**
 * Search points of interest
 * POST /api/search/attractions
 */
router.post('/attractions', async (req, res): Promise<void> => {
  try {
    const { latitude, longitude, radius = 1, categories } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
      return;
    }

    // Search POIs using Amadeus
    const result = await amadeusService.searchPointsOfInterest(
      latitude,
      longitude,
      radius,
      categories
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to search attractions',
        code: result.code
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error: any) {
    console.error('Attractions search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search attractions',
      details: error.message
    });
  }
});

/**
 * Test Amadeus API connection
 * GET /api/search/test
 */
router.get('/test', async (req, res): Promise<void> => {
  try {
    const result = await amadeusService.testConnection();
    
    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Amadeus test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Amadeus connection',
      details: error.message
    });
  }
});

export default router;