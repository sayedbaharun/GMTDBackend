/**
 * Admin Bookings Management Routes
 * CRUD operations for managing bookings
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

/**
 * List all bookings with filters
 * GET /api/admin/bookings
 */
router.get('/', authenticateAdmin, requirePermission('bookings:read'), async (req, res): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      type,
      search,
      startDate,
      endDate,
      sortBy = 'bookedAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      where.bookedAt = {};
      if (startDate) where.bookedAt.gte = new Date(startDate as string);
      if (endDate) where.bookedAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { user: { fullName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: offset,
        take: Number(limit),
        orderBy: {
          [sortBy as string]: sortOrder
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          },
          flightBookings: true,
          hotelBookings: true
        }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        bookings: bookings.map(booking => {
          const bookingWithRelations = booking as any;
          return {
            id: booking.id,
            type: bookingWithRelations.flightBookings?.length > 0 ? 'flight' : 'hotel',
            customer: {
              id: bookingWithRelations.user?.id,
              name: bookingWithRelations.user?.fullName || bookingWithRelations.user?.email,
              email: bookingWithRelations.user?.email
            },
            amount: booking.totalPrice,
            currency: booking.currency,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.bookedAt,
            flightCount: bookingWithRelations.flightBookings?.length || 0,
            hotelCount: bookingWithRelations.hotelBookings?.length || 0,
            transactionCount: 0 // TODO: Add payment transaction count
          };
        }),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

    // Log activity
    await logActivity(req.admin!.id, 'view_bookings_list', 'bookings', {
      filters: { status, paymentStatus, type, search, startDate, endDate }
    });

  } catch (error: any) {
    console.error('List bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

/**
 * Get booking details
 * GET /api/admin/bookings/:id
 */
router.get('/:id', authenticateAdmin, requirePermission('bookings:read'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        flightBookings: true,
        hotelBookings: true
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    // Log activity
    await logActivity(req.admin!.id, 'view_booking_details', 'bookings', {
      bookingId: id
    });

    res.json({
      success: true,
      data: booking
    });

  } catch (error: any) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      details: error.message
    });
  }
});

/**
 * Update booking status
 * PUT /api/admin/bookings/:id/status
 */
router.put('/:id/status', authenticateAdmin, requirePermission('bookings:update'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Create activity log using raw SQL
    await prisma.$executeRaw`
      INSERT INTO booking_activities (booking_id, type, description, metadata, created_at)
      VALUES (
        ${id}::uuid,
        'STATUS_CHANGE',
        ${`Status changed to ${status}`},
        ${JSON.stringify({
          previousStatus: booking.status,
          newStatus: status,
          reason,
          notes,
          changedBy: req.admin!.email
        })}::jsonb,
        NOW()
      )
    `;

    // Log admin activity
    await logActivity(req.admin!.id, 'update_booking_status', 'bookings', {
      bookingId: id,
      previousStatus: booking.status,
      newStatus: status,
      reason
    });

    res.json({
      success: true,
      data: booking,
      message: `Booking status updated to ${status}`
    });

  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      details: error.message
    });
  }
});

/**
 * Process refund
 * POST /api/admin/bookings/:id/refund
 */
router.post('/:id/refund', authenticateAdmin, requirePermission('bookings:update'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, reason, type = 'full' } = req.body;

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id },
      // Payment transactions will be fetched separately if needed
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    if (booking.paymentStatus !== 'PAID') {
      res.status(400).json({
        success: false,
        error: 'Cannot refund unpaid booking'
      });
      return;
    }

    // Check if there's a successful payment transaction
    const successfulTransaction = await prisma.$queryRaw<any[]>`
      SELECT * FROM payment_transactions
      WHERE booking_id = ${id}::uuid
      AND status = 'succeeded'
      LIMIT 1
    `.then(rows => rows[0]);
    
    if (!successfulTransaction) {
      res.status(400).json({
        success: false,
        error: 'No successful payment transaction found'
      });
      return;
    }

    // Calculate refund amount
    const refundAmount = type === 'partial' ? amount : booking.totalPrice;
    
    if (refundAmount > booking.totalPrice) {
      res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed booking total'
      });
      return;
    }

    // TODO: Process refund through Stripe
    // const refund = await stripe.refunds.create({
    //   payment_intent: booking.paymentIntentId,
    //   amount: Math.round(refundAmount * 100),
    //   reason: 'requested_by_customer'
    // });

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: type === 'full' ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        updatedAt: new Date()
      }
    });

    // Create refund transaction using raw SQL
    await prisma.$executeRaw`
      INSERT INTO payment_transactions (
        booking_id, amount, currency, payment_method, status, metadata, created_at
      )
      VALUES (
        ${id}::uuid,
        ${-refundAmount},
        ${booking.currency},
        'credit_card',
        'succeeded',
        ${JSON.stringify({
          type: 'refund',
          reason,
          refundType: type,
          processedBy: req.admin!.email
        })}::jsonb,
        NOW()
      )
    `;

    // Create activity log using raw SQL
    await prisma.$executeRaw`
      INSERT INTO booking_activities (booking_id, type, description, metadata, created_at)
      VALUES (
        ${id}::uuid,
        'REFUND_PROCESSED',
        ${`${type} refund processed: ${booking.currency} ${refundAmount}`},
        ${JSON.stringify({
          amount: refundAmount,
          reason,
          type,
          processedBy: req.admin!.email
        })}::jsonb,
        NOW()
      )
    `;

    // Log admin activity
    await logActivity(req.admin!.id, 'process_refund', 'bookings', {
      bookingId: id,
      amount: refundAmount,
      type,
      reason
    });

    res.json({
      success: true,
      message: `Refund of ${booking.currency} ${refundAmount} processed successfully`,
      data: {
        bookingId: id,
        refundAmount,
        type,
        status: 'processed'
      }
    });

  } catch (error: any) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      details: error.message
    });
  }
});

/**
 * Add admin notes to booking
 * POST /api/admin/bookings/:id/notes
 */
router.post('/:id/notes', authenticateAdmin, requirePermission('bookings:update'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes, isInternal = true } = req.body;

    if (!notes) {
      res.status(400).json({
        success: false,
        error: 'Notes are required'
      });
      return;
    }

    // Create activity log using raw SQL
    await prisma.$executeRaw`
      INSERT INTO booking_activities (booking_id, type, description, metadata, created_at)
      VALUES (
        ${id}::uuid,
        'ADMIN_NOTE',
        ${notes},
        ${JSON.stringify({
          isInternal,
          addedBy: req.admin!.email
        })}::jsonb,
        NOW()
      )
    `;

    // Log admin activity
    await logActivity(req.admin!.id, 'add_booking_note', 'bookings', {
      bookingId: id,
      isInternal
    });

    res.json({
      success: true,
      message: 'Note added successfully'
    });

  } catch (error: any) {
    console.error('Add booking note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note',
      details: error.message
    });
  }
});

/**
 * Helper function to log admin activity
 */
async function logActivity(adminId: string, action: string, resource: string, details?: any): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO admin_activity_logs 
      (admin_id, action, resource, resource_id, details)
      VALUES (
        ${adminId}::uuid,
        ${action},
        ${resource},
        ${details?.bookingId || null},
        ${JSON.stringify(details || {})}::jsonb
      )
    `;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export default router;