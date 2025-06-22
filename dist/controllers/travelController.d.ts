import * as express from 'express';
/**
 * Search for flights based on query parameters
 * @route GET /api/travel/flights
 */
export declare const searchFlights: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Search for hotels based on query parameters
 * @route GET /api/travel/hotels
 */
export declare const searchHotels: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Search for airports/locations based on keyword
 * @route GET /api/travel/locations
 */
export declare const searchLocations: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Get hotel offers for a specific hotel
 * @route GET /api/travel/hotels/:hotelId/offers
 */
export declare const getHotelOffers: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Search for points of interest in Dubai
 * @route GET /api/travel/points-of-interest
 */
export declare const searchPointsOfInterest: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Test the Amadeus API connection
 * @route GET /api/travel/test-connection
 */
export declare const testAmadeusConnection: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
