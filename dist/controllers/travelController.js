"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAmadeusConnection = exports.searchPointsOfInterest = exports.getHotelOffers = exports.searchLocations = exports.searchHotels = exports.searchFlights = void 0;
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
        // Validate date format (should be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(departureDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format for dates'
            });
        }
        if (returnDate && !dateRegex.test(returnDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid return date format. Use YYYY-MM-DD format for dates'
            });
        }
        // Validate passenger count
        const adultCount = parseInt(adults);
        if (isNaN(adultCount) || adultCount < 1 || adultCount > 9) {
            return res.status(400).json({
                success: false,
                message: 'Invalid number of adults. Must be between 1 and 9'
            });
        }
        // Validate travel class
        const validClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
        if (!validClasses.includes(travelClass.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid travel class. Must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST'
            });
        }
        logger_1.logger.info('Flight search request:', {
            origin,
            destination,
            departureDate,
            returnDate,
            adults: adultCount,
            travelClass
        });
        // Call Amadeus service for flight search
        const result = await amadeus_1.amadeusService.searchFlights(origin, destination, departureDate, returnDate, adultCount, travelClass.toUpperCase());
        if (!result.success) {
            logger_1.logger.error('Amadeus flight search failed:', result.error);
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
    }
    catch (error) {
        logger_1.logger.error('Error in flight search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching flights',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.searchFlights = searchFlights;
/**
 * Search for hotels based on query parameters
 * @route GET /api/travel/hotels
 */
const searchHotels = async (req, res) => {
    try {
        const { cityCode = 'DXB', // Default to Dubai
        checkInDate, checkOutDate, adults = '1', radius = '5', ratings = '3,4,5' } = req.query;
        // Input validation
        if (!checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: checkInDate and checkOutDate are required'
            });
        }
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format for dates'
            });
        }
        // Validate check-in is before check-out
        if (new Date(checkInDate) >= new Date(checkOutDate)) {
            return res.status(400).json({
                success: false,
                message: 'Check-in date must be before check-out date'
            });
        }
        // Parse and validate parameters
        const adultCount = parseInt(adults);
        const searchRadius = parseInt(radius);
        const hotelRatings = ratings.split(',').map(r => parseInt(r.trim()));
        if (isNaN(adultCount) || adultCount < 1 || adultCount > 8) {
            return res.status(400).json({
                success: false,
                message: 'Invalid number of adults. Must be between 1 and 8'
            });
        }
        logger_1.logger.info('Hotel search request:', {
            cityCode,
            checkInDate,
            checkOutDate,
            adults: adultCount,
            radius: searchRadius,
            ratings: hotelRatings
        });
        // Call Amadeus service for hotel search
        const result = await amadeus_1.amadeusService.searchHotels(cityCode, checkInDate, checkOutDate, adultCount, searchRadius, hotelRatings);
        if (!result.success) {
            logger_1.logger.error('Amadeus hotel search failed:', result.error);
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
    }
    catch (error) {
        logger_1.logger.error('Error in hotel search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching hotels',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.searchHotels = searchHotels;
/**
 * Search for airports/locations based on keyword
 * @route GET /api/travel/locations
 */
const searchLocations = async (req, res) => {
    try {
        const { keyword, subType = 'AIRPORT' } = req.query;
        // Input validation
        if (!keyword || keyword.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Keyword must be at least 2 characters long'
            });
        }
        // Validate subType
        const validSubTypes = ['AIRPORT', 'CITY'];
        if (!validSubTypes.includes(subType.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subType. Must be either AIRPORT or CITY'
            });
        }
        logger_1.logger.info('Location search request:', { keyword, subType });
        // Call Amadeus service for location search
        const result = await amadeus_1.amadeusService.searchAirports(keyword.trim(), subType.toUpperCase());
        if (!result.success) {
            logger_1.logger.error('Amadeus location search failed:', result.error);
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
    }
    catch (error) {
        logger_1.logger.error('Error in location search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching locations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.searchLocations = searchLocations;
/**
 * Get hotel offers for a specific hotel
 * @route GET /api/travel/hotels/:hotelId/offers
 */
const getHotelOffers = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { checkInDate, checkOutDate, adults = '1' } = req.query;
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
        if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format'
            });
        }
        const adultCount = parseInt(adults);
        if (isNaN(adultCount) || adultCount < 1 || adultCount > 8) {
            return res.status(400).json({
                success: false,
                message: 'Invalid number of adults. Must be between 1 and 8'
            });
        }
        logger_1.logger.info('Hotel offers request:', {
            hotelId,
            checkInDate,
            checkOutDate,
            adults: adultCount
        });
        // Call Amadeus service for hotel offers
        const result = await amadeus_1.amadeusService.getHotelOffers(hotelId, checkInDate, checkOutDate, adultCount);
        if (!result.success) {
            logger_1.logger.error('Amadeus hotel offers failed:', result.error);
            return res.status(400).json({
                success: false,
                message: result.error || 'Failed to get hotel offers',
                code: result.code
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Error in hotel offers controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while getting hotel offers',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.getHotelOffers = getHotelOffers;
/**
 * Search for points of interest in Dubai
 * @route GET /api/travel/points-of-interest
 */
const searchPointsOfInterest = async (req, res) => {
    try {
        const { latitude = '25.2048', // Dubai default
        longitude = '55.2708', // Dubai default
        radius = '1', categories } = req.query;
        // Parse and validate coordinates
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const searchRadius = parseInt(radius);
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
        let categoryList;
        if (categories) {
            categoryList = categories.split(',').map(c => c.trim());
        }
        logger_1.logger.info('Points of interest search:', {
            latitude: lat,
            longitude: lng,
            radius: searchRadius,
            categories: categoryList
        });
        // Call Amadeus service for points of interest
        const result = await amadeus_1.amadeusService.searchPointsOfInterest(lat, lng, searchRadius, categoryList);
        if (!result.success) {
            logger_1.logger.error('Amadeus POI search failed:', result.error);
            return res.status(400).json({
                success: false,
                message: result.error || 'Failed to search points of interest',
                code: result.code
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Error in POI search controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching points of interest',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.searchPointsOfInterest = searchPointsOfInterest;
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
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
};
exports.testAmadeusConnection = testAmadeusConnection;
//# sourceMappingURL=travelController.js.map