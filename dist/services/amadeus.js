"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amadeusService = void 0;
const amadeus_1 = __importDefault(require("amadeus"));
const logger_1 = require("../utils/logger");
/**
 * Amadeus API Service
 * Provides integration with Amadeus Travel APIs for flight and hotel information
 */
class AmadeusService {
    constructor() {
        this.isInitialized = false;
        try {
            this.amadeus = new amadeus_1.default({
                clientId: process.env.AMADEUS_API_KEY || '7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP',
                clientSecret: process.env.AMADEUS_API_SECRET || 'yrsVsEXxAckcMuqm',
            });
            this.isInitialized = true;
            logger_1.logger.info('Amadeus API service initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Amadeus API service:', error);
            this.isInitialized = false;
        }
    }
    /**
     * Search for flights
     * @param originCode Origin airport code
     * @param destinationCode Destination airport code
     * @param departureDate Departure date (YYYY-MM-DD)
     * @param returnDate Return date (YYYY-MM-DD) - Optional for one-way flights
     * @param adults Number of adults
     * @param travelClass Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
     * @returns Flight search results
     */
    async searchFlights(originCode, destinationCode, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY') {
        if (!this.isInitialized) {
            throw new Error('Amadeus API service not initialized');
        }
        try {
            const response = await this.amadeus.shopping.flightOffersSearch.get({
                originLocationCode: originCode,
                destinationLocationCode: destinationCode,
                departureDate: departureDate,
                returnDate: returnDate,
                adults: adults,
                travelClass: travelClass,
                currencyCode: 'USD',
                max: 20
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching flights with Amadeus:', error);
            return {
                success: false,
                error: error.description || 'Failed to search flights',
                code: error.code
            };
        }
    }
    /**
     * Search for hotels by city code
     * @param cityCode City code (e.g., 'DXB' for Dubai)
     * @param checkInDate Check-in date (YYYY-MM-DD)
     * @param checkOutDate Check-out date (YYYY-MM-DD)
     * @param adults Number of adults
     * @param radius Search radius in KM
     * @param ratings Array of hotel ratings to filter by (1-5)
     * @returns Hotel search results
     */
    async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, ratings = [3, 4, 5]) {
        if (!this.isInitialized) {
            throw new Error('Amadeus API service not initialized');
        }
        try {
            // Check if hotel search is available in this subscription
            if (!this.amadeus.shopping?.hotelOffers?.get) {
                return {
                    success: false,
                    error: 'Hotel search is not available in current Amadeus subscription plan',
                    data: []
                };
            }
            const response = await this.amadeus.shopping.hotelOffers?.get({
                cityCode: cityCode,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                adults: adults,
                radius: radius,
                radiusUnit: 'KM',
                ratings: ratings.join(','),
                currency: 'USD',
                bestRateOnly: true
            });
            return {
                success: true,
                data: response?.data || []
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching hotels with Amadeus:', error);
            return {
                success: false,
                error: error.description || 'Failed to search hotels',
                code: error.code
            };
        }
    }
    /**
     * Get hotel offers by hotel ID
     * @param hotelId The hotel ID
     * @returns List of offers for the specified hotel
     */
    async getHotelOffers(hotelId) {
        if (!this.isInitialized) {
            throw new Error('Amadeus API service not initialized');
        }
        try {
            // Check if hotel offer by hotel ID is available in this subscription
            if (!this.amadeus.shopping?.hotelOffersByHotel?.get) {
                return {
                    success: false,
                    error: 'Hotel offers by hotel ID is not available in current Amadeus subscription plan',
                    data: []
                };
            }
            const response = await this.amadeus.shopping.hotelOffersByHotel?.get({
                hotelId: hotelId
            });
            return {
                success: true,
                data: response?.data || []
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching hotel offers with Amadeus:', error);
            return {
                success: false,
                error: error.description || 'Failed to fetch hotel offers',
                code: error.code
            };
        }
    }
    /**
     * Get airport information by city name
     * @param keyword City name or airport code
     * @param subType Filter by airport subType (AIRPORT, CITY) - Optional
     * @returns List of matching airports
     */
    async searchAirports(keyword, subType = 'AIRPORT') {
        if (!this.isInitialized) {
            throw new Error('Amadeus API service not initialized');
        }
        try {
            const response = await this.amadeus.referenceData.locations.get({
                keyword: keyword,
                subType: subType
            });
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching airports with Amadeus:', error);
            return {
                success: false,
                error: error.description || 'Failed to search airports',
                code: error.code
            };
        }
    }
    /**
     * Test the Amadeus API connection
     * @returns Boolean indicating if the connection is working
     */
    async testConnection() {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'Amadeus API service not initialized'
            };
        }
        try {
            // Try to get city information for Dubai as a simple test
            const response = await this.amadeus.referenceData.locations.get({
                keyword: 'Dubai',
                subType: 'CITY'
            });
            return {
                success: true,
                message: 'Successfully connected to Amadeus API',
                data: response.data
            };
        }
        catch (error) {
            logger_1.logger.error('Amadeus API connection test failed:', error);
            return {
                success: false,
                error: error.description || 'Failed to connect to Amadeus API',
                code: error.code
            };
        }
    }
}
// Create and export a singleton instance
exports.amadeusService = new AmadeusService();
//# sourceMappingURL=amadeus.js.map