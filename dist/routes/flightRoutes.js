"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeHandler_1 = require("../utils/routeHandler");
const flightController_1 = require("../controllers/flightController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../validations/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Schema for creating/updating flights (admin only)
const flightSchema = zod_1.z.object({
    body: zod_1.z.object({
        airline: zod_1.z.string().min(2, { message: 'Airline name is required' }),
        flightNumber: zod_1.z.string().min(2, { message: 'Flight number is required' }),
        departureAirport: zod_1.z.string().min(3, { message: 'Departure airport code is required' }),
        arrivalAirport: zod_1.z.string().min(3, { message: 'Arrival airport code is required' }),
        departureTime: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
            message: 'Departure time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
        }),
        arrivalTime: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
            message: 'Arrival time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
        }),
        price: zod_1.z.number().positive({ message: 'Price must be positive' }),
        currency: zod_1.z.string().min(3).max(3).default('USD'),
        class: zod_1.z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
        availableSeats: zod_1.z.number().int().positive({ message: 'Available seats must be positive' }),
    })
});
// Schema for updating flights partially
const updateFlightSchema = zod_1.z.object({
    body: zod_1.z.object({
        airline: zod_1.z.string().min(2, { message: 'Airline name is required' }).optional(),
        flightNumber: zod_1.z.string().min(2, { message: 'Flight number is required' }).optional(),
        departureAirport: zod_1.z.string().min(3, { message: 'Departure airport code is required' }).optional(),
        arrivalAirport: zod_1.z.string().min(3, { message: 'Arrival airport code is required' }).optional(),
        departureTime: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
            message: 'Departure time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
        }).optional(),
        arrivalTime: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
            message: 'Arrival time must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'
        }).optional(),
        price: zod_1.z.number().positive({ message: 'Price must be positive' }).optional(),
        currency: zod_1.z.string().min(3).max(3).default('USD').optional(),
        class: zod_1.z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY').optional(),
        availableSeats: zod_1.z.number().int().positive({ message: 'Available seats must be positive' }).optional(),
    })
});
// Public routes
router.get('/', (0, routeHandler_1.asyncHandler)(flightController_1.getAllFlights));
router.get('/:id', (0, routeHandler_1.asyncHandler)(flightController_1.getFlightById));
// Admin routes (protected)
router.post('/', auth_1.authenticateAndSyncUser, auth_1.isAdmin, (0, validate_1.validate)(flightSchema), (0, routeHandler_1.asyncHandler)(flightController_1.createFlight));
router.put('/:id', auth_1.authenticateAndSyncUser, auth_1.isAdmin, (0, validate_1.validate)(updateFlightSchema), (0, routeHandler_1.asyncHandler)(flightController_1.updateFlight));
router.delete('/:id', auth_1.authenticateAndSyncUser, auth_1.isAdmin, (0, routeHandler_1.asyncHandler)(flightController_1.deleteFlight));
exports.default = router;
//# sourceMappingURL=flightRoutes.js.map