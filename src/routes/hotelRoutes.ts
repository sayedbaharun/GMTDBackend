import { Router } from 'express';
import { asyncHandler } from '../utils/routeHandler';
import {
  getAllHotels,
  getHotelById,
  getRoomById,
  createHotel,
  createRoom,
  updateHotel,
  updateRoom,
  deleteHotel,
  deleteRoom
} from '../controllers/hotelController';
import { authenticateAndSyncUser, isAdmin } from '../middleware/auth';
import { validate } from '../validations/validate';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Schema for creating/updating hotels (admin only)
const hotelSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Hotel name is required' }),
    description: z.string().optional(),
    address: z.string().min(5, { message: 'Address is required' }),
    city: z.string().min(2, { message: 'City is required' }),
    country: z.string().min(2, { message: 'Country is required' }),
    zipCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    starRating: z.number().min(0).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    pricePerNight: z.number().positive({ message: 'Price must be positive' }),
    currency: z.string().min(3).max(3).default('USD'),
    images: z.array(z.string().url({ message: 'Valid image URL is required' })).optional(),
  })
});

// Schema for updating hotels partially
const updateHotelSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Hotel name is required' }).optional(),
    description: z.string().optional(),
    address: z.string().min(5, { message: 'Address is required' }).optional(),
    city: z.string().min(2, { message: 'City is required' }).optional(),
    country: z.string().min(2, { message: 'Country is required' }).optional(),
    zipCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    starRating: z.number().min(0).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    pricePerNight: z.number().positive({ message: 'Price must be positive' }).optional(),
    currency: z.string().min(3).max(3).optional(),
    images: z.array(z.string().url({ message: 'Valid image URL is required' })).optional(),
  })
});

// Schema for creating/updating rooms
const roomSchema = z.object({
  body: z.object({
    type: z.string().min(2, { message: 'Room type is required' }),
    description: z.string().optional(),
    price: z.number().positive({ message: 'Price must be positive' }),
    currency: z.string().min(3).max(3).default('USD'),
    capacity: z.number().int().positive({ message: 'Capacity must be positive' }).default(2),
    amenities: z.array(z.string()).optional(),
    available: z.boolean().default(true),
  })
});

// Schema for updating rooms partially
const updateRoomSchema = z.object({
  body: z.object({
    type: z.string().min(2, { message: 'Room type is required' }).optional(),
    description: z.string().optional(),
    price: z.number().positive({ message: 'Price must be positive' }).optional(),
    currency: z.string().min(3).max(3).optional(),
    capacity: z.number().int().positive({ message: 'Capacity must be positive' }).optional(),
    amenities: z.array(z.string()).optional(),
    available: z.boolean().optional(),
  })
});

// Public routes
router.get('/', asyncHandler(getAllHotels));
router.get('/:id', asyncHandler(getHotelById));
router.get('/rooms/:id', asyncHandler(getRoomById));

// Admin routes (protected)
router.post('/', authenticateAndSyncUser, isAdmin, validate(hotelSchema), asyncHandler(createHotel));
router.post('/:hotelId/rooms', authenticateAndSyncUser, isAdmin, validate(roomSchema), asyncHandler(createRoom));
router.put('/:id', authenticateAndSyncUser, isAdmin, validate(updateHotelSchema), asyncHandler(updateHotel));
router.put('/rooms/:id', authenticateAndSyncUser, isAdmin, validate(updateRoomSchema), asyncHandler(updateRoom));
router.delete('/:id', authenticateAndSyncUser, isAdmin, asyncHandler(deleteHotel));
router.delete('/rooms/:id', authenticateAndSyncUser, isAdmin, asyncHandler(deleteRoom));

export default router;
