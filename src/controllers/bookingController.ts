import * as express from 'express';
type Response = express.Response;
import { AuthenticatedRequest } from '../types/express';
import { RequestWithRLS } from '../middleware/withRLS';
import { BookingStatus, PaymentStatus } from '../types';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

// Get all bookings for the current user
export const getUserBookings = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const rlsReq = req as RequestWithRLS;
    
    if (!rlsReq.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Use RLS-enabled Prisma client - it will automatically filter by userId
    const bookings = await rlsReq.prisma.booking.findMany({
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
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Get a specific booking by ID
export const getBookingById = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const rlsReq = req as RequestWithRLS;
    const { id } = req.params;

    if (!rlsReq.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // RLS will ensure user can only access their own booking
    const booking = await rlsReq.prisma.booking.findUnique({
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
        auditLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const rlsReq = req as RequestWithRLS;
    const { id } = req.params;
    const { reason } = req.body;

    if (!rlsReq.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Start a transaction
    const result = await rlsReq.prisma.$transaction(async (tx) => {
      // Get the booking (RLS ensures it belongs to the user)
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          flightBookings: true,
          hotelBookings: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === BookingStatus.COMPLETED) {
        throw new Error('Cannot cancel a completed booking');
      }

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUND_PENDING,
        },
      });

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: id,
          action: 'CANCELLED',
          performedById: rlsReq.user!.id,
          details: { reason },
        },
      });

      // TODO: Process refund through Stripe
      if (stripe && booking.paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
            reason: 'requested_by_customer',
          });

          // Update payment status
          await tx.booking.update({
            where: { id },
            data: {
              paymentStatus: PaymentStatus.REFUNDED,
            },
          });
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          // Continue with cancellation even if refund fails
          // Admin will need to process refund manually
        }
      }

      return updatedBooking;
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Get booking statistics for the user
export const getUserBookingStats = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const rlsReq = req as RequestWithRLS;

    if (!rlsReq.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // RLS automatically filters to user's bookings
    const [totalBookings, completedBookings, cancelledBookings, totalSpent] = await Promise.all([
      rlsReq.prisma.booking.count(),
      rlsReq.prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
      }),
      rlsReq.prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      rlsReq.prisma.booking.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent: totalSpent._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};