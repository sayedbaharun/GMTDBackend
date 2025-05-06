"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingSchema = exports.createPaymentIntentSchema = exports.conciergeRequestSchema = exports.hotelBookingSchema = exports.hotelSearchSchema = exports.flightBookingSchema = exports.flightSearchSchema = exports.paymentSchema = exports.additionalDetailsSchema = exports.userInfoSchema = exports.resetPasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// User and Authentication schemas
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    password: zod_1.z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    password: zod_1.z.string().min(6, { message: 'Password must be at least 6 characters' }),
    fullName: zod_1.z.string().min(2, { message: 'Full name is required' }),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
});
// Onboarding schemas
exports.userInfoSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, { message: 'Full name is required' }),
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    phone_number: zod_1.z.string().min(5, { message: 'Phone number is required' }),
    company_name: zod_1.z.string().min(2, { message: 'Company name is required' }),
});
exports.additionalDetailsSchema = zod_1.z.object({
    industry: zod_1.z.string().min(2, { message: 'Industry is required' }),
    company_size: zod_1.z.string().min(1, { message: 'Company size is required' }),
    role: zod_1.z.string().min(2, { message: 'Role is required' }),
    goals: zod_1.z.array(zod_1.z.string()).min(1, { message: 'At least one goal is required' }),
    referral_source: zod_1.z.string().optional(),
});
exports.paymentSchema = zod_1.z.object({
    payment_method_id: zod_1.z.string().min(3, { message: 'Payment method ID is required' }),
});
// Flight schemas
exports.flightSearchSchema = zod_1.z.object({
    departureAirport: zod_1.z.string().min(3, { message: 'Departure airport is required' }),
    arrivalAirport: zod_1.z.string().min(3, { message: 'Arrival airport is required' }),
    departureDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Departure date must be in YYYY-MM-DD format' }),
    returnDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Return date must be in YYYY-MM-DD format' }).optional(),
    passengers: zod_1.z.number().int().min(1, { message: 'At least one passenger is required' }).default(1),
    class: zod_1.z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
});
exports.flightBookingSchema = zod_1.z.object({
    flightId: zod_1.z.string().uuid({ message: 'Valid flight ID is required' }),
    passengerName: zod_1.z.string().min(2, { message: 'Passenger name is required' }),
    passengerEmail: zod_1.z.string().email({ message: 'Valid email is required' }),
    passengerPhone: zod_1.z.string().optional(),
    seatNumber: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().optional(),
});
// Hotel schemas
exports.hotelSearchSchema = zod_1.z.object({
    city: zod_1.z.string().min(2, { message: 'City is required' }),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-in date must be in YYYY-MM-DD format' }),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-out date must be in YYYY-MM-DD format' }),
    guests: zod_1.z.number().int().min(1, { message: 'At least one guest is required' }).default(1),
    rooms: zod_1.z.number().int().min(1, { message: 'At least one room is required' }).default(1),
    minPrice: zod_1.z.number().optional(),
    maxPrice: zod_1.z.number().optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    starRating: zod_1.z.number().min(1).max(5).optional(),
});
exports.hotelBookingSchema = zod_1.z.object({
    hotelId: zod_1.z.string().uuid({ message: 'Valid hotel ID is required' }),
    roomId: zod_1.z.string().uuid({ message: 'Valid room ID is required' }),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-in date must be in YYYY-MM-DD format' }),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-out date must be in YYYY-MM-DD format' }),
    guestCount: zod_1.z.number().int().min(1, { message: 'At least one guest is required' }),
    specialRequests: zod_1.z.string().optional(),
});
// Concierge schemas
exports.conciergeRequestSchema = zod_1.z.object({
    requestType: zod_1.z.enum(['RESTAURANT', 'ACTIVITY', 'TRANSPORT', 'SPECIAL_OCCASION', 'OTHER']),
    description: zod_1.z.string().min(10, { message: 'Please provide a detailed description' }),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }).optional(),
    time: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    participants: zod_1.z.number().int().min(1).default(1),
    bookingId: zod_1.z.string().uuid({ message: 'Valid booking ID is required' }).optional(),
    notes: zod_1.z.string().optional(),
});
// Payment schemas
exports.createPaymentIntentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive({ message: 'Amount must be positive' }),
    currency: zod_1.z.string().min(3).max(3).default('usd'),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
// Booking schemas
exports.createBookingSchema = zod_1.z.object({
    flightBookings: zod_1.z.array(exports.flightBookingSchema).optional(),
    hotelBookings: zod_1.z.array(exports.hotelBookingSchema).optional(),
    conciergeRequests: zod_1.z.array(exports.conciergeRequestSchema).optional(),
});
//# sourceMappingURL=schemas.js.map