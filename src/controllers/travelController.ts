import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
import { amadeusService } from '../services/amadeus';
import { logger } from '../utils/logger';

/**
 * Search for flights based on query parameters
 * @route GET /api/travel/flights
 */
export const searchFlights = async (req: express.Request, res: express.Response) => {
  try {
    const {
      origin,
      destination, 
      departureDate,
      returnDate,
      adults = '1',
      travelClass = 'ECONOMY'
    } = req.query;

    // Input validation
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: origin, destination, and departureDate are required' 
      });
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format for dates'
      });
    }

    if (returnDate && !dateRegex.test(returnDate as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid return date format. Use YYYY-MM-DD format for dates'
      });
    }

    // Validate passenger count
    const adultCount = parseInt(adults as string);
    if (isNaN(adultCount) || adultCount < 1 || adultCount > 9) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of adults. Must be between 1 and 9'
      });
    }

    // Validate travel class
    const validClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    if (!validClasses.includes((travelClass as string).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid travel class. Must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST'
      });
    }

    logger.info('Flight search request:', {
      origin,
      destination,
      departureDate,
      returnDate,
      adults: adultCount,
      travelClass
    });

    // Call Amadeus service for flight search
    const result = await amadeusService.searchFlights(
      origin as string, 
      destination as string, 
      departureDate as string,
      returnDate as string,
      adultCount,
      (travelClass as string).toUpperCase()
    );

    if (!result.success) {
      logger.error('Amadeus flight search failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to search flights',
        code: result.code
      });
    }

    // Format response for frontend
    const formattedResponse = {
      success: true,
      data: {
        flights: result.data,
        searchParams: {
          origin,
          destination,
          departureDate,
          returnDate,
          adults: adultCount,
          travelClass
        },
        meta: result.meta
      },
      message: `Found ${result.data.length} flight options`
    };

    res.status(200).json(formattedResponse);
  } catch (error: any) {
    logger.error('Error in flight search controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while searching flights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

/**
 * Search for hotels based on query parameters
 * @route GET /api/travel/hotels
 */
export const searchHotels = async (req: express.Request, res: express.Response) => {
  try {
    const {
      cityCode = 'DXB', // Default to Dubai
      checkInDate,
      checkOutDate,
      adults = '1',
      radius = '5',
      ratings = '3,4,5'
    } = req.query;

    // Input validation
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: checkInDate and checkOutDate are required' 
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkInDate as string) || !dateRegex.test(checkOutDate as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format for dates'
      });
    }

    // Validate check-in is before check-out
    if (new Date(checkInDate as string) >= new Date(checkOutDate as string)) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date must be before check-out date'
      });
    }

    // Parse and validate parameters
    const adultCount = parseInt(adults as string);
    const searchRadius = parseInt(radius as string);
    const hotelRatings = (ratings as string).split(',').map(r => parseInt(r.trim()));

    if (isNaN(adultCount) || adultCount < 1 || adultCount > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of adults. Must be between 1 and 8'
      });
    }

    logger.info('Hotel search request:', {
      cityCode,
      checkInDate,
      checkOutDate,
      adults: adultCount,
      radius: searchRadius,
      ratings: hotelRatings
    });

    // Call Amadeus service for hotel search
    const result = await amadeusService.searchHotels(
      cityCode as string,
      checkInDate as string,
      checkOutDate as string,
      adultCount,
      searchRadius,
      hotelRatings
    );

    if (!result.success) {
      logger.error('Amadeus hotel search failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to search hotels',
        code: result.code
      });
    }

    // Format response for frontend
    const formattedResponse = {
      success: true,
      data: {
        hotels: result.data,
        searchParams: {
          cityCode,
          checkInDate,
          checkOutDate,
          adults: adultCount,
          radius: searchRadius,
          ratings: hotelRatings
        },
        meta: result.meta
      },
      message: `Found ${result.data.length} hotel options`
    };

    res.status(200).json(formattedResponse);
  } catch (error: any) {
    logger.error('Error in hotel search controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while searching hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

/**
 * Search for airports/locations based on keyword
 * @route GET /api/travel/locations
 */
export const searchLocations = async (req: express.Request, res: express.Response) => {
  try {
    const {
      keyword,
      subType = 'AIRPORT'
    } = req.query;

    // Input validation
    if (!keyword || (keyword as string).trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Keyword must be at least 2 characters long' 
      });
    }

    // Validate subType
    const validSubTypes = ['AIRPORT', 'CITY'];
    if (!validSubTypes.includes((subType as string).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subType. Must be either AIRPORT or CITY'
      });
    }

    logger.info('Location search request:', { keyword, subType });

    // Call Amadeus service for location search
    const result = await amadeusService.searchAirports(
      (keyword as string).trim(),
      (subType as string).toUpperCase()
    );

    if (!result.success) {
      logger.error('Amadeus location search failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to search locations',
        code: result.code
      });
    }

    // Format response for frontend
    const formattedResponse = {
      success: true,
      data: {
        locations: result.data,
        searchParams: {
          keyword,
          subType
        },
        meta: result.meta
      },
      message: `Found ${result.data.length} locations`
    };

    res.status(200).json(formattedResponse);
  } catch (error: any) {
    logger.error('Error in location search controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while searching locations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

/**
 * Get hotel offers for a specific hotel
 * @route GET /api/travel/hotels/:hotelId/offers
 */
export const getHotelOffers = async (req: express.Request, res: express.Response) => {
  try {
    const { hotelId } = req.params;
    const {
      checkInDate,
      checkOutDate,
      adults = '1'
    } = req.query;

    // Input validation
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkInDate as string) || !dateRegex.test(checkOutDate as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    const adultCount = parseInt(adults as string);
    if (isNaN(adultCount) || adultCount < 1 || adultCount > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of adults. Must be between 1 and 8'
      });
    }

    logger.info('Hotel offers request:', {
      hotelId,
      checkInDate,
      checkOutDate,
      adults: adultCount
    });

    // Call Amadeus service for hotel offers
    const result = await amadeusService.getHotelOffers(
      hotelId,
      checkInDate as string,
      checkOutDate as string,
      adultCount
    );

    if (!result.success) {
      logger.error('Amadeus hotel offers failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to get hotel offers',
        code: result.code
      });
    }

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in hotel offers controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting hotel offers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

/**
 * Search for points of interest in Dubai
 * @route GET /api/travel/points-of-interest
 */
export const searchPointsOfInterest = async (req: express.Request, res: express.Response) => {
  try {
    const {
      latitude = '25.2048', // Dubai default
      longitude = '55.2708', // Dubai default
      radius = '1',
      categories
    } = req.query;

    // Parse and validate coordinates
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseInt(radius as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude'
      });
    }

    if (isNaN(searchRadius) || searchRadius < 1 || searchRadius > 20) {
      return res.status(400).json({
        success: false,
        message: 'Radius must be between 1 and 20 km'
      });
    }

    // Parse categories if provided
    let categoryList: string[] | undefined;
    if (categories) {
      categoryList = (categories as string).split(',').map(c => c.trim());
    }

    logger.info('Points of interest search:', {
      latitude: lat,
      longitude: lng,
      radius: searchRadius,
      categories: categoryList
    });

    // Call Amadeus service for points of interest
    const result = await amadeusService.searchPointsOfInterest(
      lat,
      lng,
      searchRadius,
      categoryList
    );

    if (!result.success) {
      logger.error('Amadeus POI search failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to search points of interest',
        code: result.code
      });
    }

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in POI search controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while searching points of interest',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

/**
 * Test the Amadeus API connection
 * @route GET /api/travel/test-connection
 */
export const testAmadeusConnection = async (req: express.Request, res: express.Response) => {
  try {
    const result = await amadeusService.testConnection();
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error testing Amadeus connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test Amadeus connection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};