"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAmadeusConnection = exports.searchLocations = exports.searchFlights = void 0;
const amadeus_1 = require("../services/amadeus");
const logger_1 = require("../utils/logger");
/**
 * Search for flights based on query parameters
 * @route GET /api/travel/flights
 */
const searchFlights = async (req, res) => {
    try {
        const { origin, destination, departureDate, returnDate, adults = '1', travelClass = 'ECONOMY' } = req.query;
        // Input validation
        if (!origin || !destination || !departureDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: origin, destination, and departureDate are required'
            });
        }
        // Call Amadeus service for flight search
        const result = await amadeus_1.amadeusService.searchFlights(origin, destination, departureDate, returnDate, parseInt(adults), travelClass);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Error in flight search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search flights',
            error: error.message
        });
    }
};
exports.searchFlights = searchFlights;
/**
 * Search for airports or cities by keyword
 * @route GET /api/travel/locations
 */
const searchLocations = async (req, res) => {
    try {
        const { keyword, subType = 'AIRPORT' } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: keyword'
            });
        }
        const result = await amadeus_1.amadeusService.searchAirports(keyword, subType);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Error in location search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search locations',
            error: error.message
        });
    }
};
exports.searchLocations = searchLocations;
/**
 * Test the Amadeus API connection
 * @route GET /api/travel/test-connection
 */
const testAmadeusConnection = async (req, res) => {
    try {
        const result = await amadeus_1.amadeusService.testConnection();
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Error testing Amadeus connection:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test Amadeus connection',
            error: error.message
        });
    }
};
exports.testAmadeusConnection = testAmadeusConnection;
//# sourceMappingURL=travelController.js.map