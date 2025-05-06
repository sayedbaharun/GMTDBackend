/**
 * Amadeus API Service
 * Provides integration with Amadeus Travel APIs for flight and hotel information
 */
declare class AmadeusService {
    private amadeus;
    private isInitialized;
    constructor();
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
    searchFlights(originCode: string, destinationCode: string, departureDate: string, returnDate?: string, adults?: number, travelClass?: string): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data?: undefined;
    }>;
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
    searchHotels(cityCode: string, checkInDate: string, checkOutDate: string, adults?: number, radius?: number, ratings?: number[]): Promise<{
        success: boolean;
        error: string;
        data: never[];
        code?: undefined;
    } | {
        success: boolean;
        data: any;
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data?: undefined;
    }>;
    /**
     * Get hotel offers by hotel ID
     * @param hotelId The hotel ID
     * @returns List of offers for the specified hotel
     */
    getHotelOffers(hotelId: string): Promise<{
        success: boolean;
        error: string;
        data: never[];
        code?: undefined;
    } | {
        success: boolean;
        data: any;
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data?: undefined;
    }>;
    /**
     * Get airport information by city name
     * @param keyword City name or airport code
     * @param subType Filter by airport subType (AIRPORT, CITY) - Optional
     * @returns List of matching airports
     */
    searchAirports(keyword: string, subType?: string): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data?: undefined;
    }>;
    /**
     * Test the Amadeus API connection
     * @returns Boolean indicating if the connection is working
     */
    testConnection(): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
        data?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        message: string;
        data: any;
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        message?: undefined;
        data?: undefined;
    }>;
}
export declare const amadeusService: AmadeusService;
export {};
