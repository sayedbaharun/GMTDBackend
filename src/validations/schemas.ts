import { z } from 'zod';

// User and Authentication schemas
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().min(2, { message: 'Full name is required' }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

// Onboarding schemas
export const userInfoSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone_number: z.string().min(5, { message: 'Phone number is required' }),
  company_name: z.string().min(2, { message: 'Company name is required' }),
});

export const additionalDetailsSchema = z.object({
  industry: z.string().min(2, { message: 'Industry is required' }),
  company_size: z.string().min(1, { message: 'Company size is required' }),
  role: z.string().min(2, { message: 'Role is required' }),
  goals: z.array(z.string()).min(1, { message: 'At least one goal is required' }),
  referral_source: z.string().optional(),
});

export const paymentSchema = z.object({
  payment_method_id: z.string().min(3, { message: 'Payment method ID is required' }),
});

// Flight schemas
export const flightSearchSchema = z.object({
  departureAirport: z.string().min(3, { message: 'Departure airport is required' }),
  arrivalAirport: z.string().min(3, { message: 'Arrival airport is required' }),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Departure date must be in YYYY-MM-DD format' }),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Return date must be in YYYY-MM-DD format' }).optional(),
  passengers: z.number().int().min(1, { message: 'At least one passenger is required' }).default(1),
  class: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
});

export const flightBookingSchema = z.object({
  flightId: z.string().uuid({ message: 'Valid flight ID is required' }),
  passengerName: z.string().min(2, { message: 'Passenger name is required' }),
  passengerEmail: z.string().email({ message: 'Valid email is required' }),
  passengerPhone: z.string().optional(),
  seatNumber: z.string().optional(),
  specialRequests: z.string().optional(),
});

// Hotel schemas
export const hotelSearchSchema = z.object({
  city: z.string().min(2, { message: 'City is required' }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-in date must be in YYYY-MM-DD format' }),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-out date must be in YYYY-MM-DD format' }),
  guests: z.number().int().min(1, { message: 'At least one guest is required' }).default(1),
  rooms: z.number().int().min(1, { message: 'At least one room is required' }).default(1),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  starRating: z.number().min(1).max(5).optional(),
});

export const hotelBookingSchema = z.object({
  hotelId: z.string().uuid({ message: 'Valid hotel ID is required' }),
  roomId: z.string().uuid({ message: 'Valid room ID is required' }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-in date must be in YYYY-MM-DD format' }),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Check-out date must be in YYYY-MM-DD format' }),
  guestCount: z.number().int().min(1, { message: 'At least one guest is required' }),
  specialRequests: z.string().optional(),
});

// Concierge schemas
export const conciergeRequestSchema = z.object({
  requestType: z.enum(['RESTAURANT', 'ACTIVITY', 'TRANSPORT', 'SPECIAL_OCCASION', 'OTHER']),
  description: z.string().min(10, { message: 'Please provide a detailed description' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }).optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  participants: z.number().int().min(1).default(1),
  bookingId: z.string().uuid({ message: 'Valid booking ID is required' }).optional(),
  notes: z.string().optional(),
});

// Payment schemas
export const createPaymentIntentSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be positive' }),
  currency: z.string().min(3).max(3).default('usd'),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Booking schemas
export const createBookingSchema = z.object({
  flightBookings: z.array(flightBookingSchema).optional(),
  hotelBookings: z.array(hotelBookingSchema).optional(),
  conciergeRequests: z.array(conciergeRequestSchema).optional(),
});