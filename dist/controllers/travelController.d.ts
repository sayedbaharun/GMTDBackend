import * as express from 'express';
/**
 * Search for flights based on query parameters
 * @route GET /api/travel/flights
 */
export declare const searchFlights: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Search for airports or cities by keyword
 * @route GET /api/travel/locations
 */
export declare const searchLocations: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
/**
 * Test the Amadeus API connection
 * @route GET /api/travel/test-connection
 */
export declare const testAmadeusConnection: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>> | undefined>;
