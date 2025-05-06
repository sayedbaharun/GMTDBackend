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

    // Call Amadeus service for flight search
    const result = await amadeusService.searchFlights(
      origin as string, 
      destination as string, 
      departureDate as string,
      returnDate as string,
      parseInt(adults as string),
      travelClass as string
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in flight search controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search flights',
      error: error.message 
    });
  }
};

/**
 * Search for airports or cities by keyword
 * @route GET /api/travel/locations
 */
export const searchLocations = async (req: express.Request, res: express.Response) => {
  try {
    const { keyword, subType = 'AIRPORT' } = req.query;

    if (!keyword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: keyword' 
      });
    }

    const result = await amadeusService.searchAirports(
      keyword as string,
      subType as string
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in location search controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search locations',
      error: error.message 
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
      error: error.message 
    });
  }
};