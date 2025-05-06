import { Router } from 'express';
import { asyncHandler, authHandler } from '../utils/routeHandler';
import {
  getAllFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight
} from '../controllers/flightController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validations/validate';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Schema for creating/updating flights (admin only)
const flightSchema = z.object({
  body: z.object({
    airline: z.string().min(2, { message: 'Airline name is required' }),
    flightNumber: z.string().min(2, { message: 'Flight number is required' }),
    departureAirport: z.string().min(3, { message: 'Departure airport code is required' }),
    arrivalAirport: z.string().min(3, { message: 'Arrival airport code is required' }),
    departureTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
      message: 'Departure time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
    }),
    arrivalTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
      message: 'Arrival time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
    }),
    price: z.number().positive({ message: 'Price must be positive' }),
    currency: z.string().min(3).max(3).default('USD'),
    class: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
    availableSeats: z.number().int().positive({ message: 'Available seats must be positive' }),
  })
});

// Schema for updating flights partially
const updateFlightSchema = z.object({
  body: z.object({
    airline: z.string().min(2, { message: 'Airline name is required' }).optional(),
    flightNumber: z.string().min(2, { message: 'Flight number is required' }).optional(),
    departureAirport: z.string().min(3, { message: 'Departure airport code is required' }).optional(),
    arrivalAirport: z.string().min(3, { message: 'Arrival airport code is required' }).optional(),
    departureTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
      message: 'Departure time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
    }).optional(),
    arrivalTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
      message: 'Arrival time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
    }).optional(),
    price: z.number().positive({ message: 'Price must be positive' }).optional(),
    currency: z.string().min(3).max(3).default('USD').optional(),
    class: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY').optional(),
    availableSeats: z.number().int().positive({ message: 'Available seats must be positive' }).optional(),
  })
});

// Public routes
router.get('/', asyncHandler(getAllFlights));
router.get('/:id', asyncHandler(getFlightById));

// Admin routes (protected)
router.post('/', authenticate, validate(flightSchema), authHandler(createFlight));
router.put('/:id', authenticate, validate(updateFlightSchema), authHandler(updateFlight));
router.delete('/:id', authenticate, authHandler(deleteFlight));

export default router;
