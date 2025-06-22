/**
 * Admin Dashboard Routes
 * Provides statistics and overview data for admin dashboard
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
router.get('/stats', authenticateAdmin, requirePermission('analytics:read'), async (req, res): Promise<void> => {
  try {
    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total bookings
    const [totalBookings, totalBookingsLastMonth] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          bookedAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      })
    ]);

    const bookingGrowth = totalBookingsLastMonth > 0 
      ? ((totalBookings - totalBookingsLastMonth) / totalBookingsLastMonth * 100).toFixed(1)
      : '0';

    // Total revenue
    const [revenueData, revenueLastMonth] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          paymentStatus: 'PAID'
        },
        _sum: {
          totalPrice: true
        }
      }),
      prisma.booking.aggregate({
        where: {
          paymentStatus: 'PAID',
          bookedAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        },
        _sum: {
          totalPrice: true
        }
      })
    ]);

    const totalRevenue = revenueData._sum?.totalPrice || 0;
    const lastMonthRevenue = revenueLastMonth._sum?.totalPrice || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    // Active users (users who made bookings in last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        bookings: {
          some: {
            bookedAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    // Total users
    const totalUsers = await prisma.user.count();

    // Conversion rate (users with bookings / total users)
    const usersWithBookings = await prisma.user.count({
      where: {
        bookings: {
          some: {}
        }
      }
    });
    const conversionRate = totalUsers > 0 
      ? (usersWithBookings / totalUsers * 100).toFixed(1)
      : '0';

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        bookedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        flightBookings: true,
        hotelBookings: true
      }
    });

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(booked_at) as date,
        COUNT(*) as bookings,
        SUM(total_price) as revenue
      FROM "Booking"
      WHERE
        booked_at >= ${sevenDaysAgo}
        AND payment_status = 'PAID'
      GROUP BY DATE(booked_at)
      ORDER BY date ASC
    `;

    // Booking type distribution
    const bookingTypes = await prisma.$queryRaw<any[]>`
      SELECT
        CASE
          WHEN EXISTS (SELECT 1 FROM "FlightBooking" WHERE "bookingId" = b.id) THEN 'flight'
          WHEN EXISTS (SELECT 1 FROM "HotelBooking" WHERE "bookingId" = b.id) THEN 'hotel'
          ELSE 'other'
        END as type,
        COUNT(*) as count
      FROM "Booking" b
      GROUP BY
        CASE
          WHEN EXISTS (SELECT 1 FROM "FlightBooking" WHERE "bookingId" = b.id) THEN 'flight'
          WHEN EXISTS (SELECT 1 FROM "HotelBooking" WHERE "bookingId" = b.id) THEN 'hotel'
          ELSE 'other'
        END
    `;

    res.json({
      success: true,
      data: {
        metrics: {
          totalBookings: {
            value: totalBookings,
            change: `${bookingGrowth}%`,
            trend: parseFloat(bookingGrowth) >= 0 ? 'up' : 'down'
          },
          totalRevenue: {
            value: totalRevenue,
            change: `${revenueGrowth}%`,
            trend: parseFloat(revenueGrowth) >= 0 ? 'up' : 'down',
            currency: 'AED'
          },
          activeUsers: {
            value: activeUsers,
            total: totalUsers
          },
          conversionRate: {
            value: parseFloat(conversionRate),
            unit: '%'
          }
        },
        recentBookings: recentBookings.map(booking => {
          const bookingWithRelations = booking as any;
          return {
            id: booking.id,
            type: bookingWithRelations.flightBookings?.length > 0 ? 'flight' : 'hotel',
            customerName: bookingWithRelations.user?.fullName || bookingWithRelations.user?.email,
            amount: booking.totalPrice,
            currency: booking.currency,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.bookedAt,
            details: bookingWithRelations.flightBookings?.length > 0
              ? `Flight Booking`
              : bookingWithRelations.hotelBookings?.length > 0 ? 'Hotel Booking' : 'N/A'
          };
        }),
        charts: {
          dailyRevenue: dailyRevenue.map(row => ({
            date: row.date,
            bookings: Number(row.bookings),
            revenue: Number(row.revenue || 0)
          })),
          bookingTypes: bookingTypes.map(row => ({
            name: row.type === 'flight' ? 'Flights' : row.type === 'hotel' ? 'Hotels' : 'Other',
            value: Number(row.count)
          }))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: error.message
    });
  }
});

/**
 * Get activity timeline
 * GET /api/admin/dashboard/activity
 */
router.get('/activity', authenticateAdmin, async (req, res): Promise<void> => {
  try {
    const { limit = 20 } = req.query;

    // Get recent admin activities
    const activities = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        admin_id,
        action,
        resource,
        resource_id,
        details,
        created_at,
        (SELECT name FROM admins WHERE id = aal.admin_id) as admin_name
      FROM admin_activity_logs aal
      ORDER BY created_at DESC
      LIMIT ${Number(limit)}
    `;

    res.json({
      success: true,
      data: activities.map(activity => ({
        id: activity.id,
        adminName: activity.admin_name,
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resource_id,
        details: activity.details,
        timestamp: activity.created_at
      }))
    });
  } catch (error: any) {
    console.error('Activity timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity timeline',
      details: error.message
    });
  }
});

export default router;