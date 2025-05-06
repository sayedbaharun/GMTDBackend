import * as express from 'express';
type Response = express.Response;
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/express';
import { BookingStatus, PaymentStatus } from '../types';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

// Get all bookings for the current user
export const getUserBookings = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        flightBookings: {
          include: {
            flight: true,
          },
        },
        hotelBookings: {
          include: {
            hotel: true,
            room: true,
          },
        },
        conciergeRequests: true,
      },
      orderBy: {
        bookedAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error: any) {
    console.error('Error fetching user bookings:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
      error: error.message,
    });
  }
};

// Get booking by ID (must be owner or admin)
export const getBookingById = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        flightBookings: {
          include: {
            flight: true,
          },
        },
        hotelBookings: {
          include: {
            hotel: true,
            room: true,
          },
        },
        conciergeRequests: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if the user is authorized to view this booking
    if (booking.userId !== userId) {
      // In a real app, check if admin
      // if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
      // }
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error('Error fetching booking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message,
    });
  }
};

// Create a new booking
export const createBooking = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const {
      flightBookings,
      hotelBookings,
      conciergeRequests,
      paymentMethodId,
    } = req.body;

    // Calculate total price based on flights and hotels
    let totalPrice = 0;

    // Validate and calculate flight prices
    if (flightBookings && flightBookings.length > 0) {
      for (const bookingData of flightBookings) {
        const flight = await prisma.flight.findUnique({
          where: { id: bookingData.flightId },
        });

        if (!flight) {
          return res.status(404).json({
            success: false,
            message: `Flight with ID ${bookingData.flightId} not found`,
          });
        }

        if (flight.availableSeats <= 0) {
          return res.status(400).json({
            success: false,
            message: `Flight ${flight.flightNumber} is fully booked`,
          });
        }

        totalPrice += flight.price;
      }
    }

    // Validate and calculate hotel prices
    if (hotelBookings && hotelBookings.length > 0) {
      for (const bookingData of hotelBookings) {
        const room = await prisma.room.findUnique({
          where: { id: bookingData.roomId },
        });

        if (!room) {
          return res.status(404).json({
            success: false,
            message: `Room with ID ${bookingData.roomId} not found`,
          });
        }

        if (!room.available) {
          return res.status(400).json({
            success: false,
            message: `Room ${room.id} is not available`,
          });
        }

        // Calculate nights
        const checkIn = new Date(bookingData.checkInDate);
        const checkOut = new Date(bookingData.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Check-out date must be after check-in date',
          });
        }

        totalPrice += room.price * nights;
      }
    }

    // Create payment intent with Stripe if payment method provided
    let paymentIntentId = null;
    
    if (paymentMethodId && stripe) {
      // Create or retrieve a customer
      let customer;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.stripeCustomerId) {
        customer = { id: user.stripeCustomerId };
      } else {
        customer = await stripe.customers.create({
          name: user?.fullName || 'Customer',
          email: user?.email || undefined,
          metadata: {
            userId,
          },
        });

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customer.id,
          },
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          userId,
          type: 'booking',
        },
      });

      paymentIntentId = paymentIntent.id;
    }

    // Create the booking in the database
    const booking = await prisma.booking.create({
      data: {
        userId,
        status: BookingStatus.CONFIRMED,
        totalPrice,
        currency: 'USD',
        paymentStatus: paymentIntentId ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        paymentIntentId,
        flightBookings: flightBookings && flightBookings.length > 0
          ? {
              create: flightBookings.map((b: any) => ({
                flightId: b.flightId,
                passengerName: b.passengerName,
                passengerEmail: b.passengerEmail,
                passengerPhone: b.passengerPhone,
                seatNumber: b.seatNumber,
                specialRequests: b.specialRequests,
              })),
            }
          : undefined,
        hotelBookings: hotelBookings && hotelBookings.length > 0
          ? {
              create: hotelBookings.map((b: any) => ({
                hotelId: b.hotelId,
                roomId: b.roomId,
                checkInDate: new Date(b.checkInDate),
                checkOutDate: new Date(b.checkOutDate),
                guestCount: b.guestCount || 1,
                specialRequests: b.specialRequests,
              })),
            }
          : undefined,
        conciergeRequests: conciergeRequests && conciergeRequests.length > 0
          ? {
              create: conciergeRequests.map((r: any) => ({
                userId,
                requestType: r.requestType,
                description: r.description,
                date: r.date ? new Date(r.date) : null,
                time: r.time,
                location: r.location,
                participants: r.participants || 1,
                status: 'PENDING',
                notes: r.notes,
              })),
            }
          : undefined,
      },
      include: {
        flightBookings: {
          include: {
            flight: true,
          },
        },
        hotelBookings: {
          include: {
            hotel: true,
            room: true,
          },
        },
        conciergeRequests: true,
      },
    });

    // Update flight available seats
    if (flightBookings && flightBookings.length > 0) {
      for (const bookingData of flightBookings) {
        await prisma.flight.update({
          where: { id: bookingData.flightId },
          data: {
            availableSeats: {
              decrement: 1,
            },
          },
        });
      }
    }

    // Update room availability if necessary
    if (hotelBookings && hotelBookings.length > 0) {
      // In a real app, you might implement a more sophisticated availability system
      // that handles date ranges rather than simply marking a room as unavailable
    }

    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    console.error('Error creating booking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        flightBookings: {
          include: {
            flight: true,
          },
        },
        hotelBookings: {
          include: {
            hotel: true,
            room: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns the booking
    if (booking.userId !== userId) {
      // In a real app, check if admin
      // if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
      // }
    }

    // Check if booking can be cancelled (not already cancelled or completed)
    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking',
      });
    }

    // Process refund if payment was made
    if (booking.paymentIntentId && stripe) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
        });

        console.log('Refund processed:', refund.id);
      } catch (stripeError: any) {
        console.error('Error processing refund:', stripeError.message);
        // Continue with cancellation even if refund fails
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: booking.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : booking.paymentStatus,
      },
      include: {
        flightBookings: {
          include: {
            flight: true,
          },
        },
        hotelBookings: {
          include: {
            hotel: true,
            room: true,
          },
        },
        conciergeRequests: true,
      },
    });

    // Return flight seats to inventory
    if (booking.flightBookings && booking.flightBookings.length > 0) {
      for (const flightBooking of booking.flightBookings) {
        await prisma.flight.update({
          where: { id: flightBooking.flightId },
          data: {
            availableSeats: {
              increment: 1,
            },
          },
        });
      }
    }

    // Update room availability if necessary
    if (booking.hotelBookings && booking.hotelBookings.length > 0) {
      // In a real app, update room availability based on date ranges
    }

    return res.status(200).json({
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};