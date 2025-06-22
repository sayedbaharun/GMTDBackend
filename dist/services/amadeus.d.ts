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
        meta: {
            count: any;
            links: any;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: never[];
        meta?: undefined;
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
        data: any;
        meta: {
            count: any;
            links: {};
            message?: undefined;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            chainCode: string;
            name: string;
            cityCode: string;
            latitude: number;
            longitude: number;
            address: {
                lines: string[];
                cityName: string;
                countryCode: string;
            };
            rating: number;
            offers: {
                id: string;
                checkInDate: string;
                checkOutDate: string;
                rateCode: string;
                room: {
                    type: string;
                    description: string;
                };
                guests: {
                    adults: number;
                };
                price: {
                    currency: string;
                    base: number;
                    total: number;
                    variations: {
                        average: {
                            base: string;
                        };
                    };
                };
                policies: {
                    cancellations: {
                        type: string;
                    }[];
                    paymentType: string;
                };
            }[];
        }[];
        meta: {
            count: number;
            message: string;
            links: {};
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: never[];
        meta?: undefined;
    }>;
    /**
     * Get hotel offers by hotel ID
     * @param hotelId The hotel ID
     * @param checkInDate Check-in date (YYYY-MM-DD)
     * @param checkOutDate Check-out date (YYYY-MM-DD)
     * @param adults Number of adults
     * @returns List of offers for the specified hotel
     */
    getHotelOffers(hotelId: string, checkInDate: string, checkOutDate: string, adults?: number): Promise<{
        success: boolean;
        data: any;
        meta: {
            links: any;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: never[];
        meta?: undefined;
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
        meta: {
            count: any;
            links: any;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: never[];
        meta?: undefined;
    }>;
    /**
     * Search for points of interest (attractions, restaurants, etc.)
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param radius Search radius in KM
     * @param categories Categories to filter by
     * @returns List of points of interest
     */
    searchPointsOfInterest(latitude: number, longitude: number, radius?: number, categories?: string[]): Promise<{
        success: boolean;
        data: any;
        meta: {
            count: any;
            links: any;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: never[];
        meta?: undefined;
    }>;
    /**
     * Create a flight order (booking)
     * @param flightOffer The selected flight offer
     * @param travelers Traveler information
     * @returns Booking confirmation
     */
    createFlightOrder(flightOffer: any, travelers: any[]): Promise<{
        success: boolean;
        data: any;
        meta: {
            links: any;
        };
        error?: undefined;
        code?: undefined;
    } | {
        success: boolean;
        error: any;
        code: any;
        data: null;
        meta?: undefined;
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
