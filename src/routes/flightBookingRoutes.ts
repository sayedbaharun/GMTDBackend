import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/routeHandler';
import { authenticateAndSyncUser } from '../middleware/auth';
import { 
  initiateFlightBooking,
  confirmFlightBooking,
  getMyFlightBookings
} from '../controllers/flightBookingController';

const router = Router();

/**
 * Flight Booking Routes
 * POST /api/flight-booking/initiate - Initiate flight booking with payment
 * POST /api/flight-booking/confirm - Confirm flight booking after payment
 * GET /api/flight-booking/my-bookings - Get user's flight bookings
 */

/**
 * TEMPORARY: Mock booking endpoint for testing without database
 */
router.post('/mock-booking', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { flightOffer, travelers } = req.body;

  if (!flightOffer || !travelers) {
    res.status(400).json({
      success: false,
      message: 'Flight offer and traveler information are required'
    });
    return;
  }

  const baseAmount = parseFloat(flightOffer.price.total);
  const servicesFee = baseAmount * 0.05; // 5% GMTD service fee
  const totalAmount = baseAmount + servicesFee;

  // Simulate successful booking with Stripe-like response
  const mockBookingId = `booking_${Date.now()}`;
  const mockPaymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
  const mockClientSecret = `${mockPaymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;

  res.status(200).json({
    success: true,
    data: {
      bookingId: mockBookingId,
      clientSecret: mockClientSecret,
      amount: totalAmount,
      currency: flightOffer.price.currency,
      breakdown: {
        baseAmount,
        servicesFee,
        totalAmount
      },
      paymentIntentId: mockPaymentIntentId,
      flightDetails: {
        flightNumber: flightOffer.flightNumber,
        airline: flightOffer.airline,
        route: `${flightOffer.departureAirport} → ${flightOffer.arrivalAirport}`,
        departure: flightOffer.departureTime,
        arrival: flightOffer.arrivalTime
      },
      travelers: travelers.length,
      status: 'payment_required'
    },
    message: 'Flight booking initiated successfully (mock mode)'
  });
}));

/**
 * TEMPORARY: Public routes for testing without authentication
 * Remove these in production and use proper Auth0 authentication
 */
router.post('/initiate-public', asyncHandler(initiateFlightBooking));
router.post('/confirm-public', asyncHandler(confirmFlightBooking));

// All other routes require authentication
router.use(authenticateAndSyncUser);

/**
 * @route POST /api/flight-booking/initiate
 * @desc Initiate flight booking process with Stripe payment
 * @access Private
 */
router.post('/initiate', asyncHandler(initiateFlightBooking));

/**
 * @route POST /api/flight-booking/confirm
 * @desc Confirm flight booking after successful payment
 * @access Private
 */
router.post('/confirm', asyncHandler(confirmFlightBooking));

/**
 * @route GET /api/flight-booking/my-bookings
 * @desc Get user's flight bookings
 * @access Private
 */
router.get('/my-bookings', asyncHandler(getMyFlightBookings));

export default router; 