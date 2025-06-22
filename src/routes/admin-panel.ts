import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get real statistics from database
    const [
      totalUsers,
      totalBookings,
      totalRevenue,
      recentUsers,
      pendingBookings,
      confirmedBookings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalPrice: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      prisma.booking.count({
        where: { status: 'CONFIRMED' }
      })
    ]);

    // Calculate derived statistics
    const stats = {
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      activeUsers: recentUsers,
      flightBookings: Math.floor(totalBookings * 0.6), // Estimate
      hotelBookings: Math.floor(totalBookings * 0.4), // Estimate
      conversionRate: totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(1) : 0,
      avgBookingValue: totalBookings > 0 ? Math.round((totalRevenue._sum.totalPrice || 0) / totalBookings) : 0,
      pendingBookings,
      confirmedBookings
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users - Get all users with details
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        bookings: {
          select: {
            id: true,
            totalPrice: true,
            status: true
          }
        },
        adminUser: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for admin panel
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.fullName || 'N/A',
      email: user.email,
      phone: user.phone || 'Not provided',
      membershipTier: user.adminUser ? 'Admin' : 
                      user.bookings.length > 10 ? 'Elite' :
                      user.bookings.length > 5 ? 'VIP' : 'Basic',
      joinDate: user.createdAt.toISOString().split('T')[0],
      lastActive: user.lastLoginAt ? formatTimeAgo(user.lastLoginAt) : 'Never',
      totalSpent: user.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
      bookingsCount: user.bookings.length,
      location: 'Unknown', // Profile doesn't have country field
      status: user.lastLoginAt && 
               new Date(user.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
               ? 'Active' : 'Inactive',
      onboardingComplete: user.onboardingComplete,
      isAdmin: !!user.adminUser
    }));

    res.json({
      success: true,
      data: transformedUsers
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings - Get all bookings with details
 */
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        confirmation: true,
        transactions: true
      },
      orderBy: {
        bookedAt: 'desc'
      }
    });

    // Transform data for admin panel
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      type: 'general', // We'll determine this from booking details later
      customerName: booking.user.fullName || 'Unknown',
      customerEmail: booking.user.email,
      bookingDate: booking.bookedAt.toISOString().split('T')[0],
      travelDate: booking.bookedAt.toISOString().split('T')[0], // Placeholder
      destination: 'Dubai', // Placeholder - would come from booking details
      origin: 'Various', // Placeholder
      amount: booking.totalPrice,
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      details: `Booking ${booking.id}`,
      paymentStatus: booking.paymentStatus.toLowerCase() as 'paid' | 'pending' | 'failed',
      currency: booking.currency,
      confirmationNumber: booking.confirmation?.confirmationNumber || 'N/A',
      transactions: booking.transactions.length
    }));

    res.json({
      success: true,
      data: transformedBookings
    });

  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/activity - Get recent platform activity
 */
router.get('/activity', async (req, res) => {
  try {
    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { bookedAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      }
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true
      }
    });

    // Get recent transactions
    const recentTransactions = await prisma.paymentTransaction.findMany({
      take: 5,
      orderBy: { transactionDate: 'desc' },
      include: {
        booking: {
          include: {
            user: {
              select: { fullName: true, email: true }
            }
          }
        }
      }
    });

    // Combine all activities
    const activities = [
      ...recentBookings.map(booking => ({
        id: `booking-${booking.id}`,
        type: 'booking' as const,
        description: `New booking by ${booking.user.fullName || 'Guest'}`,
        timestamp: formatTimeAgo(booking.bookedAt),
        amount: booking.totalPrice,
        status: booking.status === 'CONFIRMED' ? 'success' : 
                booking.status === 'PENDING' ? 'pending' : 'failed'
      })),
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        description: `New user registration - ${user.fullName || user.email}`,
        timestamp: formatTimeAgo(user.createdAt),
        status: 'success' as const
      })),
      ...recentTransactions.map(tx => ({
        id: `payment-${tx.id}`,
        type: 'payment' as const,
        description: `Payment processed for ${tx.booking.user.fullName || 'Guest'}`,
        timestamp: formatTimeAgo(tx.transactionDate),
        amount: tx.amount,
        status: tx.status === 'SUCCEEDED' ? 'success' : 
                tx.status === 'PENDING' ? 'pending' : 'failed'
      }))
    ]
    .sort((a, b) => {
      // Sort by timestamp (most recent first)
      const timeA = parseTimeAgo(a.timestamp);
      const timeB = parseTimeAgo(b.timestamp);
      return timeA - timeB;
    })
    .slice(0, 15); // Take top 15 activities

    res.json({
      success: true,
      data: activities
    });

  } catch (error: any) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/dashboard - Get complete dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    // This endpoint combines all dashboard data in one call
    const [statsResponse, usersResponse, bookingsResponse, activityResponse] = await Promise.all([
      fetch(`${req.protocol}://${req.get('host')}/api/admin/stats`),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/users`),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/bookings`), 
      fetch(`${req.protocol}://${req.get('host')}/api/admin/activity`)
    ]);

    const [stats, users, bookings, activity] = await Promise.all([
      statsResponse.json(),
      usersResponse.json(),
      bookingsResponse.json(),
      activityResponse.json()
    ]);

    res.json({
      success: true,
      data: {
        stats: stats.data,
        users: users.data,
        bookings: bookings.data,
        activity: activity.data
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Helper function to parse time ago back to number for sorting
function parseTimeAgo(timeAgo: string): number {
  if (timeAgo === 'Just now') return 0;
  
  const match = timeAgo.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  if (!match) return Date.now(); // Fallback for date strings
  
  const [, num, unit] = match;
  const value = parseInt(num);
  
  switch (unit) {
    case 'minute': return value;
    case 'hour': return value * 60;
    case 'day': return value * 60 * 24;
    default: return Date.now();
  }
}

export default router; 