import { Router } from 'express';
import { asyncHandler } from '../utils/routeHandler';
import { 
  mockHotelBooking,
  confirmMockHotelBooking
} from '../controllers/hotelBookingController';

const router = Router();

/**
 * Hotel Booking Routes
 * POST /api/hotel-booking/mock-booking - Mock hotel booking for testing
 * POST /api/hotel-booking/confirm-mock - Confirm mock hotel booking
 */

/**
 * @route POST /api/hotel-booking/mock-booking
 * @desc Mock hotel booking initiation for testing without database
 * @access Public (for testing)
 */
router.post('/mock-booking', asyncHandler(mockHotelBooking));

/**
 * @route POST /api/hotel-booking/confirm-mock
 * @desc Confirm mock hotel booking
 * @access Public (for testing)
 */
router.post('/confirm-mock', asyncHandler(confirmMockHotelBooking));

export default router; 