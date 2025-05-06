"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeHandler_1 = require("../utils/routeHandler");
const hotelController_1 = require("../controllers/hotelController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../validations/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Schema for creating/updating hotels (admin only)
const hotelSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, { message: 'Hotel name is required' }),
        description: zod_1.z.string().optional(),
        address: zod_1.z.string().min(5, { message: 'Address is required' }),
        city: zod_1.z.string().min(2, { message: 'City is required' }),
        country: zod_1.z.string().min(2, { message: 'Country is required' }),
        zipCode: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        starRating: zod_1.z.number().min(0).max(5).optional(),
        amenities: zod_1.z.array(zod_1.z.string()).optional(),
        pricePerNight: zod_1.z.number().positive({ message: 'Price must be positive' }),
        currency: zod_1.z.string().min(3).max(3).default('USD'),
        images: zod_1.z.array(zod_1.z.string().url({ message: 'Valid image URL is required' })).optional(),
    })
});
// Schema for updating hotels partially
const updateHotelSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, { message: 'Hotel name is required' }).optional(),
        description: zod_1.z.string().optional(),
        address: zod_1.z.string().min(5, { message: 'Address is required' }).optional(),
        city: zod_1.z.string().min(2, { message: 'City is required' }).optional(),
        country: zod_1.z.string().min(2, { message: 'Country is required' }).optional(),
        zipCode: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        starRating: zod_1.z.number().min(0).max(5).optional(),
        amenities: zod_1.z.array(zod_1.z.string()).optional(),
        pricePerNight: zod_1.z.number().positive({ message: 'Price must be positive' }).optional(),
        currency: zod_1.z.string().min(3).max(3).optional(),
        images: zod_1.z.array(zod_1.z.string().url({ message: 'Valid image URL is required' })).optional(),
    })
});
// Schema for creating/updating rooms
const roomSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.string().min(2, { message: 'Room type is required' }),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive({ message: 'Price must be positive' }),
        currency: zod_1.z.string().min(3).max(3).default('USD'),
        capacity: zod_1.z.number().int().positive({ message: 'Capacity must be positive' }).default(2),
        amenities: zod_1.z.array(zod_1.z.string()).optional(),
        available: zod_1.z.boolean().default(true),
    })
});
// Schema for updating rooms partially
const updateRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.string().min(2, { message: 'Room type is required' }).optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive({ message: 'Price must be positive' }).optional(),
        currency: zod_1.z.string().min(3).max(3).optional(),
        capacity: zod_1.z.number().int().positive({ message: 'Capacity must be positive' }).optional(),
        amenities: zod_1.z.array(zod_1.z.string()).optional(),
        available: zod_1.z.boolean().optional(),
    })
});
// Public routes
router.get('/', (0, routeHandler_1.asyncHandler)(hotelController_1.getAllHotels));
router.get('/:id', (0, routeHandler_1.asyncHandler)(hotelController_1.getHotelById));
router.get('/rooms/:id', (0, routeHandler_1.asyncHandler)(hotelController_1.getRoomById));
// Admin routes (protected)
router.post('/', auth_1.authenticate, (0, validate_1.validate)(hotelSchema), (0, routeHandler_1.authHandler)(hotelController_1.createHotel));
router.post('/:hotelId/rooms', auth_1.authenticate, (0, validate_1.validate)(roomSchema), (0, routeHandler_1.authHandler)(hotelController_1.createRoom));
router.put('/:id', auth_1.authenticate, (0, validate_1.validate)(updateHotelSchema), (0, routeHandler_1.authHandler)(hotelController_1.updateHotel));
router.put('/rooms/:id', auth_1.authenticate, (0, validate_1.validate)(updateRoomSchema), (0, routeHandler_1.authHandler)(hotelController_1.updateRoom));
router.delete('/:id', auth_1.authenticate, (0, routeHandler_1.authHandler)(hotelController_1.deleteHotel));
router.delete('/rooms/:id', auth_1.authenticate, (0, routeHandler_1.authHandler)(hotelController_1.deleteRoom));
exports.default = router;
//# sourceMappingURL=hotelRoutes.js.map