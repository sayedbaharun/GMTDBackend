import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
import { logger } from '../utils/logger';

interface HotelOffer {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  roomType: string;
  price: {
    total: number;
    currency: string;
    perNight: number;
  };
  rating: number;
  amenities: string[];
  images: string[];
  description: string;
}

interface GuestInfo {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  contact: {
    emailAddress: string;
    phone?: string;
  };
  specialRequests?: string;
}

/**
 * Mock hotel booking initiation
 * @route POST /api/hotel-booking/mock-booking
 */
export const mockHotelBooking = async (req: express.Request, res: express.Response) => {
  try {
    const { hotelOffer, guests } = req.body;

    if (!hotelOffer || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Hotel offer and guest information are required'
      });
    }

    const baseAmount = parseFloat(hotelOffer.price.total.toString());
    const servicesFee = baseAmount * 0.05; // 5% GMTD service fee
    const totalAmount = baseAmount + servicesFee;

    // Simulate successful booking with Stripe-like response
    const mockBookingId = `hotel_booking_${Date.now()}`;
    const mockPaymentIntentId = `pi_hotel_${Math.random().toString(36).substring(2, 15)}`;
    const mockClientSecret = `${mockPaymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;

    logger.info('Mock hotel booking initiated:', {
      hotelId: hotelOffer.id,
      hotelName: hotelOffer.name,
      checkIn: hotelOffer.checkIn,
      checkOut: hotelOffer.checkOut,
      guests: guests.length,
      totalAmount
    });

    return res.status(200).json({
      success: true,
      data: {
        bookingId: mockBookingId,
        clientSecret: mockClientSecret,
        amount: totalAmount,
        currency: hotelOffer.price.currency,
        breakdown: {
          baseAmount,
          servicesFee,
          totalAmount
        },
        paymentIntentId: mockPaymentIntentId,
        hotelDetails: {
          name: hotelOffer.name,
          location: hotelOffer.location,
          checkIn: hotelOffer.checkIn,
          checkOut: hotelOffer.checkOut,
          nights: hotelOffer.nights,
          roomType: hotelOffer.roomType,
          rating: hotelOffer.rating
        },
        guests: guests.length,
        status: 'payment_required',
        luxuryInclusions: [
          '24/7 Luxury Concierge Support',
          'VIP Check-in & Late Checkout',
          'Complimentary Room Upgrades (Subject to Availability)',
          'Priority Restaurant Reservations',
          'Spa & Wellness Discounts',
          'Airport Transfer Coordination'
        ]
      },
      message: 'Hotel booking initiated successfully (mock mode)'
    });

  } catch (error: any) {
    logger.error('Error in mock hotel booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate mock hotel booking',
      error: error.message
    });
  }
};

/**
 * Get hotel booking confirmation
 * @route POST /api/hotel-booking/confirm-mock
 */
export const confirmMockHotelBooking = async (req: express.Request, res: express.Response) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and booking ID are required'
      });
    }

    // Simulate successful payment confirmation
    const confirmationNumber = `GMTD-HTL-${Date.now()}`;

    return res.status(200).json({
      success: true,
      data: {
        confirmationNumber,
        bookingId,
        paymentStatus: 'confirmed',
        bookingStatus: 'confirmed',
        message: 'Your luxury hotel experience has been confirmed!',
        nextSteps: [
          'Check your email for detailed confirmation',
          'Our concierge will contact you 24 hours before check-in',
          'VIP check-in instructions will be provided',
          'Special requests will be coordinated with the hotel'
        ]
      },
      message: 'Hotel booking confirmed successfully'
    });

  } catch (error: any) {
    logger.error('Error confirming mock hotel booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm hotel booking',
      error: error.message
    });
  }
}; 