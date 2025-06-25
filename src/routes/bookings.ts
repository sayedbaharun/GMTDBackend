import express from 'express';
import { authenticateMobile, MobileAuthRequest } from '../middleware/mobileAuth';
import { authenticateAndSyncUser } from '../middleware/auth';
import { withRLS, RequestWithRLS } from '../middleware/withRLS';
import { getUserBookings, getBookingById, cancelBooking, getUserBookingStats } from '../controllers/bookingController';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * Create a new booking
 * POST /api/bookings/create
 */
router.post('/create', authenticateMobile, withRLS, async (req: RequestWithRLS, res) => {
  try {
    const userId = req.rlsContext.userId!;
    const { type, details } = req.body;

    console.log('📋 Creating booking:', { userId, type });

    // Start a transaction to ensure data consistency
    const booking = await req.prisma.$transaction(async (tx) => {
      // Create the main booking record
      const newBooking = await tx.booking.create({
        data: {
          userId: userId,
          status: 'PENDING',
          totalPrice: 0, // Will be calculated
          currency: details.currency || 'AED',
          paymentStatus: 'UNPAID'
        }
      });

      let totalPrice = 0;

      // Handle flight booking
      if (type === 'flight' && details.flight) {
        const flightDetails = details.flight;
        
        // Create flight record if it doesn't exist
        const flight = await tx.flight.upsert({
          where: { id: flightDetails.id || 'new-flight' },
          update: {},
          create: {
            id: flightDetails.id || uuidv4(),
            airline: flightDetails.airline,
            flightNumber: flightDetails.flightNumber,
            departureAirport: flightDetails.departureAirport,
            arrivalAirport: flightDetails.arrivalAirport,
            departureTime: new Date(flightDetails.departureTime),
            arrivalTime: new Date(flightDetails.arrivalTime),
            price: flightDetails.price,
            currency: flightDetails.currency || 'AED',
            class: flightDetails.class || 'ECONOMY',
            availableSeats: flightDetails.availableSeats || 100
          }
        });

        // Create flight booking
        await tx.bookingFlight.create({
          data: {
            bookingId: newBooking.id,
            flightId: flight.id,
            passengerName: details.passengerName || '',
            passengerEmail: details.passengerEmail,
            passengerPhone: details.passengerPhone,
            seatNumber: details.seatNumber,
            specialRequests: details.specialRequests
          }
        });

        totalPrice += flight.price;
      }

      // Handle hotel booking
      if (type === 'hotel' && details.hotel) {
        const hotelDetails = details.hotel;
        
        // Create hotel record if it doesn't exist
        const hotel = await tx.hotel.upsert({
          where: { id: hotelDetails.id || 'new-hotel' },
          update: {},
          create: {
            id: hotelDetails.id || uuidv4(),
            name: hotelDetails.name,
            description: hotelDetails.description,
            address: hotelDetails.address,
            city: hotelDetails.city || 'Dubai',
            country: hotelDetails.country || 'UAE',
            starRating: hotelDetails.rating,
            pricePerNight: hotelDetails.pricePerNight,
            currency: hotelDetails.currency || 'AED',
            amenities: hotelDetails.amenities || []
          }
        });

        // Create or find room
        const room = await tx.room.upsert({
          where: { id: hotelDetails.roomId || 'new-room' },
          update: {},
          create: {
            id: hotelDetails.roomId || uuidv4(),
            hotelId: hotel.id,
            type: hotelDetails.roomType || 'Standard',
            price: hotelDetails.pricePerNight,
            currency: hotelDetails.currency || 'AED',
            capacity: hotelDetails.guestCount || 2
          }
        });

        // Create hotel booking
        await tx.bookingHotel.create({
          data: {
            bookingId: newBooking.id,
            hotelId: hotel.id,
            roomId: room.id,
            checkInDate: new Date(hotelDetails.checkInDate),
            checkOutDate: new Date(hotelDetails.checkOutDate),
            guestCount: hotelDetails.guestCount || 1,
            specialRequests: hotelDetails.specialRequests
          }
        });

        // Calculate nights
        const checkIn = new Date(hotelDetails.checkInDate);
        const checkOut = new Date(hotelDetails.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        totalPrice += room.price * nights;
      }

      // Handle combined booking (flight + hotel)
      if (type === 'package' && details.flight && details.hotel) {
        // Process both flight and hotel bookings
        // (Implementation similar to above, combined)
      }

      // Update booking with total price
      const updatedBooking = await tx.booking.update({
        where: { id: newBooking.id },
        data: { totalPrice },
        include: {
          flightBookings: {
            include: { flight: true }
          },
          hotelBookings: {
            include: { 
              hotel: true,
              room: true
            }
          }
        }
      });

      // Create booking confirmation
      await tx.bookingConfirmation.create({
        data: {
          bookingId: newBooking.id,
          confirmationNumber: `GMTD${Date.now().toString(36).toUpperCase()}`,
          status: 'PENDING'
        }
      });

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: newBooking.id,
          action: 'CREATE',
          entityType: 'BOOKING',
          entityId: newBooking.id,
          newData: updatedBooking,
          changedBy: userId,
          changedByType: 'USER'
        }
      });

      return updatedBooking;
    });

    console.log('✅ Booking created successfully:', booking.id);
    res.json({ 
      success: true, 
      booking,
      message: 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create booking' 
    });
  }
});

