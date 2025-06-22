import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
import { amadeusService } from '../services/amadeus';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

interface TravelerInfo {
  id: string;
  dateOfBirth: string;
  name: {
    firstName: string;
    lastName: string;
  };
  gender: string;
  contact: {
    emailAddress: string;
    phones: Array<{
      deviceType: string;
      countryCallingCode: string;
      number: string;
    }>;
  };
  documents: Array<{
    documentType: string;
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    nationality: string;
    holder: boolean;
  }>;
}

/**
 * Initiate flight booking process
 * @route POST /api/flight-booking/initiate
 */
export const initiateFlightBooking = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    let userId = req.user?.id;
    let user;

    // For public testing routes, create or use a test user
    if (!userId) {
      const testEmail = 'test-user@gmtd.ai';
      
      // Try to find existing test user
      user = await prisma.user.findUnique({
        where: { email: testEmail }
      });

      // Create test user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: testEmail,
            fullName: 'Test User',
            onboardingComplete: true,
            auth0Id: 'test-user-auth0-id' // For testing only
          }
        });
        logger.info('Created test user for public booking', { userId: user.id });
      }

      userId = user.id;
    } else {
      // Get authenticated user information
      user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const { flightOffer, travelers } = req.body;

    if (!flightOffer || !travelers || !Array.isArray(travelers) || travelers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Flight offer and traveler information are required'
      });
    }

    // Validate flight offer
    if (!flightOffer.id || !flightOffer.price || !flightOffer.price.total) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flight offer data'
      });
    }

    // Calculate total amount
    const baseAmount = parseFloat(flightOffer.price.total);
    const servicesFee = baseAmount * 0.05; // 5% GMTD service fee
    const totalAmount = baseAmount + servicesFee;

    logger.info('Initiating flight booking:', {
      userId,
      flightId: flightOffer.id,
      baseAmount,
      servicesFee,
      totalAmount,
      travelers: travelers.length,
      isTestUser: !req.user?.id
    });

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId && stripe) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName || user.email,
        metadata: {
          userId: userId,
          type: 'flight_booking',
          isTestUser: !req.user?.id ? 'true' : 'false'
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: stripeCustomerId }
      });
    }

    // Create payment intent
    if (!stripe || !stripeCustomerId) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing not available'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: flightOffer.price.currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: {
        userId,
        type: 'flight_booking',
        flightId: flightOffer.id,
        departureAirport: flightOffer.departureAirport,
        arrivalAirport: flightOffer.arrivalAirport,
        departureDate: flightOffer.departureTime,
        travelers: travelers.length.toString(),
        baseAmount: baseAmount.toString(),
        servicesFee: servicesFee.toString(),
        isTestUser: !req.user?.id ? 'true' : 'false'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Store booking intent in database
    const bookingIntent = await prisma.booking.create({
      data: {
        userId,
        status: 'PENDING',
        totalPrice: totalAmount,
        currency: flightOffer.price.currency,
        paymentStatus: 'PENDING',
        paymentIntentId: paymentIntent.id,
        // Store flight offer and traveler data as JSON in a flexible way
        // We'll add these as JSON fields if needed
      }
    });

    // Store flight booking details
    const flightBooking = await prisma.bookingFlight.create({
      data: {
        bookingId: bookingIntent.id,
        flightId: flightOffer.id, // Using offer ID as flight ID
        passengerName: travelers[0]?.name ? 
          `${travelers[0].name.firstName} ${travelers[0].name.lastName}` : 
          user.fullName || 'Passenger',
        passengerEmail: travelers[0]?.contact?.emailAddress || user.email,
        passengerPhone: travelers[0]?.contact?.phones?.[0] ? 
          `+${travelers[0].contact.phones[0].countryCallingCode}${travelers[0].contact.phones[0].number}` : 
          null,
        // Store additional traveler info in special requests for now
        specialRequests: JSON.stringify({
          flightOffer,
          travelers,
          bookingMetadata: {
            baseAmount,
            servicesFee,
            totalAmount,
            initiated: new Date().toISOString(),
            isTestUser: !req.user?.id
          }
        })
      }
    });

    logger.info('Flight booking initiated:', {
      bookingId: bookingIntent.id,
      flightBookingId: flightBooking.id,
      paymentIntentId: paymentIntent.id,
      isTestUser: !req.user?.id
    });

    return res.status(200).json({
      success: true,
      data: {
        bookingId: bookingIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        currency: flightOffer.price.currency,
        breakdown: {
          baseAmount,
          servicesFee,
          totalAmount
        },
        paymentIntentId: paymentIntent.id
      },
      message: 'Flight booking initiated successfully'
    });

  } catch (error: any) {
    logger.error('Error initiating flight booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate flight booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Confirm flight booking after payment
 * @route POST /api/flight-booking/confirm
 */
export const confirmFlightBooking = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Find the booking by payment intent ID
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId,
        userId
      },
      include: {
        flightBookings: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment with Stripe
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment verification not available'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`
      });
    }

    // Get flight booking details
    const flightBooking = booking.flightBookings[0];
    if (!flightBooking) {
      return res.status(400).json({
        success: false,
        message: 'Flight booking details not found'
      });
    }

    // Parse stored flight offer and traveler data
    let flightOffer, travelers;
    try {
      const bookingData = JSON.parse(flightBooking.specialRequests || '{}');
      flightOffer = bookingData.flightOffer;
      travelers = bookingData.travelers;
    } catch (error) {
      logger.error('Error parsing booking data:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking data'
      });
    }

    if (!flightOffer || !travelers) {
      return res.status(400).json({
        success: false,
        message: 'Flight offer or traveler data missing'
      });
    }

    logger.info('Confirming flight booking with Amadeus:', {
      bookingId: booking.id,
      flightOfferId: flightOffer.id,
      travelers: travelers.length
    });

    // Create flight order with Amadeus
    const amadeusResult = await amadeusService.createFlightOrder(flightOffer, travelers);

    if (!amadeusResult.success) {
      logger.error('Amadeus booking failed:', amadeusResult.error);
      
      // Update booking status to failed
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'PAID' // Payment succeeded but booking failed
        }
      });

      // In a real scenario, you might want to initiate a refund here
      return res.status(400).json({
        success: false,
        message: `Flight booking failed: ${amadeusResult.error}`,
        code: amadeusResult.code,
        needsRefund: true
      });
    }

    // Update booking status to confirmed
    const confirmedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      },
      include: {
        flightBookings: {
          include: {
            flight: true
          }
        }
      }
    });

    // Update flight booking with Amadeus booking reference
    await prisma.bookingFlight.update({
      where: { id: flightBooking.id },
      data: {
        specialRequests: JSON.stringify({
          ...JSON.parse(flightBooking.specialRequests || '{}'),
          amadeusBooking: amadeusResult.data,
          confirmedAt: new Date().toISOString()
        })
      }
    });

    logger.info('Flight booking confirmed successfully:', {
      bookingId: booking.id,
      amadeusBookingId: amadeusResult.data?.id
    });

    return res.status(200).json({
      success: true,
      data: {
        booking: confirmedBooking,
        amadeusBooking: amadeusResult.data,
        confirmationNumber: amadeusResult.data?.id || booking.id
      },
      message: 'Flight booking confirmed successfully'
    });

  } catch (error: any) {
    logger.error('Error confirming flight booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm flight booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's flight bookings
 * @route GET /api/flight-booking/my-bookings
 */
export const getMyFlightBookings = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        flightBookings: {
          some: {} // Only get bookings that have flight bookings
        }
      },
      include: {
        flightBookings: true
      },
      orderBy: {
        bookedAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });

  } catch (error: any) {
    logger.error('Error fetching flight bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch flight bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}; 