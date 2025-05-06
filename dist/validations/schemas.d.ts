import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    password: string;
}, {
    email: string;
    fullName: string;
    password: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const userInfoSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    phone_number: z.ZodString;
    company_name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    phone_number: string;
    company_name: string;
}, {
    email: string;
    fullName: string;
    phone_number: string;
    company_name: string;
}>;
export declare const additionalDetailsSchema: z.ZodObject<{
    industry: z.ZodString;
    company_size: z.ZodString;
    role: z.ZodString;
    goals: z.ZodArray<z.ZodString, "many">;
    referral_source: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    industry: string;
    role: string;
    goals: string[];
    company_size: string;
    referral_source?: string | undefined;
}, {
    industry: string;
    role: string;
    goals: string[];
    company_size: string;
    referral_source?: string | undefined;
}>;
export declare const paymentSchema: z.ZodObject<{
    payment_method_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    payment_method_id: string;
}, {
    payment_method_id: string;
}>;
export declare const flightSearchSchema: z.ZodObject<{
    departureAirport: z.ZodString;
    arrivalAirport: z.ZodString;
    departureDate: z.ZodString;
    returnDate: z.ZodOptional<z.ZodString>;
    passengers: z.ZodDefault<z.ZodNumber>;
    class: z.ZodDefault<z.ZodEnum<["ECONOMY", "BUSINESS", "FIRST"]>>;
}, "strip", z.ZodTypeAny, {
    departureAirport: string;
    arrivalAirport: string;
    class: "ECONOMY" | "BUSINESS" | "FIRST";
    departureDate: string;
    passengers: number;
    returnDate?: string | undefined;
}, {
    departureAirport: string;
    arrivalAirport: string;
    departureDate: string;
    class?: "ECONOMY" | "BUSINESS" | "FIRST" | undefined;
    returnDate?: string | undefined;
    passengers?: number | undefined;
}>;
export declare const flightBookingSchema: z.ZodObject<{
    flightId: z.ZodString;
    passengerName: z.ZodString;
    passengerEmail: z.ZodString;
    passengerPhone: z.ZodOptional<z.ZodString>;
    seatNumber: z.ZodOptional<z.ZodString>;
    specialRequests: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    flightId: string;
    passengerName: string;
    passengerEmail: string;
    passengerPhone?: string | undefined;
    seatNumber?: string | undefined;
    specialRequests?: string | undefined;
}, {
    flightId: string;
    passengerName: string;
    passengerEmail: string;
    passengerPhone?: string | undefined;
    seatNumber?: string | undefined;
    specialRequests?: string | undefined;
}>;
export declare const hotelSearchSchema: z.ZodObject<{
    city: z.ZodString;
    checkInDate: z.ZodString;
    checkOutDate: z.ZodString;
    guests: z.ZodDefault<z.ZodNumber>;
    rooms: z.ZodDefault<z.ZodNumber>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    starRating: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    city: string;
    rooms: number;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    starRating?: number | undefined;
    amenities?: string[] | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    city: string;
    checkInDate: string;
    checkOutDate: string;
    starRating?: number | undefined;
    amenities?: string[] | undefined;
    rooms?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    guests?: number | undefined;
}>;
export declare const hotelBookingSchema: z.ZodObject<{
    hotelId: z.ZodString;
    roomId: z.ZodString;
    checkInDate: z.ZodString;
    checkOutDate: z.ZodString;
    guestCount: z.ZodNumber;
    specialRequests: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    hotelId: string;
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    specialRequests?: string | undefined;
}, {
    hotelId: string;
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    specialRequests?: string | undefined;
}>;
export declare const conciergeRequestSchema: z.ZodObject<{
    requestType: z.ZodEnum<["RESTAURANT", "ACTIVITY", "TRANSPORT", "SPECIAL_OCCASION", "OTHER"]>;
    description: z.ZodString;
    date: z.ZodOptional<z.ZodString>;
    time: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    participants: z.ZodDefault<z.ZodNumber>;
    bookingId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
    participants: number;
    date?: string | undefined;
    time?: string | undefined;
    bookingId?: string | undefined;
    location?: string | undefined;
    notes?: string | undefined;
}, {
    description: string;
    requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
    date?: string | undefined;
    time?: string | undefined;
    bookingId?: string | undefined;
    location?: string | undefined;
    participants?: number | undefined;
    notes?: string | undefined;
}>;
export declare const createPaymentIntentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: string;
    description?: string | undefined;
    metadata?: Record<string, string> | undefined;
}, {
    amount: number;
    currency?: string | undefined;
    description?: string | undefined;
    metadata?: Record<string, string> | undefined;
}>;
export declare const createBookingSchema: z.ZodObject<{
    flightBookings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        flightId: z.ZodString;
        passengerName: z.ZodString;
        passengerEmail: z.ZodString;
        passengerPhone: z.ZodOptional<z.ZodString>;
        seatNumber: z.ZodOptional<z.ZodString>;
        specialRequests: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        flightId: string;
        passengerName: string;
        passengerEmail: string;
        passengerPhone?: string | undefined;
        seatNumber?: string | undefined;
        specialRequests?: string | undefined;
    }, {
        flightId: string;
        passengerName: string;
        passengerEmail: string;
        passengerPhone?: string | undefined;
        seatNumber?: string | undefined;
        specialRequests?: string | undefined;
    }>, "many">>;
    hotelBookings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        hotelId: z.ZodString;
        roomId: z.ZodString;
        checkInDate: z.ZodString;
        checkOutDate: z.ZodString;
        guestCount: z.ZodNumber;
        specialRequests: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        hotelId: string;
        roomId: string;
        checkInDate: string;
        checkOutDate: string;
        guestCount: number;
        specialRequests?: string | undefined;
    }, {
        hotelId: string;
        roomId: string;
        checkInDate: string;
        checkOutDate: string;
        guestCount: number;
        specialRequests?: string | undefined;
    }>, "many">>;
    conciergeRequests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        requestType: z.ZodEnum<["RESTAURANT", "ACTIVITY", "TRANSPORT", "SPECIAL_OCCASION", "OTHER"]>;
        description: z.ZodString;
        date: z.ZodOptional<z.ZodString>;
        time: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        participants: z.ZodDefault<z.ZodNumber>;
        bookingId: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
        participants: number;
        date?: string | undefined;
        time?: string | undefined;
        bookingId?: string | undefined;
        location?: string | undefined;
        notes?: string | undefined;
    }, {
        description: string;
        requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
        date?: string | undefined;
        time?: string | undefined;
        bookingId?: string | undefined;
        location?: string | undefined;
        participants?: number | undefined;
        notes?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    flightBookings?: {
        flightId: string;
        passengerName: string;
        passengerEmail: string;
        passengerPhone?: string | undefined;
        seatNumber?: string | undefined;
        specialRequests?: string | undefined;
    }[] | undefined;
    hotelBookings?: {
        hotelId: string;
        roomId: string;
        checkInDate: string;
        checkOutDate: string;
        guestCount: number;
        specialRequests?: string | undefined;
    }[] | undefined;
    conciergeRequests?: {
        description: string;
        requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
        participants: number;
        date?: string | undefined;
        time?: string | undefined;
        bookingId?: string | undefined;
        location?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
}, {
    flightBookings?: {
        flightId: string;
        passengerName: string;
        passengerEmail: string;
        passengerPhone?: string | undefined;
        seatNumber?: string | undefined;
        specialRequests?: string | undefined;
    }[] | undefined;
    hotelBookings?: {
        hotelId: string;
        roomId: string;
        checkInDate: string;
        checkOutDate: string;
        guestCount: number;
        specialRequests?: string | undefined;
    }[] | undefined;
    conciergeRequests?: {
        description: string;
        requestType: "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "SPECIAL_OCCASION" | "OTHER";
        date?: string | undefined;
        time?: string | undefined;
        bookingId?: string | undefined;
        location?: string | undefined;
        participants?: number | undefined;
        notes?: string | undefined;
    }[] | undefined;
}>;