/**
 * Get user's bookings
 * GET /api/bookings/my-bookings
 */
router.get('/my-bookings', authenticateMobile, withRLS, async (req: RequestWithRLS, res) => {
  try {
    const userId = req.rlsContext.userId!;
    const { status, limit = 10, offset = 0 } = req.query;

    // RLS will automatically filter by userId
    const where: any = {};
    if (status) {
      where.status = status as string;
    }

    const bookings = await req.prisma.booking.findMany({
      where,
      include: {
        flightBookings: {
          include: { flight: true }
        },
        hotelBookings: {
          include: { 
            hotel: true,
            room: true
          }
        },
        confirmation: true
      },
      orderBy: { bookedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await req.prisma.booking.count({ where });

    res.json({
      success: true,
      bookings,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch bookings' 
    });
  }
});

/**
 * Get booking details
 * GET /api/bookings/:bookingId
 */
router.get('/:bookingId', authenticateMobile, withRLS, async (req: RequestWithRLS, res): Promise<void> => {
  try {
    const userId = req.rlsContext.userId!;
    const { bookingId } = req.params;

    // RLS will ensure user can only access their own booking
    const booking = await req.prisma.booking.findUnique({
      where: {
        id: bookingId
      },
      include: {
        flightBookings: {
          include: { flight: true }
        },
        hotelBookings: {
          include: { 
            hotel: true,
            room: true
          }
        },
        confirmation: true,
        transactions: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    res.json({
      success: true,
      booking
    });

  } catch (error: any) {
    console.error('❌ Error fetching booking details:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch booking details' 
    });
  }
});

/**
 * Update booking status
 * PUT /api/bookings/:bookingId/status
 */
router.put('/:bookingId/status', authenticateMobile, withRLS, async (req: RequestWithRLS, res): Promise<void> => {
  try {
    const userId = req.rlsContext.userId!;
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    // Update booking
    const booking = await req.prisma.$transaction(async (tx) => {
      // RLS ensures ownership
      const existingBooking = await tx.booking.findUnique({
        where: {
          id: bookingId
        }
      });

      if (!existingBooking) {
        throw new Error('Booking not found');
      }

      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          flightBookings: {
            include: { flight: true }
          },
          hotelBookings: {
            include: { 
              hotel: true,
              room: true
            }
          },
          confirmation: true
        }
      });

      // Update confirmation status if needed
      if (status === 'CONFIRMED' && updated.confirmation) {
        await tx.bookingConfirmation.update({
          where: { id: updated.confirmation.id },
          data: { 
            status: 'CONFIRMED',
            confirmationSentAt: new Date()
          }
        });
      }

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: bookingId,
          action: 'UPDATE_STATUS',
          entityType: 'BOOKING',
          entityId: bookingId,
          oldData: { status: existingBooking.status },
          newData: { status },
          changes: { status: { from: existingBooking.status, to: status } },
          changedBy: userId,
          changedByType: 'USER',
          reason
        }
      });

      return updated;
    });

    console.log('✅ Booking status updated:', bookingId, status);
    res.json({
      success: true,
      booking,
      message: `Booking ${status.toLowerCase()} successfully`
    });

  } catch (error: any) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update booking status' 
    });
  }
});

/**
 * Cancel booking
 * DELETE /api/bookings/:bookingId
 */
router.delete('/:bookingId', authenticateMobile, withRLS, async (req: RequestWithRLS, res) => {
  try {
    const userId = req.rlsContext.userId!;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await req.prisma.$transaction(async (tx) => {
      // RLS ensures ownership
      const existingBooking = await tx.booking.findUnique({
        where: {
          id: bookingId
        }
      });

      if (!existingBooking) {
        throw new Error('Booking not found');
      }

      if (existingBooking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      if (existingBooking.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed booking');
      }

      // Update booking status to cancelled
      const cancelled = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: {
          flightBookings: {
            include: { flight: true }
          },
          hotelBookings: {
            include: { 
              hotel: true,
              room: true
            }
          },
          confirmation: true
        }
      });

      // Update confirmation status
      if (cancelled.confirmation) {
        await tx.bookingConfirmation.update({
          where: { id: cancelled.confirmation.id },
          data: { status: 'CANCELLED' }
        });
      }

      // Create audit log
      await tx.bookingAuditLog.create({
        data: {
          bookingId: bookingId,
          action: 'CANCEL',
          entityType: 'BOOKING',
          entityId: bookingId,
          oldData: existingBooking,
          newData: cancelled,
          changedBy: userId,
          changedByType: 'USER',
          reason: reason || 'User requested cancellation'
        }
      });

      return cancelled;
    });

    console.log('✅ Booking cancelled:', bookingId);
    res.json({
      success: true,
      booking,
      message: 'Booking cancelled successfully'
    });

  } catch (error: any) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cancel booking' 
    });
  }
});

export default router;